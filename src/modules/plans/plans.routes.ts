import { Router } from 'express';
import { PlansController } from './plans.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createPlanSchema,
  updatePlanSchema,
  planListQuerySchema,
} from './plans.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: planListQuerySchema }), PlansController.listPlans);
router.post('/', validate({ body: createPlanSchema }), PlansController.createPlan);
router.get('/:id', PlansController.getPlan);
router.patch('/:id', validate({ body: updatePlanSchema }), PlansController.updatePlan);
router.delete('/:id', PlansController.deletePlan);

export default router;
