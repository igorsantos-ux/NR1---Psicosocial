import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { processarGeracaoPGR } from '../workers/pgrGeneratorWorker';

const prisma = new PrismaClient();

export async function expirarColetasVencidas() {
    console.log('[Cron] Verificando coletas vencidas...');

    const agora = new Date();

    const empresasVencidas = await prisma.empresa.findMany({
        where: {
            statusColeta: 'ATIVA',
            dataExpiracaoLink: {
                lt: agora
            }
        },
        include: {
            _count: {
                select: { respostas: true }
            }
        }
    });

    for (const empresa of empresasVencidas) {
        console.log(`[Cron] Expirando coleta da empresa: ${empresa.razaoSocial} (${empresa.id})`);

        await prisma.empresa.update({
            where: { id: empresa.id },
            data: { statusColeta: 'EXPIRADA' }
        });

        if (empresa._count.respostas > 0) {
            console.log(`[Cron] Disparando geração de PGR para empresa expirada.`);

            // Criar registro PGR inicial
            const pgr = await prisma.pgr.create({
                data: {
                    empresaId: empresa.id,
                    status: 'GERANDO',
                    jsonGerado: {}
                }
            });

            // Disparar worker
            processarGeracaoPGR(pgr.id).catch(err => {
                console.error(`[Cron] Erro ao disparar geração automática para ${empresa.id}:`, err);
            });
        }
    }
}

// Configurar agendamento (default: a cada hora)
const scheduleExpr = process.env.COLETA_EXPIRACAO_CRON || '0 * * * *';

export function setupCrons() {
    cron.schedule(scheduleExpr, async () => {
        await expirarColetasVencidas();
    });
    console.log(`[Cron] Agendamento de expiração configurado: ${scheduleExpr}`);
}
