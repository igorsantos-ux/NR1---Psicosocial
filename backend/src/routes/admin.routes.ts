import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export async function adminRoutes(fastify: FastifyInstance) {
    // GET /api/empresas/metricas - Métricas para os cards do topo
    fastify.get('/empresas/metricas', async () => {
        const agora = new Date();
        const empresas = await prisma.empresa.findMany({
            include: { pgrs: { orderBy: { geradoEm: 'desc' }, take: 1 } }
        });

        const ativas = empresas.filter(e => e.statusColeta === 'ATIVA' && e.dataExpiracaoLink > agora).length;
        const expiradas = empresas.filter(e => (e.statusColeta === 'ATIVA' && e.dataExpiracaoLink <= agora) || e.statusColeta === 'EXPIRADA').length;
        const finalizadas = empresas.filter(e => e.pgrs.length > 0 && e.pgrs[0]?.status === 'VALIDADO').length;

        return { ativas, expiradas, finalizadas };
    });

    // Rotas legadas/compatibilidade que o dashboard já usava
    fastify.get('/assessments', async () => {
        const respostas = await prisma.respostaQuestionario.findMany({
            include: {
                empresa: { select: { nomeFantasia: true, razaoSocial: true } },
                ghe: { select: { nome: true } }
            },
            orderBy: { criadaEm: 'desc' }
        });
        return respostas.map(r => ({ ...r, status: r.processada ? 'VALIDATED' : 'PENDING' }));
    });

    fastify.get('/companies', async () => {
        return await prisma.empresa.findMany({
            include: { _count: { select: { respostas: true } } },
            orderBy: { criadoEm: 'desc' }
        });
    });

    fastify.get('/ghes', async () => {
        return await prisma.gHE.findMany({
            include: {
                empresa: { select: { nomeFantasia: true, razaoSocial: true } },
                cargos: true
            }
        });
    });

    fastify.get('/engineer', async () => {
        return await prisma.engenheiro.findFirst();
    });
}

    // PATCH /api/empresas/:id/estender-prazo
    fastify.patch('/empresas/:id/estender-prazo', async (request, reply) => {
        const { id } = request.params as { id: string };
        const schema = z.object({ novaDataExpiracao: z.string().datetime() });
        const { novaDataExpiracao } = schema.parse(request.body);

        await prisma.empresa.update({
            where: { id },
            data: { 
                dataExpiracaoLink: new Date(novaDataExpiracao),
                statusColeta: 'ATIVA'
            }
        });

        return { message: 'Prazo estendido com sucesso' };
    });

    // POST /api/empresas/:id/encerrar-coleta
    fastify.post('/empresas/:id/encerrar-coleta', async (request) => {
        const { id } = request.params as { id: string };
        await prisma.empresa.update({
            where: { id },
            data: { statusColeta: 'ENCERRADA_MANUALMENTE' }
        });
        return { message: 'Coleta encerrada manualmente' };
    });

    // Rotas legadas/compatibilidade que o dashboard já usava
    fastify.get('/assessments', async () => {
        const respostas = await prisma.respostaQuestionario.findMany({
            include: {
                empresa: { select: { nomeFantasia: true, razaoSocial: true } },
                ghe: { select: { nome: true } }
            },
            orderBy: { criadaEm: 'desc' }
        });
        return respostas.map(r => ({ ...r, status: r.processada ? 'VALIDATED' : 'PENDING' }));
    });

    fastify.get('/companies', async () => {
        return await prisma.empresa.findMany({
            include: { _count: { select: { respostas: true } } },
            orderBy: { criadoEm: 'desc' }
        });
    });

    fastify.get('/engineer', async () => {
        return await prisma.engenheiro.findFirst();
    });
}
