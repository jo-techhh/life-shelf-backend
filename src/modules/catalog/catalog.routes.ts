import { Router } from 'express';
import { CatalogController } from './catalog.controller.js';
import { authMiddleware, requireAdmin } from '../../middleware/auth.middleware.js';
import { uploadMiddleware } from '../../middleware/upload.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  CreateCatalogMovieSchema,
  UpdateCatalogMovieSchema,
  AddMovieToShelfSchema,
  CreateCatalogBookSchema,
  UpdateCatalogBookSchema,
  AddBookToShelfSchema,
  CatalogQuerySchema,
} from './catalog.schema.js';

const router = Router();

// All catalog endpoints require authentication
router.use(authMiddleware);

// ==========================================
// Movies Catalog
// ==========================================
router.get('/movies', validate({ query: CatalogQuerySchema }), CatalogController.listMovies);
router.get('/movies/:id', CatalogController.getMovieById);
router.post(
  '/movies',
  requireAdmin,
  validate({ body: CreateCatalogMovieSchema }),
  CatalogController.createMovie,
);
router.put(
  '/movies/:id',
  requireAdmin,
  validate({ body: UpdateCatalogMovieSchema }),
  CatalogController.updateMovie,
);
router.delete('/movies/:id', requireAdmin, CatalogController.deleteMovie);
router.post(
  '/movies/:id/add-to-shelf',
  validate({ body: AddMovieToShelfSchema }),
  CatalogController.addMovieToShelf,
);

// ==========================================
// Books Catalog
// ==========================================
router.get('/books', validate({ query: CatalogQuerySchema }), CatalogController.listBooks);
router.get('/books/:id', CatalogController.getBookById);
router.post(
  '/books',
  requireAdmin,
  validate({ body: CreateCatalogBookSchema }),
  CatalogController.createBook,
);
router.put(
  '/books/:id',
  requireAdmin,
  validate({ body: UpdateCatalogBookSchema }),
  CatalogController.updateBook,
);
router.delete('/books/:id', requireAdmin, CatalogController.deleteBook);
router.post(
  '/books/:id/add-to-shelf',
  validate({ body: AddBookToShelfSchema }),
  CatalogController.addBookToShelf,
);

// ==========================================
// Catalog Cover Media Upload (Admin only)
// ==========================================
router.post(
  '/upload-cover',
  requireAdmin,
  uploadMiddleware.single('file'),
  CatalogController.uploadCover,
);

export default router;
