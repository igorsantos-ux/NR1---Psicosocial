export const INDIVIDUAL_PROMPT = `Analise as respostas do questionário de riscos psicossociais abaixo. Retorne APENAS um objeto JSON válido, sem texto adicional, sem markdown.

DADOS DO COLABORADOR:
- ID anônimo: {{colaboradorId}}
- GHE / Setor: {{gheName}}
- Cargo: {{cargo}}
- Respostas do questionário: {{respostasNodes}}

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
}
`;
