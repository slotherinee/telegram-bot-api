import { bot } from "../bot/bot";
import { downloadFile, handleMedia } from "../utils/utils";

export default () => {
  bot.on("document", async (ctx) => {
    const fileId = ctx.document?.file_id!;
    handleMedia(ctx, fileId, downloadFile);
  });
};
