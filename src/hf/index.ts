import type TelegramBot from "node-telegram-bot-api";

export async function query(data: { inputs: string }) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev",
      {
        headers: {
          Authorization: `Bearer ${Bun.env.HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    const blob = await response.blob();
    const fileName = `${crypto.randomUUID()}.jpeg`;
    const filePath = `./temp/${fileName}`;
    await Bun.write(filePath, blob);

    return filePath;
  } catch (error: unknown) {
    console.log(error);
    return error;
  }
}
