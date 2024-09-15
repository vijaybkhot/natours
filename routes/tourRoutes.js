const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRoutes = require('./reviewRoutes');
const bookingRoutes = require('./bookingRoutes');

const router = express.Router();

// router.param('id', tourController.checkID);

// Example nested routes
// POST /tour/23141jubfk/reviews
// POST /reviews

// // Nested route for review routes inside tour route.
// // Nested routes. We are nesting the reviews routes to the tour route. By doing so, we will already have the tour id in the params.

// Ideal use of nested routes:
// In case of /:tourId.reviews use the reviewRoutes
// router is just a middleware. It is actually mountig an URL
router.use('/:tourId/reviews', reviewRoutes);

// Nested route to access bookings for a particular tour
router.use('/:tourId/bookings', bookingRoutes);

// Section 100 - Aliasing
//---------------------------
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
//---------------------------

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan,
  );

// Section 171: Geospatial Queries: Getting tours within a radius from a point
// Route to get tours within a radius from a certain center
// /tours-distance?distance=233&center=-40,45&unit=mi   // Not clear
// /tours-distance/233/center/-40,45/unit/mi    // Clear and ideal
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

// Section 172: Geospatial Aggregation: Calculating Distance of all tours from a point
// Route to calculate distances of all tours from a center
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour,
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages, // Section - 204 - Uploading Multiple Images
    tourController.resizeTourImages, // Section - 204 - Uploading Multiple Images
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),

    tourController.deleteTour,
  );

module.exports = router;
