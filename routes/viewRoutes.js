const express = require('express');
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Section 190 - Checking if the user is logged in - A middleware isLoggedIn
// router.use(authController.isLoggedIn);

router.get(
  '/',
  bookingController.createBookingCheckout, // Section 214 - Temporary Solution
  authController.isLoggedIn,
  viewsController.getOverview,
); // The initial home page

router.get('/tours/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

// Section 194 - Building the account page
router.get('/me', authController.protect, viewsController.getAccount);

// Section 215 - Rendering a user's Booked tours
router.get('/my-tours', authController.protect, viewsController.getMyTours);

// Section 195 - Updating user data
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData,
);

module.exports = router;
