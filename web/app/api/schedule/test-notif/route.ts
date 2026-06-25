import { NextResponse } from "next/server";
import { sendTelegram } from "@/lib/telegram";

export async function POST() {
  await sendTelegram(
    `🔔 <b>Test Notifikasi Creavoo</b>\n\n` +
    `Contoh notif yang akan kamu terima:\n\n` +
    `✅ <b>Berhasil diposting!</b>\n📌 <i>5 Tips Viral TikTok 2026</i>\n🎬 Reels\n🔗 https://instagram.com/p/xxx\n\n` +
    `⚠️ <b>Render selesai, tapi belum diposting</b>\n📌 <i>Cara Audit Akun TikTok</i>\n🎠 Carousel · Auto-post tidak aktif\n\n` +
    `❌ <b>Gagal post ke Instagram</b>\n📌 <i>Hook Video 3 Detik</i>\n🎬 Reels · runId 123456\n⚠️ Error: Zernio 400 — account not connected`
  );
  return NextResponse.json({ ok: true });
}
