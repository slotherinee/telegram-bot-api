import { bot } from "../bot/bot";
import { handleAudio } from "../utils/utils";

export default () => {
  bot.on("audio", async (ctx) => {
    await handleAudio(ctx, ctx.audio?.file_id as string);
  });
};
