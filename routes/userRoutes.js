import express from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';
import bookingRoutes from '../routes/bookingRoutes.js'; // Section 217 - Implementing nested routes for users/bookings

const router = express.Router();

// Nested route to access bookings for a particular user
router.use('/:userId/bookings', bookingRoutes);

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Middleware to protect all the routes after this line
// No need to add the protect middleware to any other routes after this line in this userRoutes
router.use(authController.protect);

router.patch('/updateMyPassword/', authController.updatePassword);

router.get(
  '/me',
  userController.getMe, // We have inserted the middleware which gets the currently logged in userId and assigns to parameter userId.
  userController.getUser,
);

// Section 199 - Image uploads - add upload middleware
router.patch(
  '/updateMe/',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto, // Section 202 - Resize user photo
  userController.updateMe,
);

router.delete('/deleteMe/', userController.deleteMe);

// Middleware to restrict the following methods to admins only
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
