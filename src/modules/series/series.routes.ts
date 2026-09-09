import { Router } from 'express';
import { SeriesController } from './series.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createSeriesSchema,
  updateSeriesSchema,
  seriesListQuerySchema,
  createSeasonSchema,
} from './series.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: seriesListQuerySchema }), SeriesController.listSeries);
router.post('/', validate({ body: createSeriesSchema }), SeriesController.createSeries);
router.get('/:id', SeriesController.getSeries);
router.patch('/:id', validate({ body: updateSeriesSchema }), SeriesController.updateSeries);
router.delete('/:id', SeriesController.deleteSeries);

// Sub-route: create season under series
router.post(
  '/:id/seasons',
  validate({ body: createSeasonSchema }),
  SeriesController.createSeason,
);

export default router;
