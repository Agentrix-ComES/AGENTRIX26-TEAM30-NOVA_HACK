import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
console.log("[gemini] key loaded?", !!apiKey, "prefix:", apiKey?.slice(0, 6), "length:", apiKey?.length);

const genAI = new GoogleGenerativeAI(apiKey);


// Use a current flash model by default, but allow override from the environment.
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model = genAI.getGenerativeModel({ model: modelName });

/**
 * Sends a prompt to Gemini and returns the text response.
 * @param {string} prompt - The text prompt to send.
 * @returns {Promise<string>} The generated text.
 */
export async function generateContent(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error (full):", error);
    console.error("Gemini API Error (message):", error?.message);
    throw new Error(error?.message || "Failed to get response from AI");
  }
}