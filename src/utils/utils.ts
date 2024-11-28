import type TelegramBot from "node-telegram-bot-api";
import { bot } from "../bot/bot";
import type { AllowedTypes } from "../types/types";
import {
  allowedAudioTypes,
  allowedDocumentTypes,
  allowedImageTypes,
  allowedVideoTypes,
} from "./data";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import model from "../gemini/gemini";
import { readdir, unlink, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import cron from "node-cron";
import { query } from "../hf";

const mediaGroupStore = new Map();
const history = new Map();

export async function handleMedia(
  ctx: TelegramBot.Message,
  fileId: string,
  downloadFunction: (
    url: string,
  ) => Promise<{ filePath: string; mimeType: string } | Error>,
) {
  if (ctx.media_group_id) {
    if (!mediaGroupStore.has(ctx.media_group_id)) {
      mediaGroupStore.set(ctx.media_group_id, {
        files: [],
        caption: ctx.caption || ctx.text,
      });
    }

    const fileInfo = {
      fileId,
      type: ctx.photo
        ? "photo"
        : ctx.document
          ? "document"
          : ctx.video
            ? "video"
            : "audio",
      downloadFunction,
    };
    mediaGroupStore.get(ctx.media_group_id).files.push(fileInfo);

    setTimeout(async () => {
      const groupData = mediaGroupStore.get(ctx.media_group_id);
      if (!groupData) return;
      mediaGroupStore.delete(ctx.media_group_id);

      try {
        bot.sendChatAction(ctx.chat.id, "typing");

        const downloadedFiles = [];
        for (const file of groupData.files) {
          const fileLink = await bot.getFileLink(file.fileId);
          if (!fileLink) continue;

          const downloadResult = await file.downloadFunction(fileLink);
          if (downloadResult instanceof Error) continue;

          downloadedFiles.push(downloadResult);
        }

        const fileManager = new GoogleAIFileManager(
          Bun.env.GEMINI_TOKEN as string,
        );
        const uploadPromises = downloadedFiles.map((file) =>
          fileManager.uploadFile(file.filePath, {
            mimeType: file.mimeType,
            displayName: "file",
          }),
        );
        const uploads = await Promise.all(uploadPromises);

        const result = await model.generateContent([
          ...uploads.map((upload) => ({
            fileData: {
              mimeType: upload.file.mimeType,
              fileUri: upload.file.uri,
            },
          })),
          {
            text:
              groupData.caption ||
              "Check these media files and give an answer!",
          },
        ]);
        if (!result.response.text()) {
          bot.sendMessage(ctx.chat.id, "Something went wrong...");
        }

        await Promise.all(
          downloadedFiles.map((file) => deleteFile(file.filePath)),
        );
        history.set(ctx.chat.id, result.response.text());
        bot.sendMessage(ctx.chat.id, result.response.text());
      } catch (error) {
        bot.sendMessage(ctx.chat.id, "Something went wrong...");
      }
    }, 1000);
  } else {
    try {
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
      const fileManager = new GoogleAIFileManager(
        Bun.env.GEMINI_TOKEN as string,
      );
      const uploadResponse = await fileManager.uploadFile(filePath as string, {
        mimeType,
        displayName: "file",
      });

      const name = uploadResponse.file.name;
      let file = await fileManager.getFile(name);
      while (file.state === FileState.PROCESSING) {
        await new Promise((resolve) => setTimeout(resolve, 5_000));
        file = await fileManager.getFile(name);
      }

      if (file.state === FileState.FAILED) {
        throw new Error("Video processing failed.");
      }

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
            "Check this media file and give an answer!",
        },
      ]);

      const error = await deleteFile(filePath);
      if (error instanceof Error) {
        console.log("error deleting file", error);
        bot.sendMessage(ctx.chat.id, "Something went wrong...");
      }

      if (!result.response.text()) {
        bot.sendMessage(ctx.chat.id, "Something went wrong...");
      }
      bot.sendMessage(ctx.chat.id, result.response.text());
    } catch (error) {
      console.log("Error handling media:", error);
      bot.sendMessage(ctx.chat.id, "Something went wrong...");
      return;
    }
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

export async function handleImageGeneration(
  ctx: TelegramBot.Message,
): Promise<string> {
  try {
    bot.sendChatAction(ctx.chat.id, "upload_photo");
    const filePath = await query({
      inputs: ctx.text!.slice(3),
    });
    if (filePath instanceof Error || typeof filePath !== "string") {
      bot.sendMessage(ctx.chat.id, "An error occurred");
      return "❌";
    }
    await bot.sendPhoto(
      ctx.chat.id,
      filePath as string,
      {},
      { contentType: "application/octet-stream" },
    );
    await deleteFile(filePath as string);
    return "📷";
  } catch (error) {
    console.log("Error in handleInstagramQuery:", error);
    bot.sendMessage(ctx.chat.id, "An error occurred");
    return "❌";
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
  if (fileType === "js" || fileType === "ts" || fileType === "tsx") {
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

export async function downloadVideo(
  url: string,
): Promise<{ filePath: string; mimeType: string } | Error> {
  return downloadResource(url, allowedVideoTypes);
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

async function manageTempFolder() {
  const tempFolderPath = "./temp";
  const gitkeepFilePath = join(tempFolderPath, ".gitkeep");

  try {
    await mkdir(tempFolderPath, { recursive: true });

    const files = await readdir(tempFolderPath);

    await Promise.all(
      files.map(async (file) => {
        if (file !== ".gitkeep") {
          await unlink(join(tempFolderPath, file));
        }
      }),
    );

    await writeFile(gitkeepFilePath, "", { flag: "wx" }).catch(() => {});
  } catch (err) {
    console.error("Error managing temp folder:", err);
  }
}

cron.schedule("0 0 * * *", manageTempFolder);
