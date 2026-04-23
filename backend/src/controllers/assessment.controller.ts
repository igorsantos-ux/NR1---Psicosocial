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
      // 1. Criar a avaliação no banco
      const assessment = await prisma.assessment.create({
        data: {
          gheId,
          employeeName: employeeName || 'Anônimo',
          employeeRole: employeeRole || 'Não informado',
          answers,
          status: 'PENDING'
        },
        include: { 
          ghe: { 
            include: { company: true } 
          } 
        }
      });

      // 2. Buscar configurações do engenheiro
      let engineerSettings = await prisma.engineerSettings.findFirst();
      if (!engineerSettings) {
        engineerSettings = await prisma.engineerSettings.create({
          data: {
            engineerName: 'Denis Antônio',
            engineerCrea: '',
            engineerContact: '',
            companyElaboradora: '',
          }
        });
      }

      // 3. Chamar Prompt 1 (Análise Individual) via IA
      const { result, raw } = await GeminiService.analyzeIndividual({
        colaboradorId: assessment.id.substring(0, 8),
        gheName: assessment.ghe.name,
        cargo: employeeRole || 'Não informado',
        respostasJson: answers,
        empresaNome: assessment.ghe.company.name,
        cnpj: assessment.ghe.company.cnpj,
        engenheiroNome: engineerSettings.engineerName,
        creaEngenheiro: engineerSettings.engineerCrea,
        dataReferencia: new Date().toISOString().split('T')[0] || '',
      });

      // 4. Atualizar avaliação com resultado da IA
      const updatedAssessment = await prisma.assessment.update({
        where: { id: assessment.id },
        data: {
          riskMatrix: result,
          aiRawResult: raw,
          status: 'ANALYZED',
          aiProcessed: true,
          actionPlan: {
            create: {
              items: result.riscos_identificados?.map((r: any) => ({
                measure: r.orientacao,
                factor: r.fator,
                riskLevel: r.nivel_risco,
                score: r.score,
                schedule: r.nivel_risco === 'INTOLERÁVEL' ? 'Imediato' : 
                          r.nivel_risco === 'SUBSTANCIAL' ? '60 dias' : 
                          r.nivel_risco === 'MODERADO' ? '90 dias' : 'Monitoramento',
                responsible: 'SST / RH',
              })) || [],
              status: 'DRAFT'
            }
          }
        },
        include: { actionPlan: true, ghe: { include: { company: true } } }
      });

      res.json(updatedAssessment);
    } catch (error: any) {
      console.error("ERRO CRÍTICO NO BACKEND:", error);
      res.status(500).json({ 
        error: 'Erro ao processar questionário', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
