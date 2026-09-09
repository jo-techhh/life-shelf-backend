import { Router } from 'express';
import { SeriesController } from './series.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import { updateSeasonSchema, createEpisodeSchema } from './series.schema.js';

const router = Router();

router.use(authMiddleware);

router.patch('/:id', validate({ body: updateSeasonSchema }), SeriesController.updateSeason);
router.delete('/:id', SeriesController.deleteSeason);
router.post('/:id/episodes', validate({ body: createEpisodeSchema }), SeriesController.createEpisode);

export default router;
