import { bot } from "../bot/bot";
import { queueMediaMiddleware } from "../queueMiddleware/queueMiddleware";
import { downloadAudio, handleMedia } from "../utils/utils";

export default () => {
  bot.on("voice", queueMediaMiddleware(handleMedia, downloadAudio));
};
