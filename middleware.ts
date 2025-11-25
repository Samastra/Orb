import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)', 
  '/api/webhooks/clerk',
  '/terms',
  '/privacy', 
  '/refunds',
  "/api/chat",
  '/boards/new',
  '/boards',
  '/boards/(.*)',         // ← Allow accessing any board without auth
  // Add other public routes as needed
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // If user is signed in and trying to access root ("/"), redirect to dashboard
  if (userId && req.nextUrl.pathname === '/') {
    return Response.redirect(new URL('/dashboard', req.url))
  }
  
  // Protect all other routes except public ones
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}