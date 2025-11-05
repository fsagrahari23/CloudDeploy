import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Note: Since we're using JWT strategy, we can't directly modify the session
    // We need to signal the client to re-authenticate to clear the GitHub token
    // The client should call signIn("google") which will refresh the token without GitHub
    
    return NextResponse.json({ 
      success: true, 
      message: "GitHub disconnection initiated. Please re-authenticate." 
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
