import dotenv from 'dotenv';

dotenv.config();

export class GeminiService {
  static async analyzeRisk(employeeName: string, gheName: string, answers: any) {
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    // URL direta da API do Google Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const prompt = `
      Você é um Engenheiro de Segurança do Trabalho especialista em NR 01 e riscos psicossociais.
      Analise as respostas de um formulário de escala Likert (1 a 5) onde:
      1 - Nunca / Muito Baixo
      5 - Sempre / Muito Alto

      Dados do Funcionário:
      Nome: ${employeeName || 'Anônimo'}
      GHE (Grupo Homogêneo de Exposição): ${gheName}
      Respostas: ${JSON.stringify(answers)}

      Sua tarefa é:
      1. Identificar Agentes de Risco (Físico, Ergonômico, Químico, Biológico ou de Acidente).
      2. Classificar o Nível de Risco usando a Matriz AIHA (Probabilidade x Consequência): Trivial, Moderado, Substancial ou Intolerável.
      3. Atribuir Grau de Prioridade de 1 a 4.
      4. Sugerir Medidas de Controle, Cronograma e Responsável.

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

    const requestBody = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    try {
      // 1. Tentar listar modelos disponíveis para ver o que essa chave "enxerga"
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listResponse = await fetch(listUrl);
      const listData: any = await listResponse.json();
      const availableModels = listData.models?.map((m: any) => m.name.replace('models/', '')) || [];
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const data: any = await response.json();

      if (!response.ok) {
        console.error("Erro na API do Google:", data);
        throw new Error(`Google API Error: ${data.error?.message}. Modelos que sua chave enxerga: ${availableModels.join(', ')}`);
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // Busca o primeiro '{' e o último '}' para extrair apenas o JSON puro
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Resposta da IA não contém um JSON válido");
      }
      
      return JSON.parse(jsonMatch[0]);
    } catch (error: any) {
      console.error("Erro na análise do Gemini:", error);
      throw new Error(`Falha na IA: ${error.message}`);
    }
  }
}
