import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * Middleware for Next.js that handles authentication and redirects.
 * It uses NextAuth to manage user sessions and access control.
 *
 * This middleware checks if a user is logged in and redirects them accordingly:
 * - If the user is logged in and tries to access the login page, they are redirected to the dashboard.
 * - If the user is not logged in and tries to access the dashboard, they are redirected to the login page.
 *
 * The advantage of employing Middleware for this task is that the protected routes
 * will not even start rendering until the Middleware verifies the authentication,
 * enhancing both the security and performance of your application.
 */

// Initialize NextAuth with `authConfig` which we set up in the auth.config.ts file
// Then export the auth handler to be used in the Next.js application.
export default NextAuth(authConfig).auth;

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
  // This matcher ensures that the middleware runs for all routes except API routes, static files, and image files.
};
