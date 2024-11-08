import { bot } from "../bot/bot";
import { queueMediaMiddleware } from "../queueMiddleware/queueMiddleware";
import { downloadPhoto, handleMedia } from "../utils/utils";

export default () => {
  bot.on("photo", queueMediaMiddleware(handleMedia, downloadPhoto));
};
