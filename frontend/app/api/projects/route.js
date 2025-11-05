import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const base = process.env.BACKEND_URL || "http://localhost:5500";
    const res = await fetch(`${base.replace(/\/$/, "")}/projects`, { cache: "no-store", headers: { ...(email ? { "x-user-email": email } : {}) } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
