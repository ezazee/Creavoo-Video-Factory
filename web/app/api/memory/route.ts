import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

const MEMORY_BLOB_KEY = "memory/history.json";
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

export async function DELETE() {
  await put(MEMORY_BLOB_KEY, JSON.stringify([]), {
    access: "public", token: BLOB_TOKEN, addRandomSuffix: false,
  });
  return NextResponse.json({ ok: true });
}
