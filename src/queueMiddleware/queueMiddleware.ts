import PQueue from "p-queue";
import type TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot/bot";

const MAX_REQUESTS_PER_MINUTE = 15;

// Create a queue with a concurrency limit
const requestQueue = new PQueue({
  concurrency: MAX_REQUESTS_PER_MINUTE,
  interval: 60000,
  intervalCap: MAX_REQUESTS_PER_MINUTE,
});

export const queueMiddleware = (
  handler: (ctx: TelegramBot.Message) => Promise<string>,
) => {
  return async (ctx: TelegramBot.Message) => {
    const chatId = ctx.chat.id;
    const text = ctx.text as string;
    let sentMessage: TelegramBot.Message | undefined;

    // Add the request to the queue
    requestQueue.add(async () => {
      try {
        const responseText = await handler(ctx);

        if (sentMessage) {
          await bot.editMessageText(responseText, {
            chat_id: chatId,
            message_id: sentMessage.message_id,
          });
        } else {
          await bot.sendMessage(chatId, responseText);
        }
      } catch (error) {
        console.log(error);
        if (sentMessage) {
          await bot.editMessageText("Something went wrong...", {
            chat_id: chatId,
            message_id: sentMessage.message_id,
          });
        } else {
          await bot.sendMessage(chatId, "Something went wrong...");
        }
      }
    });

    if (requestQueue.size > 0) {
      sentMessage = await bot.sendMessage(
        chatId,
        "Your request is in a queue, please wait...",
      );
    }
  };
};
