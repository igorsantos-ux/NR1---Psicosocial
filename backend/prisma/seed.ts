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

    // Criar Empresa de Exemplo
    const company = await prisma.company.upsert({
      where: { slug: 'maravilha-linguicas' },
      update: {},
      create: {
        name: 'Maravilha Linguiças',
        slug: 'maravilha-linguicas',
        cnpj: '12.345.678/0001-99',
        cnae: '10.13-9-01',
        riskLevel: 3,
        ghes: {
          create: [
            { name: 'Produção - Área Fria', description: 'Funcionários que atuam na manipulação e desossa.' },
            { name: 'Administrativo', description: 'Funcionários de escritório e gerência.' },
            { name: 'Logística / Chão de Fábrica', description: 'Operadores de empilhadeira e carga.' }
          ]
        }
      }
    });

    console.log('Seed realizado com sucesso!');
    console.log('Empresa:', company.name, 'Slug:', company.slug);
  } catch (error) {
    console.error('Erro no seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
