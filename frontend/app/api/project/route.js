import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    console.log("Session:", session);
    if (!email) {
      return NextResponse.json({ error: "No email found in session" }, { status: 401 });
    }
    const body = await req.json();

    const cookie = await cookies();
    const cookieHeader = cookie.toString() // forward all cookies

    const backendURL = process.env.BACKEND_URL || "http://localhost:5500";

    // 🔥 Make request using Axios
    const response = await axios.post(`${backendURL}/project`, body, {
      headers: {
        "Content-Type": "application/json",
        ...(email ? { "x-user-email": email } : {}),
        Cookie: cookieHeader, // 👈 forward cookies to backend
      },
      withCredentials: true, // ensures cookies flow both ways
      timeout: 10000, // optional safety timeout (10s)
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    console.error("❌ Error in /api/project:", error.response?.data || error.message);

    return NextResponse.json(
      {
        error:
          error.response?.data?.error ||
          error.message ||
          "Failed to create project",
      },
      { status: error.response?.status || 500 }
    );
  }
}
