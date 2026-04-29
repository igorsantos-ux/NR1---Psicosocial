/**
 * Document Service — Geração do PGR a partir do template parametrizado.
 *
 * Este service preenche o template PGR-MODELO-V2.docx com os dados:
 * - Cadastro da empresa (do banco)
 * - Engenheiro responsável (do banco)
 * - JSON gerado pelo Gemini (análise consolidada)
 *
 * Uso:
 *   const docxBuffer = await preencherTemplatePGR(json, empresa, engenheiro);
 *   const pdfBuffer = await converterDocxParaPdf(docxBuffer);
 */

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEMPLATE_PATH = process.env.PGR_TEMPLATE_PATH || './templates/PGR-MODELO.docx';

const MESES_MAIUSCULO = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

const MESES_MINUSCULO = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
];

interface EmpresaCompleta {
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj: string;
  endereco?: string | null;
  complemento?: string | null;
  telefone?: string | null;
  cep?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado?: string | null;
  cnae: string;
  cnaeDescricao?: string | null;
  cnaesSecundarios?: string | null;
  grauRiscoNr4: number;
  totalFuncionarios: number;
  horarioTrabalho?: string | null;
}

interface EngenheiroCompleto {
  nome: string;
  cargo?: string | null;
  contato?: string | null;
  crea?: string | null;
  endereco?: string | null;
}

interface PGRConsolidadoJSON {
  empresa?: any;
  resumo_executivo?: any;
  ghes?: any[];
  secao_10_por_ghe?: any[];
  inventario_riscos?: any[];
  plano_acao?: any[];
  secao_11?: {
    cronograma_acoes?: any[];
    responsabilidades?: any[];
    prioridades?: any[];
  };
  secao_13_recomendacoes?: string;
  secao_14_consideracoes_finais?: string;
  recomendacoes?: any[];
}

/**
 * Formata data como "ABRIL/2026"
 */
function formatarMesAno(date: Date): string {
  return `${MESES_MAIUSCULO[date.getMonth()]}/${date.getFullYear()}`;
}

/**
 * Formata data por extenso: "29 de abril de 2026"
 */
function formatarDataExtenso(date: Date): string {
  return `${date.getDate()} de ${MESES_MINUSCULO[date.getMonth()]} de ${date.getFullYear()}`;
}

/**
 * Mapeia score AIHA para label de prioridade
 */
function scoreParaPrioridade(score: number): string {
  if (score <= 4) return 'Grau 1 - Irrelevante';
  if (score <= 9) return 'Grau 2 - De Atenção';
  if (score <= 15) return 'Grau 3 - Crítica';
  return 'Grau 4 - Não Tolerável';
}

/**
 * Mapeia nível de risco para grau numérico
 */
function nivelParaGrau(nivel: string): number {
  const map: Record<string, number> = {
    'TRIVIAL': 1,
    'MODERADO': 2,
    'SUBSTANCIAL': 3,
    'INTOLERAVEL': 4,
    'INTOLERÁVEL': 4
  };
  return map[nivel?.toUpperCase()] || 1;
}

/**
 * Preenche o template PGR-MODELO-V2.docx com os dados consolidados.
 */
