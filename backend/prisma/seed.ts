import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando limpeza do banco de dados...');
    // Deletar em ordem para respeitar foreign keys
    await prisma.pgrReport.deleteMany({});
    await prisma.actionPlanItem.deleteMany({});
    await prisma.actionPlan.deleteMany({});
    await prisma.assessment.deleteMany({});
    await prisma.gHE.deleteMany({});
    await prisma.company.deleteMany({});
    
    console.log('Banco de dados limpo com sucesso!');

    // Criar Usuário Engenheiro (Denis Antônio)
    await prisma.user.upsert({
      where: { email: 'denis@pgr.com' },
      update: {},
      create: {
        email: 'denis@pgr.com',
        password: 'admin',
        role: 'ENGINEER'
      }
    });

    console.log('Seed realizado com sucesso!');
    console.log('Usuário admin criado: denis@pgr.com');
  } catch (error) {
    console.error('Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
