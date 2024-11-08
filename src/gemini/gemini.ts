import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Bun.env.GEMINI_TOKEN as string);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
  systemInstruction:
    "Write answers as short as possible! Also answer user the same language he asked you.",
});

export default model;
