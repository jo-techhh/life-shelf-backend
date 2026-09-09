import { Router } from 'express';
import { SeriesController } from './series.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { updateEpisodeSchema, markWatchedSchema } from './series.schema.js';

const router = Router();

router.use(authMiddleware);

router.patch('/:id', validate({ body: updateEpisodeSchema }), SeriesController.updateEpisode);
router.delete('/:id', SeriesController.deleteEpisode);
router.post('/:id/watched', validate({ body: markWatchedSchema }), SeriesController.markWatched);
router.delete('/:id/watched', SeriesController.unmarkWatched);

export default router;
