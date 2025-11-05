import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { ExternalLink, Calendar, Globe, Rocket, FolderGit2, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function getProjects() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const base = process.env.BACKEND_URL || "http://localhost:5500";
  const res = await fetch(`${base.replace(/\/$/, "")}/projects`, {
    cache: "no-store",
    headers: { ...(email ? { "x-user-email": email } : {}) },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data || [];
}

export default async function ProjectsPage() {
  const projects = await getProjects();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <FolderGit2 size={24} className="text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Your Projects</h1>
          </div>
          <p className="text-muted-foreground ml-14">
            Manage and monitor all your deployed projects in one place
          </p>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="rounded-full bg-primary/10 p-8 mb-6">
              <Rocket size={48} className="text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-8 text-center max-w-md">
              Get started by creating your first project from the dashboard
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
            >
              <Rocket size={18} />
              Go to Dashboard
              <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="group relative rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                {/* Project Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <ExternalLink 
                      size={16} 
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                    />
                  </div>
                  
                  {/* Subdomain */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Globe size={14} className="shrink-0" />
                    <span className="font-mono truncate">
                      {p.subDomain}.yourdomain.com
                    </span>
                  </div>
                </div>

                {/* Project Footer */}
                <div className="pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar size={12} className="shrink-0" />
                    <span>Created {new Date(p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 rounded-xl bg-linear-to-br from-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Link>
            ))}
          </div>
        )}

        {/* Footer Info */}
        {projects.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Total projects: <span className="font-medium text-foreground">{projects.length}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
