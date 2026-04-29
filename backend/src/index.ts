// Carregar variáveis de ambiente apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl && process.env.NODE_ENV === 'production') {
  console.error('FATAL: DATABASE_URL não está definida no ambiente de produção.');
  process.exit(1);
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { empresaRoutes } from './routes/empresa.routes.js';
import { coletaRoutes } from './routes/coleta.routes.js';
import { pgrRoutes } from './routes/pgr.routes.js';
import { adminRoutes } from './routes/admin.routes.js';
import { setupCrons } from './crons/expirarColetas.js';

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3001;

// Registrar Plugins
fastify.register(cors, { origin: '*' });

// Registrar Rotas
fastify.register(empresaRoutes, { prefix: '/api/empresas' });
fastify.register(coletaRoutes, { prefix: '/api/q' });
fastify.register(pgrRoutes, { prefix: '/api/pgr' });
fastify.register(adminRoutes, { prefix: '/api' });

// Global Error Handler para tratar erros do Zod
fastify.setErrorHandler((error: any, request, reply) => {
  if (error.name === 'ZodError') {
    return reply.status(400).send({
      message: 'Erro de validação nos dados enviados.',
      errors: JSON.parse(error.message)
    });
  }
  
  fastify.log.error(error);
  reply.status(500).send({ message: 'Erro interno do servidor' });
});

// Inicializar Crons
setupCrons();

// Health Check
fastify.get('/health', async () => {
  return { status: 'OK', message: 'Engine PGR NR 01 rodando' };
});

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Backend Fastify rodando na porta ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

export { prisma, fastify };
