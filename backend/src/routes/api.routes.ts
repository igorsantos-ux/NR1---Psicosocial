import { Router } from 'express';
import { CompanyController, AssessmentController } from '../controllers/assessment.controller';

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

export default router;
