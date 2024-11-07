import model from "../gemini/gemini";
import { bot } from "../bot/bot";

export default () => {
  bot.on("text", async (ctx) => {
    bot.sendChatAction(ctx.chat.id, "typing");
    await model
      .generateContent(ctx.text as string)
      .then((response) => {
        bot.sendMessage(ctx.chat.id, response.response.text());
      })
      .catch((error) => {
        console.log(error);
        bot.sendMessage(ctx.chat.id, "Something went wrong...");
      });
  });
};
