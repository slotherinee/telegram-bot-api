import type TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot/bot";
import type { AllowedTypes } from "../types/types";
import {
  allowedAudioTypes,
  allowedDocumentTypes,
  allowedImageTypes,
} from "./data";
import { unlink } from "node:fs/promises";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import model from "../gemini/gemini";

export async function handleMedia(
  ctx: TelegramBot.Message,
  fileId: string,
  downloadFunction: (
    url: string,
  ) => Promise<{ filePath: string; mimeType: string } | Error>,
) {
  bot.sendChatAction(ctx.chat.id, "typing");
  const fileLink = await bot.getFileLink(fileId);
  if (!fileLink) {
    bot.sendMessage(ctx.chat.id, "Something went wrong...");
    return;
  }

  const downloadResult = await downloadFunction(fileLink);
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
        ctx.text ||
        ctx.caption ||
        "Analyze this file and give me an answer to this media or just describe it",
    },
  ]);
  bot.sendMessage(ctx.chat.id, result.response.text());
  const error = await deleteFile(filePath);
  if (error instanceof Error) {
    console.log("error deleting file", error);
    bot.sendMessage(ctx.chat.id, "Something went wrong...");
  }
}

async function downloadResource(
  url: string,
  allowedTypes: AllowedTypes,
): Promise<{ filePath: string; mimeType: string } | Error> {
  try {
    const fileType = getFileTypebyUrl(url);
    if (!allowedTypes[fileType]) {
      throw new Error("Invalid file type");
    }
    const response = await fetch(url);
    const blob = await response.blob();

    const fileName =
      crypto.randomUUID() +
      `.${fileType === "javascript" ? "js" : fileType === "python" ? "py" : fileType}`;
    const filePath = `./temp/${fileName}`;

    await Bun.write(filePath, blob);
    return {
      filePath,
      mimeType: allowedTypes[fileType],
    };
  } catch (err) {
    console.log(err);
    return err as Error;
  }
}

export async function deleteFile(filePath: string): Promise<Error | void> {
  try {
    await unlink(filePath);
  } catch (err) {
    console.log(err);
    return err as Error;
  }
}

function getFileTypebyUrl(url: string) {
  const fileType = url.split("/").pop()?.split(".").pop() || "pdf";
  if (fileType === "js") {
    return "javascript";
  }
  if (fileType === "py") {
    return "python";
  }
  return fileType;
}

export async function downloadAudio(
  url: string,
): Promise<{ filePath: string; mimeType: string } | Error> {
  return downloadResource(url, allowedAudioTypes);
}

export async function downloadFile(
  url: string,
): Promise<{ filePath: string; mimeType: string } | Error> {
  return downloadResource(url, allowedDocumentTypes);
}

export async function downloadPhoto(
  url: string,
): Promise<{ filePath: string; mimeType: string } | Error> {
  return downloadResource(url, allowedImageTypes);
}
