"use client";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import { startDeployment, refreshProjectData } from "@/store/slices/deploySlice";
import DeployLogs from "@/components/DeployLogs";
import { useEffect, useState } from "react";
import { Rocket, ExternalLink, RefreshCw, Clock, GitBranch } from "lucide-react";

export default function ProjectDetail({ project: initialProject }) {
  const dispatch = useDispatch();
  const { deploymentId, status, deploymentStatus, currentProject } = useSelector((s) => s.deploy);
  const searchParams = useSearchParams();
  const autoStart = searchParams.get("autoStart") === "1";
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(null);
  
  // Use current project from Redux if available, otherwise use initial project
  const project = currentProject || initialProject;

  // Format date consistently for SSR and client
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${month}/${day}/${year}, ${hours}:${minutes}:${seconds}`;
  };

  // Refresh project data every 10 seconds to get updated deployment statuses
  useEffect(() => {
    if (!project?.id) return;
    
    const interval = setInterval(() => {
      dispatch(refreshProjectData({ projectId: project.id }));
    }, 10000);
    
    return () => clearInterval(interval);
  }, [project?.id, dispatch]);

  const getDeploymentStatusBadge = (status) => {
    const statusConfig = {
      'READY': { 
        bg: 'bg-green-50 dark:bg-green-500/10', 
        text: 'text-green-700 dark:text-green-400', 
        ring: 'ring-green-600/20 dark:ring-green-500/20',
        dot: 'bg-green-500'
      },
      'COMPLETED': { 
        bg: 'bg-green-50 dark:bg-green-500/10', 
        text: 'text-green-700 dark:text-green-400', 
        ring: 'ring-green-600/20 dark:ring-green-500/20',
        dot: 'bg-green-500'
      },
      'IN_PROGRESS': { 
        bg: 'bg-blue-50 dark:bg-blue-400/10', 
        text: 'text-blue-700 dark:text-blue-400', 
        ring: 'ring-blue-700/10 dark:ring-blue-400/30',
        dot: 'bg-blue-500 animate-pulse'
      },
      'QUEUED': { 
        bg: 'bg-yellow-50 dark:bg-yellow-400/10', 
        text: 'text-yellow-800 dark:text-yellow-500', 
        ring: 'ring-yellow-600/20 dark:ring-yellow-400/20',
        dot: 'bg-yellow-500'
      },
      'FAILED': { 
        bg: 'bg-red-50 dark:bg-red-500/10', 
        text: 'text-red-700 dark:text-red-400', 
        ring: 'ring-red-600/20 dark:ring-red-500/20',
        dot: 'bg-red-500'
      },
      'NOT_STARTED': { 
        bg: 'bg-gray-50 dark:bg-gray-500/10', 
        text: 'text-gray-700 dark:text-gray-400', 
        ring: 'ring-gray-600/20 dark:ring-gray-500/20',
        dot: 'bg-gray-500'
      }
    };
    
    const config = statusConfig[status] || statusConfig['NOT_STARTED'];
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {status === 'READY' ? 'Completed' : status.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
      </span>
    );
  };

  const onRedeploy = () => {
    if (!project?.id) return;
    setSelectedDeploymentId(null); // Clear selection when starting new deployment
    dispatch(startDeployment({ projectId: project.id }));
  };

  const onSelectDeployment = (deploymentId) => {
    setSelectedDeploymentId(deploymentId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-0">
        {/* Project Header Card */}
        <div className="rounded-xl border border-border bg-card shadow-sm mb-4">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <GitBranch size={20} className="text-primary" />
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{project.name}</h1>
                </div>
                
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                      Repository
                    </label>
                    <p className="text-xs text-foreground break-all font-mono bg-muted/50 px-2.5 py-1.5 rounded-lg border border-border">
                      {project.gitUrl}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                      Deployment URL
                    </label>
                    <a
                      href={`http://${project.subDomain}.localhost:8000`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-mono text-primary hover:underline underline-offset-2 bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40 transition-all"
                    >
                      {project.subDomain}.localhost:8000
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={onRedeploy} 
                disabled={status === 'loading'} 
                className="lg:mt-0 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow whitespace-nowrap h-fit"
              >
                {status === 'loading' ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Rocket size={16} />
                    Deploy Latest
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Two Column Layout for Logs and Deployments */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Deployment Logs - Takes 2 columns on xl screens */}
          <div className="xl:col-span-2">
            <DeployLogs projectId={project.id} autoStart={autoStart} selectedDeploymentId={selectedDeploymentId} />
          </div>

          {/* Recent Deployments Sidebar - Takes 1 column on xl screens */}
          <div className="xl:col-span-1">
            <div className="rounded-xl border border-border bg-card shadow-sm h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Clock size={20} className="text-primary" />
                    Recent Deployments
                  </h3>
                  <button 
                    onClick={() => dispatch(refreshProjectData({ projectId: project.id }))}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition-all"
                    title="Refresh deployments"
                  >
                    <RefreshCw size={13} />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>
                
                <div className="space-y-2 max-h-[calc(100vh-16rem)] overflow-auto custom-scrollbar pr-1">
                  {(project.Deployment || []).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => onSelectDeployment(d.id)}
                      className={`w-full p-3.5 rounded-lg border text-sm flex flex-col justify-between hover:shadow-sm transition-all text-left group ${
                        selectedDeploymentId === d.id 
                          ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-sm' 
                          : 'border-border hover:border-primary/30 hover:bg-accent/30'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-mono text-xs text-muted-foreground truncate flex-1">
                            {d.id}
                          </div>
                          {getDeploymentStatusBadge(d.status)}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock size={12} />
                          <span className="text-xs">{formatDate(d.createdAt)}</span>
                        </div>
                        
                        {selectedDeploymentId === d.id && (
                          <div className="pt-1.5 border-t border-primary/20">
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              Currently Viewing
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                  
                  {(!project.Deployment || project.Deployment.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="rounded-full bg-muted p-4 mb-3">
                        <Rocket size={28} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">No deployments yet</p>
                      <p className="text-xs text-muted-foreground">Click "Deploy Latest" to start</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
