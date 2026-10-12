import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/admin/api";
import { site } from "@/lib/site";
import { recentChats, sendTelegram, telegramConfigured } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Chats that have messaged the bot, to find TELEGRAM_CHAT_ID. */
export const GET = adminRoute(async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json(
      { error: "Set TELEGRAM_BOT_TOKEN in Vercel first." },
      { status: 503 },
    );
  }
  return NextResponse.json({ chats: await recentChats() });
});

/** Sends a test alert. */
export const POST = adminRoute(async () => {
  if (!telegramConfigured()) {
    return NextResponse.json(
      { error: "Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel first." },
      { status: 503 },
    );
  }
  const sent = await sendTelegram(
    `🔔 <b>Test alert from ${site.name}</b>\n\nLead alerts are working. Good-fit leads will appear here.`,
  );
  return sent
    ? NextResponse.json({ ok: true })
    : NextResponse.json(
        { error: "Telegram didn't accept the message — see Errors below." },
        { status: 502 },
      );
});
