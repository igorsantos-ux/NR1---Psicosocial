import { Request, Response } from 'express';
import { prisma } from '../index';
import { GeminiService } from '../services/gemini.service';

export const CompanyController = {
  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    try {
      const company = await prisma.company.findUnique({
        where: { slug: slug as string },
        include: { ghes: true }
      });
      if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });
      res.json(company);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
  },

  async create(req: Request, res: Response) {
    const { 
      name, cnpj, cnae, cnaeDescricao, riskLevel, ghes,
      endereco, municipio, estado, cep, telefone,
      totalFuncionarios, horarioTrabalho
    } = req.body;
    
    // Gerar slug simples
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const company = await prisma.company.create({
        data: {
          name,
          slug,
          cnpj,
          cnae,
          cnaeDescricao,
          riskLevel: parseInt(riskLevel) || 1,
          endereco,
          municipio,
          estado,
          cep,
          telefone,
          totalFuncionarios: totalFuncionarios ? parseInt(totalFuncionarios) : null,
          horarioTrabalho,
          ghes: {
            create: ghes.map((gheName: string) => ({
              name: gheName
            }))
          }
        },
        include: { ghes: true }
      });
      res.json(company);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'P2002') {
        return res.status(400).json({ error: 'CNPJ ou Nome de Empresa (Slug) já existe.' });
      }
      res.status(500).json({ error: 'Erro ao cadastrar empresa' });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const companies = await prisma.company.findMany({
        include: { ghes: true, _count: { select: { pgrReports: true } } },
        orderBy: { createdAt: 'desc' }
      });
      res.json(companies);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar empresas' });
    }
  },

  async listGhes(req: Request, res: Response) {
    try {
      const ghes = await prisma.gHE.findMany({
        include: { company: true }
      });
      res.json(ghes);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar GHEs' });
    }
  }
};

export const AssessmentController = {
  async create(req: Request, res: Response) {
    const { gheId, employeeName, employeeRole, answers } = req.body;
    try {
      // 1. Criar a avaliação no banco apenas como PENDING
      const assessment = await prisma.assessment.create({
        data: {
          gheId,
          employeeName: employeeName || 'Anônimo',
          employeeRole: employeeRole || 'Não informado',
          answers,
          status: 'PENDING',
          aiProcessed: false
        },
        include: { 
          ghe: { 
            include: { company: true } 
          } 
        }
      });

      res.json(assessment);
    } catch (error: any) {
      console.error("ERRO AO SALVAR AVALIAÇÃO:", error);
      res.status(500).json({ 
        error: 'Erro ao salvar questionário', 
        message: error.message,
      });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const assessments = await prisma.assessment.findMany({
        include: { 
          ghe: { 
            include: { company: true } 
          },
          actionPlan: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar avaliações' });
    }
  },

  async getById(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const assessment = await prisma.assessment.findUnique({
        where: { id: id as string },
        include: { 
          ghe: { 
            include: { company: true } 
          },
          actionPlan: true
        }
      });
      if (!assessment) return res.status(404).json({ error: 'Avaliação não encontrada' });
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar avaliação' });
    }
  }
};
