import PQueue from "p-queue";
import type TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot/bot";

const MAX_REQUESTS_PER_MINUTE = 15;

const requestQueue = new PQueue({
  concurrency: MAX_REQUESTS_PER_MINUTE,
  interval: 60000,
  intervalCap: MAX_REQUESTS_PER_MINUTE,
});

async function sendMessageWithMarkdownFallback(
  chatId: number,
  text: string,
): Promise<TelegramBot.Message> {
  try {
    return await bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  } catch (markdownError) {
    return await bot.sendMessage(chatId, text);
  }
}

async function editMessageWithMarkdownFallback(
  chatId: number,
  messageId: number,
  text: string,
): Promise<TelegramBot.Message | boolean> {
  try {
    return await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "Markdown",
    });
  } catch (markdownError) {
    return await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
    });
  }
}

export const queueMiddleware = (
  handler: (ctx: TelegramBot.Message) => Promise<string>,
) => {
  return async (ctx: TelegramBot.Message) => {
    const chatId = ctx.chat.id;
    let sentMessage: TelegramBot.Message | undefined;

    requestQueue.add(async () => {
      try {
        const responseText = await handler(ctx);

        if (sentMessage) {
          await editMessageWithMarkdownFallback(
            chatId,
            sentMessage.message_id,
            responseText,
          );
        } else {
          await sendMessageWithMarkdownFallback(chatId, responseText);
        }
      } catch (error) {
        console.log(error);
        if (sentMessage) {
          await editMessageWithMarkdownFallback(
            chatId,
            sentMessage.message_id,
            "Something went wrong...5124",
          );
        } else {
          await sendMessageWithMarkdownFallback(
            chatId,
            "Something went wrong...5111",
          );
        }
      }
    });

    if (requestQueue.size > 0) {
      sentMessage = await sendMessageWithMarkdownFallback(
        chatId,
        "Your request is in a queue, please wait...",
      );
    }
  };
};

// import PQueue from "p-queue";
// import type TelegramBot from "node-telegram-bot-api";
// import { bot } from "../bot/bot";

// const MAX_REQUESTS_PER_MINUTE = 15;

// const requestQueue = new PQueue({
//   concurrency: MAX_REQUESTS_PER_MINUTE,
//   interval: 60000,
//   intervalCap: MAX_REQUESTS_PER_MINUTE,
// });

// export const queueMiddleware = (
//   handler: (ctx: TelegramBot.Message) => Promise<string>,
// ) => {
//   return async (ctx: TelegramBot.Message) => {
//     const chatId = ctx.chat.id;
//     let sentMessage: TelegramBot.Message | undefined;

//     requestQueue.add(async () => {
//       try {
//         const responseText = await handler(ctx);

//         if (sentMessage) {
//           await bot.editMessageText(responseText, {
//             chat_id: chatId,
//             message_id: sentMessage.message_id,
//           });
//         } else {
//           try {
//             await bot.sendMessage(chatId, responseText, {
//               parse_mode: "Markdown",
//             });
//           } catch (markdownError) {
//             await bot.sendMessage(chatId, responseText);
//           }
//         }
//       } catch (error) {
//         console.log(error);
//         if (sentMessage) {
//           await bot.editMessageText("Something went wrong...5124", {
//             chat_id: chatId,
//             message_id: sentMessage.message_id,
//           });
//         } else {
//           await bot.sendMessage(chatId, "Something went wrong...5111");
//         }
//       }
//     });

//     if (requestQueue.size > 0) {
//       sentMessage = await bot.sendMessage(
//         chatId,
//         "Your request is in a queue, please wait...",
//       );
//     }
//   };
// };

// export const queueMediaMiddleware = (
//   handler: (
//     ctx: TelegramBot.Message,
//     fileId: string,
//     downloadFunction: (
//       url: string,
//     ) => Promise<{ filePath: string; mimeType: string } | Error>,
//   ) => Promise<string | undefined>,
//   downloadFunction: (
//     url: string,
//   ) => Promise<{ filePath: string; mimeType: string } | Error>,
// ) => {
//   return async (ctx: TelegramBot.Message) => {
//     const chatId = ctx.chat.id;
//     let fileId: string | undefined;

//     if (ctx.audio?.file_id) {
//       fileId = ctx.audio.file_id;
//     } else if (ctx.document?.file_id) {
//       fileId = ctx.document.file_id;
//     } else if (ctx.photo) {
//       fileId = ctx.photo[ctx.photo.length - 1]?.file_id;
//     } else if (ctx.voice?.file_id) {
//       fileId = ctx.voice.file_id;
//     }

//     if (!fileId) {
//       await bot.sendMessage(chatId, "No media file found.");
//       return;
//     }

//     let sentMessage: TelegramBot.Message | undefined;

//     requestQueue.add(async () => {
//       try {
//         const responseText = await handler(ctx, fileId, downloadFunction);

//         if (sentMessage) {
//           await bot.editMessageText(responseText || "Something went wrong...222", {
//             chat_id: chatId,
//             message_id: sentMessage.message_id,
//           });
//         } else {
//           await bot.sendMessage(
//             chatId,
//             responseText || "Something went wrong...444",
//           );
//         }
//       } catch (error) {
//         console.log(error);
//         if (sentMessage) {
//           await bot.editMessageText("Something went wrong...555", {
//             chat_id: chatId,
//             message_id: sentMessage.message_id,
//           });
//         } else {
//           await bot.sendMessage(chatId, "Something went wrong...666");
//         }
//       }
//     });

//     if (requestQueue.size > 0) {
//       sentMessage = await bot.sendMessage(
//         chatId,
//         "Your request is in a queue, please wait...",
//       );
//     }
//   };
// };
