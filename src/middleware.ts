import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserSession } from '@/actions/auth'; // Import session check

export async function middleware(request: NextRequest) {
  const session = await getUserSession(); // Check session on the server
  const { pathname } = request.nextUrl;

  // --- Define Protected Routes ---
  // All routes starting with these paths require authentication
  const protectedPaths = [
    '/dashboard',
    '/appointments',
    '/book-appointment', // Require login to book
    '/chat',
    '/maintenance',
    '/profile',
    '/service-history',
    '/subscriptions/manage',
    // Add admin/staff specific routes if needed
    '/admin',
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // --- Define Public Routes ---
  // Routes accessible without authentication
  const publicPaths = ['/login', '/register', '/forgot-password', '/', '/services', '/subscriptions', '/contact'];
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api'); // Allow Next.js internals and API routes

  // --- Logic ---
  if (isProtected && !session) {
    // User is trying to access a protected route without being logged in
    // Redirect them to the login page, preserving the intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname); // Add redirect query param
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === '/login' || pathname === '/register') && session) {
    // User is trying to access login/register page while already logged in
    // Redirect them to the dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }


    // --- Role-Based Access Control (Example) ---
    // If you need specific roles for certain paths
    const adminPaths = ['/admin'];
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

    if (isAdminPath && session?.role !== 'admin') {
        // User is trying to access an admin path without admin role
        // Redirect to dashboard or an 'unauthorized' page
        console.warn(`Unauthorized access attempt to ${pathname} by user ${session?.email} (role: ${session?.role})`);
        return NextResponse.redirect(new URL('/dashboard', request.url)); // Redirect to general dashboard
         // Or: return NextResponse.redirect(new URL('/unauthorized', request.url));
    }


  // Allow the request to proceed if none of the above conditions are met
  return NextResponse.next();
}

// --- Matcher ---
// Define which paths the middleware should run on.
// Avoid running it on static files or API routes unless necessary.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};