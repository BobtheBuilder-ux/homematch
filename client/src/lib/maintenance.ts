// Utility functions for maintenance mode

export const isAdminPath = (pathname: string): boolean => {
  return pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin');
};

export const isPublicPath = (pathname: string): boolean => {
  const publicPaths = [
    '/maintenance',
    '/api',
    '/_next',
    '/favicon.ico',
    '/login',
    '/signup',
    '/auth',
    '/coming-soon'
  ];
  
  return publicPaths.some(path => pathname.startsWith(path));
};

export const shouldBypassMaintenance = (pathname: string, userRole?: string): boolean => {
  // Allow admins to bypass maintenance mode
  if (userRole === 'admin' && isAdminPath(pathname)) {
    return true;
  }
  
  // Allow access to public paths
  if (isPublicPath(pathname)) {
    return true;
  }
  
  return false;
};