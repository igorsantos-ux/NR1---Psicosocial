import { INDIVIDUAL_PROMPT } from './prompts/individualPrompt.js';
import { CONSOLIDATED_PROMPT } from './prompts/consolidatedPrompt.js';

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface AnaliseIndividualJSON {
    ghe: string;
    riscos: Array<{
        fator: string;
        severidade: number;
        frequencia: number;
        recomendacao: string;
    }>;
    conclusao_tecnica: string;
}

export interface PGRConsolidadoJSON {
    identificacao: any;
    secao_10_por_ghe: any[];
    secao_11: any;
    secao_13_recomendacoes: string;
    secao_14_consideracoes_finais: string;
    resumo_executivo: any;
}

export class GeminiService {
    private static replacePlaceholders(prompt: string, variables: Record<string, any>): string {
        let result = prompt;
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(placeholder, typeof value === 'object' ? JSON.stringify(value, null, 2) : value);
        }
        return result;
    }

    private static async callWithRetry(
        prompt: string, 
        systemInstruction: string, 
        maxTokens: number = 8192, 
        temperature: number = 0.2,
        retries: number = 5
    ): Promise<any> {
        let lastError: any;

        for (let i = 0; i < retries; i++) {
            try {
                if (i > 0) {
                    const waitTime = Math.pow(2, i) * 1000;
                    console.log(`[Gemini] Tentativa ${i + 1} de ${retries}. Aguardando ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }

                console.log(`[Gemini] Chamando API v1beta (${GEMINI_MODEL})`);
                const response = await fetch(GEMINI_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        systemInstruction: { parts: [{ text: systemInstruction }] },
                        generationConfig: {
                            temperature,
                            maxOutputTokens: maxTokens,
                            responseMimeType: "application/json"
                        }
                    })
                });

                const data: any = await response.json();

                if (!response.ok) {
                    throw new Error(data.error?.message || 'Erro na API do Gemini');
                }

                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(cleanJson);

            } catch (error: any) {
                lastError = error;
                console.error(`[Gemini] Falha na tentativa ${i + 1}: ${error.message}`);
                
                // Se for erro de cota (429 ou Quota Exceeded), esperamos mais tempo (30s)
                if (error.message.includes('Quota exceeded') || error.message.includes('429')) {
                    console.warn('[Gemini] Cota atingida. Aguardando 30 segundos para reset de limite...');
                    await new Promise(resolve => setTimeout(resolve, 30000));
                    continue; 
                }

                // Se for erro de sintaxe/auth, para.
                if (error.message.includes('API key not valid') || error.message.includes('Unexpected token')) {
                    throw error;
                }
            }
        }

        throw lastError;
    }

    static async gerarPGRConsolidado(dados: any): Promise<PGRConsolidadoJSON> {
        const prompt = this.replacePlaceholders(CONSOLIDATED_PROMPT, {
            ...dados,
            ghesListaJson: JSON.stringify(dados.ghes, null, 2),
            analisesConsolidadasJson: JSON.stringify(dados.analisesPorGhe, null, 2)
        });

        const systemInstruction = "Você é um Engenheiro de Segurança do Trabalho especialista em riscos psicossociais (NR-01). Sua tarefa é gerar um relatório técnico consolidado seguindo rigorosamente o esquema JSON fornecido.";

        return await this.callWithRetry(prompt, systemInstruction);
    }
}
