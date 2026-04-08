// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub,
    Password({
      profile(params) {
        return {
          email: params.email as string,
          fName: params.fName as string,
          lName: params.lName as string,
          role: params.role as string,
        };
      },
    }),
  ],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      // 1. If user already exists (logging in again), just return their ID
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // 2. Extract role and other fields from the profile
      const { role, ...rest } = args.profile as {
        role?: string;
        [key: string]: any;
      };

      // 3. Insert the new user into the database
      const userId = await ctx.db.insert("users", {
        ...rest,
        fName: (rest.fName as string) ?? "",
        lName: (rest.lName as string) ?? "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 4. Determine the role (default to "student" for GitHub)
      const roleName = role ?? "student";
      
      // 5. Try to find the role using the fast index
      let roleDoc = await ctx.db
        .query("roles")
        .filter((q) => q.eq(q.field("name"), roleName))
        .first();

      // fix - If the role does not exist yet in the DB, create it before linking to the user
      if (!roleDoc) {
        const newRoleId = await ctx.db.insert("roles", {
          name: roleName,
          description: `Default role for ${roleName}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        // Fetch the newly created role document
        roleDoc = await ctx.db.get(newRoleId);
      }

      // 6. Link the user to the role in the bridge table safely
      if (roleDoc) {
        await ctx.db.insert("user_roles", {
          userId,
          roleId: roleDoc._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return userId;
    },
  },
});
    