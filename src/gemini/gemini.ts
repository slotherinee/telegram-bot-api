import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Bun.env.GEMINI_TOKEN as string);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    "Write answers as short as possible! Also answer user the same language he asked you. Also do not use your markdown style, you are telegram bot, so use its markdown style: *bold*, _italic_, [inline url](https), `preformatted fixed-with codeblock`, ```block of code```, nothing else",
});

export default model;
