import TelegramBot from "node-telegram-bot-api";

const token = Bun.env.TELEGRAM_BOT_TOKEN!;

export const bot = new TelegramBot(token);
console.log("bot started");
