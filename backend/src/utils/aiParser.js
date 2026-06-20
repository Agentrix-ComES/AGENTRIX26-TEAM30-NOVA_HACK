/**
 * Safely parses Gemini's JSON response, handling markdown code blocks and errors.
 * Falls back to returning the raw text if parsing fails.
 *
 * @param {string} rawText - The raw text response from Gemini
 * @returns {object} Parsed JSON object or fallback object with raw text
 */
export function safeParseGeminiResponse(rawText) {
    // Remove markdown code blocks (```json ... ``` or just ``` ... ```)
    const cleaned = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        console.warn("⚠️ Failed to parse Gemini response as JSON, using fallback");
        console.warn("Raw response was:", rawText);

        // Return a safe fallback so the frontend doesn't break
        return {
            language: "en",
            responseText: rawText,
            formAvailable: false,
            pdfFilename: null
        };
    }
}