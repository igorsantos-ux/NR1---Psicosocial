import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function pgrRoutes(fastify: FastifyInstance) {
    // POST /api/empresas/:id/gerar-pgr (registrado como sub-rota ou aqui direto)
    // Vou usar o prefixo /api/pgr para simplificar o roteamento

    fastify.post('/gerar/:empresaId', async (request, reply) => {
        const { empresaId } = request.params as { empresaId: string };

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
        const { processarGeracaoPGR } = await import('../workers/pgrGeneratorWorker');

        processarGeracaoPGR(pgr.id).catch(err => {
            console.error(`Erro ao processar PGR ${pgr.id}:`, err);
        });

        return { pgrId: pgr.id, status: pgr.status };
    });

    fastify.get('/:id/status', async (request, reply) => {
        const { id } = request.params as { id: string };
        const pgr = await prisma.pgr.findUnique({
            where: { id },
            select: { status: true, caminhoDocx: true, caminhoPdf: true, observacoesEngenheiro: true }
        });

        if (!pgr) return reply.status(404).send({ message: 'PGR não encontrado' });

        return pgr;
    });

    fastify.get('/:id/download/docx', async (request, reply) => {
        const { id } = request.params as { id: string };
        const pgr = await prisma.pgr.findUnique({ where: { id } });

        if (!pgr || !pgr.caminhoDocx) return reply.status(404).send({ message: 'Arquivo não disponível' });

        const fileBuffer = await fs.readFile(pgr.caminhoDocx);
        reply
            .header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            .header('Content-Disposition', `attachment; filename=PGR-${id}.docx`)
            .send(fileBuffer);
    });

    fastify.get('/:id/download/pdf', async (request, reply) => {
        const { id } = request.params as { id: string };
        const pgr = await prisma.pgr.findUnique({ where: { id } });

        if (!pgr || !pgr.caminhoPdf) return reply.status(404).send({ message: 'Arquivo não disponível' });

        const fileBuffer = await fs.readFile(pgr.caminhoPdf);
        reply
            .header('Content-Type', 'application/pdf')
            .header('Content-Disposition', `attachment; filename=PGR-${id}.pdf`)
            .send(fileBuffer);
    });

    fastify.post('/:id/validar', async (request, reply) => {
        const { id } = request.params as { id: string };
        const { observacoes, validadoPor } = request.body as { observacoes?: string, validadoPor: string };

        const pgr = await prisma.pgr.update({
            where: { id },
            data: {
                status: 'VALIDADO',
                observacoesEngenheiro: observacoes,
                validadoPor,
                validadoEm: new Date()
            }
        });

        return pgr;
    });
}
