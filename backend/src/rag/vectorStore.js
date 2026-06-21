import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildBM25Index } from './bm25.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAG_MODE = process.env.RAG_MODE || 'bm25';
const EMBED_MODEL = process.env.EMBEDDING_MODEL || 'embedding-001';
const CACHE_PATH = path.join(__dirname, '../data/embeddings.cache.json');
const KNOWLEDGE_PATH = path.join(__dirname, '../data/knowledge.json');

let vectorStore = null;
let embedClient = null;

function getEmbedClient() {
    if (embedClient) return embedClient;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const genAI = new GoogleGenerativeAI(apiKey);
    embedClient = genAI.getGenerativeModel({ model: EMBED_MODEL });
    return embedClient;
}

function hashFallback(text) {
    const hash = crypto.createHash('sha256').update(text).digest();
    const vector = new Array(768);
    for (let i = 0; i < 768; i++) vector[i] = hash[i % hash.length] / 255;
    return vector;
}

export async function embed(text) {
    const client = getEmbedClient();
    if (!client) return hashFallback(text);
    try {
        const res = await client.embedContent(text);
        return res.embedding.values;
    } catch (err) {
        console.warn(`⚠️ Embedding API failed (${err?.message}); falling back to hash`);
        return hashFallback(text);
    }
}

function contentHash(entries) {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(entries.map(e => [e.id, e.text_for_embedding])))
        .update(EMBED_MODEL)
        .digest('hex');
}

async function loadCache() {
    try { return JSON.parse(await fs.readFile(CACHE_PATH, 'utf-8')); }
    catch { return null; }
}
async function saveCache(payload) {
    await fs.writeFile(CACHE_PATH, JSON.stringify(payload), 'utf-8');
}

async function buildEmbeddingStore(knowledgeData) {
    const fingerprint = contentHash(knowledgeData);
    const cached = await loadCache();
    if (cached && cached.fingerprint === fingerprint) {
        console.log('💾 Using cached embeddings');
        vectorStore = cached.entries.map(c => ({
            id: c.id,
            vector: c.vector,
            entry: knowledgeData.find(k => k.id === c.id),
        }));
        return vectorStore;
    }
    vectorStore = [];
    for (const entry of knowledgeData) {
        console.log(`  🔢 Embedding: ${entry.id}`);
        const vector = await embed(entry.text_for_embedding);
        vectorStore.push({ id: entry.id, vector, entry });
    }
    await saveCache({
        fingerprint,
        model: EMBED_MODEL,
        entries: vectorStore.map(v => ({ id: v.id, vector: v.vector })),
    });
    return vectorStore;
}

/**
 * Builds the retrieval index. RAG_MODE selects:
 *  - "bm25"      (default): lexical BM25, no API calls
 *  - "embedding": Gemini text-embedding (requires API access)
 */
export async function buildVectorStore({ force = false } = {}) {
    if (vectorStore && !force) return vectorStore;

    console.log(`🔨 Building retrieval index (mode=${RAG_MODE})...`);
    const knowledgeData = JSON.parse(await fs.readFile(KNOWLEDGE_PATH, 'utf-8'));
    console.log(`📚 Found ${knowledgeData.length} entries`);

    if (RAG_MODE === 'bm25') {
        buildBM25Index(knowledgeData);
        vectorStore = knowledgeData.map(entry => ({ id: entry.id, entry }));
        return vectorStore;
    }

    if (RAG_MODE === 'embedding') {
        await buildEmbeddingStore(knowledgeData);
        console.log(`✅ Embedding store built with ${vectorStore.length} entries`);
        return vectorStore;
    }

    throw new Error(`Unknown RAG_MODE: ${RAG_MODE}. Use "bm25" or "embedding".`);
}

export function getVectorStore() {
    if (!vectorStore) throw new Error('Vector store not built. Call buildVectorStore() first.');
    return vectorStore;
}

export function getRagMode() {
    return RAG_MODE;
}
