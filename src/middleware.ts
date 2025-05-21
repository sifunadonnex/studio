
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getUserSession } from '@/actions/auth'; // Import session check

export async function middleware(request: NextRequest) {
  const session = await getUserSession(); // Check session on the server
  const { pathname } = request.nextUrl;

  // --- Define Protected Routes ---
  const protectedPaths = [
    '/dashboard',
    '/appointments', // Customer specific
    '/book-appointment',
    '/chat', // Customer specific
    '/maintenance',
    '/profile',
    '/service-history', // Customer specific
    '/subscriptions/manage', // Customer specific
    '/admin', // Generic admin, further checks below
    '/staff/chats', // Staff specific chat
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  // --- Define Public Routes ---
  const publicPaths = ['/login', '/register', '/forgot-password', '/', '/services', '/subscriptions', '/contact'];
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api');

  // --- Login/Registration for Authenticated Users ---
  if ((pathname === '/login' || pathname === '/register') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // --- Protected Route Access ---
  if (isProtected && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- Role-Based Access Control ---
  if (session) { // Only apply role checks if user is logged in
    if (pathname.startsWith('/admin')) {
      const allowedAdminPathsForStaff = ['/admin/appointments', '/admin/users'];
      const isPathAllowedForStaff = allowedAdminPathsForStaff.some(p => pathname.startsWith(p));

      if (session.role === 'staff') {
        if (!isPathAllowedForStaff) {
          console.warn(`Staff access denied to ${pathname} for user ${session.email}`);
          return NextResponse.redirect(new URL('/dashboard', request.url)); // Or an unauthorized page
        }
      } else if (session.role === 'customer') {
        // Customers should not access any /admin paths
        console.warn(`Customer access denied to ${pathname} for user ${session.email}`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Admins can access all /admin paths (no explicit block needed here for admins)
    }

    // Specific customer routes protection (if a staff/admin tries to access them directly)
    const customerOnlyPaths = ['/appointments', '/service-history', '/subscriptions/manage'];
    if (customerOnlyPaths.some(p => pathname.startsWith(p)) && session.role !== 'customer') {
        console.warn(`Non-customer access denied to ${pathname} for user ${session.email} (role: ${session.role})`);
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
