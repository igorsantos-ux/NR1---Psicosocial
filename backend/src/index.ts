import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import apiRoutes from './routes/api.routes';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas da API
app.use('/api', apiRoutes);

// Rota de Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Engine PGR NR 01 rodando' });
});

app.listen(PORT, () => {
  console.log(`Backend PGR rodando na porta ${PORT}`);
});

export { prisma };
