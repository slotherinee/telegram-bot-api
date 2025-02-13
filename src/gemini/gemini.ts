import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Bun.env.GEMINI_TOKEN as string);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash", 
  systemInstruction:
    "Also answer user the same language he asked you. Also do not use your markdown style, use this markdown style: *bold*, _italic_, [inline url](https), `preformatted fixed-with codeblock`, ```block of code``` !",
});

export default model;
