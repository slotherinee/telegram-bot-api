import { bot } from "../bot/bot";
import model from "../gemini/gemini";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { deleteFile, downloadFile } from "../utils/utils";

export default () => {
  bot.on("document", async (ctx) => {
    bot.sendChatAction(ctx.chat.id, "typing");
    const documentLink = await bot.getFileLink(ctx.document?.file_id as string);
    if (!documentLink) bot.sendMessage(ctx.chat.id, "Something went wrong...");

    const downloadResult = await downloadFile(documentLink);
    if (downloadResult instanceof Error) {
      bot.sendMessage(ctx.chat.id, "Something went wrong...");
      console.log("error downloading file", downloadResult);
      return;
    }
    const { filePath, mimeType } = downloadResult;
    const fileManager = new GoogleAIFileManager(Bun.env.GEMINI_TOKEN as string);
    const uploadResponse = await fileManager.uploadFile(filePath as string, {
      mimeType,
      displayName: "file",
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResponse.file.mimeType,
          fileUri: uploadResponse.file.uri,
        },
      },
      {
        text:
          ctx.text || ctx.caption || "Analyze this file and give me a summary",
      },
    ]);
    bot.sendMessage(ctx.chat.id, result.response.text());
    const error = await deleteFile(filePath);
    if (error instanceof Error) {
      console.log("error deleting file", error);
      bot.sendMessage(ctx.chat.id, "Something went wrong...");
    }
  });
};
