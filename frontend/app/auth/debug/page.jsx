export const dynamic = "force-dynamic";

export default function AuthDebug() {
  const vars = {
    NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
    NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET),
    GOOGLE_CLIENT_ID: Boolean(process.env.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    GITHUB_ID: Boolean(process.env.GITHUB_ID),
    GITHUB_SECRET: Boolean(process.env.GITHUB_SECRET),
  };
  const redirectGoogle = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`;
  const redirectGitHub = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/github`;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Auth debug</h2>
      <div className="rounded-lg border p-4">
        <p className="text-sm text-muted-foreground">Environment presence (true/false):</p>
        <pre className="mt-2 text-sm">{JSON.stringify(vars, null, 2)}</pre>
      </div>
      <div className="rounded-lg border p-4">
        <p className="font-medium">Expected redirect URIs</p>
        <p className="text-sm text-muted-foreground">Make sure these are configured exactly in your provider dashboards:</p>
        <ul className="mt-2 text-sm list-disc pl-5">
          <li>Google: <code>{redirectGoogle}</code></li>
          <li>GitHub: <code>{redirectGitHub}</code></li>
        </ul>
      </div>
      <div className="rounded-lg border p-4">
        <a className="underline" href="/api/auth/providers">View /api/auth/providers</a>
      </div>
    </div>
  );
}
