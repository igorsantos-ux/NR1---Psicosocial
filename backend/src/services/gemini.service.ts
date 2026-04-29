import dotenv from 'dotenv';
import { SYSTEM_PROMPT } from './prompts/systemPrompt.js';
import { INDIVIDUAL_PROMPT } from './prompts/individualPrompt.js';
import { CONSOLIDATED_PROMPT } from './prompts/consolidatedPrompt.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

export interface AnaliseIndividualJSON {
    colaborador_id: string;
    ghe: string;
    cargo: string;
    riscos_identificados: Array<{
        fator: string;
        descricao_tecnica: string;
        frequencia_relato: string;
        fonte_geradora: string;
        efeito: string;
        orientacao: string;
        probabilidade: number;
        consequencia: number;
        score: number;
        nivel_risco: string;
    }>;
    nivel_risco_dominante: string;
    observacoes_tecnicas: string;
    requer_atencao_imediata: boolean;
}

export interface PGRConsolidadoJSON {
    identificacao: any;
    secao_10_por_ghe: any[];
    secao_11: {
        cronograma_acoes: any[];
        responsabilidades: any[];
        prioridades: any[];
    };
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

    private static async callWithRetry(prompt: string, systemInstruction: string, temperature: number = 0.2, maxTokens: number = 8192): Promise<any> {
        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
            try {
                console.log(`[Gemini] Chamando API: ${GEMINI_URL.replace(GEMINI_API_KEY, '***')}`);
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
                return JSON.parse(text);
            } catch (error: any) {
                attempt++;
                if (attempt >= maxRetries) throw error;

                const delay = Math.pow(2, attempt) * 1000;
                console.warn(`Tentativa ${attempt} falhou. Tentando novamente em ${delay}ms...`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    static async analisarRespostaIndividual(params: {
        colaboradorId: string;
        gheNome: string;
        cargo: string;
        respostas: Array<{ pergunta: string, resposta: string }>;
        empresaContext: { nome: string; cnpj: string; engenheiro: string; crea: string; data: string };
    }): Promise<AnaliseIndividualJSON> {
        const systemInstruction = this.replacePlaceholders(SYSTEM_PROMPT, {
            empresa_nome: params.empresaContext.nome,
            cnpj: params.empresaContext.cnpj,
            engenheiro_nome: params.empresaContext.engenheiro,
            crea_engenheiro: params.empresaContext.crea,
            data_referencia: params.empresaContext.data
        });

        const prompt = this.replacePlaceholders(INDIVIDUAL_PROMPT, {
            colaboradorId: params.colaboradorId,
            gheName: params.gheNome,
            cargo: params.cargo,
            respostasNodes: params.respostas
        });

        return await this.callWithRetry(prompt, systemInstruction, 0.2);
    }

    static async gerarPGRConsolidado(params: {
        empresa: any;
        ghes: any[];
        analisesPorGhe: Record<string, any[]>;
        periodoColeta: { inicio: string; fim: string };
        totalRespondentes: number;
        dataGeracao: string;
        vigencia: { inicio: string; fim: string };
    }): Promise<PGRConsolidadoJSON> {
        const systemInstruction = this.replacePlaceholders(SYSTEM_PROMPT, {
            empresa_nome: params.empresa.razaoSocial,
            cnpj: params.empresa.cnpj,
            engenheiro_nome: params.empresa.engenheiro.nome,
            crea_engenheiro: params.empresa.engenheiro.crea,
            data_referencia: params.dataGeracao
        });

        const prompt = this.replacePlaceholders(CONSOLIDATED_PROMPT, {
            empresaNome: params.empresa.razaoSocial,
            cnpj: params.empresa.cnpj,
            cnae: params.empresa.cnae,
            cnaeDescricao: params.empresa.cnaeDescricao,
            grauRiscoNr4: params.empresa.grauRiscoNr4,
            endereco: params.empresa.endereco,
            municipio: params.empresa.municipio,
            estado: params.empresa.estado,
            cep: params.empresa.cep,
            telefone: params.empresa.telefone,
            totalFuncionarios: params.empresa.totalFuncionarios,
            horarioTrabalho: params.empresa.horarioTrabalho,
            engenheiroNome: params.empresa.engenheiro.nome,
            creaEngenheiro: params.empresa.engenheiro.crea,
            contatoEngenheiro: params.empresa.engenheiro.contato,
            empresaElaboradora: params.empresa.empresaElaboradora,
            dataGeracao: params.dataGeracao,
            vigenciaInicio: params.vigencia.inicio,
            vigenciaFim: params.vigencia.fim,
            periodoColeta: `${params.periodoColeta.inicio} a ${params.periodoColeta.fim}`,
            totalRespondentes: params.totalRespondentes,
            ghesListaJson: params.ghes,
            analisesConsolidadasJson: params.analisesPorGhe
        });

        return await this.callWithRetry(prompt, systemInstruction, 0.3, 32000);
    }
}
