import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                },
            },
        }
    );

    // Refresh session and get user
    const { data: { user }, error } = await supabase.auth.getUser();

    // Define route types
    const protectedRoutes = ["/admin", "/pos", "/reports", "/kitchen"];
    const publicRoutes = ["/", "/login", "/order", "/customer"];
    
    const pathname = request.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );
    const isPublicRoute = publicRoutes.some((route) =>
        pathname === route || pathname.startsWith("/order/")
    );

    // If there's an auth error or no user on protected routes, redirect to login
    if (isProtectedRoute && (!user || error)) {
        // Clear any stale auth cookies
        const redirectUrl = new URL("/login", request.url);
        redirectUrl.searchParams.set("redirectTo", pathname);
        
        const redirectResponse = NextResponse.redirect(redirectUrl);
        
        // Clear auth cookies to force fresh login
        redirectResponse.cookies.delete("sb-access-token");
        redirectResponse.cookies.delete("sb-refresh-token");
        
        return redirectResponse;
    }

    // Redirect logged-in users away from login page to their intended destination
    if (pathname === "/login" && user && !error) {
        const redirectTo = request.nextUrl.searchParams.get("redirectTo") || "/pos";
        return NextResponse.redirect(new URL(redirectTo, request.url));
    }

    return response;
}
