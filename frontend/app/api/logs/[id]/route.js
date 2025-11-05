import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(req, context = {}) {
  // In Next 16, `params` can be a Promise; unwrap it before use.
  const params = context?.params ? await context.params : undefined;
  let id = params?.id;
  if (!id) {
    try {
      const url = new URL(req.url);
      const segments = url.pathname.split("/").filter(Boolean);
      id = segments[segments.length - 1];
    } catch {}
  }
  if (!id) return NextResponse.json({ error: "Missing deployment id" }, { status: 400 });
  try {
    const base = process.env.BACKEND_URL || "http://localhost:5500";
    const url = `${base.replace(/\/$/, "")}/get-logs/${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "GET", cache: "no-store" });
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    }
    const text = await res.text();
    return NextResponse.json({ error: text || "Unexpected response" }, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
