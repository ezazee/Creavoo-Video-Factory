// AI model config: murni dari environment variables (Vercel dashboard).
export type AiConfig = {
  aiModel: string;
  aiBaseUrl: string;
  aiApiKey: string;
};

export function loadConfig(): AiConfig {
  return {
    aiModel: process.env.AI_MODEL ?? "cerebras/gpt-oss-120b",
    aiBaseUrl: process.env.AI_BASE_URL ?? "",
    aiApiKey: process.env.AI_API_KEY ?? "",
  };
}

// Zernio, Telegram, Tavily: murni environment variables — diatur di Vercel dashboard
export function getZernioKey(profile: string): string {
  return profile === "zaportfolio"
    ? process.env.ZERNIO_API_KEY_ZAPORTFOLIO ?? ""
    : process.env.ZERNIO_API_KEY_CREAVOO ?? process.env.ZERNIO_API_KEY ?? "";
}
