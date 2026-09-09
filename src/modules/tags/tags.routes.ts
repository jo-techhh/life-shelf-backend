import { Router } from 'express';
import { TagsController } from './tags.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { createTagSchema, updateTagSchema } from './tags.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', TagsController.listTags);
router.post('/', validate({ body: createTagSchema }), TagsController.createTag);
router.patch('/:id', validate({ body: updateTagSchema }), TagsController.updateTag);
router.delete('/:id', TagsController.deleteTag);

export default router;
