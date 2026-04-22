const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
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
