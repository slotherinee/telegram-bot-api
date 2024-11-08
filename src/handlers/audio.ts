import { bot } from "../bot/bot";
import { downloadAudio, handleMedia } from "../utils/utils";
import { queueMediaMiddleware } from "../queueMiddleware/queueMiddleware";

export default () => {
  bot.on("audio", queueMediaMiddleware(handleMedia, downloadAudio));
};
