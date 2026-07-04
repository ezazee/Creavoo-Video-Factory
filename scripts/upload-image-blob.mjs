// Uploads rendered image(s) to MinIO.
// Usage: node scripts/upload-image-blob.mjs <runId> [single|carousel]
import { put } from "./lib/storage.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const runId = process.argv[2];
const type = process.argv[3] ?? "single";
if (!runId) { console.error("Usage: upload-image-blob.mjs <runId> [single|carousel]"); process.exit(1); }

if (type === "carousel") {
  // Upload all slide-N.jpg files
  const outDir = resolve("out");
  const slides = readdirSync(outDir)
    .filter(f => f.startsWith("slide-") && f.endsWith(".jpg"))
    .sort((a, b) => {
      const na = parseInt(a.replace("slide-", "").replace(".jpg", ""));
      const nb = parseInt(b.replace("slide-", "").replace(".jpg", ""));
      return na - nb;
    });

  for (const file of slides) {
    const data = readFileSync(resolve(outDir, file));
    const blob = await put(`carousel-${runId}-${file}`, data, { contentType: "image/jpeg" });
    console.log("SLIDE:" + blob.url);
  }
  console.log(`CAROUSEL_COUNT:${slides.length}`);
} else {
  const imgPath = resolve("out/post.jpg");
  const imgData = readFileSync(imgPath);
  const blob = await put(`image-${runId}.jpg`, imgData, { contentType: "image/jpeg" });
  console.log("IMAGE:" + blob.url);
}
