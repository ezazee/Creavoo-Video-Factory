import { put, head } from "@vercel/blob";

// Konfigurasi aplikasi — disimpan di Blob, bisa diubah dari halaman Settings
// tanpa redeploy. Env vars jadi fallback kalau field kosong.
export type AppConfig = {
  aiModel: string;
  aiBaseUrl: string;
  aiApiKey: string;
  zernioKeyCreavoo: string;
  zernioKeyZaportfolio: string;
  telegramBotToken: string;
  telegramChatId: string;
  tavilyApiKey: string;
  defaultVoice: string;
};

const CONFIG_KEY = "settings/app-config.json";
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN!;

function envDefaults(): AppConfig {
  return {
    aiModel: process.env.AI_MODEL ?? "cerebras/gpt-oss-120b",
    aiBaseUrl: process.env.AI_BASE_URL ?? "",
    aiApiKey: process.env.AI_API_KEY ?? "",
    zernioKeyCreavoo: process.env.ZERNIO_API_KEY_CREAVOO ?? process.env.ZERNIO_API_KEY ?? "",
    zernioKeyZaportfolio: process.env.ZERNIO_API_KEY_ZAPORTFOLIO ?? "",
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
    telegramChatId: process.env.TELEGRAM_CHAT_ID ?? "",
    tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
    defaultVoice: process.env.TTS_VOICE ?? "id-ID-ArdiNeural",
  };
}

// ponytail: cache per-instance 30 detik — cukup untuk mengurangi Blob reads tanpa staleness berarti
let cache: { config: AppConfig; at: number } | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cache && Date.now() - cache.at < 30_000) return cache.config;
  const defaults = envDefaults();
  let config = defaults;
  try {
    const meta = await head(CONFIG_KEY, { token: TOKEN });
    const res = await fetch(meta.url, { cache: "no-store" });
    const saved: Partial<AppConfig> = await res.json();
    // Field kosong di Blob → pakai env fallback
    config = Object.fromEntries(
      (Object.keys(defaults) as (keyof AppConfig)[]).map((k) => [k, saved[k] || defaults[k]])
    ) as AppConfig;
  } catch { /* belum ada config tersimpan */ }
  cache = { config, at: Date.now() };
  return config;
}

export async function saveConfig(partial: Partial<AppConfig>): Promise<AppConfig> {
  const current = await loadConfigRaw();
  const updated = { ...current, ...partial };
  await put(CONFIG_KEY, JSON.stringify(updated), {
    access: "public", token: TOKEN, addRandomSuffix: false,
  });
  cache = null;
  return loadConfig();
}

// Nilai mentah yang tersimpan di Blob (tanpa env fallback) — untuk merge saat save
async function loadConfigRaw(): Promise<Partial<AppConfig>> {
  try {
    const meta = await head(CONFIG_KEY, { token: TOKEN });
    const res = await fetch(meta.url, { cache: "no-store" });
    return await res.json();
  } catch {
    return {};
  }
}

export async function getZernioKey(profile: string): Promise<string> {
  const c = await loadConfig();
  return profile === "zaportfolio" ? c.zernioKeyZaportfolio : c.zernioKeyCreavoo;
}
