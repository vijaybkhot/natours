const Review = require('../models/reviewsModel');
const Booking = require('../models/bookingModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const AppError = require('../utils/appError');

// Section 217 - Restrict user to post a review only to the tour they have booked
exports.checkBookingBeforReview = async (req, res, next) => {
  // Allow nested routes
  req.body.user = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;
  // 1) Find all the bookings for the logged in user
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Extract the tours from bookings
  const tours = bookings.map((booking) => booking.tour.id);
  // Check if the user had booked the tour he/she wants to reveiw. The user can review only those tours that they have booked.
  if (!tours.includes(req.body.tour)) {
    return next(
      new AppError(
        'You cannot post a review since you have not booked the tour. Please book a tour before posting a review',
        400,
      ),
    );
  }

  // Check if there's an old review for this tour and user
  // If there exists a previous review posted by the user, update the existing user
  const oldReview = await Review.findOneAndUpdate(
    { user: req.user.id, tour: req.body.tour }, // Find the review by user and tour
    { $set: { review: req.body.review, rating: req.body.rating } }, // Update the review fields
    { new: true }, // Return the updated document
  );

  if (oldReview) {
    // If the review was updated, return a response and stop the request chain
    return res.status(200).json({
      status: 'success',
      message:
        'You had already reviewed that tour. Your existing review updated successfully',
      data: {
        review: oldReview,
      },
    });
  }

  // If no old review found, proceed to creating and posting a new review
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
