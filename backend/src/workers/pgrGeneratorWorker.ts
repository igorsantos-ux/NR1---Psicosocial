import { PrismaClient, type GHE, type RespostaQuestionario, type Cargo, type Empresa, type Engenheiro } from '@prisma/client';
import { GeminiService } from '../services/gemini.service.js';
import { DocumentService } from '../services/document.service.js';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Tipagem para auxiliar nas iterações
type GHEWithRelations = GHE & {
    cargos: Cargo[];
};

type EmpresaWithRelations = Empresa & {
    engenheiro: Engenheiro;
    ghes: GHEWithRelations[];
    respostas: RespostaQuestionario[];
};

export async function processarGeracaoPGR(pgrId: string) {
    console.log(`[Worker] Iniciando geração do PGR: ${pgrId}`);

    try {
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
        const empresa = pgr.empresa as EmpresaWithRelations;

        if (empresa.respostas.length === 0) {
            throw new Error('Sem respostas para gerar PGR');
        }

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

        // 2. Chamar Gemini (Prompt 3)
        console.log(`[Worker] Chamando Gemini para consolidação...`);
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

        // 3. Salvar JSON gerado
        await prisma.pgr.update({
            where: { id: pgrId },
            data: { jsonGerado: jsonGerado as any }
        });

        // 4. Preencher template DOCX
        console.log(`[Worker] Preenchendo template DOCX...`);
        const docxBuffer = await DocumentService.preencherTemplatePGR(jsonGerado);

        // 5. Converter para PDF
        console.log(`[Worker] Convertendo para PDF...`);
        const pdfBuffer = await DocumentService.converterDocxParaPdf(docxBuffer);

        // 6. Salvar arquivos (storage local)
        const baseOutputDir = process.env.PGR_OUTPUT_DIR || path.join(process.cwd(), 'output');
        const empresaDir = path.join(baseOutputDir, empresa.id, pgrId);
        await fs.mkdir(empresaDir, { recursive: true });

        const docxPath = path.join(empresaDir, 'pgr.docx');
        const pdfPath = path.join(empresaDir, 'pgr.pdf');

        await fs.writeFile(docxPath, docxBuffer);
        await fs.writeFile(pdfPath, pdfBuffer);

        // 7. Atualizar status para AGUARDANDO_VALIDACAO
        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                caminhoDocx: docxPath,
                caminhoPdf: pdfPath,
                status: 'AGUARDANDO_VALIDACAO'
            }
        });

        console.log(`[Worker] PGR ${pgrId} gerado com sucesso!`);
    } catch (error: any) {
        console.error(`[Worker] Erro catastrófico na geração do PGR ${pgrId}:`, error);
        await prisma.pgr.update({
            where: { id: pgrId },
            data: {
                status: 'REPROVADO',
                observacoesEngenheiro: `ERRO DE GERAÇÃO: ${error.message}`
            }
        });
    }
}
