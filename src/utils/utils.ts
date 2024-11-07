import { allowedDocumentTypes } from "./data";
import { unlink } from "node:fs/promises";

export async function downloadFile(
  url: string,
): Promise<{ filePath: string; mimeType: string } | Error> {
  try {
    console.log("URL IS: ", url);
    const fileType = getFileTypebyUrl(url);
    if (!allowedDocumentTypes[fileType]) {
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
      mimeType: allowedDocumentTypes[fileType],
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
