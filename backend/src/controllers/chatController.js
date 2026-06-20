import { buildPrompt } from '../ai/prompts.js';
import { generateContent } from '../ai/gemini.js';
import { safeParseGeminiResponse } from '../utils/aiParser.js';
import { retrieveRelevantContext } from '../rag/retriever.js';// You'll build this next
import { retrieve, mergeWithDistrictOverride } from '../rag/retriever.js';



export async function handleChat(req, res) {
    try {
        const { query } = req.body;
        const userDistrict = req.session.district || null;

        // 1. Get relevant context from RAG (you'll implement this)
        const retrievedData = await retrieveRelevantContext(query, userDistrict);

        // 2. Build the prompt
        const prompt = buildPrompt(query, retrievedData, null);

        // 3. Call Gemini
        const rawAiResponse = await generateContent(prompt);

        // 4. Safely parse the response
        const parsedResponse = safeParseGeminiResponse(rawAiResponse);

        res.json({
            success: true,
            data: parsedResponse
        });

    } catch (error) {
        console.error("Chat controller error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process your request"
        });
    }
}


export async function handleChat(req, res) {
    const { query } = req.body;
    const userDistrict = req.session.district || null;

    // 1. Retrieve relevant entries
    const retrievedEntries = await retrieve(query, 3);

    // 2. Merge district overrides
    const mergedData = mergeWithDistrictOverride(retrievedEntries, userDistrict);

    // 3. Build prompt and call Gemini
    const prompt = buildPrompt(query, mergedData, null);
    const rawAiResponse = await generateContent(prompt);
    const parsedResponse = safeParseGeminiResponse(rawAiResponse);

    res.json({ success: true, data: parsedResponse });
}