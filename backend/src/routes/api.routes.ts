import { Router } from 'express';
import { CompanyController, AssessmentController } from '../controllers/assessment.controller';
import { PgrController, EngineerSettingsController } from '../controllers/pgr.controller';

const router = Router();

// Rotas de Empresa e GHEs
router.get('/companies/:slug', CompanyController.getBySlug);
router.get('/companies', CompanyController.list);
router.post('/companies', CompanyController.create);
router.get('/ghes', CompanyController.listGhes);

// Rotas de Avaliação
router.get('/assessments', AssessmentController.list);
router.get('/assessments/:id', AssessmentController.getById);
router.post('/assessments', AssessmentController.create);

// Rotas do PGR Consolidado
router.post('/pgr/consolidate/:companyId', PgrController.consolidate);
router.get('/pgr/reports/:companyId', PgrController.listByCompany);
router.get('/pgr/reports/detail/:id', PgrController.getDetail);
router.patch('/pgr/reports/:id/validate', PgrController.validate);

// Rotas de Configurações do Engenheiro
router.get('/settings/engineer', EngineerSettingsController.get);
router.put('/settings/engineer', EngineerSettingsController.update);

export default router;
