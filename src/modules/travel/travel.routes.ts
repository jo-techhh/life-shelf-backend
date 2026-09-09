import { Router } from 'express';
import { TravelController } from './travel.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validation.middleware.js';
import {
  createTravelPlaceSchema,
  updateTravelPlaceSchema,
  travelPlaceListQuerySchema,
  createTripSchema,
  updateTripSchema,
  tripPlaceInputSchema,
  tripListQuerySchema,
} from './travel.schema.js';

const router = Router();

router.use(authMiddleware);

// Travel Places
router.get('/places', validate({ query: travelPlaceListQuerySchema }), TravelController.listPlaces);
router.post('/places', validate({ body: createTravelPlaceSchema }), TravelController.createPlace);
router.get('/places/:id', TravelController.getPlace);
router.patch('/places/:id', validate({ body: updateTravelPlaceSchema }), TravelController.updatePlace);
router.delete('/places/:id', TravelController.deletePlace);

// Trips
router.get('/trips', validate({ query: tripListQuerySchema }), TravelController.listTrips);
router.post('/trips', validate({ body: createTripSchema }), TravelController.createTrip);
router.get('/trips/:id', TravelController.getTrip);
router.patch('/trips/:id', validate({ body: updateTripSchema }), TravelController.updateTrip);
router.delete('/trips/:id', TravelController.deleteTrip);

// Trip places management
router.post(
  '/trips/:id/places',
  validate({ body: tripPlaceInputSchema }),
  TravelController.addPlaceToTrip,
);
router.delete('/trips/:id/places/:placeId', TravelController.removePlaceFromTrip);

export default router;
