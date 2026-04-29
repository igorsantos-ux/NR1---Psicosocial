import { PrismaClient, type GHE, type RespostaQuestionario, type Cargo, type Empresa, type Engenheiro } from '@prisma/client';
import { GeminiService } from '../services/gemini.service.js';
import { DocumentService } from '../services/document.service.js';
import fs from 'fs/promises';
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
        log('🚀 Iniciando geração de PGR');

        const pgr = await prisma.pgr.findUnique({
            where: { id: pgrId },
            include: {
                empresa: {
                    include: {
                        engenheiro: true,
                        ghes: {
                            include: {
                                cargos: true
                            }
                        },
                        respostas: true
                    }
                }
            }
        });

        if (!pgr) throw new Error('PGR não encontrado');
        log('📋 PGR encontrado', { status: pgr.status, empresaId: pgr.empresaId });

        const empresa = pgr.empresa as EmpresaWithRelations;
        log('🏢 Empresa carregada', { nome: empresa.razaoSocial, ghes: empresa.ghes.length });

        if (empresa.respostas.length === 0) {
            throw new Error('Nenhuma resposta encontrada disponível para gerar PGR');
        }
        log('📝 Respostas encontradas', { total: empresa.respostas.length });

        // 1. Agrupar análises/respostas por GHE
        const analisesPorGhe: Record<string, any[]> = {};
        empresa.ghes.forEach((ghe: GHEWithRelations) => {
            const respostasGhe = (empresa.respostas as RespostaQuestionario[]).filter((r: RespostaQuestionario) => r.gheId === ghe.id);
            analisesPorGhe[ghe.nome] = respostasGhe.map((r: RespostaQuestionario) => ({
                colaborador_id: r.colaboradorId,
                cargo: r.cargo,
                respostas: r.respostasRaw
            }));
        });

        // Calcular período de coleta
        const datas = (empresa.respostas as RespostaQuestionario[]).map((r: RespostaQuestionario) => r.criadaEm.getTime());
        const periodoColeta = {
            inicio: new Date(Math.min(...datas)).toLocaleDateString('pt-BR'),
            fim: new Date(Math.max(...datas)).toLocaleDateString('pt-BR')
        };

        // 2. Chamar Gemini
        log('🤖 Chamando Gemini para análise consolidada...');
        const jsonGerado = await GeminiService.gerarPGRConsolidado({
            empresa,
            ghes: empresa.ghes.map((g: GHEWithRelations) => ({
                codigo: g.codigo,
                nome: g.nome,
                total_colaboradores: g.cargos.reduce((acc: number, c: Cargo) => acc + c.quantidade, 0)
            })),
            analisesPorGhe,
            periodoColeta,
            totalRespondentes: empresa.respostas.length,
            dataGeracao: new Date().toLocaleDateString('pt-BR'),
            vigencia: {
                inicio: new Date().toLocaleDateString('pt-BR'),
                fim: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toLocaleDateString('pt-BR')
            }
        });
        log('✅ Gemini retornou JSON', { tamanho: JSON.stringify(jsonGerado).length });

        // 3. Salvar JSON gerado
        await prisma.pgr.update({
            where: { id: pgrId },
            data: { jsonGerado: jsonGerado as any }
        });
        log('💾 JSON salvo no banco');

        // 4. Preencher template DOCX
        log('📄 Preenchendo template DOCX...');
        const docxBuffer = await DocumentService.preencherTemplatePGR(jsonGerado, empresa, empresa.engenheiro);
        log('✅ DOCX gerado', { bytes: docxBuffer.length });

        // 5. Converter para PDF
        log('🔄 Convertendo para PDF...');
        const pdfBuffer = await DocumentService.converterDocxParaPdf(docxBuffer);
        log('✅ PDF gerado', { bytes: pdfBuffer.length });

        // 6. Salvar arquivos (storage local)
        const baseOutputDir = process.env.PGR_OUTPUT_DIR || path.join(process.cwd(), 'output');
        const empresaDir = path.join(baseOutputDir, empresa.id, pgrId);
        await fs.mkdir(empresaDir, { recursive: true });

        const docxPath = path.join(empresaDir, 'pgr.docx');
        const pdfPath = path.join(empresaDir, 'pgr.pdf');

        await fs.writeFile(docxPath, docxBuffer);
        await fs.writeFile(pdfPath, pdfBuffer);
        log('💾 Arquivos salvos', { docxPath, pdfPath });

        // 7. Atualizar status para AGUARDANDO_VALIDACAO
        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                caminhoDocx: docxPath,
                caminhoPdf: pdfPath,
                status: 'AGUARDANDO_VALIDACAO'
            }
        });
        log('🎉 PGR finalizado com sucesso');

    } catch (error: any) {
        console.error(`[PGR-WORKER ${pgrId}] ❌ ERRO:`, error);
        console.error(`[PGR-WORKER ${pgrId}] Stack:`, error.stack);

        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                status: 'REPROVADO',
                observacoesEngenheiro: `ERRO AUTOMÁTICO: ${error.message}\n\nStack: ${error.stack}`
            }
        });
    }
}
