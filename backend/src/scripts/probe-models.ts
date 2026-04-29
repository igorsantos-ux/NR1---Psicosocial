import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

const modelsToTest = [
    'gemini-3.1-flash-lite',
    'gemini-3.1-flash-lite-001',
    'gemini-3-flash',
    'gemini-2.5-flash-lite'
];

async function probeModels() {
    for (const model of modelsToTest) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            console.log(`Testando: ${model}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'oi' }] }]
                })
            });
            const data = await response.json();
            if (response.ok) {
                console.log(`✅ SUCESSO: ${model} está disponível!`);
                return;
            } else {
                console.log(`❌ FALHA (${response.status}): ${model} - ${data.error?.message}`);
            }
        } catch (err: any) {
            console.log(`❌ ERRO: ${model} - ${err.message}`);
        }
    }
}

probeModels();
