"use client";
import { useState } from "react";
import { useSelector } from "react-redux";
import ConnectGitHubCard from "@/components/ConnectGitHubCard";
import RepoPicker from "@/components/RepoPicker";
import CreateProjectForm from "@/components/CreateProjectForm";
import ClientOnly from "@/components/ClientOnly";
import { Rocket, FolderGit2 } from "lucide-react";

export default function Dashboard() {
  const [selectedRepo, setSelectedRepo] = useState(null);
  const { current } = useSelector((s) => s.project);

  return (
    <ClientOnly>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <Rocket size={24} className="text-primary" />
              </div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
            </div>
            <p className="text-muted-foreground">
              Connect your GitHub account and deploy your project
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            {/* GitHub Connection Card */}
            <ConnectGitHubCard />

            {/* Two Column Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Repository Picker */}
              <div className="lg:col-span-1">
                <RepoPicker onSelect={(r) => setSelectedRepo(r)} />
              </div>

              {/* Create Project Form */}
              <div className="lg:col-span-1">
                <CreateProjectForm
                  prefillGitUrl={selectedRepo?.clone_url || selectedRepo?.html_url || ""}
                  prefillName={selectedRepo?.name || ""}
                />
              </div>
            </div>

            {/* Success Message */}
            {current?.id && (
              <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-500/10 p-2">
                    <FolderGit2 size={24} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                      Project Created Successfully!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                      Your project is ready to deploy. Click below to view details and start deployment.
                    </p>
                    <a 
                      href={`/projects/${current.id}?autoStart=1`} 
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 dark:bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors"
                    >
                      <Rocket size={16} />
                      Go to Project & Deploy
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ClientOnly>
  );
}
