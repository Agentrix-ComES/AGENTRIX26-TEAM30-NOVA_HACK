import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the client with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the 'flash' model for speed and free-tier limits
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
    console.error("Gemini API Error:", error);
    // Throw a clean error so our Express error handler can catch it
    throw new Error("Failed to get response from AI"); 
  }
}