import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

export class GeminiService {
  static async analyzeRisk(employeeName: string, gheName: string, answers: any) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    console.log("Iniciando Gemini com chave:", apiKey.substring(0, 10) + "...");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um Engenheiro de Segurança do Trabalho especialista em NR 01 e riscos psicossociais.
      Analise as respostas de um formulário de escala Likert (1 a 5) onde:
      1 - Nunca / Muito Baixo
      5 - Sempre / Muito Alto

      Dados do Funcionário:
      Nome: ${employeeName}
      GHE (Grupo Homogêneo de Exposição): ${gheName}
      Respostas: ${JSON.stringify(answers)}

      Sua tarefa é:
      1. Identificar Agentes de Risco (Físico, Ergonômico, Químico, Biológico ou de Acidente).
      2. Classificar o Nível de Risco usando a Matriz AIHA (Probabilidade x Consequência): Trivial, Moderado, Substancial ou Intolerável.
      3. Atribuir Grau de Prioridade de 1 a 4.
      4. Sugerir Medidas de Controle, Cronograma e Responsável.

      REGRAS ESPECÍFICAS:
      - Se houver menção a ruído > 85 dB(A), sugerir protetor auricular e monitoramento anual.
      - Para riscos psicossociais (estresse, carga de trabalho), sugerir pausas, feedback ou suporte psicológico.

      Retorne APENAS um JSON no seguinte formato:
      {
        "riskMatrix": [
          { "agent": "Nome do Agente", "type": "Tipo", "probability": 1-5, "consequence": 1-5, "level": "Nível", "priority": 1-4 }
        ],
        "actionPlan": [
          { "measure": "Medida Sugerida", "schedule": "Prazo", "responsible": "Cargo Responsável" }
        ]
      }
    `;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Busca o primeiro '{' e o último '}' para extrair apenas o JSON puro
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Resposta da IA não contém um JSON válido");
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error("Erro na análise do Gemini:", error);
      throw new Error(`Falha ao processar análise de risco via IA: ${error.message}`);
    }
  }
}
