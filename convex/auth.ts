import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return {
          email: params.email as string,
          fName: params.fName as string,
          lName: params.lName as string,
          // role passed from signup form, used in createOrUpdateUser below
          role: params.role as string,
        };
      },
    }),
  ],
  callbacks: {
    // ADDED: runs server-side during signup with guaranteed session
    // fixes the timing issue where createUserProfile was called before the session was ready on the client
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // CHANGED: destructure role out of profile before inserting role is not a field on the users table — it lives in user_roles
      // spreading ...rest means role won't be inserted into users
      const { role, ...rest } = args.profile as {
        role: string;
        [key: string]: unknown
      };

      const userId = await ctx.db.insert("users", {
        ...rest,  // everything except role
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // use the destructured role here
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