"use client";
import { useState , useEffect} from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { createProject } from "@/store/slices/projectSlice";
import { Plus, AlertCircle } from "lucide-react";

export default function CreateProjectForm({ prefillGitUrl, prefillName }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { status, current, error } = useSelector((s) => s.project);
  const [name, setName] = useState("");
  const [gitUrl, setGitUrl] = useState(prefillGitUrl || "");

  // Keep inputs in sync with new selections without clobbering manual edits
  useEffect(() => {
    if (prefillGitUrl && !gitUrl) setGitUrl(prefillGitUrl);
  }, [prefillGitUrl, gitUrl]);

  useEffect(() => {
    if (prefillName && !name) setName(prefillName);
  }, [prefillName, name]);

  // After creating, redirect to the project detail with logs
  useEffect(() => {
    if (status === "succeeded" && current?.id) {
      // After creating, navigate to the project page and auto start deployment once
      router.push(`/projects/${current.id}?autoStart=1`);
    }
  }, [status, current, router]);

  // Ensure .git suffix for GitHub URLs when missing
  const normalizedGitUrl = (() => {
    if (!gitUrl) return "";
    try {
      const u = new URL(gitUrl);
      if (u.hostname.includes("github.com") && !u.pathname.endsWith(".git")) {
        return `${u.origin}${u.pathname}.git`;
      }
      return gitUrl;
    } catch {
      return gitUrl; // allow raw text; backend may validate
    }
  })();

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-full">
      <div className="flex items-center gap-2 mb-4">
        <Plus size={20} className="text-primary" />
        <h3 className="text-lg font-semibold">Create New Project</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium mb-2">
            Project Name
          </label>
          <input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-awesome-project"
            className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div>
          <label htmlFor="git-url" className="block text-sm font-medium mb-2">
            Repository URL
          </label>
          <input
            id="git-url"
            value={gitUrl}
            onChange={(e) => setGitUrl(e.target.value)}
            placeholder="https://github.com/username/repository"
            className="w-full h-11 px-4 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <button
          disabled={!name || !normalizedGitUrl || status === "loading"}
          onClick={() => dispatch(createProject({ name, gitUrl: normalizedGitUrl }))}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground h-11 font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow"
        >
          {status === "loading" ? (
            <>
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Creating Project...
            </>
          ) : (
            <>
              <Plus size={18} />
              Create Project
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {current && !error && (
          <div className="p-4 rounded-lg border border-border bg-muted/50">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Project ID:</span>
                <span className="font-mono font-medium">{current.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subdomain:</span>
                <span className="font-mono font-medium">{current.subDomain}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
