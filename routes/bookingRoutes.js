const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');

// Section 211 -Integrating Stripe into the Backend
// ---------------------------
const router = express.Router({ mergeParams: true });
// mergeParams option helps us merge params from other route.
// By default each router only has access to the parameters of their specific routes.
// For example, the bookingRouter does not have access to tourId parameter, which falls under the tourRouter.
// But, since tourRouter will be accessing the bookingRouter for nested routes, we also need to mergeParams from the tourRouter.

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);
// ---------------------------

// Section 216 - Finishing the booking api

router
  .route('/')
  .get(
    authController.restrictTo('admin', 'lead-guide'), // Either an admin or a lead-guide should be able to access all bookings
    bookingController.setTourUserIds,
    bookingController.getAllBookings,
  )
  .post(
    authController.restrictTo('admin', 'user'), // Either an admin or a user should be able to create a booking
    bookingController.setTourUserIds,
    bookingController.createBooking, // If the user uses nested routes, she would not have to input anything in the body to create a new booking. If not using nested routes, user would have to input "tour":"tourId" in the req.body
  );

router.use(authController.restrictTo('admin', 'lead-guide')); // Only an admin or a lead-guide should be able to get one booking, edit a booking or delete a booking
router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);
// ---------------------------
module.exports = router;
