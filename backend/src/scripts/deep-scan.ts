import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();

const models = ['gemini-3.1-flash-lite', 'gemini-3-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-flash'];
const versions = ['v1', 'v1beta'];

async function deepScan() {
    for (const v of versions) {
        for (const m of models) {
            const url = `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${GEMINI_API_KEY}`;
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] })
                });
                const data = await response.json();
                console.log(`[${v}] ${m} -> Status: ${response.status}`);
                if (response.ok || response.status === 429) {
                    console.log(`🎯 ENCONTRADO: Use ${v}/models/${m}`);
                    return;
                }
            } catch (err: any) {
                // ignore
            }
        }
    }
}

deepScan();
