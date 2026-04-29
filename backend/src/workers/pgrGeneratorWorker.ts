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

        // Diagnóstico de Template
        const templatePath = './templates/PGR-MODELO.docx';
        const templateExists = fsSync.existsSync(templatePath);
        log(`[DIAGNÓSTICO] Template existe em ${templatePath}? ${templateExists}`);
        if (templateExists) {
            const stats = fsSync.statSync(templatePath);
            log(`[DIAGNÓSTICO] Tamanho do template: ${stats.size} bytes`);
        }

        const pgr = await prisma.pgr.findUnique({
            where: { id: pgrId },
            include: {
                empresa: {
                    include: {
                        engenheiro: true,
                        ghes: { include: { cargos: true } },
                        respostas: true
                    }
                }
            }
        });

        if (!pgr) throw new Error('PGR não encontrado no banco');
        const empresa = pgr.empresa as EmpresaWithRelations;
        
        log(`🏢 [ETAPA 1] Empresa: ${empresa.razaoSocial} | Engenheiro: ${empresa.engenheiro?.nome || 'NÃO DEFINIDO'}`);

        if (empresa.respostas.length === 0) {
            throw new Error('Nenhuma resposta encontrada para esta empresa');
        }

        // 1. Agrupar análises
        log('📦 [ETAPA 2] Agrupando respostas por GHE...');
        const analisesPorGhe: Record<string, any[]> = {};
        empresa.ghes.forEach((ghe: GHEWithRelations) => {
            const respostasGhe = empresa.respostas.filter((r: any) => r.gheId === ghe.id);
            analisesPorGhe[ghe.nome] = respostasGhe.map((r: any) => ({
                cargo: r.cargo,
                respostas: r.respostasRaw
            }));
        });

        // 2. IA / Cache
        let jsonGerado: any = pgr.jsonGerado;
        if (!jsonGerado) {
            log('🤖 [ETAPA 3] Chamando Gemini para análise consolidada...');
            jsonGerado = await GeminiService.gerarPGRConsolidado({
                empresa,
                ghes: empresa.ghes.map(g => ({
                    nome: g.nome,
                    total_colaboradores: g.cargos.reduce((acc, c) => acc + c.quantidade, 0)
                })),
                analisesPorGhe,
                dataGeracao: new Date().toLocaleDateString('pt-BR')
            });
            
            await prisma.pgr.update({
                where: { id: pgrId },
                data: { jsonGerado: jsonGerado as any }
            });
            log('✅ [ETAPA 3 OK] JSON gerado e salvo no banco');
        } else {
            log('♻️ [ETAPA 3] Usando JSON de análise existente no cache');
        }

        // 3. Gerar DOCX
        log('📄 [ETAPA 4] Preenchendo template DOCX...');
        const docxBuffer = await preencherTemplatePGR(
            jsonGerado, 
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
        log(`✅ [ETAPA 4 OK] DOCX gerado (${docxBuffer.length} bytes)`);

        // 4. PDF
        log('🔄 [ETAPA 5] Convertendo para PDF...');
        const pdfBuffer = await converterDocxParaPdf(docxBuffer);
        log(`✅ [ETAPA 5 OK] PDF gerado (${pdfBuffer.length} bytes)`);

        // 5. Salvar
        const baseOutputDir = process.env.PGR_OUTPUT_DIR || path.join(process.cwd(), 'output');
        const outputDir = path.join(baseOutputDir, empresa.id, pgrId);
        await fs.mkdir(outputDir, { recursive: true });

        await fs.writeFile(path.join(outputDir, 'pgr.docx'), docxBuffer);
        await fs.writeFile(path.join(outputDir, 'pgr.pdf'), pdfBuffer);

        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                caminhoDocx: `${empresa.id}/${pgrId}/pgr.docx`,
                caminhoPdf: `${empresa.id}/${pgrId}/pgr.pdf`,
                status: 'AGUARDANDO_VALIDACAO'
            }
        });
        log('🎉 [FINALIZADO] PGR pronto para revisão');

    } catch (error: any) {
        log('❌ ERRO CRÍTICO:', error.message);
        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                status: 'REPROVADO',
                observacoesEngenheiro: `FALHA NA GERAÇÃO: ${error.message}`
            }
        });
    }
}
