import { getVectorStore, embed, getRagMode } from './vectorStore.js';
import { searchBM25 } from './bm25.js';

function cosineSimilarity(a, b) {
    if (a.length !== b.length) throw new Error(`dim mismatch: ${a.length} vs ${b.length}`);
    let dot = 0, mA = 0, mB = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; mA += a[i] * a[i]; mB += b[i] * b[i]; }
    mA = Math.sqrt(mA); mB = Math.sqrt(mB);
    return mA === 0 || mB === 0 ? 0 : dot / (mA * mB);
}

async function retrieveEmbedding(query, topK) {
    const store = getVectorStore();
    const qv = await embed(query);
    const scored = store.map(item => ({
        entry: item.entry,
        score: cosineSimilarity(qv, item.vector),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
}

export async function retrieve(query, topK = 3) {
    const mode = getRagMode();
    const top = mode === 'bm25' ? searchBM25(query, topK) : await retrieveEmbedding(query, topK);

    console.log(`🔍 [${mode}] Retrieved ${top.length} entries for: "${query}"`);
    top.forEach((r, i) => {
        console.log(`  ${i + 1}. ${r.entry.id} (score: ${r.score.toFixed(3)})`);
    });
    return top;
}

export function mergeWithDistrictOverride(retrievedResults, userDistrict) {
    if (!retrievedResults || retrievedResults.length === 0) return [];
    const entries = retrievedResults.map(r => r.entry ?? r);

    const byService = {};
    for (const e of entries) {
        const key = (e.service ?? '').toLowerCase();
        if (!byService[key]) byService[key] = [];
        byService[key].push(e);
    }

    const merged = [];
    for (const key of Object.keys(byService)) {
        const group = byService[key];
        const defaultEntry =
            group.find(e => e.scope === 'national') ||
            group.find(e => !e.scope || e.scope === 'district') ||
            group[0];
        const overrideEntry = userDistrict
            ? group.find(e => e.scope === 'district_override' && e.district === userDistrict)
            : null;
        if (!defaultEntry) continue;

        const data = { ...defaultEntry.data, service: defaultEntry.service, pdf_filename: defaultEntry.pdf_filename };
        if (overrideEntry) {
            console.log(`  🔄 Applying ${userDistrict} override for ${defaultEntry.service}`);
            for (const [k, v] of Object.entries(overrideEntry.data)) {
                if (v !== null && v !== undefined) data[k] = v;
            }
            if (overrideEntry.pdf_filename) data.pdf_filename = overrideEntry.pdf_filename;
        }
        merged.push(data);
    }
    return merged;
}
