import { bot } from "../bot/bot";
import { queueMediaMiddleware } from "../queueMiddleware/queueMiddleware";
import { downloadFile, handleMedia } from "../utils/utils";

export default () => {
  bot.on("document", queueMediaMiddleware(handleMedia, downloadFile));
};
