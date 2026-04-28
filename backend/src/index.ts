import 'dotenv/config';

const dbUrl = process.env.DATABASE_URL;
console.log('=== DEBUG DATABASE_URL ===');
console.log('Definida?', !!dbUrl);
console.log('Tamanho:', dbUrl?.length || 0);
console.log('Protocolo:', dbUrl?.split('://')[0] || 'NENHUM');
console.log('Primeiros 30 chars:', dbUrl?.substring(0, 30) || 'VAZIA');
console.log('Todas as env vars começando com DATABASE:',
  Object.keys(process.env).filter(k => k.startsWith('DATABASE'))
);
console.log('==========================');

if (!dbUrl) {
  console.error('FATAL: DATABASE_URL não está definida no ambiente.');
  console.error('Verifique as variáveis de ambiente no Easypanel.');
  process.exit(1);
}

if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
  console.error('FATAL: DATABASE_URL tem protocolo inválido.');
  console.error('Valor atual começa com:', dbUrl.substring(0, 20));
  console.error('Esperado: postgresql:// ou postgres://');
  process.exit(1);
}

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { empresaRoutes } from './routes/empresa.routes.js';
import { coletaRoutes } from './routes/coleta.routes.js';
import { pgrRoutes } from './routes/pgr.routes.js';
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
