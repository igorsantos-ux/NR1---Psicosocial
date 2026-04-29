# PGR-MODELO-V2.docx — Template Parametrizado

Template do Programa de Gerenciamento de Riscos com placeholders do **docxtemplater** prontos para preenchimento dinâmico via Gemini AI.

## Como instalar no projeto

1. Substitua o arquivo antigo:
   ```bash
   cp PGR-MODELO-V2.docx ./templates/PGR-MODELO.docx
   ```

2. Garanta que o Dockerfile copia a pasta `templates`:
   ```dockerfile
   COPY templates ./templates
   ```

3. Faça commit e redeploy.

## Estrutura de placeholders

### Dados da Empresa
- `{empresa.razao_social}`
- `{empresa.nome_fantasia}`
- `{empresa.cnpj}`
- `{empresa.endereco}`
- `{empresa.complemento}`
- `{empresa.telefone}`
- `{empresa.cep}`
- `{empresa.bairro}`
- `{empresa.municipio}`
- `{empresa.estado}`
- `{empresa.cnae}`
- `{empresa.cnae_descricao}`
- `{empresa.grau_risco}`
- `{empresa.cnaes_secundarios}`
- `{empresa.total_funcionarios}`
- `{empresa.horario_trabalho}`

### Dados do Documento
- `{documento.data_emissao_formatada}` — Ex: "ABRIL/2026"
- `{documento.data_validade_formatada}` — Ex: "ABRIL/2028"
- `{documento.data_emissao_extenso}` — Ex: "29 de abril de 2026"
- `{documento.vigencia}` — Ex: "ABRIL DE 2026 À ABRIL DE 2028"
- `{documento.periodo_coleta}` — Ex: "01/04/2026 a 28/04/2026"
- `{documento.total_respondentes}` — Ex: "12"

### Engenheiro Responsável
- `{engenheiro.nome}`
- `{engenheiro.cargo}`
- `{engenheiro.contato}`
- `{engenheiro.crea}`
- `{engenheiro.endereco}`

### Loops

#### Revisões (lista de modificações sucessivas)
```
{#revisoes}
  {numero}, {data}, {elaborador}, {responsavel}, {descricao}
{/revisoes}
```

#### Inventário de Riscos
```
{#inventario_riscos}
  {id}, {fator_risco}, {ghes_afetados_str}, {numero_expostos}, {score}, {nivel_risco}
{/inventario_riscos}
```

#### GHEs (Seção 10)
```
{#ghes}
  {nome}, {codigo}, {total_respondentes}, {nivel_predominante}, {atencao_imediata}
  
  {#riscos_psicossociais}
    {tipo_agente}, {descricao_agente}, {codigo_esocial}, {frequencia},
    {tipo_avaliacao}, {efeito}, {fonte_geradora}, {orientacao}
  {/riscos_psicossociais}
{/ghes}
```

#### Cronograma de Ações (Seção 11)
```
{#cronograma_acoes}
  {o_que}, {onde_str}, {quem}, {quando}, {prioridade_label}
{/cronograma_acoes}
```

### Textos longos
- `{secao_13_recomendacoes}` — Parágrafo gerado pela IA com recomendações
- `{secao_14_consideracoes_finais}` — Parágrafo de considerações finais

## Total de placeholders
- 58 simples
- 5 loops (com abertura e fechamento)
- 0 placeholders com problemas (espaços, etc)
