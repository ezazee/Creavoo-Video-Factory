import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

function keyFor(profile: string) {
  return profile === "zaportfolio" ? "settings/watermark-zaportfolio.json" : "settings/watermark.json";
}

export async function GET(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  try {
    const meta = await head(keyFor(profile), { token: TOKEN });
    const res = await fetch(meta.url, { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ handle: "", logoUrl: null });
  }
}

export async function POST(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get("profile") ?? "creavoo";
  const body = await req.json();
  await put(keyFor(profile), JSON.stringify(body), {
    access: "public", token: TOKEN, addRandomSuffix: false,
  });
  return NextResponse.json({ ok: true });
}
