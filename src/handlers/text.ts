import model from "../gemini/gemini";
import { bot } from "../bot/bot";
import { queueMiddleware } from "../queueMiddleware/queueMiddleware";

export default () => {
  bot.on(
    "text",
    queueMiddleware(async (ctx) => {
      bot.sendChatAction(ctx.chat.id, "typing");
      const response = await model.generateContent(ctx.text as string);
      return response.response.text();
    }),
  );
};
