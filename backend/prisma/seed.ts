import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando limpeza do banco de dados...');
    
    // Deletar em ordem para respeitar foreign keys
    await prisma.pgr.deleteMany({});
    await prisma.respostaQuestionario.deleteMany({});
    await prisma.cargo.deleteMany({});
    await prisma.gHE.deleteMany({});
    await prisma.empresa.deleteMany({});
    await prisma.engenheiro.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Banco de dados limpo com sucesso!');

    // Criar Engenheiro Denis (ID fixo usado no frontend)
    const denisId = 'fb098935-d227-4638-89c0-63ceba51532f';
    await prisma.engenheiro.upsert({
      where: { id: denisId },
      update: {
        nome: 'Denis Antônio',
        crea: '123456-SP',
        contato: '(11) 99999-9999'
      },
      create: {
        id: denisId,
        nome: 'Denis Antônio',
        email: 'denis@pgr.com',
        crea: '123456-SP',
        contato: '(11) 99999-9999'
      }
    });

    // Criar Usuário para login
    await prisma.user.create({
      data: {
        email: 'denis@pgr.com',
        password: 'admin', // Em produção usar hash!
        role: 'ENGINEER'
      }
    });

    console.log('Seed realizado com sucesso!');
    console.log('Engenheiro Denis criado com ID:', denisId);
    console.log('Usuário admin criado: denis@pgr.com');
  } catch (error) {
    console.error('Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
