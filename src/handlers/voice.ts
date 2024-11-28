import { bot } from "../bot/bot";
import { downloadAudio, handleMedia } from "../utils/utils";

export default () => {
    bot.on("voice", async (ctx) => {
    const fileId = ctx.voice?.file_id!;
    handleMedia(ctx, fileId, downloadAudio);
})};
