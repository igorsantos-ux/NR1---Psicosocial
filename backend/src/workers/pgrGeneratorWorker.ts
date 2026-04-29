import { PrismaClient, type GHE, type RespostaQuestionario, type Cargo, type Empresa, type Engenheiro } from '@prisma/client';
import { GeminiService } from '../services/gemini.service.js';
import { preencherTemplatePGR, converterDocxParaPdf } from '../services/document.service.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

const prisma = new PrismaClient();

type GHEWithRelations = GHE & {
    cargos: Cargo[];
};

type EmpresaWithRelations = Empresa & {
    engenheiro: Engenheiro;
    ghes: GHEWithRelations[];
    respostas: RespostaQuestionario[];
};

export async function processarGeracaoPGR(pgrId: string) {
    const log = (msg: string, extra?: any) => 
        console.log(`[PGR-WORKER ${pgrId}] ${msg}`, extra || '');

    try {
        log('🚀 [ETAPA 0] Iniciando processo de geração');

        const pgr = await prisma.pgr.findUnique({
            where: { id: pgrId },
            include: {
                empresa: {
                    include: {
                        engenheiro: true,
                        ghes: { include: { cargos: true } },
                        respostas: { where: { processada: true } } // Pegar apenas as que já foram analisadas individualmente
                    }
                }
            }
        });

        if (!pgr) throw new Error('PGR não encontrado no banco');
        const empresa = pgr.empresa as EmpresaWithRelations;
        
        log(`🏢 [ETAPA 1] Empresa: ${empresa.razaoSocial} | Respostas processadas: ${empresa.respostas.length}`);

        if (empresa.respostas.length === 0) {
            log('⚠️ Nenhuma resposta processada encontrada. Verifique se as análises individuais foram concluídas.');
            // Se não tem respostas processadas, tentamos pegar as não processadas apenas para não travar, 
            // mas o ideal é que elas já tivessem passado pela IA individual.
            const todasRespostas = await prisma.respostaQuestionario.findMany({ where: { empresaId: empresa.id } });
            if (todasRespostas.length === 0) throw new Error('Nenhuma resposta disponível (nem processada, nem bruta)');
            empresa.respostas = todasRespostas;
        }

        // 1. Agrupar análises
        log('📦 [ETAPA 2] Agrupando respostas para consolidação...');
        const analisesPorGhe: Record<string, any[]> = {};
        empresa.ghes.forEach((ghe: GHEWithRelations) => {
            const respostasGhe = empresa.respostas.filter((r: any) => r.gheId === ghe.id);
            analisesPorGhe[ghe.nome] = respostasGhe.map((r: any) => ({
                cargo: r.cargo,
                analiseIA: r.analiseIA || r.respostasRaw // Prioriza a análise já feita pela IA
            }));
        });

        // 2. IA / Cache - VALIDAÇÃO RIGOROSA
        let jsonConsolidado: any = pgr.jsonGerado;
        
        // Verifica se o cache é REALMENTE válido (tem as seções dinâmicas)
        const cacheValido = jsonConsolidado && 
                           typeof jsonConsolidado === 'object' && 
                           (jsonConsolidado.secao_10_por_ghe?.length > 0 || jsonConsolidado.ghes?.length > 0) &&
                           (jsonConsolidado.inventario_riscos?.length > 0);

        if (!cacheValido) {
            log('🤖 [ETAPA 3] Cache ausente ou incompleto. Chamando Gemini para consolidação total...');
            jsonConsolidado = await GeminiService.gerarPGRConsolidado({
                empresa,
                ghes: empresa.ghes.map(g => ({
                    id: g.id,
                    nome: g.nome,
                    total_colaboradores: g.cargos.reduce((acc, c) => acc + c.quantidade, 0)
                })),
                analisesPorGhe,
                totalRespondentes: empresa.respostas.length,
                dataGeracao: new Date().toLocaleDateString('pt-BR')
            });
            
            await prisma.pgr.update({
                where: { id: pgrId },
                data: { jsonGerado: jsonConsolidado as any }
            });
            log('✅ [ETAPA 3 OK] Novo JSON consolidado gerado e salvo');
        } else {
            log('♻️ [ETAPA 3] Cache validado e reutilizado');
        }

        // LOG DE VERIFICAÇÃO DE ESTRUTURA (Tarefa 1)
        console.log('[Worker] 🔍 Estrutura do JSON consolidado:', {
            temSecao10: !!jsonConsolidado.secao_10_por_ghe,
            temGhes: !!jsonConsolidado.ghes,
            temInventario: !!jsonConsolidado.inventario_riscos,
            temPlanoAcao: !!jsonConsolidado.plano_acao,
            temSecao11: !!jsonConsolidado.secao_11,
            chaves: Object.keys(jsonConsolidado),
            ghesCount: (jsonConsolidado.secao_10_por_ghe || jsonConsolidado.ghes || []).length,
            riscosCount: (jsonConsolidado.inventario_riscos || []).length
        });

        // 3. Gerar DOCX
        log('📄 [ETAPA 4] Preenchendo template DOCX...');
        const docxBuffer = await preencherTemplatePGR(
            jsonConsolidado, 
            empresa, 
            empresa.engenheiro,
            {
                periodoColeta: {
                    inicio: new Date(Math.min(...empresa.respostas.map(r => r.criadaEm.getTime()))),
                    fim: new Date(Math.max(...empresa.respostas.map(r => r.criadaEm.getTime())))
                },
                totalRespondentes: empresa.respostas.length
            }
        );
        
        // 4. PDF
        log('🔄 [ETAPA 5] Convertendo para PDF...');
        const pdfBuffer = await converterDocxParaPdf(docxBuffer);

        // 5. Salvar Fisicamente
        const baseOutputDir = process.env.PGR_OUTPUT_DIR || path.join(process.cwd(), 'output');
        const outputDir = path.join(baseOutputDir, empresa.id, pgrId);
        await fs.mkdir(outputDir, { recursive: true });

        await fs.writeFile(path.join(outputDir, 'pgr.docx'), docxBuffer);
        await fs.writeFile(path.join(outputDir, 'pgr.pdf'), pdfBuffer);

        // 6. Finalizar no Banco
        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                caminhoDocx: `${empresa.id}/${pgrId}/pgr.docx`,
                caminhoPdf: `${empresa.id}/${pgrId}/pgr.pdf`,
                status: 'AGUARDANDO_VALIDACAO'
            }
        });
        log('🎉 [FINALIZADO] PGR gerado com sucesso com todas as seções');

    } catch (error: any) {
        log('❌ ERRO CRÍTICO NO WORKER:', error.message);
        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                status: 'REPROVADO',
                observacoesEngenheiro: `ERRO DE PROCESSAMENTO: ${error.message}`
            }
        });
    }
}
