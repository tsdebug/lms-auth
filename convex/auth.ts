import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import GitHub from "@auth/core/providers/github"; // ADDED

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    GitHub, // ADDED
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
        role: string;
        [key: string]: unknown
      };

      const userId = await ctx.db.insert("users", {
        ...rest,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // ADDED: GitHub users default to student role since they don't pick one
      const roleName = role ?? "student";
      const roleDoc = await ctx.db
        .query("roles")
        .filter((q) => q.eq(q.field("name"), roleName))
        .first();

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