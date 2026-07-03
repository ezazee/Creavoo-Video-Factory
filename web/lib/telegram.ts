import { loadConfig } from "./config";

export async function sendTelegram(message: string) {
  const { telegramBotToken: token, telegramChatId: chatId } = await loadConfig();
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
  }).catch(() => {});
}
