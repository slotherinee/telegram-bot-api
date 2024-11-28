import { bot } from "../bot/bot";
import { downloadVideo, handleMedia } from "../utils/utils";

export default () => {
  bot.on("video", async (ctx) => {
    const fileId = ctx.video?.file_id!;
    handleMedia(ctx, fileId, downloadVideo);
  });
};
