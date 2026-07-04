import { head } from "./storage";

const MEMORY_BLOB_KEY = "memory/history.json";

export async function readMemory(): Promise<string[]> {
  try {
    const meta = await head(MEMORY_BLOB_KEY);
    const res = await fetch(meta.url);
    return await res.json();
  } catch {
    return [];
  }
}

export function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

// Stopword Indonesia — tidak dihitung saat membandingkan kemiripan judul
const STOPWORDS = new Set([
  "untuk", "buat", "para", "yang", "dengan", "dari", "dalam", "agar", "biar",
  "supaya", "kamu", "anda", "lebih", "paling", "secara", "adalah", "akan",
  "bisa", "harus", "wajib", "tahun",
]);

function significantWords(norm: string): Set<string> {
  return new Set(norm.split(" ").filter((w) => w.length > 3 && !STOPWORDS.has(w)));
}

// Cek kemiripan judul terhadap memory: exact match + word overlap (Jaccard >= 0.6)
export function isDuplicateTitle(title: string, entries: string[]): boolean {
  const norm = normalizeTitle(title);
  if (!norm) return false;
  const words = significantWords(norm);
  for (const entry of entries) {
    // Format entry: "[profile] topik → judul | tips: ..." (atau format lama "topik → judul")
    const parts = entry.split("→");
    const prevTopic = normalizeTitle((parts[0] ?? "").replace(/^\[[^\]]*\]\s*/, ""));
    const prevTitle = normalizeTitle((parts[1] ?? entry).split("|")[0]);
    for (const prev of [prevTopic, prevTitle]) {
      if (!prev) continue;
      if (prev === norm) return true;
      const prevWords = significantWords(prev);
      if (words.size === 0 || prevWords.size === 0) continue;
      let overlap = 0;
      for (const w of words) if (prevWords.has(w)) overlap++;
      const jaccard = overlap / (words.size + prevWords.size - overlap);
      if (jaccard >= 0.6) return true;
    }
  }
  return false;
}
