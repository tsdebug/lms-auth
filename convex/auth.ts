import GitHub from "@auth/core/providers/github";
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

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
      if (args.existingUserId) {
        return args.existingUserId;
      }

      const { role, ...rest } = args.profile as {
        role?: string;
        [key: string]: unknown;
      };

      const userId = await ctx.db.insert("users", {
        ...rest,
        fName: (rest.fName as string) ?? "",
        lName: (rest.lName as string) ?? "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const roleName = role ?? "student";

      let roleDoc = await ctx.db
        .query("roles")
        .filter((q) => q.eq(q.field("name"), roleName))
        .first();

      if (!roleDoc) {
        const newRoleId = await ctx.db.insert("roles", {
          name: roleName,
          description: `Default role for ${roleName}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        roleDoc = await ctx.db.get(newRoleId);
      }

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