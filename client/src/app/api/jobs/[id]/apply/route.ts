import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Forward the request to the backend server
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:3002';
    const response = await fetch(`${backendUrl}/jobs/${id}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward authorization header if present
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in jobs/[id]/apply API route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit job application' },
      { status: 500 }
    );
  }
}