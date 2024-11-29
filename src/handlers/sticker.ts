import { bot } from "../bot/bot";

export default () => {
  bot.on("sticker", async (ctx) => {
    try {
      const stickerId = ctx.sticker?.file_id!;
      await bot.sendSticker(ctx.chat.id, stickerId);
    } catch (error) {
      console.error("Error sending sticker:", error);
      await bot.sendMessage(
        ctx.chat.id,
        "Sorry, I couldn't send back your sticker",
      );
    }
  });
};
