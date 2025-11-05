import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

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
          scope: "read:user repo",
          prompt: "select_account" // Force account selection on every sign-in
        } 
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
      // Handle disconnection by clearing GitHub token
      if (trigger === "update" && session?.disconnectGithub) {
        delete token.githubAccessToken;
        return token;
      }
      
      // Preserve GitHub access token when user connects GitHub
      if (account?.provider === "github" && account?.access_token) {
        token.githubAccessToken = account.access_token;
      }
      // Basic user info on first sign in
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
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
