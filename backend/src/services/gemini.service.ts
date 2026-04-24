import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// Usando gemini-2.0-flash conforme lista de modelos disponíveis do usuário
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Extrai JSON puro de uma resposta de texto da IA.
 */
function extractJSON(text: string): any {
  // Remove markdown code blocks se existirem
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '');
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Resposta da IA não contém um JSON válido');
  }
  return JSON.parse(jsonMatch[0]);
}

/**
 * Faz a chamada para a API do Gemini.
 */
async function callGemini(prompt: string): Promise<any> {
  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
    }
  };

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY não configurada no servidor (.env ou variáveis de ambiente).');
  }

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  const data: any = await response.json();

  if (!response.ok) {
    console.error('Erro na API do Google:', data);
    throw new Error(`Google API Error: ${data.error?.message || 'Erro desconhecido'}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log('--- RESPOSTA BRUTA DA IA ---');
  console.log(text);
  console.log('----------------------------');
  
  if (!text) {
    throw new Error('Resposta vazia da IA');
  }

  return { parsed: extractJSON(text), raw: text };
}

export class GeminiService {

  /**
   * PROMPT 1 — Análise Individual de Risco Psicossocial
   * Processa respostas de um colaborador e retorna riscos identificados com scores AIHA.
   */
  static async analyzeIndividual(params: {
    colaboradorId: string;
    gheName: string;
    cargo: string;
    respostasJson: any;
    empresaNome: string;
    cnpj: string;
    engenheiroNome: string;
    creaEngenheiro: string;
    dataReferencia: string;
  }) {
    const prompt = `Você é o PGR-AI, especialista em Saúde e Segurança do Trabalho com domínio completo da NR-01 (Atualização 2024), da Portaria MTE 1.419/2024 e da metodologia AIHA de avaliação de riscos.

Seu papel é processar respostas de questionários psicossociais e gerar o conteúdo técnico do Programa de Gerenciamento de Riscos (PGR), especificamente as seções de riscos psicossociais (Ergonômico/Psicossocial), seguindo rigorosamente a estrutura do modelo oficial adotado pela empresa.

REGRAS INVIOLÁVEIS:
- Nunca identifique respondentes individuais. Todo dado é consolidado por GHE.
- Use exclusivamente a Matriz AIHA com escala de probabilidade 1–5 e consequência 1–4 (score máximo 20).
- Classifique os riscos em: TRIVIAL (1–4) | MODERADO (5–9) | SUBSTANCIAL (10–15) | INTOLERÁVEL (16–20).
- Código eSocial para riscos ergonômicos/psicossociais: 09.01.001
- Tipo de avaliação para riscos psicossociais: sempre "Qualitativa"
- Intensidade para riscos psicossociais: sempre "N.A"
- Limites de tolerância para riscos psicossociais: sempre "N.E" (Não Estabelecido)
- Linguagem técnica e formal, adequada a laudos de engenharia de segurança do trabalho.
- Retorne APENAS JSON válido, sem texto externo, sem markdown, sem blocos de código.

EMPRESA: ${params.empresaNome}
CNPJ: ${params.cnpj}
ENGENHEIRO RESPONSÁVEL: ${params.engenheiroNome}
CREA: ${params.creaEngenheiro}
DATA DE REFERÊNCIA: ${params.dataReferencia}

Analise as respostas do questionário de riscos psicossociais abaixo. Retorne APENAS um objeto JSON válido, sem texto adicional, sem markdown.

DADOS DO COLABORADOR:
- ID anônimo: ${params.colaboradorId}
- GHE / Setor: ${params.gheName}
- Cargo: ${params.cargo}
- Respostas do questionário: ${JSON.stringify(params.respostasJson)}

FATORES DE RISCO PSICOSSOCIAL A AVALIAR (conforme NR-01 Anexo I):

Organização do trabalho:
- Sobrecarga ou ritmo excessivo de trabalho
- Jornada prolongada ou trabalho em turnos
- Metas inalcançáveis ou pressão excessiva por produtividade
- Monotonia e repetitividade

Relações socioprofissionais:
- Ambiente conflituoso entre colegas ou com liderança
- Assédio moral ou situações de humilhação
- Falta de suporte da chefia imediata
- Isolamento social no trabalho

Condições e organização:
- Falta de autonomia / microgestão
- Falta de reconhecimento ou feedback
- Comunicação ineficaz na empresa
- Insegurança no emprego

Estressores individuais:
- Sinais de esgotamento emocional (burnout)
- Ansiedade ou sofrimento psíquico relacionado ao trabalho
- Baixa satisfação geral com o trabalho

ESCALA DE CLASSIFICAÇÃO AIHA:
Probabilidade (1–5):
  1 = Muito improvável (< 5% da jornada ou < 1x/ano)
  2 = Improvável (5–30% da jornada ou < 1x/mês)
  3 = Provável (30–60% da jornada ou < 1x/semana)
  4 = Muito provável (60–80% da jornada ou > 1x/semana)
  5 = Extremamente provável (> 80% da jornada / diário)

Consequência (1–4):
  1 = Insignificante (sem efeito adverso à saúde)
  2 = Baixa (efeitos reversíveis, afastamento < 15 dias)
  3 = Média (efeitos reversíveis graves, afastamento > 15 dias)
  4 = Alta (limitação permanente da capacidade laboral ou fatal)

Score = Probabilidade × Consequência
Nível: TRIVIAL (1–4) | MODERADO (5–9) | SUBSTANCIAL (10–15) | INTOLERÁVEL (16–20)

INSTRUÇÃO: Avalie apenas os fatores que apresentem evidências nas respostas. Não invente riscos ausentes nos dados.

Retorne EXCLUSIVAMENTE neste formato JSON:

{
  "colaborador_id": "string",
  "ghe": "string",
  "cargo": "string",
  "riscos_identificados": [
    {
      "fator": "nome do fator de risco psicossocial",
      "descricao_tecnica": "descrição objetiva baseada nas respostas, sem identificar o respondente",
      "frequencia_relato": "Eventual | Habitual | Permanente",
      "fonte_geradora": "origem do risco (ex: Microgestão, Ausência de feedback, Problemas interpessoais)",
      "efeito": "consequência à saúde (ex: Estresse, burnout, desmotivação, queda de desempenho)",
      "orientacao": "medida preventiva recomendada",
      "probabilidade": 1,
      "consequencia": 1,
      "score": 1,
      "nivel_risco": "TRIVIAL | MODERADO | SUBSTANCIAL | INTOLERÁVEL"
    }
  ],
  "nivel_risco_dominante": "TRIVIAL | MODERADO | SUBSTANCIAL | INTOLERÁVEL",
  "observacoes_tecnicas": "síntese técnica para o engenheiro, máximo 3 frases",
  "requer_atencao_imediata": false
}`;

    try {
      const { parsed, raw } = await callGemini(prompt);
      return { result: parsed, raw };
    } catch (error: any) {
      console.error('Erro na análise individual do Gemini:', error);
      throw new Error(`Falha na análise individual: ${error.message}`);
    }
  }

  /**
   * PROMPT 2 — Geração do PGR Consolidado
   * Recebe dados da empresa + análises consolidadas por GHE e retorna o PGR completo.
   */
  static async generateConsolidatedPgr(params: {
    empresaNome: string;
    cnpj: string;
    cnae: string;
    cnaeDescricao: string;
    grauRiscoNr4: string;
    endereco: string;
    municipio: string;
    estado: string;
    cep: string;
    telefone: string;
    totalFuncionarios: number;
    horarioTrabalho: string;
    engenheiroNome: string;
    creaEngenheiro: string;
    contatoEngenheiro: string;
    empresaElaboradora: string;
    dataGeracao: string;
    vigenciaInicio: string;
    vigenciaFim: string;
    periodoColeta: string;
    totalRespondentes: number;
    ghesListaJson: any;
    analisesConsolidadasJson: any;
  }) {
    const prompt = `Você é o PGR-AI, especialista em Saúde e Segurança do Trabalho com domínio completo da NR-01 (Atualização 2024), da Portaria MTE 1.419/2024 e da metodologia AIHA de avaliação de riscos.

Com base nas análises individuais consolidadas por GHE abaixo, gere o conteúdo completo das seções psicossociais do PGR. Retorne APENAS um objeto JSON válido e completo, sem markdown, sem texto externo.

REGRAS INVIOLÁVEIS:
- Nunca identifique respondentes individuais. Todo dado é consolidado por GHE.
- Use exclusivamente a Matriz AIHA com escala de probabilidade 1–5 e consequência 1–4 (score máximo 20).
- Classifique os riscos em: TRIVIAL (1–4) | MODERADO (5–9) | SUBSTANCIAL (10–15) | INTOLERÁVEL (16–20).
- Código eSocial para riscos ergonômicos/psicossociais: 09.01.001
- Tipo de avaliação para riscos psicossociais: sempre "Qualitativa"
- Intensidade para riscos psicossociais: sempre "N.A"
- Limites de tolerância para riscos psicossociais: sempre "N.E" (Não Estabelecido)
- Linguagem técnica e formal, adequada a laudos de engenharia de segurança do trabalho.
- Retorne APENAS JSON válido, sem texto externo, sem markdown, sem blocos de código.

DADOS DA EMPRESA:
- Razão Social: ${params.empresaNome}
- CNPJ: ${params.cnpj}
- CNAE: ${params.cnae}
- Descrição CNAE: ${params.cnaeDescricao}
- Grau de Risco (NR-4): ${params.grauRiscoNr4}
- Endereço: ${params.endereco}
- Município/Estado: ${params.municipio} / ${params.estado}
- CEP: ${params.cep}
- Telefone: ${params.telefone}
- Número de funcionários: ${params.totalFuncionarios}
- Horário de trabalho: ${params.horarioTrabalho}
- Engenheiro Responsável: ${params.engenheiroNome}
- CREA: ${params.creaEngenheiro}
- Contato Engenheiro: ${params.contatoEngenheiro}
- Empresa elaboradora: ${params.empresaElaboradora}
- Data de geração: ${params.dataGeracao}
- Vigência do PGR: ${params.vigenciaInicio} a ${params.vigenciaFim}
- Período de coleta dos questionários: ${params.periodoColeta}
- Total de respondentes: ${params.totalRespondentes}

GHEs CADASTRADOS:
${JSON.stringify(params.ghesListaJson, null, 2)}

ANÁLISES INDIVIDUAIS CONSOLIDADAS POR GHE:
${JSON.stringify(params.analisesConsolidadasJson, null, 2)}

INSTRUÇÕES DE GERAÇÃO:

BLOCO 1 — IDENTIFICAÇÃO E CABEÇALHO:
Gere os dados de identificação da empresa e do documento para preenchimento da capa e tabela de dados cadastrais.

BLOCO 2 — SEÇÃO 10 (RECONHECIMENTO E ANÁLISE DOS RISCOS — FOCO PSICOSSOCIAL):
Para cada GHE, gere as linhas da tabela de riscos referentes aos fatores Ergonômico/Psicossocial identificados nas análises. Cada entrada deve conter:
- Tipo de agente: "Ergonômico/Psicossocial"
- Descrição do agente: nome do fator de risco
- Código eSocial: "09.01.001"
- Intensidade: "N.A"
- Frequência: conforme predominância das análises (Eventual / Habitual / Permanente)
- Limites de Tolerância: "N.E"
- Tipo de Avaliação: "Qualitativa"
- Efeito: consequência à saúde
- Tempo de Exposição: "Jornada de trabalho"
- Fonte Geradora: origem identificada
- Orientação: medida preventiva recomendada

BLOCO 3 — SEÇÃO 11 (METAS E PRIORIDADES DE CONTROLE):
3a. Cronograma de Ações (12 meses a partir de ${params.dataGeracao}):
Gere ações específicas para os riscos psicossociais identificados com nível MODERADO, SUBSTANCIAL ou INTOLERÁVEL. Indique o mês de execução previsto para cada ação usando os critérios:
- INTOLERÁVEL: início imediato (mês 1)
- SUBSTANCIAL: início em até 60 dias (mês 1–2)
- MODERADO: início em até 90 dias (mês 1–3)

3b. Cronograma de Treinamentos:
Gere os treinamentos necessários para mitigação dos riscos psicossociais identificados.

3c. Responsabilidades:
Para cada ação e treinamento, indique o responsável (RH, Gestão, SST, Médico do Trabalho ou a própria empresa).

3d. Prioridades:
Classifique cada ação de 1 a 4:
- Grau 1: Irrelevante (risco TRIVIAL)
- Grau 2: De Atenção (risco MODERADO)
- Grau 3: Crítica (risco SUBSTANCIAL)
- Grau 4: Não tolerável (risco INTOLERÁVEL)

BLOCO 4 — SEÇÃO 13 (RECOMENDAÇÕES À EMPRESA):
Gere um parágrafo técnico com as principais recomendações baseadas nos riscos psicossociais encontrados, citando os GHEs mais críticos e as intervenções prioritárias.

BLOCO 5 — SEÇÃO 14 (CONSIDERAÇÕES FINAIS):
Gere um parágrafo de encerramento técnico mencionando o escopo da avaliação psicossocial, a metodologia utilizada e a necessidade de monitoramento contínuo.

BLOCO 6 — RESUMO EXECUTIVO (para o painel do engenheiro):
Gere um resumo consolidado com distribuição de riscos por GHE e alertas de atenção imediata.

Retorne EXCLUSIVAMENTE neste formato JSON:

{
  "identificacao": {
    "razao_social": "string",
    "cnpj": "string",
    "cnae": "string",
    "cnae_descricao": "string",
    "grau_risco": "string",
    "endereco": "string",
    "municipio": "string",
    "estado": "string",
    "cep": "string",
    "telefone": "string",
    "total_funcionarios": 0,
    "horario_trabalho": "string",
    "data_geracao": "string",
    "vigencia_inicio": "string",
    "vigencia_fim": "string",
    "engenheiro_nome": "string",
    "engenheiro_crea": "string",
    "engenheiro_contato": "string",
    "empresa_elaboradora": "string"
  },
  "secao_10_por_ghe": [
    {
      "ghe_nome": "string",
      "ghe_codigo": "GHE 01",
      "total_colaboradores": 0,
      "riscos_psicossociais": [
        {
          "tipo_agente": "Ergonômico/Psicossocial",
          "descricao_agente": "string",
          "codigo_esocial": "09.01.001",
          "intensidade": "N.A",
          "frequencia": "Eventual | Habitual | Permanente",
          "limite_tolerancia": "N.E",
          "tipo_avaliacao": "Qualitativa",
          "efeito": "string",
          "tempo_exposicao": "Jornada de trabalho",
          "fonte_geradora": "string",
          "orientacao": "string",
          "probabilidade": 1,
          "consequencia": 1,
          "score": 1,
          "nivel_risco": "TRIVIAL | MODERADO | SUBSTANCIAL | INTOLERÁVEL"
        }
      ]
    }
  ],
  "secao_11": {
    "cronograma_acoes": [
      {
        "acao": "string",
        "tipo": "Ação | Treinamento",
        "ghe_alvo": ["string"],
        "nivel_risco_origem": "string",
        "mes_inicio": 1,
        "mes_fim": 1,
        "responsavel": "string",
        "prioridade": 1
      }
    ],
    "responsabilidades": [
      {
        "tipo": "Ação | Treinamento",
        "descricao": "string",
        "responsavel": "string"
      }
    ],
    "prioridades": [
      {
        "tipo": "Ação | Treinamento",
        "descricao": "string",
        "grau": 1,
        "classificacao": "Irrelevante | De Atenção | Crítica | Não tolerável"
      }
    ]
  },
  "secao_13_recomendacoes": "string (texto técnico completo)",
  "secao_14_consideracoes_finais": "string (texto técnico completo)",
  "resumo_executivo": {
    "total_ghes": 0,
    "total_respondentes": 0,
    "periodo_coleta": "string",
    "distribuicao_geral": {
      "trivial": 0,
      "moderado": 0,
      "substancial": 0,
      "intoleravel": 0
    },
    "ghes_atencao_imediata": ["string"],
    "top_riscos": ["string"],
    "parecer_sintetico": "string (máximo 2 frases para o painel)"
  }
}`;

    try {
      const { parsed, raw } = await callGemini(prompt);
      return { result: parsed, raw };
    } catch (error: any) {
      console.error('Erro na geração do PGR consolidado:', error);
      throw new Error(`Falha na geração do PGR: ${error.message}`);
    }
  }

  /**
   * Método legado mantido para compatibilidade.
   */
  static async analyzeRisk(employeeName: string, gheName: string, answers: any) {
    const result = await GeminiService.analyzeIndividual({
      colaboradorId: 'legacy-' + Date.now(),
      gheName,
      cargo: 'Não informado',
      respostasJson: answers,
      empresaNome: 'Não informado',
      cnpj: '',
      engenheiroNome: 'Denis Antônio',
      creaEngenheiro: '',
      dataReferencia: new Date().toISOString().split('T')[0] || '',
    });

    // Converter para o formato legado
    return {
      riskMatrix: result.result.riscos_identificados?.map((r: any) => ({
        agent: r.fator,
        type: 'Ergonômico/Psicossocial',
        probability: r.probabilidade,
        consequence: r.consequencia,
        level: r.nivel_risco,
        priority: r.score >= 16 ? 4 : r.score >= 10 ? 3 : r.score >= 5 ? 2 : 1,
      })) || [],
      actionPlan: result.result.riscos_identificados?.map((r: any) => ({
        measure: r.orientacao,
        schedule: r.nivel_risco === 'INTOLERÁVEL' ? 'Imediato' : r.nivel_risco === 'SUBSTANCIAL' ? '60 dias' : '90 dias',
        responsible: 'SST / RH',
      })) || [],
    };
  }
}
