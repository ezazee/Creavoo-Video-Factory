import {
  S3Client, PutObjectCommand, HeadObjectCommand, ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Object storage — MinIO (S3-compatible). Drop-in replacement for the
// @vercel/blob API surface (put/head/list/del) so call sites barely change.
const ENDPOINT = (process.env.MINIO_ENDPOINT ?? "").replace(/\/$/, "");
const BUCKET = process.env.MINIO_BUCKET ?? "";
const REGION = process.env.MINIO_REGION ?? "us-east-1";
const PUBLIC_URL = (process.env.MINIO_PUBLIC_URL || ENDPOINT).replace(/\/$/, "");

let client: S3Client | null = null;
function s3(): S3Client {
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

function urlForKey(key: string): string {
  return `${PUBLIC_URL}/${BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

function keyFromUrl(url: string): string {
  const marker = `/${BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) throw new Error(`Cannot resolve storage key from url: ${url}`);
  return decodeURIComponent(url.slice(idx + marker.length));
}

function guessContentType(pathname: string): string | undefined {
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

export type BlobResult = { url: string; pathname: string };

export async function put(
  pathname: string,
  body: string | Buffer | Uint8Array | Blob,
  options?: { addRandomSuffix?: boolean; contentType?: string },
): Promise<BlobResult> {
  let key = pathname;
  if (options?.addRandomSuffix) {
    const dot = pathname.lastIndexOf(".");
    const suffix = Math.random().toString(36).slice(2, 10);
    key = dot === -1 ? `${pathname}-${suffix}` : `${pathname.slice(0, dot)}-${suffix}${pathname.slice(dot)}`;
  }

  const uploadBody = body instanceof Blob ? Buffer.from(await body.arrayBuffer()) : body;
  const contentType = options?.contentType
    ?? (body instanceof Blob ? body.type : undefined)
    ?? guessContentType(pathname);

  await s3().send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: uploadBody, ContentType: contentType,
  }));

  return { url: urlForKey(key), pathname: key };
}

export async function head(pathname: string): Promise<BlobResult> {
  await s3().send(new HeadObjectCommand({ Bucket: BUCKET, Key: pathname }));
  return { url: urlForKey(pathname), pathname };
}

export type ListedBlob = { url: string; pathname: string; uploadedAt: string; size: number };

export async function list(options?: { prefix?: string; limit?: number }): Promise<{ blobs: ListedBlob[] }> {
  const blobs: ListedBlob[] = [];
  let ContinuationToken: string | undefined;
  do {
    const res = await s3().send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: options?.prefix,
      ContinuationToken,
      MaxKeys: options?.limit,
    }));
    for (const obj of res.Contents ?? []) {
      if (!obj.Key) continue;
      blobs.push({
        url: urlForKey(obj.Key),
        pathname: obj.Key,
        uploadedAt: (obj.LastModified ?? new Date()).toISOString(),
        size: obj.Size ?? 0,
      });
    }
    ContinuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (ContinuationToken && !options?.limit);
  return { blobs };
}

export async function del(urlOrUrls: string | string[]): Promise<void> {
  const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  if (!urls.length) return;
  const keys = urls.map((u) => (/^https?:\/\//.test(u) ? keyFromUrl(u) : u));
  // DeleteObjectsCommand (batch) butuh Content-MD5 yang tidak selalu dikirim
  // SDK versi baru — MinIO menolaknya. Hapus satu-satu dengan DeleteObjectCommand.
  await Promise.all(keys.map((Key) => s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key }))));
}
