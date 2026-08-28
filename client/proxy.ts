import { clerkMiddleware } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'

// createRouteMatcher is deprecated (path-based auth in middleware can diverge
// from actual routing); matching the same public paths by hand instead.
function isPublicRoute(req: NextRequest) {
  const { pathname } = req.nextUrl
  return (
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/api/webhook")
  )
}

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    // '/(api|trpc)(.*)',
    // Always run for Clerk-specific frontend API routes
    '/__clerk/(.*)',
  ],
}
