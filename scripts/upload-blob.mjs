// Uploads rendered video to Vercel Blob. Called by GitHub Actions after render.
// Usage: node scripts/upload-blob.mjs <runId>
import { put } from "@vercel/blob";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const runId = process.argv[2];
if (!runId) { console.error("Usage: upload-blob.mjs <runId>"); process.exit(1); }

const filePath = resolve("out/video.mp4");
const data = readFileSync(filePath);

const blob = await put(`video-${runId}.mp4`, data, {
  access: "public",
  token: process.env.BLOB_READ_WRITE_TOKEN,
});

console.log(blob.url);
