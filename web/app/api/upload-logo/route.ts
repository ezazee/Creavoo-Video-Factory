import { NextRequest, NextResponse } from "next/server";
import { put } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "png";
  const blob = await put(`logos/watermark-logo.${ext}`, file);

  return NextResponse.json({ url: blob.url, filename: `watermark-logo.${ext}` });
}
