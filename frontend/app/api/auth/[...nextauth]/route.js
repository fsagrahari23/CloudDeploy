import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { cookies } from "next/headers"; // <-- For setting cookies on server

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const providers = [];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
          prompt: "select_account",
        },
      },
    })
  );
}

export const authOptions = {
  providers,
  session: { strategy: "jwt" },
  debug: process.env.NODE_ENV !== "production",
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      if (trigger === "update" && session?.disconnectGithub) {
        delete token.githubAccessToken;
        return token;
      }

      if (account?.provider === "github" && account?.access_token) {
        token.githubAccessToken = account.access_token;
      }

      if (profile && !token.name) {
        token.name = profile.name || token.name;
        token.picture = profile.picture || token.picture;
        token.email = profile.email || token.email;
      }

      return token;
    },

    async session({ session, token }) {
      session.user = session.user || {};
      session.githubAccessToken = token.githubAccessToken || null;

      // ✅ Set GitHub access token as a secure cookie
      if (token.githubAccessToken) {
        const cookieStore = await cookies();
        cookieStore.set("githubAccessToken", token.githubAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24, // 1 day
        });
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
