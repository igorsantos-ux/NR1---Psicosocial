import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { slugify, generateRandomSuffix } from '../utils/stringUtils.js';
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
    dataExpiracaoLink: z.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
        return arg;
    }, z.date({ message: "Data de expiração inválida" })),
    engenheiroId: z.string().uuid({ message: "ID do engenheiro deve ser um UUID válido" }),
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
        
        // Verificar se o engenheiro existe antes de tentar criar a empresa
        const engenheiroExiste = await prisma.engenheiro.findUnique({
            where: { id: data.engenheiroId }
        });

        if (!engenheiroExiste) {
            return reply.status(400).send({ 
                message: 'O Engenheiro selecionado não existe no banco de dados. Por favor, execute o comando de seed ou verifique as configurações.' 
            });
        }

        const subdominio = `${slugify(data.razaoSocial)}-${generateRandomSuffix()}`;

        const result = await prisma.$transaction(async (tx) => {
            const empresa = await tx.empresa.create({
                data: {
                    razaoSocial: data.razaoSocial,
                    nomeFantasia: data.nomeFantasia ?? null,
                    cnpj: data.cnpj,
                    cnae: data.cnae,
                    cnaeDescricao: data.cnaeDescricao ?? null,
                    grauRiscoNr4: data.grauRiscoNr4,
                    endereco: data.endereco ?? null,
                    municipio: data.municipio ?? null,
                    estado: data.estado ?? null,
                    cep: data.cep ?? null,
                    telefone: data.telefone ?? null,
                    totalFuncionarios: data.totalFuncionarios,
                    horarioTrabalho: data.horarioTrabalho ?? null,
                    dataExpiracaoLink: data.dataExpiracaoLink,
                    subdominio,
                    engenheiroId: data.engenheiroId,
                    empresaElaboradora: data.empresaElaboradora ?? null,
                    ghes: {
                        create: data.ghes.map(ghe => ({
                            codigo: ghe.codigo,
                            nome: ghe.nome,
                            descricao: ghe.descricao ?? null,
                            ambiente: ghe.ambiente ?? null,
                            cargos: {
                                create: ghe.cargos.map(cargo => ({
                                    nome: cargo.nome,
                                    cbo: cargo.cbo ?? null,
                                    descricaoAtividade: cargo.descricaoAtividade ?? null,
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

    fastify.get('/', async (request) => {
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

        const mapped = empresas.map(e => {
            let statusCalculado = e.statusColeta;
            if (e.statusColeta === 'ATIVA' && e.dataExpiracaoLink <= agora) {
                statusCalculado = 'EXPIRADA';
            }
            
            const ultimoPgr = e.pgrs[0];
            let statusGeral: string = statusCalculado;
            
            if (ultimoPgr) {
                if (ultimoPgr.status === 'GERANDO') statusGeral = 'GERANDO';
                else if (ultimoPgr.status === 'AGUARDANDO_VALIDACAO') statusGeral = 'AGUARDANDO_VALIDACAO';
                else if (ultimoPgr.status === 'VALIDADO') statusGeral = 'FINALIZADO';
            }

            return {
                ...e,
                statusColeta: statusCalculado,
                statusGeral: statusGeral,
                totalRespostas: e._count.respostas,
                pgrId: ultimoPgr?.id || null
            };
        });

        if (status && status !== 'todas') {
            return mapped.filter(e => e.statusGeral.toLowerCase() === status.toLowerCase());
        }

        return mapped;
    });

    fastify.get('/:id', async (request, reply) => {
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
}
