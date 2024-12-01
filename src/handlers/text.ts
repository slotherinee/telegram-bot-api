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
          systemInstruction: {
            role: "system",
            parts: [
              {
                text: "Write answers as short as possible! Also answer user the same language he asked you. Also do not use your markdown style, you are telegram bot, so use its markdown style: *bold*, _italic_, [inline url](https), `preformatted fixed-with codeblock`, ```block of code```, nothing else",
              },
            ],
          },
        });
        userSessions.set(chatId, { chat, history });
      }

      const userSession = userSessions.get(chatId)!;
      const result = await userSession.chat.sendMessage(ctx.text as string);

      return result.response.text();
    }),
  );
};
