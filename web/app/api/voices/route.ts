import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return NextResponse.json({ voices: [] });

  const res = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": apiKey },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return NextResponse.json({ voices: [], error: await res.text() });

  const data = await res.json();
  const voices = (data.voices ?? [])
    .filter((v: { category?: string }) => v.category === "premade" || v.category === "cloned" || !v.category)
    .slice(0, 20)
    .map((v: { voice_id: string; name: string; labels?: Record<string, string>; preview_url?: string }) => ({
      id: v.voice_id,
      label: v.name,
      desc: [v.labels?.gender, v.labels?.use_case ?? v.labels?.description].filter(Boolean).join(" · ") || "ElevenLabs",
      previewUrl: v.preview_url ?? null,
    }));

  return NextResponse.json({ voices });
}
