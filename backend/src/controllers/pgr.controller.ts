import { Request, Response } from 'express';
import { prisma } from '../index';
import { GeminiService } from '../services/gemini.service';

export const PgrController = {
  /**
   * POST /api/pgr/consolidate/:companyId
   * Consolida todas as análises por GHE e gera o PGR completo via IA.
   */
  async consolidate(req: Request, res: Response) {
    const companyId = req.params.companyId as string;
    const { vigenciaInicio, vigenciaFim, periodoColeta } = req.body;

    try {
      // 1. Buscar empresa com GHEs
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        include: { ghes: true }
      });

      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada' });
      }

      // 2. Buscar todas as avaliações ANALYZED da empresa
      const assessments = await prisma.assessment.findMany({
        where: {
          ghe: { companyId: companyId },
          status: { in: ['ANALYZED', 'VALIDATED'] },
          aiProcessed: true,
        },
        include: { ghe: true }
      });

      if (assessments.length === 0) {
        return res.status(400).json({ 
          error: 'Nenhuma avaliação processada encontrada para esta empresa. Aguarde o envio e análise dos questionários.' 
        });
      }

      // 3. Buscar configurações do engenheiro
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

      // 4. Consolidar análises por GHE
      const gheMap: Record<string, any[]> = {};
      for (const assessment of assessments) {
        const gheName = assessment.ghe.name;
        if (!gheMap[gheName]) {
          gheMap[gheName] = [];
        }
        gheMap[gheName].push({
          colaborador_id: assessment.id.substring(0, 8),
          cargo: assessment.employeeRole || 'Não informado',
          riscos: assessment.riskMatrix,
        });
      }

      // 5. Formatar GHEs para o prompt
      const ghesLista = company.ghes.map((g: any, i: number) => ({
        codigo: `GHE ${String(i + 1).padStart(2, '0')}`,
        nome: g.name,
        total_colaboradores: gheMap[g.name]?.length || 0,
      }));

      // 6. Formatar análises consolidadas para o prompt
      const analisesConsolidadas = Object.entries(gheMap).map(([gheName, analyses]) => ({
        ghe: gheName,
        total_respondentes: analyses.length,
        analises: analyses,
      }));

      const dataGeracao = new Date().toLocaleDateString('pt-BR');
      const vInicio = vigenciaInicio || dataGeracao;
      const vFim = vigenciaFim || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

      // 7. Chamar Prompt 2 da IA
      const { result, raw } = await GeminiService.generateConsolidatedPgr({
        empresaNome: company.name,
        cnpj: company.cnpj,
        cnae: company.cnae || '',
        cnaeDescricao: company.cnaeDescricao || '',
        grauRiscoNr4: String(company.riskLevel || 1),
        endereco: company.endereco || '',
        municipio: company.municipio || '',
        estado: company.estado || '',
        cep: company.cep || '',
        telefone: company.telefone || '',
        totalFuncionarios: company.totalFuncionarios || 0,
        horarioTrabalho: company.horarioTrabalho || '',
        engenheiroNome: engineerSettings.engineerName,
        creaEngenheiro: engineerSettings.engineerCrea,
        contatoEngenheiro: engineerSettings.engineerContact,
        empresaElaboradora: engineerSettings.companyElaboradora,
        dataGeracao,
        vigenciaInicio: vInicio,
        vigenciaFim: vFim,
        periodoColeta: periodoColeta || dataGeracao,
        totalRespondentes: assessments.length,
        ghesListaJson: ghesLista,
        analisesConsolidadasJson: analisesConsolidadas,
      });

      // 8. Persistir relatório
      const report = await prisma.pgrReport.create({
        data: {
          companyId: company.id,
          reportData: result,
          status: 'DRAFT',
          vigenciaInicio: vInicio,
          vigenciaFim: vFim,
          periodoColeta: periodoColeta || dataGeracao,
          totalRespondentes: assessments.length,
        },
        include: { company: true }
      });

      res.json(report);
    } catch (error: any) {
      console.error('ERRO NA CONSOLIDAÇÃO PGR:', error);
      res.status(500).json({
        error: 'Erro ao gerar PGR consolidado',
        details: error.message,
      });
    }
  },

  /**
   * GET /api/pgr/reports/:companyId
   * Lista relatórios PGR de uma empresa.
   */
  async listByCompany(req: Request, res: Response) {
    const companyId = req.params.companyId as string;
    try {
      const reports = await prisma.pgrReport.findMany({
        where: { companyId: companyId },
        include: { company: true },
        orderBy: { createdAt: 'desc' }
      });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao listar relatórios PGR' });
    }
  },

  /**
   * GET /api/pgr/reports/detail/:id
   * Detalhe de um relatório PGR.
   */
  async getDetail(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
      const report = await prisma.pgrReport.findUnique({
        where: { id: id },
        include: { company: true }
      });
      if (!report) return res.status(404).json({ error: 'Relatório não encontrado' });
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar relatório PGR' });
    }
  },

  /**
   * PATCH /api/pgr/reports/:id/validate
   * Valida um relatório PGR.
   */
  async validate(req: Request, res: Response) {
    const id = req.params.id as string;
    try {
      const report = await prisma.pgrReport.update({
        where: { id: id },
        data: { status: 'VALIDATED' }
      });
      res.json(report);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao validar relatório PGR' });
    }
  },
};

/**
 * Controller para configurações do engenheiro.
 */
export const EngineerSettingsController = {
  async get(_req: Request, res: Response) {
    try {
      let settings = await prisma.engineerSettings.findFirst();
      if (!settings) {
        settings = await prisma.engineerSettings.create({
          data: {
            engineerName: 'Denis Antônio',
            engineerCrea: '',
            engineerContact: '',
            companyElaboradora: '',
          }
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar configurações' });
    }
  },

  async update(req: Request, res: Response) {
    const { engineerName, engineerCrea, engineerContact, companyElaboradora } = req.body;
    try {
      let settings = await prisma.engineerSettings.findFirst();
      if (!settings) {
        settings = await prisma.engineerSettings.create({
          data: { engineerName, engineerCrea, engineerContact, companyElaboradora }
        });
      } else {
        settings = await prisma.engineerSettings.update({
          where: { id: settings.id },
          data: { engineerName, engineerCrea, engineerContact, companyElaboradora }
        });
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao salvar configurações' });
    }
  }
};
