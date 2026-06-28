const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        // The @google/genai SDK doesn't expose listModels directly easily in v1beta yet through ai.models
        // Let's use standard fetch to the REST API to see models
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        console.log(data.models.map(m => m.name).join('\n'));
    } catch (e) {
        console.error(e);
    }
}

listModels();
