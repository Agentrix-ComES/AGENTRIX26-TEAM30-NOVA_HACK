import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const models = await genAI.listModels();
        console.log('✅ Available models:\n');

        for (const model of models.models) {
            if (model.supportedGenerationMethods.includes('embedContent')) {
                console.log(`🔢 ${model.name}`);
                console.log(`   Methods: ${model.supportedGenerationMethods.join(', ')}`);
                console.log('');
            }
        }
    } catch (error) {
        console.error('❌ Error listing models:', error.message);
    }
}

listModels();