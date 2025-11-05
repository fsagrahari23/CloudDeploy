import ProjectDetail from "@/components/ProjectDetail";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

async function getProject(id) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  const base = process.env.BACKEND_URL || "http://localhost:5500";
  const res = await fetch(`${base.replace(/\/$/, "")}/project/${id}`, {
    cache: "no-store",
    headers: { ...(email ? { "x-user-email": email } : {}) },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data || null;
}

export default async function ProjectPage({ params }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return <div className="container mx-auto px-4 py-8">Project not found.</div>;
  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectDetail project={project} />
    </div>
  );
}
