import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const TEMPLATE_PATH = process.env.PGR_TEMPLATE_PATH || './templates/PGR-MODELO.docx';

const MESES = [
  'JANEIRO','FEVEREIRO','MARÇO','ABRIL','MAIO','JUNHO',
  'JULHO','AGOSTO','SETEMBRO','OUTUBRO','NOVEMBRO','DEZEMBRO'
];

export async function preencherTemplatePGR(
  jsonConsolidado: any,
  empresa: any,
  engenheiro: any,
  options?: { periodoColeta?: { inicio: Date; fim: Date }; totalRespondentes?: number }
): Promise<Buffer> {
  
  // 1. Carregar template
  const templatePath = path.resolve(TEMPLATE_PATH);
  console.log('[DocService] 📂 Carregando template de:', templatePath);
  
  let content: Buffer;
  try {
    content = await fs.readFile(templatePath);
    console.log(`[DocService] ✅ Template carregado com sucesso (${content.length} bytes)`);
  } catch (err: any) {
    console.error(`[DocService] ❌ ERRO ao ler template em ${templatePath}:`, err.message);
    throw new Error(`Arquivo de template não encontrado ou inacessível: ${err.message}`);
  }
  
  // 2. Inicializar docxtemplater
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter() { return '---'; } // Garante que placeholders vazios fiquem visíveis como '---' em vez de sumirem
  });
  
  // 3. Montar dados
  const agora = new Date();
  const validade = new Date(agora);
  validade.setFullYear(validade.getFullYear() + 2);
  
  const dados = {
    empresa: {
      razao_social: empresa.razaoSocial || empresa.razao_social || '',
      nome_fantasia: empresa.nomeFantasia || empresa.nome_fantasia || '*****',
      cnpj: empresa.cnpj || '',
      endereco: empresa.endereco || '',
      complemento: empresa.complemento || '',
      telefone: empresa.telefone || '',
      cep: empresa.cep || '',
      bairro: empresa.bairro || '',
      municipio: empresa.municipio || '',
      estado: empresa.estado || '',
      cnae: empresa.cnae || '',
      cnae_descricao: empresa.cnaeDescricao || empresa.cnae_descricao || '',
      cnaes_secundarios: empresa.cnaesSecundarios || empresa.cnaes_secundarios || '',
      grau_risco: String(empresa.grauRiscoNr4 || empresa.grau_risco || ''),
      total_funcionarios: String(empresa.totalFuncionarios || empresa.total_funcionarios || 0),
      horario_trabalho: empresa.horarioTrabalho || empresa.horario_trabalho || ''
    },
    
    documento: {
      data_emissao_formatada: `${MESES[agora.getMonth()] || ''}/${agora.getFullYear()}`,
      data_validade_formatada: `${MESES[validade.getMonth()] || ''}/${validade.getFullYear()}`,
      data_emissao_extenso: `${agora.getDate()} de ${(MESES[agora.getMonth()] || '').toLowerCase()} de ${agora.getFullYear()}`,
      vigencia: `${MESES[agora.getMonth()] || ''} DE ${agora.getFullYear()} À ${MESES[validade.getMonth()] || ''} DE ${validade.getFullYear()}`,
      periodo_coleta: options?.periodoColeta 
        ? `${options.periodoColeta.inicio.toLocaleDateString('pt-BR')} a ${options.periodoColeta.fim.toLocaleDateString('pt-BR')}`
        : '',
      total_respondentes: String(options?.totalRespondentes || 0)
    },
    
    engenheiro: {
      nome: engenheiro.nome || engenheiro.name || '',
      cargo: engenheiro.cargo || 'Engenheiro de Segurança do Trabalho',
      contato: engenheiro.contato || engenheiro.contact || '',
      crea: engenheiro.crea || '',
      endereco: engenheiro.endereco || ''
    },
    
    revisoes: [{
      numero: '0',
      data: agora.toLocaleDateString('pt-BR'),
      elaborador: engenheiro.nome || '',
      responsavel: engenheiro.nome || '',
      descricao: 'Emissão Inicial'
    }],
    
    inventario_riscos: (jsonConsolidado.inventario_riscos || []).map((r: any) => ({
      id: r.id || '',
      fator_risco: r.fator_risco || '',
      ghes_afetados_str: Array.isArray(r.ghes_afetados) ? r.ghes_afetados.join(', ') : (r.ghes_afetados || ''),
      numero_expostos: String(r.numero_expostos || 0),
      score: String(r.score || ''),
      nivel_risco: r.nivel_risco || ''
    })),
    
    ghes: (jsonConsolidado.secao_10_por_ghe || jsonConsolidado.ghes || []).map((ghe: any, idx: number) => ({
      nome: ghe.ghe_nome || ghe.nome || '',
      codigo: ghe.ghe_codigo || `GHE ${String(idx + 1).padStart(2, '0')}`,
      total_respondentes: String(ghe.total_respondentes || ghe.total_colaboradores || 0),
      nivel_predominante: ghe.nivel_predominante || '',
      atencao_imediata: String(ghe.atencao_imediata || 0),
      riscos_psicossociais: (ghe.riscos_psicossociais || []).map((risco: any) => ({
        tipo_agente: risco.tipo_agente || 'Ergonômico/Psicossocial',
        descricao_agente: risco.descricao_agente || '',
        codigo_esocial: risco.codigo_esocial || '09.01.001',
        frequencia: risco.frequencia || 'Eventual',
        tipo_avaliacao: risco.tipo_avaliacao || 'Qualitativa',
        efeito: risco.efeito || '',
        fonte_geradora: risco.fonte_geradora || '',
        orientacao: risco.orientacao || ''
      }))
    })),
    
    cronograma_acoes: (jsonConsolidado.secao_11?.cronograma_acoes || jsonConsolidado.plano_acao || []).map((a: any) => ({
      o_que: a.o_que || a.acao || a.descricao || '',
      onde_str: Array.isArray(a.onde) ? a.onde.join(', ') : (a.onde || a.ghe_alvo || ''),
      quem: a.quem || a.responsavel || '',
      quando: a.quando || `${a.prazo_dias || 90} dias`,
      prioridade_label: a.prioridade_label || 'Grau 2 - De Atenção'
    })),
    
    secao_13_recomendacoes: jsonConsolidado.secao_13_recomendacoes || 
      'Recomenda-se a implementação das medidas preventivas listadas no plano de ação.',
    
    secao_14_consideracoes_finais: jsonConsolidado.secao_14_consideracoes_finais || 
      'As avaliações foram realizadas considerando as condições atuais de trabalho.'
  };
  
  console.log('[DocService] 🛠️ Dados montados para renderização:', {
    empresa: dados.empresa.razao_social,
    cnpj: dados.empresa.cnpj,
    engenheiro: dados.engenheiro.nome,
    ghesCount: dados.ghes.length,
    inventarioCount: dados.inventario_riscos.length,
    acoesCount: dados.cronograma_acoes.length
  });
  
  // 4. RENDERIZAR
  try {
    doc.render(dados);
    console.log('[DocService] ✅ doc.render() executado com sucesso');
  } catch (err: any) {
    console.error('[DocService] ❌ Erro Crítico ao renderizar template:', err.message);
    if (err.properties?.errors) {
      err.properties.errors.forEach((e: any) => {
        console.error('[DocService] Erro Detalhado:', JSON.stringify(e));
      });
    }
    throw new Error(`Falha técnica na renderização do DOCX: ${err.message}`);
  }
  
  // 5. Gerar buffer
  const buffer = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });
  
  console.log(`[DocService] 🏁 Buffer final gerado (${buffer.length} bytes)`);
  return buffer;
}

export async function converterDocxParaPdf(docxBuffer: Buffer): Promise<Buffer> {
  const tmpDir = `/tmp/pgr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await fs.mkdir(tmpDir, { recursive: true });
  const docxPath = path.join(tmpDir, 'input.docx');
  
  try {
    await fs.writeFile(docxPath, docxBuffer);
    console.log('[DocService] 🔄 Iniciando conversão para PDF...');
    
    const timeout = 60000;
    await execAsync(
      `libreoffice --headless --convert-to pdf --outdir ${tmpDir} ${docxPath}`,
      { timeout }
    );
    
    const pdfPath = path.join(tmpDir, 'input.pdf');
    const pdfBuffer = await fs.readFile(pdfPath);
    console.log(`[DocService] ✅ PDF gerado com sucesso (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } catch (err: any) {
    console.error('[DocService] ❌ Falha na conversão PDF:', err.message);
    throw new Error(`Erro no motor de PDF: ${err.message}`);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
