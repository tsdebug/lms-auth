import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub({
      profile(githubProfile) {
        return {
          email: githubProfile.email,
          name: githubProfile.name || githubProfile.login,
          image: githubProfile.avatar_url,
          role: "student", // Default for GitHub
          fName: githubProfile.name?.split(" ")[0] || githubProfile.login || "GitHub",
          lName: githubProfile.name?.split(" ").slice(1).join(" ") || "User",
        };
      },
    }),
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
      // 1. If user already exists, just log them in
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // 2. Safely extract profile data
      const profile = args.profile;

      // 3. Bulletproof Database Insert
      // We ONLY insert fields that we know exist in the schema to prevent crashes.
      const userId = await ctx.db.insert("users", {
        email: profile.email as string | undefined,
        name: profile.name as string | undefined,
        image: profile.image as string | undefined,
        fName: (profile.fName as string) || "New",
        lName: (profile.lName as string) || "User",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 4. Handle the Multiple Roles logic (Bridge Table)
      const roleName = (profile.role as string) || "student";
      
      let roleDoc = await ctx.db
        .query("roles")
        .filter((q) => q.eq(q.field("name"), roleName))
        .first();

      // 5. Create role if it doesn't exist yet
      if (!roleDoc) {
        const newRoleId = await ctx.db.insert("roles", {
          name: roleName,
          description: `Role for ${roleName}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        roleDoc = await ctx.db.get(newRoleId);
      }

      // 6. Connect user to role via bridge table
      if (roleDoc) {
        await ctx.db.insert("user_roles", {
          userId: userId,
          roleId: roleDoc._id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      return userId;
    },
  },
});