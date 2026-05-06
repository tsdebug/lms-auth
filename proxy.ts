import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// CHANGED: /signin → /login to match new route
const isSignInPage = createRouteMatcher(["/login", "/signup"])

const isProtectedRoute = createRouteMatcher([
  "/",
  "/teacher(.*)",
  "/student(.*)",
]);

const AUTH_CHECK_TIMEOUT_MS = 1500;

async function getAuthStatusWithTimeout(
  isAuthenticated: () => Promise<boolean>
): Promise<boolean | null> {
  const authPromise = isAuthenticated()
    .then((value) => ({ ok: true as const, value }))
    .catch(() => ({ ok: false as const }));

  const timeoutPromise = new Promise<{ ok: false }>((resolve) => {
    setTimeout(() => resolve({ ok: false }), AUTH_CHECK_TIMEOUT_MS);
  });

  const result = await Promise.race([authPromise, timeoutPromise]);
  return result.ok ? result.value : null;
}

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const onSignInPage = isSignInPage(request);
  const onProtectedRoute = isProtectedRoute(request);

  if (!onSignInPage && !onProtectedRoute) {
    return;
  }

  const authStatus = await getAuthStatusWithTimeout(
    convexAuth.isAuthenticated
  );

  // If auth check is slow/unreachable, skip redirect here and let page-level
  // auth checks handle authorization instead of blocking middleware.
  if (authStatus === null) {
    return;
  }

  // Logged in + visiting /login or /signup → send to home
  if (onSignInPage && authStatus) {
    return nextjsMiddlewareRedirect(request, "/");
  }

  // Not logged in + visiting protected route → send to /login
  if (onProtectedRoute && !authStatus) {
    return nextjsMiddlewareRedirect(request, "/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};