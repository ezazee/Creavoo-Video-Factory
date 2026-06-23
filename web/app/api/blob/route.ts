import { NextRequest, NextResponse } from "next/server";
import { del, list } from "@vercel/blob";

export async function GET() {
  const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });
  // hanya video MP4
  const videos = blobs
    .filter((b) => b.pathname.endsWith(".mp4"))
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .map((b) => ({ url: b.url, pathname: b.pathname, uploadedAt: b.uploadedAt, size: b.size }));
  return NextResponse.json({ videos });
}

export async function DELETE(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return NextResponse.json({ ok: true });
}
