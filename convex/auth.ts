// convex/auth.ts
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // We only use Password authentication. No GitHub. No Google.
    Password({
      // The profile function allows us to take extra data from the frontend form
      // (like 'role') and save it directly into the Convex Auth system.
      profile(params) {
        return {
          email: params.email as string,
          role: params.role as string, // "student" or "teacher"
          fName: params.fName as string,
          lName: params.lName as string,
        };
      },
    }),
  ],
});