import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

async function listModels() {
    try {
        console.log(`Usando chave: ${GEMINI_API_KEY.substring(0, 5)}...`);
        const response = await fetch(url);
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (err: any) {
        console.error('Erro ao listar modelos:', err.message);
    }
}

listModels();
