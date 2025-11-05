"use client";
import { signIn, useSession } from "next-auth/react";
import { Github, Unlink, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { resetRepos } from "@/store/slices/githubSlice";

export default function ConnectGitHubCard() {
  const { data: session, update } = useSession();
  const dispatch = useDispatch();
  const connected = Boolean(session?.githubAccessToken);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setShowDisconnectDialog(false);
    
    try {
      // Reset repos in Redux store
      dispatch(resetRepos());
      // Update session to clear GitHub token
      await update({ disconnectGithub: true });
      
      // Open GitHub settings in new tab
      window.open('https://github.com/settings/applications', '_blank');
      
      // Force session refresh after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to disconnect GitHub:", error);
      alert("Failed to disconnect GitHub. Please try again.");
      setIsDisconnecting(false);
    }
  };

  const handleConnect = () => {
    signIn("github", { 
      callbackUrl: "/dashboard",
      redirect: true
    });
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`rounded-lg p-3 ${connected ? 'bg-green-500/10' : 'bg-muted'}`}>
                <Github size={28} className={connected ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold">GitHub Integration</h3>
                  {connected && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 dark:bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400 ring-1 ring-inset ring-green-600/20 dark:ring-green-500/20">
                      <CheckCircle2 size={12} />
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground max-w-lg">
                  {connected 
                    ? "Your GitHub account is connected. You can access and deploy your repositories." 
                    : "Connect your GitHub account to access your repositories and start deploying."}
                </p>
                {connected && session?.user?.email && (
                  <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted/50 px-2 py-1 rounded inline-block">
                    {session.user.email}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
              {connected ? (
                <button
                  onClick={() => setShowDisconnectDialog(true)}
                  disabled={isDisconnecting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-background text-destructive px-4 py-2.5 text-sm font-medium hover:bg-destructive/10 hover:border-destructive transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                >
                  <Unlink size={16} /> 
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow"
                >
                  <Github size={16} /> Connect GitHub
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Dialog */}
      {showDisconnectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative mx-4 w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="rounded-lg bg-destructive/10 p-2">
                  <AlertCircle size={24} className="text-destructive" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">Disconnect GitHub Account?</h3>
                  <p className="text-sm text-muted-foreground">
                    This will remove your GitHub integration. You won't be able to access your repositories until you reconnect.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-muted/50 border border-border p-4 mb-6">
                <p className="text-sm font-medium mb-2">To switch to a different GitHub account:</p>
                <ol className="text-sm text-muted-foreground space-y-1.5 ml-4 list-decimal">
                  <li>Click "Disconnect" below</li>
                  <li>Revoke app access in GitHub Settings (will open automatically)</li>
                  <li>Return here and click "Connect GitHub" with your new account</li>
                </ol>
                <a
                  href="https://github.com/settings/applications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-3"
                >
                  <ExternalLink size={12} />
                  Open GitHub Settings
                </a>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={() => setShowDisconnectDialog(false)}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive text-destructive-foreground px-4 py-2.5 text-sm font-medium hover:bg-destructive/90 transition-all disabled:opacity-50 shadow-sm hover:shadow"
                >
                  <Unlink size={16} />
                  {isDisconnecting ? "Disconnecting..." : "Disconnect GitHub"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
