import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
    console.log("Middleware executing for:", req.nextUrl.pathname);
    const { userId } = await auth()
    console.log("Auth checked, userId:", userId);

    // 1. If user is logged in and tries to access an Auth route (sign-in/up), redirect to dashboard
    if (userId && isAuthRoute(req)) {
      console.log("Redirecting to dashboard (AuthRoute)");
      return Response.redirect(new URL('/dashboard', req.url))
    }

    // 2. If user is logged in and trying to access root ("/"), redirect to dashboard
    if (userId && req.nextUrl.pathname === '/') {
      console.log("Redirecting to dashboard (Root)");
      return Response.redirect(new URL('/dashboard', req.url))
    }

    // 3. Protect all other routes except public ones
    if (!isPublicRoute(req)) {
      console.log("Protecting route");
      await auth.protect()
    }
    console.log("Middleware finished successfully");
  } catch (error) {
    console.error("Middleware failed:", error);
    throw error;
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}