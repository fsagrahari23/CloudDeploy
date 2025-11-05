"use client";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchLogs, startDeployment } from "@/store/slices/deploySlice";
import { Terminal, ChevronDown, AlertCircle } from "lucide-react";

export default function DeployLogs({ projectId, autoStart = true, selectedDeploymentId = null }) {
  const dispatch = useDispatch();
  const { deploymentId, logs, status, error, deploymentStatus } = useSelector((s) => s.deploy);
  const logsEndRef = useRef(null);
  const containerRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollTimeoutRef = useRef(null);
  // Guard to avoid dispatching startDeployment multiple times
  const startedRef = useRef(false);
  const [latestDeploymentId, setLatestDeploymentId] = useState(null);

  const scrollToBottom = (force = false) => {
    const container = containerRef.current;
    if (!container) return;

    // If user is actively scrolling and not forcing, don't auto-scroll
    const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    if (!force && (isUserScrolling || distanceFromBottom > 50)) return;

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(() => {
      try {
        container.scrollTo({ 
          top: container.scrollHeight, 
          behavior: 'smooth' 
        });
      } catch (e) {
        // Fallback for older browsers
        container.scrollTop = container.scrollHeight;
      }
    });
  };

  // Handle user scroll detection
  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    setIsUserScrolling(true);
    
    // Check if user has scrolled away from bottom
    const distanceFromBottom = container.scrollHeight - container.clientHeight - container.scrollTop;
    setShowScrollButton(distanceFromBottom > 100);
    
    // If user scrolls to the very bottom, consider it as "not user scrolling" to resume auto-scroll
    if (distanceFromBottom < 10) {
      setIsUserScrolling(false);
      setShowScrollButton(false);
    }
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Reset user scrolling flag after 2 seconds of no scrolling
    scrollTimeoutRef.current = setTimeout(() => {
      setIsUserScrolling(false);
    }, 2000);
  };

  useEffect(() => {
    if (!projectId || !autoStart) return;
    // Prevent duplicate starts (React Strict Mode may double-invoke effects in dev)
    if (startedRef.current && startedRef.current === projectId) return;
    startedRef.current = projectId;
    dispatch(startDeployment({ projectId }));
  }, [projectId, autoStart, dispatch]);

  // Fetch latest deployment when component mounts (resume existing deployment)
  useEffect(() => {
    if (!projectId) return;
    
    // Fetch project data to get the most recent deployment
    const fetchLatestDeployment = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) return;
        const data = await res.json();
        const project = data?.data;
        
        // Get the most recent deployment that's not completed
        const recentDeployment = project?.Deployment?.[0];
        if (recentDeployment && 
            recentDeployment.status !== 'READY' && 
            recentDeployment.status !== 'FAILED') {
          // Resume polling for this deployment
          setLatestDeploymentId(recentDeployment.id);
        } else if (recentDeployment) {
          // Even if completed, load it to show logs
          setLatestDeploymentId(recentDeployment.id);
        }
      } catch (e) {
        console.error('Failed to fetch latest deployment:', e);
      }
    };
    
    fetchLatestDeployment();
  }, [projectId]);

  useEffect(() => {
    // Priority order: selectedDeploymentId > deploymentId > latestDeploymentId
    const activeDeploymentId = selectedDeploymentId || deploymentId || latestDeploymentId;
    if (!activeDeploymentId) return;
    
    // Stop polling if deployment is completed or failed
    if (deploymentStatus === 'READY' || deploymentStatus === 'FAILED') {
      // Do one final fetch and stop
      dispatch(fetchLogs({ deploymentId: activeDeploymentId }));
      return;
    }
    
    // Initial fetch
    dispatch(fetchLogs({ deploymentId: activeDeploymentId }));
    
    // Poll for logs every 2 seconds
    const id = setInterval(() => {
      dispatch(fetchLogs({ deploymentId: activeDeploymentId }));
    }, 2000);
    return () => clearInterval(id);
  }, [deploymentId, latestDeploymentId, selectedDeploymentId, deploymentStatus, dispatch]);

  useEffect(() => {
    // Auto-scroll with a slight delay for smoother animation
    const timeoutId = setTimeout(() => {
      scrollToBottom(false);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [logs, isUserScrolling]); // Added isUserScrolling as dependency

  // Alternative smooth scroll using logsEndRef for better reliability
  useEffect(() => {
    if (isUserScrolling) return; // Don't scroll if user is manually scrolling
    
    const scrollTimeout = setTimeout(() => {
      if (logsEndRef.current && logs.length > 0) {
        logsEndRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }
    }, 150); // Slightly longer delay to ensure DOM is updated
    
    return () => clearTimeout(scrollTimeout);
  }, [logs, isUserScrolling]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch {
      return timestamp;
    }
  };

  const getStatusBadge = () => {
    if (deploymentStatus === "READY") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Completed
        </span>
      );
    }
    if (deploymentStatus === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Failed
        </span>
      );
    }
    if (status === "loading" || deploymentStatus === "QUEUED") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" />
          Building...
        </span>
      );
    }
    if (deploymentId || deploymentStatus === "IN_PROGRESS") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          In Progress
        </span>
      );
    }
    return null;
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Terminal size={20} className="text-primary" />
            Deployment Logs
          </h3>
          {getStatusBadge()}
        </div>
        
        {status === "loading" && !logs.length && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
            <div className="h-4 w-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin dark:border-blue-400/30 dark:border-t-blue-400" />
            <p className="text-sm text-blue-700 dark:text-blue-400">Starting deployment…</p>
          </div>
        )}
        
        {error && (
          <div className="flex items-start gap-2 p-3 mb-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle size={16} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        {(selectedDeploymentId || deploymentId || latestDeploymentId) && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border">
            {selectedDeploymentId && (
              <p className="text-xs text-muted-foreground mb-1">Viewing selected deployment</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">Deployment ID:</span>
              <span className="font-mono bg-background px-2 py-1 rounded text-xs border border-border">
                {selectedDeploymentId || deploymentId || latestDeploymentId}
              </span>
            </div>
          </div>
        )}
        
        <div className="relative">
          <div 
            ref={containerRef} 
            className="h-128 overflow-auto rounded-lg border border-border bg-background scroll-smooth custom-scrollbar"
            style={{ scrollBehavior: 'smooth' }}
            onScroll={handleScroll}
          >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {deploymentId ? "Waiting for logs..." : "No deployment started"}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((l, i) => (
                <div 
                  key={`${l.timestamp}-${i}`} 
                  className="flex gap-4 p-3 hover:bg-accent/50 transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-2"
                  style={{
                    animationDelay: `${Math.min(i * 50, 500)}ms`,
                    animationDuration: '400ms'
                  }}
                >
                  <div className="shrink-0 w-20 text-right">
                    <span className="text-muted-foreground text-xs font-mono bg-secondary/50 px-2 py-1 rounded">
                      {formatTimestamp(l.timestamp)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="overflow-x-auto">
                      <pre className="text-foreground text-sm font-mono whitespace-pre-wrap wrap-break-word leading-relaxed m-0">
                        {l.log}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
        
        {/* Scroll to bottom button */}
        {showScrollButton && logs.length > 0 && (
          <button
            onClick={() => scrollToBottom(true)}
            title="Jump to latest logs"
            aria-label="Jump to latest logs"
            className="absolute bottom-4 right-4 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>
      </div>
    </div>
  );
}
