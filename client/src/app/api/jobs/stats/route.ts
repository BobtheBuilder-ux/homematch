import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:3002";
    const response = await fetch(`${baseUrl}/jobs/general-stats`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in jobs stats API route:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch job statistics" },
      { status: 500 }
    );
  }
}