import { Router } from 'express';
import { StudylistController } from './studylist.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createStudyItemSchema,
  updateStudyItemSchema,
  studyListQuerySchema,
  createStudyResourceSchema,
  updateStudyResourceSchema,
} from './studylist.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: studyListQuerySchema }), StudylistController.listItems);
router.post('/', validate({ body: createStudyItemSchema }), StudylistController.createItem);
router.get('/:id', StudylistController.getItem);
router.patch('/:id', validate({ body: updateStudyItemSchema }), StudylistController.updateItem);
router.delete('/:id', StudylistController.deleteItem);

// Resource sub-routes
router.post(
  '/:id/resources',
  validate({ body: createStudyResourceSchema }),
  StudylistController.addResource,
);
router.patch(
  '/resources/:id',
  validate({ body: updateStudyResourceSchema }),
  StudylistController.updateResource,
);
router.delete('/resources/:id', StudylistController.deleteResource);

export default router;
