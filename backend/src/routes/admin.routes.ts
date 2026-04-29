import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function adminRoutes(fastify: FastifyInstance) {
    // GET /api/assessments - Listar todas as respostas para o Dashboard
    fastify.get('/assessments', async () => {
        const respostas = await prisma.respostaQuestionario.findMany({
            include: {
                empresa: {
                    select: {
                        nomeFantasia: true,
                        razaoSocial: true
                    }
                },
                ghe: {
                    select: {
                        nome: true
                    }
                }
            },
            orderBy: { criadaEm: 'desc' }
        });

        // Mapear para o formato que o frontend espera (com campo 'status')
        return respostas.map(r => ({
            ...r,
            status: r.processada ? 'VALIDATED' : 'PENDING'
        }));
    });

    // GET /api/companies - Listar empresas (plural em inglês como o front pede)
    fastify.get('/companies', async () => {
        return await prisma.empresa.findMany({
            include: {
                _count: {
                    select: { respostas: true }
                }
            },
            orderBy: { criadoEm: 'desc' }
        });
    });

    // GET /api/ghes - Listar GHEs
    fastify.get('/ghes', async () => {
        return await prisma.gHE.findMany({
            include: {
                empresa: {
                    select: { nomeFantasia: true, razaoSocial: true }
                },
                cargos: true
            }
        });
    });

    // GET /api/engineer - Dados do engenheiro padrão
    fastify.get('/engineer', async () => {
        const eng = await prisma.engenheiro.findFirst();
        return eng;
    });
}
