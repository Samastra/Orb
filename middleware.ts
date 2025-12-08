import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  '/terms',
  '/privacy',
  '/contact',
  '/features',
  '/pricing',
  '/refunds',
  "/api/chat",
  '/boards/new',
  '/boards',
  '/boards/(.*)',
])

// Define routes where a logged-in user should NOT be (Auth routes)
const isAuthRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  try {
    const { userId } = await auth();

    // 1. If user is logged in and tries to access an Auth route (sign-in/up), redirect to dashboard
    if (userId && isAuthRoute(req)) {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 2. If user is logged in and trying to access root ("/"), redirect to dashboard
    if (userId && req.nextUrl.pathname === '/') {
      const dashboardUrl = new URL('/dashboard', req.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // 3. Protect all other routes except public ones
    if (!isPublicRoute(req)) {
      await auth.protect();
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware_Error_Recovered:", error);
    // CRITICAL: Do NOT throw error. Fail OPEN.
    // If middleware fails, let the application handle the request.
    // The individual pages will enforce auth if needed.
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}