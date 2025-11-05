import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const body = await req.json();
    const res = await fetch(`${process.env.BACKEND_URL || "http://localhost:5500"}/project`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(email ? { "x-user-email": email } : {}) },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
