import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { slugify, generateRandomSuffix } from '../utils/stringUtils';
import { z } from 'zod';

const prisma = new PrismaClient();

const empresaSchema = z.object({
    razaoSocial: z.string(),
    nomeFantasia: z.string().optional(),
    cnpj: z.string(),
    cnae: z.string(),
    cnaeDescricao: z.string().optional(),
    grauRiscoNr4: z.number(),
    endereco: z.string().optional(),
    municipio: z.string().optional(),
    estado: z.string().optional(),
    cep: z.string().optional(),
    telefone: z.string().optional(),
    totalFuncionarios: z.number(),
    horarioTrabalho: z.string().optional(),
    dataExpiracaoLink: z.string().datetime(),
    engenheiroId: z.string(),
    empresaElaboradora: z.string().optional(),
    ghes: z.array(z.object({
        codigo: z.string(),
        nome: z.string(),
        descricao: z.string().optional(),
        ambiente: z.any().optional(),
        cargos: z.array(z.object({
            nome: z.string(),
            cbo: z.string().optional(),
            descricaoAtividade: z.string().optional(),
            quantidade: z.number(),
            qtdHomens: z.number().default(0),
            qtdMulheres: z.number().default(0),
        }))
    }))
});

export async function empresaRoutes(fastify: FastifyInstance) {
    fastify.post('/', async (request, reply) => {
        const data = empresaSchema.parse(request.body);

        const subdominio = `${slugify(data.razaoSocial)}-${generateRandomSuffix()}`;

        const result = await prisma.$transaction(async (tx) => {
            const empresa = await tx.empresa.create({
                data: {
                    razaoSocial: data.razaoSocial,
                    nomeFantasia: data.nomeFantasia,
                    cnpj: data.cnpj,
                    cnae: data.cnae,
                    cnaeDescricao: data.cnaeDescricao,
                    grauRiscoNr4: data.grauRiscoNr4,
                    endereco: data.endereco,
                    municipio: data.municipio,
                    estado: data.estado,
                    cep: data.cep,
                    telefone: data.telefone,
                    totalFuncionarios: data.totalFuncionarios,
                    horarioTrabalho: data.horarioTrabalho,
                    dataExpiracaoLink: new Date(data.dataExpiracaoLink),
                    subdominio,
                    engenheiroId: data.engenheiroId,
                    empresaElaboradora: data.empresaElaboradora,
                    ghes: {
                        create: data.ghes.map(ghe => ({
                            codigo: ghe.codigo,
                            nome: ghe.nome,
                            descricao: ghe.descricao,
                            ambiente: ghe.ambiente,
                            cargos: {
                                create: ghe.cargos.map(cargo => ({
                                    nome: cargo.nome,
                                    cbo: cargo.cbo,
                                    descricaoAtividade: cargo.descricaoAtividade,
                                    quantidade: cargo.quantidade,
                                    qtdHomens: cargo.qtdHomens,
                                    qtdMulheres: cargo.qtdMulheres,
                                }))
                            }
                        }))
                    }
                },
                include: {
                    ghes: {
                        include: {
                            cargos: true
                        }
                    }
                }
            });

            return empresa;
        });

        const publicUrl = `${request.protocol}://${request.hostname}/q/${result.tokenColeta}`;

        return reply.status(201).send({
            empresa: result,
            publicUrl
        });
    });

    fastify.get('/', async () => {
        return await prisma.empresa.findMany({
            include: {
                _count: {
                    select: { respostas: true }
                }
            }
        });
    });

    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const empresa = await prisma.empresa.findUnique({
            where: { id },
            include: {
                ghes: {
                    include: {
                        cargos: true
                    }
                },
                _count: {
                    select: { respostas: true }
                }
            }
        });

        if (!empresa) return reply.status(404).send({ message: 'Empresa não encontrada' });
        return empresa;
    });
}
