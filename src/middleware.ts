import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, user, supabaseResponse } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Public routes: login, register
  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isNdaRoute = pathname === "/nda";

  // Not logged in → redirect to login (unless already on auth route)
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in and on auth route → redirect to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/os/fec-analyzer";
    return NextResponse.redirect(url);
  }

  // Logged in → check NDA signature
  if (user && !isNdaRoute && !isAuthRoute) {
    const { data: ndaSignature } = await supabase
      .from("nda_signatures")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!ndaSignature) {
      const url = request.nextUrl.clone();
      url.pathname = "/nda";
      return NextResponse.redirect(url);
    }
  }

  // Logged in, on NDA route but already signed → redirect to dashboard
  if (user && isNdaRoute) {
    const { data: ndaSignature } = await supabase
      .from("nda_signatures")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (ndaSignature) {
      const url = request.nextUrl.clone();
      url.pathname = "/os/fec-analyzer";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
