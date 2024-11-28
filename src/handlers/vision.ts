import { bot } from "../bot/bot";
import { downloadPhoto, handleMedia } from "../utils/utils";

export default () => {
    bot.on("photo", async (ctx) => {
    const fileId = ctx.photo?.[ctx.photo.length - 1].file_id!;
    handleMedia(ctx, fileId, downloadPhoto);
})};
