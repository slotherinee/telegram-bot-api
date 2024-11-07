import { bot } from "../bot/bot";
import model from "../gemini/gemini";
import { downloadPhoto, handleMedia } from "../utils/utils";

export default () => {
  bot.on("photo", async (ctx) => {
    if (ctx.photo) {
      await handleMedia(
        ctx,
        ctx.photo[ctx.photo.length - 1]?.file_id as string,
        downloadPhoto,
      );
    }
  });
};