export async function preencherTemplatePGR(
  jsonConsolidado: PGRConsolidadoJSON,
  empresa: EmpresaCompleta,
  engenheiro: EngenheiroCompleto,
  options?: {
    periodoColeta?: { inicio: Date; fim: Date };
    totalRespondentes?: number;
  }
): Promise<Buffer> {
  // 1. Carregar o template
  const templatePath = path.resolve(TEMPLATE_PATH);
  console.log(`[DocService] Carregando template: ${templatePath}`);

  let templateBuffer: Buffer;
  try {
    templateBuffer = await fs.readFile(templatePath);
  } catch (err: any) {
    throw new Error(
      `Template não encontrado em ${templatePath}. ` +
      `Garanta que o arquivo PGR-MODELO.docx está em ./templates/ e que o Dockerfile copia esta pasta.`
    );
  }

  // 2. Inicializar docxtemplater
  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() { return ''; }, // placeholders sem valor viram string vazia
  });

  // 3. Preparar dados
  const dataAtual = new Date();
  const dataValidade = new Date(dataAtual);
  dataValidade.setFullYear(dataValidade.getFullYear() + 2);

  const periodoInicio = options?.periodoColeta?.inicio
    ? options.periodoColeta.inicio.toLocaleDateString('pt-BR')
    : '';
  const periodoFim = options?.periodoColeta?.fim
    ? options.periodoColeta.fim.toLocaleDateString('pt-BR')
    : '';

  // Dados estruturados para o template
  const dados = {
    empresa: {
      razao_social: empresa.razaoSocial || '',
      nome_fantasia: empresa.nomeFantasia || '*****',
      cnpj: empresa.cnpj || '',
      endereco: empresa.endereco || '',
      complemento: empresa.complemento || '',
      telefone: empresa.telefone || '',
      cep: empresa.cep || '',
      bairro: empresa.bairro || '',
      municipio: empresa.municipio || '',
      estado: empresa.estado || '',
      cnae: empresa.cnae || '',
      cnae_descricao: empresa.cnaeDescricao || '',
      cnaes_secundarios: empresa.cnaesSecundarios || '',
      grau_risco: String(empresa.grauRiscoNr4 || ''),
      total_funcionarios: String(empresa.totalFuncionarios || 0),
      horario_trabalho: empresa.horarioTrabalho || '',
    },

    documento: {
      data_emissao_formatada: formatarMesAno(dataAtual),
      data_validade_formatada: formatarMesAno(dataValidade),
      data_emissao_extenso: formatarDataExtenso(dataAtual),
      vigencia: `${formatarMesAno(dataAtual).replace('/', ' DE ')} À ${formatarMesAno(dataValidade).replace('/', ' DE ')}`,
      periodo_coleta: periodoInicio && periodoFim ? `${periodoInicio} a ${periodoFim}` : '',
      total_respondentes: String(options?.totalRespondentes || 0),
    },

    engenheiro: {
      nome: engenheiro.nome || '',
      cargo: engenheiro.cargo || 'Engenheiro de Segurança do Trabalho',
      contato: engenheiro.contato || '',
      crea: engenheiro.crea || '',
      endereco: engenheiro.endereco || '',
    },

    revisoes: [
      {
        numero: '0',
        data: dataAtual.toLocaleDateString('pt-BR'),
        elaborador: engenheiro.nome,
        responsavel: engenheiro.nome,
        descricao: 'Emissão Inicial',
      },
    ],

    // Inventário de riscos consolidado
    inventario_riscos: (jsonConsolidado.inventario_riscos || []).map((r: any) => ({
      id: r.id || '',
      fator_risco: r.fator_risco || '',
      descricao: r.descricao || '',
      ghes_afetados_str: Array.isArray(r.ghes_afetados) ? r.ghes_afetados.join(', ') : (r.ghes_afetados || ''),
      numero_expostos: String(r.numero_expostos || 0),
      probabilidade: String(r.probabilidade || ''),
      consequencia: String(r.consequencia || r.severidade || ''),
      score: String(r.score || ''),
      nivel_risco: r.nivel_risco || '',
      base_legal: r.base_legal || 'NR-01',
    })),

    // Seção 10 — GHEs com riscos psicossociais
    ghes: (jsonConsolidado.secao_10_por_ghe || jsonConsolidado.ghes || []).map((ghe: any, idx: number) => ({
      nome: ghe.ghe_nome || ghe.nome || '',
      codigo: ghe.ghe_codigo || `GHE ${String(idx + 1).padStart(2, '0')}`,
      total_respondentes: String(ghe.total_respondentes || 0),
      nivel_predominante: ghe.nivel_predominante || '',
      atencao_imediata: String(ghe.atencao_imediata || 0),
      riscos_psicossociais: (ghe.riscos_psicossociais || []).map((risco: any) => ({
        tipo_agente: risco.tipo_agente || 'Ergonômico/Psicossocial',
        descricao_agente: risco.descricao_agente || risco.fator || '',
        codigo_esocial: risco.codigo_esocial || '09.01.001',
        intensidade: risco.intensidade || 'N.A',
        frequencia: risco.frequencia || 'Eventual',
        limite_tolerancia: risco.limite_tolerancia || 'N.E',
        tipo_avaliacao: risco.tipo_avaliacao || 'Qualitativa',
        efeito: risco.efeito || '',
        tempo_exposicao: risco.tempo_exposicao || 'Jornada de trabalho',
        fonte_geradora: risco.fonte_geradora || '',
        orientacao: risco.orientacao || '',
        nivel_risco: risco.nivel_risco || '',
      })),
    })),

    // Seção 11 — Cronograma de ações
    cronograma_acoes: (jsonConsolidado.secao_11?.cronograma_acoes || jsonConsolidado.plano_acao || []).map((acao: any) => ({
      o_que: acao.o_que || acao.acao || acao.descricao || '',
      por_que: acao.por_que || '',
      quem: acao.quem || acao.responsavel || 'RH/Gestão',
      onde_str: Array.isArray(acao.onde) ? acao.onde.join(', ') : (acao.onde || acao.ghe_alvo || ''),
      quando: acao.quando || `${acao.prazo_dias || 90} dias`,
      como: acao.como || '',
      recurso: acao.recurso || 'Médio',
      prioridade_label: acao.prioridade_label || scoreParaPrioridade(acao.score || 5),
      status: acao.status || 'PENDENTE',
    })),

    // Textos longos da IA
    secao_13_recomendacoes: jsonConsolidado.secao_13_recomendacoes ||
      'Com base nos riscos psicossociais identificados, recomenda-se a implementação ' +
      'imediata das medidas preventivas listadas no plano de ação.',

    secao_14_consideracoes_finais: jsonConsolidado.secao_14_consideracoes_finais ||
      'As avaliações foram realizadas considerando as condições de trabalho atuais. ' +
      'Quaisquer alterações exigirão nova análise.',
  };

  console.log(`[DocService] Renderizando template para empresa: ${dados.empresa.razao_social}`);
  console.log(`[DocService] Total GHEs: ${dados.ghes.length}, riscos no inventário: ${dados.inventario_riscos.length}, ações: ${dados.cronograma_acoes.length}`);

  // 4. Renderizar
  try {
    doc.render(dados);
  } catch (err: any) {
    console.error('[DocService] Erro ao renderizar template:', err);
    if (err.properties && err.properties.errors) {
      console.error('[DocService] Detalhes:', JSON.stringify(err.properties.errors, null, 2));
    }
    throw new Error(`Falha ao preencher template: ${err.message}`);
  }

  // 5. Gerar buffer final
  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  console.log(`[DocService] DOCX gerado com sucesso (${buffer.length} bytes)`);
  return buffer;
}

