import { NextRequest, NextResponse } from "next/server";
import { put, head } from "@vercel/blob";

const KEY = "settings/watermark.json";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export async function GET() {
  try {
    const meta = await head(KEY, { token: TOKEN });
    const res = await fetch(meta.url, { cache: "no-store" });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ handle: "", logoUrl: null });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  await put(KEY, JSON.stringify(body), {
    access: "public", token: TOKEN, addRandomSuffix: false,
  });
  return NextResponse.json({ ok: true });
}
