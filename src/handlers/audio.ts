import { bot } from "../bot/bot";
import { downloadAudio, handleMedia } from "../utils/utils";

export default () => {
  bot.on("audio", async (ctx) => {
    await handleMedia(ctx, ctx.audio?.file_id as string, downloadAudio);
  });
};
