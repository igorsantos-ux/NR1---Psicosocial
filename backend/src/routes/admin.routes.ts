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

    // GET /api/empresas - Listagem com filtros
    fastify.get('/empresas', async (request) => {
        const { status, search } = request.query as { status?: string, search?: string };
        const agora = new Date();

        let where: any = {};

        if (search) {
            where.OR = [
                { razaoSocial: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search, mode: 'insensitive' } }
            ];
        }

        const empresas = await prisma.empresa.findMany({
            where,
            include: {
                _count: { select: { respostas: true } },
                pgrs: { orderBy: { geradoEm: 'desc' }, take: 1 }
            },
            orderBy: { criadoEm: 'desc' }
        });

        // Mapeamento e Filtro de Status Manual (devido à lógica de data de expiração)
        const mapped = empresas.map(e => {
            let statusCalculado = e.statusColeta;
            if (e.statusColeta === 'ATIVA' && e.dataExpiracaoLink <= agora) {
                statusCalculado = 'EXPIRADA';
            }
            
            const ultimoPgr = e.pgrs[0];
            let statusGeral: string = statusCalculado; // Tipado como string para aceitar estados do PGR
            
            if (ultimoPgr) {
                if (ultimoPgr.status === 'GERANDO') statusGeral = 'GERANDO';
                else if (ultimoPgr.status === 'AGUARDANDO_VALIDACAO') statusGeral = 'AGUARDANDO_VALIDACAO';
                else if (ultimoPgr.status === 'VALIDADO') statusGeral = 'FINALIZADO';
            }

            return {
                id: e.id,
                razaoSocial: e.razaoSocial,
                nomeFantasia: e.nomeFantasia,
                cnpj: e.cnpj,
                grauRiscoNr4: e.grauRiscoNr4,
                totalFuncionarios: e.totalFuncionarios,
                statusColeta: statusCalculado,
                statusPgr: ultimoPgr?.status || null,
                statusGeral: statusGeral,
                dataExpiracaoLink: e.dataExpiracaoLink,
                totalRespostas: e._count.respostas,
                tokenColeta: e.tokenColeta
            };
        });

        if (status && status !== 'todas') {
            return mapped.filter(e => e.statusGeral.toLowerCase() === status.toLowerCase());
        }

        return mapped;
    });

    // GET /api/empresas/:id - Detalhes completos
    fastify.get('/empresas/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const empresa = await prisma.empresa.findUnique({
            where: { id },
            include: {
                ghes: {
                    include: {
                        cargos: true,
                        respostas: true
                    }
                },
                respostas: {
                    orderBy: { criadaEm: 'desc' },
                    take: 20
                },
                pgrs: {
                    orderBy: { geradoEm: 'desc' }
                }
            }
        });

        if (!empresa) return reply.status(404).send({ message: 'Empresa não encontrada' });

        return empresa;
    });

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
