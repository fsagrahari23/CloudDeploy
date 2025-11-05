import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const token = session?.githubAccessToken;
    if (!token) return NextResponse.json({ data: [], error: "GitHub not connected" }, { status: 401 });

    const res = await fetch("https://api.github.com/user/repos?per_page=100", {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
      // GitHub API stable requires v3 header sometimes; optional
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ data: [], error: `GitHub API error ${res.status}: ${text}` }, { status: res.status });
    }
    const repos = await res.json();
    // Normalize minimal shape used by UI
    const data = repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      private: r.private,
      language: r.language,
      owner: { login: r.owner?.login },
      clone_url: r.clone_url,
      html_url: r.html_url,
    }));
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ data: [], error: e.message }, { status: 500 });
  }
}
