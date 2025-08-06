import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isPublicPath, isAdminPath } from './lib/maintenance';

// Function to check if maintenance mode is enabled
async function isMaintenanceModeEnabled(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/settings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const settings = await response.json();
      return settings.maintenanceMode === true;
    }
  } catch (error) {
    console.error('Error checking maintenance mode:', error);
  }
  
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip maintenance check for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Check if maintenance mode is enabled
  const maintenanceMode = await isMaintenanceModeEnabled();
  
  if (maintenanceMode) {
    // Allow admins to access admin pages during maintenance
    if (isAdminPath(pathname)) {
      return NextResponse.next();
    }
    
    // Redirect all other users to maintenance page
    return NextResponse.redirect(new URL('/maintenance', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - maintenance (maintenance page)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|maintenance).*)',
  ],
};