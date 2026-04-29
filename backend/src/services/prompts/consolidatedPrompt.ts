export const CONSOLIDATED_PROMPT = `Com base nas análises individuais consolidadas por GHE abaixo, gere o conteúdo completo das seções psicossociais do PGR. Retorne APENAS um objeto JSON válido e completo, sem markdown, sem texto externo.

DADOS DA EMPRESA:
- Razão Social: {{empresaNome}}
- CNPJ: {{cnpj}}
- CNAE: {{cnae}}
- Descrição CNAE: {{cnaeDescricao}}
- Grau de Risco (NR-4): {{grauRiscoNr4}}
- Endereço: {{endereco}}
- Município/Estado: {{municipio}} / {{estado}}
- CEP: {{cep}}
- Telefone: {{telefone}}
- Número de funcionários: {{totalFuncionarios}}
- Horário de trabalho: {{horarioTrabalho}}
- Engenheiro Responsável: {{engenheiroNome}}
- CREA: {{creaEngenheiro}}
- Contato Engenheiro: {{contatoEngenheiro}}
- Empresa elaboradora: {{empresaElaboradora}}
- Data de geração: {{dataGeracao}}
- Vigência do PGR: {{vigenciaInicio}} a {{vigenciaFim}}
- Período de coleta dos questionários: {{periodoColeta}}
- Total de respondentes: {{totalRespondentes}}

GHEs CADASTRADOS:
{{ghesListaJson}}

ANÁLISES INDIVIDUAIS (RESPOSTAS BRUTAS) CONSOLIDADAS POR GHE:
{{analisesConsolidadasJson}}

INSTRUÇÕES DE GERAÇÃO:
Você deve analisar as respostas brutas fornecidas para cada GHE e, com base na predominância e severidade dos relatos, gerar a matriz de riscos consolidada e as recomendações técnicas seguindo a metodologia AIHA (P: 1-5, C: 1-4).

BLOCO 1 — SEÇÃO 10 (RECONHECIMENTO E ANÁLISE DOS RISCOS — FOCO PSICOSSOCIAL):
Para cada GHE, gere:
1. Resumo do GHE (total respondentes, nível predominante, alertas).
2. Tabela de riscos psicossociais identificados.

BLOCO 2 — INVENTÁRIO DE RISCOS CONSOLIDADO:
Gere uma lista única de todos os riscos identificados em toda a empresa, agrupando ghes afetados pelo mesmo fator.

BLOCO 3 — SEÇÃO 11 (PLANO DE AÇÃO):
Gere ações corretivas/preventivas com prazos (quando), responsáveis (quem) e locais (onde).

BLOCO 4 — SEÇÃO 13 E 14:
Gere os textos técnicos de recomendações e considerações finais.

Retorne EXCLUSIVAMENTE neste formato JSON:

{
  "secao_10_por_ghe": [
    {
      "ghe_nome": "string",
      "ghe_codigo": "GHE 01",
      "total_respondentes": 0,
      "nivel_predominante": "TRIVIAL | MODERADO | SUBSTANCIAL | INTOLERÁVEL",
      "atencao_imediata": 0,
      "riscos_psicossociais": [
        {
          "tipo_agente": "Ergonômico/Psicossocial",
          "descricao_agente": "string",
          "codigo_esocial": "09.01.001",
          "frequencia": "Eventual | Habitual | Permanente",
          "tipo_avaliacao": "Qualitativa",
          "efeito": "string",
          "fonte_geradora": "string",
          "orientacao": "string",
          "nivel_risco": "TRIVIAL | MODERADO | SUBSTANCIAL | INTOLERÁVEL"
        }
      ]
    }
  ],
  "inventario_riscos": [
    {
      "id": "R01",
      "fator_risco": "string",
      "descricao": "string",
      "ghes_afetados": ["nome_ghe"],
      "numero_expostos": 0,
      "probabilidade": 1,
      "consequencia": 1,
      "score": 1,
      "nivel_risco": "string",
      "base_legal": "NR-01"
    }
  ],
  "secao_11": {
    "cronograma_acoes": [
      {
        "o_que": "string",
        "por_que": "string",
        "quem": "string",
        "onde": ["nome_ghe"],
        "quando": "90 dias",
        "como": "string",
        "recurso": "Baixo | Médio | Alto",
        "status": "PENDENTE"
      }
    ]
  },
  "secao_13_recomendacoes": "texto técnico longo...",
  "secao_14_consideracoes_finais": "texto de encerramento...",
  "resumo_executivo": {
    "total_ghes": 0,
    "total_respondentes": 0,
    "distribuicao_geral": {
      "trivial": 0,
      "moderado": 0,
      "substancial": 0,
      "intoleravel": 0
    },
    "ghes_atencao_imediata": [],
    "top_riscos": [],
    "parecer_sintetico": "string"
  }
}
`;