/**
 * Converte um buffer DOCX em PDF usando LibreOffice headless.
 */
export async function converterDocxParaPdf(docxBuffer: Buffer): Promise<Buffer> {
  const tmpDir = `/tmp/pgr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.mkdir(tmpDir, { recursive: true });

  const docxPath = path.join(tmpDir, 'input.docx');
  const pdfPath = path.join(tmpDir, 'input.pdf');

  try {
    await fs.writeFile(docxPath, docxBuffer);

    const timeout = parseInt(process.env.LIBREOFFICE_TIMEOUT_MS || '60000', 10);
    console.log(`[DocService] Convertendo DOCX → PDF via LibreOffice (timeout ${timeout}ms)`);

    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir ${tmpDir} ${docxPath}`,
      { timeout }
    );

    const pdfBuffer = await fs.readFile(pdfPath);
    console.log(`[DocService] PDF gerado (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } catch (err: any) {
    console.error('[DocService] Erro na conversão DOCX→PDF:', err);
    throw new Error(`Falha ao converter para PDF: ${err.message}. Verifique se libreoffice está instalado no container.`);
  } finally {
    // Cleanup
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // ignora erros de cleanup
    }
  }
}

/**
 * Salva o arquivo no diretório de outputs e retorna o caminho.
 */
export async function salvarArquivoPGR(
  buffer: Buffer,
  pgrId: string,
  filename: string
): Promise<string> {
  const outputDir = process.env.PGR_OUTPUT_DIR || '/var/pgr-files';
  const dir = path.join(outputDir, pgrId);
  await fs.mkdir(dir, { recursive: true });
  const filepath = path.join(dir, filename);
  await fs.writeFile(filepath, buffer);
  console.log(`[DocService] Arquivo salvo: ${filepath}`);
  return filepath;
}
