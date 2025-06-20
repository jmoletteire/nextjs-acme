import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /**
     * The authorized callback is used to verify if the request is authorized to
     * access a page with Next.js Middleware. It is called before a request is completed,
     * and it receives an object with the `auth` and `request` properties.
     * The `auth` property contains the user's session, and the `request` property contains
     * the incoming request.
     *
     * If the user is logged in and tries to access the login page, they will be redirected to the dashboard.
     * If the user is not logged in and tries to access the dashboard, they will be redirected to the login page.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }
      return true;
    },
  },
  // The providers option is an array where you list different login options.
  providers: [],
} satisfies NextAuthConfig;
