import express from 'express';
import * as viewsController from '../controllers/viewsController.js';
import * as authController from '../controllers/authController.js';
import * as bookingController from '../controllers/bookingController.js';

const router = express.Router();

// Section 190 - Checking if the user is logged in - A middleware isLoggedIn
// router.use(authController.isLoggedIn);

router.get(
  '/',
  // bookingController.createBookingCheckout, // Section 214 - Temporary Solution
  authController.isLoggedIn,
  viewsController.getOverview,
); // The initial home page

router.get('/tours/:slug', authController.isLoggedIn, viewsController.getTour);

router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

router.get('/signup', authController.isLoggedIn, viewsController.getSignupForm);

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

export default router;
