import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function pgrRoutes(fastify: FastifyInstance) {
    // POST /api/empresas/:id/gerar-pgr (registrado como sub-rota ou aqui direto)
    // Vou usar o prefixo /api/pgr para simplificar o roteamento

    fastify.post('/gerar', async (request, reply) => {
        const { empresaId } = request.body as { empresaId: string };

        const empresa = await prisma.empresa.findUnique({
            where: { id: empresaId },
            include: {
                respostas: { where: { processada: false } } // Na verdade o usuário quer processar TUDO no final
            }
        });

        if (!empresa) return reply.status(404).send({ message: 'Empresa não encontrada' });

        const totalRespostas = await prisma.respostaQuestionario.count({ where: { empresaId } });
        const minRespostas = Number(process.env.MIN_RESPOSTAS_PARA_GERAR) || 1;

        if (totalRespostas < minRespostas) {
            return reply.status(400).send({ message: `Necessário no mínimo ${minRespostas} respostas para gerar o PGR.` });
        }

        // Criar registro PGR
        const pgr = await prisma.pgr.create({
            data: {
                empresaId,
                status: 'GERANDO',
                jsonGerado: {}
            }
        });

        // Disparar worker (Aqui chamaremos a função do worker de forma assíncrona para simplificar sem Redis por enquanto se não houver)
        // No mundo ideal, usaria BullMQ. Aqui faremos um "fire and forget" ou usaremos uma fila simples.

        // Importação dinâmica para evitar loop se necessário
        const { processarGeracaoPGR } = await import('../workers/pgrGeneratorWorker.js');

        processarGeracaoPGR(pgr.id).catch((err: Error) => {
            console.error(`Erro ao processar PGR ${pgr.id}:`, err);
        });

        return { pgrId: pgr.id, status: pgr.status };
    });

    const baseOutputDir = process.env.PGR_OUTPUT_DIR || path.join(process.cwd(), 'output');

    fastify.get('/:id/status', async (request, reply) => {
        const { id } = request.params as { id: string };
        const pgr = await prisma.pgr.findUnique({
            where: { id },
            include: {
                empresa: {
                    include: {
                        _count: {
                            select: { ghes: true, respostas: true }
                        }
                    }
                }
            }
        });

        if (!pgr) return reply.status(404).send({ message: 'PGR não encontrado' });

        // Adiciona as URLs públicas para o frontend
        return {
            ...pgr,
            urlPdf: pgr.caminhoPdf ? `/outputs/${pgr.caminhoPdf}` : null,
            urlDocx: pgr.caminhoDocx ? `/outputs/${pgr.caminhoDocx}` : null
        };
    });

    fastify.get('/:id/download/docx', async (request, reply) => {
        const { id } = request.params as { id: string };
        const pgr = await prisma.pgr.findUnique({ where: { id } });

        if (!pgr || !pgr.caminhoDocx) return reply.status(404).send({ message: 'Arquivo não disponível' });

        const fullPath = path.isAbsolute(pgr.caminhoDocx) ? pgr.caminhoDocx : path.join(baseOutputDir, pgr.caminhoDocx);
        const fileBuffer = await fs.readFile(fullPath);
        reply
            .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            .header('Content-Disposition', `attachment; filename=PGR-${id}.docx`)
            .send(fileBuffer);
    });

    fastify.get('/:id/download/pdf', async (request, reply) => {
        const { id } = request.params as { id: string };
        const pgr = await prisma.pgr.findUnique({ where: { id } });

        if (!pgr || !pgr.caminhoPdf) return reply.status(404).send({ message: 'Arquivo não disponível' });

        const fullPath = path.isAbsolute(pgr.caminhoPdf) ? pgr.caminhoPdf : path.join(baseOutputDir, pgr.caminhoPdf);
        const fileBuffer = await fs.readFile(fullPath);
        reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename=PGR-${id}.pdf`)
            .send(fileBuffer);
    });

    fastify.post('/:id/validar', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { approved, observacoes, validadoPor } = request.body as { approved: boolean, observacoes?: string, validadoPor: string };

        if (!approved) {
            // Se foi rejeitado, resetamos para processar novamente
            const pgr = await prisma.pgr.update({
                where: { id },
                data: {
                    status: 'GERANDO',
                    observacoesEngenheiro: observacoes ?? 'Rejeitado pelo engenheiro',
                    jsonGerado: {} // Limpa cache para forçar nova análise
                }
            });

            const { processarGeracaoPGR } = await import('../workers/pgrGeneratorWorker.js');
            processarGeracaoPGR(pgr.id).catch((err: Error) => {
                console.error(`Erro ao reprocessar PGR rejeitado ${pgr.id}:`, err);
            });

            return { status: 'GERANDO', message: 'PGR rejeitado e enviado para reprocessamento.' };
        }

        const pgr = await prisma.pgr.update({
            where: { id },
            data: {
                status: 'VALIDADO',
                observacoesEngenheiro: observacoes ?? null,
                validadoPor,
                validadoEm: new Date()
            }
        });

        return pgr;
    });

    fastify.post('/:id/regenerar', async (request, reply) => {
        const { id } = request.params as { id: string };

        const pgrExistente = await prisma.pgr.findUnique({ where: { id } });
        if (!pgrExistente) return reply.status(404).send({ message: 'PGR não encontrado' });

        // Resetar status para GERANDO e limpar erros anteriores
        const pgr = await prisma.pgr.update({
            where: { id },
            data: {
                status: 'GERANDO',
                observacoesEngenheiro: null,
                // Limpamos o jsonGerado para forçar o Gemini a reanalisar (Modo gas/nitro ativado anteriormente)
                jsonGerado: {}
            }
        });

        // Disparar worker
        const { processarGeracaoPGR } = await import('../workers/pgrGeneratorWorker.js');
        processarGeracaoPGR(pgr.id).catch((err: Error) => {
            console.error(`Erro ao regenerar PGR ${pgr.id}:`, err);
        });

        return { success: true, status: pgr.status };
    });

    fastify.get('/', async (request) => {
        const { status, empresaId } = request.query as { status?: string, empresaId?: string };
        
        const where: any = {};
        if (status && status !== 'todos') where.status = status;
        if (empresaId) where.empresaId = empresaId;
        
        const pgrs = await prisma.pgr.findMany({
            where,
            include: {
                empresa: {
                    select: { id: true, razaoSocial: true, cnpj: true }
                }
            },
            orderBy: { geradoEm: 'desc' }
        });
        
        return pgrs.map(pgr => ({
            id: pgr.id,
            empresa: pgr.empresa,
            status: pgr.status,
            geradoEm: pgr.geradoEm,
            validadoEm: pgr.validadoEm,
            temDocx: !!pgr.caminhoDocx,
            temPdf: !!pgr.caminhoPdf,
            erroDetalhes: pgr.status === 'REPROVADO' 
                ? pgr.observacoesEngenheiro?.split('\n\nStack:')[0]?.replace('ERRO AUTOMÁTICO: Error: ', '') 
                : null,
            resumo: (pgr.jsonGerado as any)?.resumo_executivo?.parecer_sintetico || null
        }));
    });
}
