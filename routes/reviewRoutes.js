const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });
// mergeParams option helps us merge params from other route.
// By default each router only has access to the parameters of their specific routes.
// For example, the reviewRouter does not have access to tourId parameter, which falls under the tourRouter.
// But, since tourRouter will be accessing the reviewRouter for nested routes, we also need to mergeParams from the tourRouter.

router.use(authController.protect); // Only logged in users allowed

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'),
  reviewController.setTourUserIds, // A middleware to set tour and user ids
  reviewController.createReview,
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview,
  );
module.exports = router;
