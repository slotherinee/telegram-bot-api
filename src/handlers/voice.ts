import { bot } from "../bot/bot";
import { handleAudio } from "../utils/utils";

export default () => {
  bot.on("voice", async (ctx) => {
    await handleAudio(ctx, ctx.voice?.file_id as string);
  });
};
