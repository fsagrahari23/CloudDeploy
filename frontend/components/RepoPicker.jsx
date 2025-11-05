"use client";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchRepos } from "@/store/slices/githubSlice";
import { signIn } from "next-auth/react";
import { Github, Search, Lock, Globe, Code2, AlertCircle, Loader2 } from "lucide-react";

export default function RepoPicker({ onSelect }) {
  const dispatch = useDispatch();
  const { repos, status, error } = useSelector((s) => s.github);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (status === "idle") dispatch(fetchRepos());
  }, [status, dispatch]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return repos.filter((r) => `${r.owner?.login}/${r.name}`.toLowerCase().includes(q));
  }, [repos, query]);

  // Check if error is due to GitHub not being connected
  const isNotConnected = status === "failed" && error && (
    error.includes("GitHub not connected") || 
    error.includes("401") ||
    error.includes("Repo fetch failed: 401")
  );

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Github size={20} className="text-primary" />
          <h3 className="text-lg font-semibold">Your Repositories</h3>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search repositories..."
            className="h-10 pl-9 pr-4 w-full sm:w-64 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {status === "loading" && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <Loader2 size={32} className="text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading your repositories...</p>
          </div>
        </div>
      )}
      
      {/* Show GitHub connect button if not connected */}
      {isNotConnected && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Github size={40} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-semibold">GitHub Not Connected</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              Connect your GitHub account to access and deploy your repositories
            </p>
          </div>
          <button
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
          >
            <Github size={18} /> Connect GitHub
          </button>
        </div>
      )}
      
      {/* Show other errors */}
      {status === "failed" && !isNotConnected && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle size={18} className="text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      
      {status === "succeeded" && filtered.length === 0 && (
        <div className="text-center py-12 px-4">
          <div className="rounded-full bg-muted p-3 w-fit mx-auto mb-3">
            <Search size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {query ? `No repositories found matching "${query}"` : "No repositories found"}
          </p>
        </div>
      )}
      
      {status === "succeeded" && filtered.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? 'repository' : 'repositories'} {query && 'found'}
            </p>
          </div>
          <ul className="max-h-96 overflow-auto space-y-2 pr-2 custom-scrollbar">
            {filtered.map((r) => (
              <li 
                key={r.id} 
                className="group p-4 rounded-lg border border-border bg-background hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Github size={16} className="text-muted-foreground shrink-0" />
                      <p className="text-sm font-semibold truncate">{r.full_name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        {r.private ? (
                          <>
                            <Lock size={12} />
                            Private
                          </>
                        ) : (
                          <>
                            <Globe size={12} />
                            Public
                          </>
                        )}
                      </span>
                      {r.language && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Code2 size={12} />
                            {r.language}
                          </span>
                        </>
                      )}
                      {r.stargazers_count > 0 && (
                        <>
                          <span>•</span>
                          <span>⭐ {r.stargazers_count}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onSelect(r)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm group-hover:shadow"
                  >
                    Select
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
