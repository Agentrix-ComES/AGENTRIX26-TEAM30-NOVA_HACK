import { buildPrompt } from '../ai/prompts.js';
import { generateContent } from '../ai/gemini.js';
import { safeParseGeminiResponse } from '../utils/aiParser.js';
import { retrieve, mergeWithDistrictOverride } from '../rag/retriever.js';
import { getRagMode } from '../rag/vectorStore.js';

function minScoreForMode(mode) {
    if (mode === 'bm25') return Number(process.env.RAG_MIN_SCORE_BM25 ?? 1.0);
    return Number(process.env.RAG_MIN_SCORE_EMBEDDING ?? 0.55);
}

export async function handleChat(req, res, next) {
    try {
        const { query } = req.body;
        if (!query || query.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Query is required' });
        }

        const userDistrict = req.session.district || null;
        const mode = getRagMode();
        const minScore = minScoreForMode(mode);

        console.log(`\n📝 [${mode}] Chat query: "${query}"  district=${userDistrict || '—'}`);

        const retrieved = await retrieve(query, 5);
        const confident = retrieved.filter(r => r.score >= minScore);

        const mergedList = mergeWithDistrictOverride(confident, userDistrict);
        const topScore = retrieved[0]?.score ?? 0;

        const prompt = buildPrompt(query, mergedList, null);
        const rawAiResponse = await generateContent(prompt);
        const parsedResponse = safeParseGeminiResponse(rawAiResponse);

        res.json({
            success: true,
            data: parsedResponse,
            debug: {
                mode,
                topScore,
                retrievedIds: retrieved.map(r => ({ id: r.entry.id, score: Number(r.score.toFixed(3)) })),
            },
        });
    } catch (error) {
        console.error('❌ Chat controller error:', error);
        next(error);
    }
}
