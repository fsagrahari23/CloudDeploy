"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { Fira_Code } from "next/font/google";
import axios from "axios";

const socket = io(process.env.IO_SERVER); // ✅ changed to safe port

const firaCode = Fira_Code({ subsets: ["latin"] });

export default function Home() {
  const [repoURL, setURL] = useState<string>("");
  const [projectId, setProjectId] = useState<string | undefined>(""); // ✅ input field

  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [deployPreviewURL, setDeployPreviewURL] = useState<string | undefined>();

  const logContainerRef = useRef<HTMLElement>(null);

  const isValidURL: [boolean, string | null] = useMemo(() => {
    if (!repoURL.trim()) return [false, null];
    const regex = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)(?:\/)?$/;
    return [regex.test(repoURL), "Enter valid Github Repository URL"];
  }, [repoURL]);

  const handleClickDeploy = useCallback(async () => {
    setLoading(true);

    const apiServer = process.env.API_SERVER;
    if (!apiServer) {
      setLoading(false);
      console.error("API_SERVER is not defined");
      return;
    }

    const { data } = await axios.post(apiServer, {
      gitUrl: repoURL,
      slug: projectId || undefined, // ✅ use user-entered if provided
    });

    if (data?.data) {
      const { projectSlug, url } = data.data;
      console.log("Project Slug:", data.data);
      setProjectId(projectSlug);
      setDeployPreviewURL(url);

      console.log(`Subscribing to logs:${projectSlug}`);
      socket.emit("subscribe", `logs:${projectSlug}`);
    }

    setLoading(false);
  }, [projectId, repoURL]);

  const handleSocketIncommingMessage = useCallback((message: string) => {

    setLogs((prev) => [...prev, message]);
    logContainerRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    socket.on("log", handleSocketIncommingMessage);
    return () => {
      socket.off("log", handleSocketIncommingMessage);
    };
  }, [handleSocketIncommingMessage]);

  return (
    <main className="flex justify-center items-center h-screen">
      <div className="w-[600px]">
        {/* GitHub URL */}
        <span className="flex justify-start items-center gap-2">
          <Github className="text-5xl" />
          <Input
            disabled={loading}
            value={repoURL}
            onChange={(e) => setURL(e.target.value)}
            type="url"
            placeholder="Github URL"
          />
        </span>

        {/* Project ID (Optional Manual Entry) */}
        <span className="flex justify-start items-center gap-2 mt-3">
          <Input
            disabled={loading}
            value={projectId || ""}
            onChange={(e) => setProjectId(e.target.value)}
            type="text"
            placeholder="Project ID (optional)"
          />
        </span>

        {/* Deploy Button */}
        <Button
          onClick={handleClickDeploy}
          disabled={!isValidURL[0] || loading}
          className="w-full mt-3"
        >
          {loading ? "In Progress..." : "Deploy"}
        </Button>

        {/* Preview URL */}
        {deployPreviewURL && (
          <div className="mt-2 bg-slate-900 py-4 px-2 rounded-lg">
            <p>
              Preview URL{" "}
              <a
                target="_blank"
                className="text-sky-400 bg-sky-950 px-3 py-2 rounded-lg"
                href={deployPreviewURL}
              >
                {deployPreviewURL}
              </a>
            </p>
          </div>
        )}

        {/* Logs */}
        {logs.length > 0 && (
          <div
            className={`${firaCode.className} text-sm text-green-500 logs-container mt-5 border-green-500 border-2 rounded-lg p-4 h-[300px] overflow-y-auto`}
          >
            <pre className="flex flex-col gap-1">
              {logs.map((log, i) => (
                <code
                  ref={logs.length - 1 === i ? logContainerRef : undefined}
                  key={i}
                >{`> ${log}`}</code>
              ))}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
