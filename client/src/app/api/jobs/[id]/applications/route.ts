import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    
    // Forward the request to the backend server
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3002';
    const response = await fetch(`${backendUrl}/jobs/${id}/applications?${searchParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in jobs/[id]/applications API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job applications' },
      { status: 500 }
    );
  }
}