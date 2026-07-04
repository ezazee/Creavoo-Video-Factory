import { NextResponse } from "next/server";
import { put } from "@/lib/storage";

const MEMORY_BLOB_KEY = "memory/history.json";

export async function DELETE() {
  await put(MEMORY_BLOB_KEY, JSON.stringify([]));
  return NextResponse.json({ ok: true });
}
