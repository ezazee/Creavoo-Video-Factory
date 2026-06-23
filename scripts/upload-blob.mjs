// Uploads rendered video + thumbnail to Vercel Blob. Called by GitHub Actions after render.
// Usage: node scripts/upload-blob.mjs <runId>
import { put } from "@vercel/blob";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const runId = process.argv[2];
if (!runId) { console.error("Usage: upload-blob.mjs <runId>"); process.exit(1); }

const videoPath = resolve("out/video.mp4");
const thumbPath = resolve("out/thumbnail.jpg");

// Extract frame at 1s sebagai thumbnail (ffmpeg tersedia di ubuntu-latest)
try {
  execSync(`ffmpeg -ss 1 -i "${videoPath}" -vframes 1 -q:v 2 "${thumbPath}" -y`, { stdio: "pipe" });
} catch { /* thumbnail opsional, jangan fail */ }

const videoData = readFileSync(videoPath);
const blob = await put(`video-${runId}.mp4`, videoData, {
  access: "public",
  token: process.env.BLOB_READ_WRITE_TOKEN,
});
console.log(blob.url);

if (existsSync(thumbPath)) {
  const thumbData = readFileSync(thumbPath);
  const thumbBlob = await put(`thumbnail-${runId}.jpg`, thumbData, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  console.log("THUMBNAIL:" + thumbBlob.url);
}
