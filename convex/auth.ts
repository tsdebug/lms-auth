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
          // ADDED: role is passed from signup form and stored in profile
          // so it's available in createOrUpdateUser callback below
          role: params.role as string,
        };
      },
    }),
  ],
  
});