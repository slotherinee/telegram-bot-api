import { bot } from "../bot/bot";
import { downloadAudio, handleMedia } from "../utils/utils";

export default () => {
  bot.on("audio", async (ctx) => {
    const fileId = ctx.audio?.file_id!;
    handleMedia(ctx, fileId, downloadAudio);
  });
};
