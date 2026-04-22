import { Router } from 'express';
import { CompanyController, AssessmentController } from '../controllers/assessment.controller';

const router = Router();

// Rotas de Empresa
router.get('/companies/:slug', CompanyController.getBySlug);
router.get('/companies', CompanyController.list);
router.post('/companies', CompanyController.create);

// Rotas de Avaliação
router.post('/assessments', AssessmentController.create);

export default router;
