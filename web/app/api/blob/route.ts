import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";

export async function DELETE(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  return NextResponse.json({ ok: true });
}
