import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@/lib/storage";

function keyFor(profile: string) {
  return profile === "zaportfolio" ? "settings/watermark-zaportfolio.json" : "settings/watermark.json";
}

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  try {
    const meta = await head(keyFor(profile));
    const res = await fetch(meta.url, { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ handle: "", logoUrl: null });
  }
}

export async function POST(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  const body = await req.json();
  await put(keyFor(profile), JSON.stringify(body));
  return NextResponse.json({ ok: true });
}
