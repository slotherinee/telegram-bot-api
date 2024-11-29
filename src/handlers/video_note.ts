import { bot } from "../bot/bot";
import { downloadVideo, handleMedia } from "../utils/utils";

export default () => {
  bot.on("video_note", async (ctx) => {
    const fileId = ctx.video_note?.file_id!;
    handleMedia(ctx, fileId, downloadVideo);
  });
};
