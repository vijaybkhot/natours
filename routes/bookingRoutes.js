const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// Section 211 -Integrating Stripe into the Backend
// ---------------------------
const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
// ---------------------------

// Section 216 - Finishing the booking api

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.setTourUserIds, bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
// ---------------------------
module.exports = router;
