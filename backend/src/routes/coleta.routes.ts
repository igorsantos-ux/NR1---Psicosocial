import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

export async function coletaRoutes(fastify: FastifyInstance) {
    // GET /api/q/:token - Dados públicos da coleta
    fastify.get('/:token', async (request, reply) => {
        const { token } = request.params as { token: string };

        const empresa = await prisma.empresa.findUnique({
            where: { tokenColeta: token },
            include: {
                ghes: {
                    select: {
                        id: true,
                        codigo: true,
                        nome: true,
                        cargos: {
                            select: {
                                nome: true
                            }
                        }
                    }
                }
            }
        });

        if (!empresa) {
            return reply.status(404).send({ message: 'Link de coleta inválido' });
        }

        if (empresa.statusColeta !== 'ATIVA' || new Date() > empresa.dataExpiracaoLink) {
            return reply.status(410).send({ message: 'Este link de coleta expirou ou foi encerrado' });
        }

        return {
            empresa: {
                nomeFantasia: empresa.nomeFantasia,
                razaoSocial: empresa.razaoSocial,
                statusColeta: empresa.statusColeta,
                dataExpiracaoLink: empresa.dataExpiracaoLink,
                ghes: empresa.ghes
            }
        };
    });

    // POST /api/q/:token/responder - Registrar resposta
    fastify.post('/:token/responder', async (request, reply) => {
        const { token } = request.params as { token: string };
        const bodySchema = z.object({
            colaboradorId: z.string().uuid(),
            gheId: z.string(),
            cargo: z.string(),
            respostasRaw: z.any()
        });

        const { colaboradorId, gheId, cargo, respostasRaw } = bodySchema.parse(request.body);

        const empresa = await prisma.empresa.findUnique({
            where: { tokenColeta: token }
        });

        if (!empresa || empresa.statusColeta !== 'ATIVA' || new Date() > empresa.dataExpiracaoLink) {
            return reply.status(410).send({ message: 'Coleta não disponível' });
        }

        // Salvar resposta bruta
        await prisma.respostaQuestionario.create({
            data: {
                colaboradorId,
                empresaId: empresa.id,
                gheId,
                cargo,
                respostasRaw: respostasRaw,
                processada: false
            }
        });

        // Nota: O processamento individual via Gemini (Prompt 2) foi solicitado para ser feito apenas ao final,
        // mas a estrutura permite rodar aqui se desejado. Conforme última instrução, salvamos apenas o bruto.

        return reply.status(202).send({ message: 'Resposta recebida com sucesso' });
    });
}

function string() {
    return z.string();
}
