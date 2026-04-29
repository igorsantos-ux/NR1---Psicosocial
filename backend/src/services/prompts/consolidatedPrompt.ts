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
3a. Cronograma de Ações (12 meses a partir de {{dataGeracao}}):
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
  "secao_13_recomendacoes": "texto",
  "secao_14_consideracoes_finais": "texto",
  "resumo_executivo": {
    "total_ghes": 0,
    "total_respondentes": 0,
    "periodo_coleta": "",
    "distribuicao_geral": {
      "trivial": 0,
      "moderado": 0,
      "substancial": 0,
      "intoleravel": 0
    },
    "ghes_atencao_imediata": [],
    "top_riscos": [],
    "parecer_sintetico": ""
  }
}
`;
