import { bot } from "../bot/bot";
import { downloadAudio, handleMedia } from "../utils/utils";

export default () => {
  bot.on("voice", async (ctx) => {
    await handleMedia(ctx, ctx.voice?.file_id as string, downloadAudio);
  });
};
