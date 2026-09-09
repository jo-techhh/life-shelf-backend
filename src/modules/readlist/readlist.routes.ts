import { Router } from 'express';
import { ReadlistController } from './readlist.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createReadingItemSchema,
  updateReadingItemSchema,
  readingListQuerySchema,
} from './readlist.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: readingListQuerySchema }), ReadlistController.listItems);
router.post('/', validate({ body: createReadingItemSchema }), ReadlistController.createItem);
router.get('/:id', ReadlistController.getItem);
router.patch('/:id', validate({ body: updateReadingItemSchema }), ReadlistController.updateItem);
router.delete('/:id', ReadlistController.deleteItem);

export default router;
