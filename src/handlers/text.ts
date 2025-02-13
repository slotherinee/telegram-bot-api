import model from "../gemini/gemini";
import { bot } from "../bot/bot";
import { queueMiddleware } from "../queueMiddleware/queueMiddleware";
import { handleImageGeneration } from "../utils/utils";

type participantsMessages = {
  role: string;
  parts: { text: string }[];
}[];

const userSessions: Map<number, { chat: any; history: participantsMessages }> =
  new Map();

export default () => {
  bot.on(
    "text",
    queueMiddleware(async (ctx) => {
      if (ctx.text?.startsWith("/ig")) {
        return handleImageGeneration(ctx);
      }

      const chatId = ctx.chat.id;
      bot.sendChatAction(chatId, "typing");

      if (!userSessions.has(chatId)) {
        const history: participantsMessages = [];
        const chat = model.startChat({
          history,
        });
        userSessions.set(chatId, { chat, history });
      }

      const userSession = userSessions.get(chatId)!;
      const result = await userSession.chat.sendMessage(ctx.text as string);

      return result.response.text();
    }),
  );
};
