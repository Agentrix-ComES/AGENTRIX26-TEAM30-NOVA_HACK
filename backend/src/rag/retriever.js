import { GoogleGenerativeAI } from '@google/generative-ai';
import { getVectorStore } from './vectorStore.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

/**
 * Computes cosine similarity between two vectors.
 * Cosine similarity = (A · B) / (||A|| * ||B||)
 * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 *
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} Cosine similarity score
 */
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    // Avoid division by zero
    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Retrieves the top K most relevant entries for a user query.
 *
 * @param {string} query - The user's question
 * @param {number} topK - Number of results to return (default: 3)
 * @returns {Promise<object[]>} Array of relevant knowledge entries
 */
export async function retrieve(query, topK = 3) {
    const vectorStore = getVectorStore();

    // 1. Embed the user's query
    const queryResult = await embeddingModel.embedContent(query);
    const queryVector = queryResult.embedding.values;

    // 2. Compute similarity scores for all entries
    const scoredEntries = vectorStore.map(item => ({
        entry: item.entry,
        score: cosineSimilarity(queryVector, item.vector)
    }));

    // 3. Sort by score (descending) and take top K
    scoredEntries.sort((a, b) => b.score - a.score);
    const topResults = scoredEntries.slice(0, topK).map(item => item.entry);

    console.log(`🔍 Retrieved ${topResults.length} relevant entries for query: "${query}"`);
    topResults.forEach((entry, i) => {
        console.log(`  ${i + 1}. ${entry.id} (score: ${scoredEntries[i].score.toFixed(3)})`);
    });

    return topResults;
}

/**
 * Merges district-specific overrides into national defaults.
 * For each service, if there's both a national default and a district override,
 * the override's non-null fields replace the default's fields.
 *
 * @param {object[]} retrievedEntries - Array of entries from retrieve()
 * @param {string|null} userDistrict - The user's district (e.g., "Colombo")
 * @returns {object|null} Merged data object ready for the AI prompt, or null if no results
 */
export function mergeWithDistrictOverride(retrievedEntries, userDistrict) {
    if (retrievedEntries.length === 0) {
        return null;
    }

    // Group entries by service
    const byService = {};
    for (const entry of retrievedEntries) {
        if (!byService[entry.service]) {
            byService[entry.service] = [];
        }
        byService[entry.service].push(entry);
    }

    // For each service, merge default + override
    const mergedResults = [];
    for (const service of Object.keys(byService)) {
        const entries = byService[service];

        // Find the national default and district override (if user provided a district)
        const defaultEntry = entries.find(e => e.scope === 'national');
        const overrideEntry = userDistrict
            ? entries.find(e => e.scope === 'district_override' && e.district === userDistrict)
            : null;

        if (defaultEntry) {
            // Start with the default data
            const mergedData = { ...defaultEntry.data };
            mergedData.service = service;
            mergedData.pdf_filename = defaultEntry.pdf_filename;

            // Override with non-null fields from district override
            if (overrideEntry) {
                console.log(`  🔄 Merging ${userDistrict} override for ${service}`);
                for (const key of Object.keys(overrideEntry.data)) {
                    if (overrideEntry.data[key] !== null) {
                        mergedData[key] = overrideEntry.data[key];
                    }
                }
                // Override PDF if specified
                if (overrideEntry.pdf_filename) {
                    mergedData.pdf_filename = overrideEntry.pdf_filename;
                }
            }

            mergedResults.push(mergedData);
        }
    }

    // Return the first merged result (most relevant service)
    return mergedResults.length > 0 ? mergedResults[0] : null;
}