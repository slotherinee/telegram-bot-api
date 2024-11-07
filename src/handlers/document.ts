import { bot } from "../bot/bot";
import { downloadFile, handleMedia } from "../utils/utils";

export default () => {
  bot.on("document", async (ctx) => {
    await handleMedia(ctx, ctx.voice?.file_id as string, downloadFile);
  });
};
