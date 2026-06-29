import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  if (!password || password !== process.env.AUTH_PASSWORD) {
    return NextResponse.json({ error: "Password salah" }, { status: 401 });
  }

  const token = process.env.AUTH_TOKEN ?? process.env.AUTH_PASSWORD!;
  const res = NextResponse.json({ ok: true });
  res.cookies.set("vf_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("vf_auth");
  return res;
}
