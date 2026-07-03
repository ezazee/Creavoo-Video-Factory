import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Biarkan login page & API lewat tanpa auth
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Route server-to-server dengan auth sendiri (CRON_SECRET / SCHEDULE_WEBHOOK_SECRET):
  // cron GitHub Actions + webhook render selesai — tanpa ini schedule & notif mati total
  if (pathname === "/api/schedule/tick" || pathname === "/api/schedule/complete") {
    return NextResponse.next();
  }

  // Panggilan internal antar-route (tick → generate/render/publish) membawa secret header
  const internalSecret = req.headers.get("x-internal-secret");
  if (internalSecret && internalSecret === process.env.SCHEDULE_WEBHOOK_SECRET) {
    return NextResponse.next();
  }

  // Cek cookie auth
  const auth = req.cookies.get("vf_auth")?.value;
  if (auth !== process.env.AUTH_TOKEN) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)",
  ],
};
