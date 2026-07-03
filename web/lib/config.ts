import { put, head } from "@vercel/blob";

// AI model config: satu-satunya bagian yang bisa diubah dari halaman Settings
// tanpa redeploy (disimpan di Blob, env var jadi fallback kalau field kosong).
export type AiConfig = {
  aiModel: string;
  aiBaseUrl: string;
  aiApiKey: string;
};

const CONFIG_KEY = "settings/app-config.json";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

function envDefaults(): AiConfig {
  return {
    aiModel: process.env.AI_MODEL ?? "cerebras/gpt-oss-120b",
    aiBaseUrl: process.env.AI_BASE_URL ?? "",
    aiApiKey: process.env.AI_API_KEY ?? "",
  };
}

// ponytail: tanpa cache — Vercel serverless jalan di banyak instance terpisah,
// cache per-instance bikin GET setelah save bisa kena instance lama (kelihatan "gagal disimpan")
async function loadConfigRaw(): Promise<Partial<AiConfig>> {
  try {
    const meta = await head(CONFIG_KEY, { token: TOKEN });
    const res = await fetch(meta.url, { cache: "no-store" });
    return await res.json();
  } catch {
    return {};
  }
}

export async function loadConfig(): Promise<AiConfig> {
  const defaults = envDefaults();
  const saved = await loadConfigRaw();
  return Object.fromEntries(
    (Object.keys(defaults) as (keyof AiConfig)[]).map((k) => [k, saved[k] || defaults[k]])
  ) as AiConfig;
}

export async function saveConfig(partial: Partial<AiConfig>): Promise<AiConfig> {
  const current = await loadConfigRaw();
  const updated = { ...current, ...partial };
  await put(CONFIG_KEY, JSON.stringify(updated), {
    access: "public", token: TOKEN, addRandomSuffix: false,
  });
  return loadConfig();
}

// Zernio, Telegram, Tavily: murni environment variables — diatur di Vercel dashboard
export function getZernioKey(profile: string): string {
  return profile === "zaportfolio"
    ? process.env.ZERNIO_API_KEY_ZAPORTFOLIO ?? ""
    : process.env.ZERNIO_API_KEY_CREAVOO ?? process.env.ZERNIO_API_KEY ?? "";
}
