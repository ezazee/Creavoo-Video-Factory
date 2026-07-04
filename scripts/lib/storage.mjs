// Object storage — MinIO (S3-compatible). Standalone Node module used by
// upload scripts invoked from GitHub Actions (no Next.js path aliases here).
import {
  S3Client, PutObjectCommand, DeleteObjectCommand,
} from "@aws-sdk/client-s3";

const ENDPOINT = (process.env.MINIO_ENDPOINT ?? "").replace(/\/$/, "");
const BUCKET = process.env.MINIO_BUCKET ?? "";
const REGION = process.env.MINIO_REGION ?? "us-east-1";
const PUBLIC_URL = (process.env.MINIO_PUBLIC_URL || ENDPOINT).replace(/\/$/, "");

let client = null;
function s3() {
  if (!client) {
    client = new S3Client({
      endpoint: ENDPOINT,
      region: REGION,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY ?? "",
        secretAccessKey: process.env.MINIO_SECRET_KEY ?? "",
      },
      forcePathStyle: true,
    });
  }
  return client;
}

function urlForKey(key) {
  return `${PUBLIC_URL}/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function keyFromUrl(url) {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) throw new Error(`Cannot resolve storage key from url: ${url}`);
  return decodeURIComponent(url.slice(idx + marker.length));
}

function guessContentType(pathname) {
  const ext = pathname.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json": return "application/json";
    case "mp4": return "video/mp4";
    case "jpg": case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "svg": return "image/svg+xml";
    case "webp": return "image/webp";
    default: return undefined;
  }
}

// Diagnosa koneksi: bedakan "secrets kosong" vs "diblokir proxy/Cloudflare".
async function diagnose(err) {
  console.error("─── STORAGE UPLOAD DIAGNOSTICS ───");
  console.error("MINIO_ENDPOINT set   :", ENDPOINT ? ENDPOINT : "❌ KOSONG — cek GitHub Secrets");
  console.error("MINIO_BUCKET set     :", BUCKET ? BUCKET : "❌ KOSONG — cek GitHub Secrets");
  console.error("MINIO_ACCESS_KEY set :", process.env.MINIO_ACCESS_KEY ? "yes" : "❌ KOSONG — cek GitHub Secrets");
  console.error("MINIO_SECRET_KEY set :", process.env.MINIO_SECRET_KEY ? "yes" : "❌ KOSONG — cek GitHub Secrets");
  console.error("HTTP status          :", err?.$metadata?.httpStatusCode ?? "n/a");
  if (ENDPOINT) {
    try {
      const res = await fetch(`${ENDPOINT}/${BUCKET}/`, { method: "GET" });
      const body = (await res.text()).slice(0, 300);
      console.error(`Raw GET ${ENDPOINT}/${BUCKET}/ → ${res.status}`);
      console.error("Raw body (300 chars) :", body);
      if (body.trimStart().toLowerCase().startsWith("<!doctype") || body.includes("cloudflare")) {
        console.error("⚠️  Response berupa HTML — kemungkinan Cloudflare/WAF memblokir request dari IP GitHub Actions.");
        console.error("    Solusi: set DNS record minio-api ke 'DNS only' (grey cloud), atau buat WAF skip rule untuk subdomain ini.");
      }
    } catch (e) {
      console.error("Raw fetch gagal      :", e?.message);
    }
  }
  console.error("──────────────────────────────────");
}

export async function put(pathname, body, options) {
  const contentType = options?.contentType ?? guessContentType(pathname);
  try {
    await s3().send(new PutObjectCommand({
      Bucket: BUCKET, Key: pathname, Body: body, ContentType: contentType,
    }));
  } catch (err) {
    await diagnose(err);
    throw err;
  }
  return { url: urlForKey(pathname), pathname };
}

export async function del(urlOrUrls) {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  if (!urls.length) return;
  const keys = urls.map((u) => (/^https?:\/\//.test(u) ? keyFromUrl(u) : u));
  await Promise.all(keys.map((Key) => s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key }))));
}
