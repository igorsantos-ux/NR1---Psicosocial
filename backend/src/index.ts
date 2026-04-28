import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { empresaRoutes } from './routes/empresa.routes';
import { coletaRoutes } from './routes/coleta.routes';
import { pgrRoutes } from './routes/pgr.routes';
import { setupCrons } from './crons/expirarColetas';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT) || 3001;

// Registrar Plugins
fastify.register(cors, { origin: '*' });

// Registrar Rotas
fastify.register(empresaRoutes, { prefix: '/api/empresas' });
fastify.register(coletaRoutes, { prefix: '/api/q' });
fastify.register(pgrRoutes, { prefix: '/api/pgr' });

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
