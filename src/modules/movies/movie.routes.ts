import { Router } from 'express';
import { MovieController } from './movie.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createMovieSchema,
  updateMovieSchema,
  movieListQuerySchema,
} from './movie.schema.js';

const router = Router();

router.use(authMiddleware);

router.get('/', validate({ query: movieListQuerySchema }), MovieController.listMovies);
router.post('/', validate({ body: createMovieSchema }), MovieController.createMovie);
router.get('/:id', MovieController.getMovie);
router.patch('/:id', validate({ body: updateMovieSchema }), MovieController.updateMovie);
router.delete('/:id', MovieController.deleteMovie);

export default router;
