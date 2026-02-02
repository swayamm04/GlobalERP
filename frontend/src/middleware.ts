import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const authToken = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    // Paths protecting logic
    const isLoginPage = pathname === "/login";
    const isPublicAsset = pathname.includes(".") || pathname.startsWith("/_next"); // static files, images, next internal

    // If trying to access login page while already authenticated, redirect to home
    if (isLoginPage && authToken) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // If trying to access protected route without auth token, redirect to login
    if (!authToken && !isLoginPage && !isPublicAsset) {
        return NextResponse.redirect(new URL("/login", request.url));
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
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
