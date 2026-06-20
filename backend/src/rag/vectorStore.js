import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini for embeddings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

// This will hold our vector store in memory
let vectorStore = null;

/**
 * Generates an embedding vector for a given text using Gemini.
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} Array of numbers representing the embedding
 */
async function generateEmbedding(text) {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}

/**
 * Builds the in-memory vector store from knowledge.json.
 * Called once at server startup.
 * @returns {Promise<Array<{id: string, vector: number[], entry: object}>>}
 */
export async function buildVectorStore() {
    if (vectorStore) {
        console.log('✅ Vector store already built, returning cached version');
        return vectorStore;
    }

    console.log('🔨 Building vector store from knowledge.json...');

    // 1. Read the knowledge base
    const knowledgePath = path.join(__dirname, '../data/knowledge.json');
    const knowledgeData = JSON.parse(await fs.readFile(knowledgePath, 'utf-8'));

    console.log(`📚 Found ${knowledgeData.length} entries in knowledge base`);

    // 2. Generate embeddings for each entry
    vectorStore = [];
    for (const entry of knowledgeData) {
        console.log(`  🔢 Embedding: ${entry.id}`);
        const vector = await generateEmbedding(entry.text_for_embedding);

        vectorStore.push({
            id: entry.id,
            vector: vector,
            entry: entry
        });
    }

    console.log(`✅ Vector store built with ${vectorStore.length} entries`);
    return vectorStore;
}

/**
 * Returns the cached vector store. Throws if not built yet.
 */
export function getVectorStore() {
    if (!vectorStore) {
        throw new Error('Vector store not built yet. Call buildVectorStore() first.');
    }
    return vectorStore;
}