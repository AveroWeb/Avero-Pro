import type { NextAuthConfig } from "next-auth";

// Edge-safe config: no database access here. Used by middleware.
// The full config (with the Credentials provider) lives in `src/auth.ts`.
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname === "/login" || pathname === "/signup") {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", request.nextUrl));
        }
        return true;
      }

      if (pathname === "/") return true;

      if (!isLoggedIn) return false;

      return true;
    },
  },
} satisfies NextAuthConfig;
