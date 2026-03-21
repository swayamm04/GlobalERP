import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get("auth_token")?.value;
    const userRole = request.cookies.get("user_role")?.value;
    const { pathname } = request.nextUrl;

    // Paths protecting logic
    const isLoginPage = pathname === "/login";
    const isPublicAsset = pathname.includes(".") || pathname.startsWith("/_next"); // static files, images, next internal

    // Redirect logic for non-authenticated users
    if (isLoginPage && authToken) {
        return NextResponse.redirect(new URL("/", request.url));
    }
    if (!authToken && !isLoginPage && !isPublicAsset) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // RBAC: Restrict specific paths to super_admin only
    const restrictedPaths = ["/dummy-orders", "/past-order", "/users", "/secret-dashboard"];
    if (restrictedPaths.some(path => pathname.startsWith(path)) && userRole !== "super_admin") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Add security headers to prevent caching of protected pages (BFcache)
    const response = NextResponse.next();
    
    if (!isPublicAsset && !isLoginPage) {
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
    }
    
    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
