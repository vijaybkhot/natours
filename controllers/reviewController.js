const Review = require('../models/reviewsModel');
// const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// A middleware to set Tour and User ids from the parameters if not provided in the req.body
// This will run before the createReview function, setting the tour and user ids.
exports.setTourUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId; // We get the tourId from the params field because of the nested routes
  if (!req.body.user) req.body.user = req.user.id; // We get user from the protect middleware
  next();
};

// Section 217 - Restrict user to post a review only to the tour they have booked
exports.checkBookingBeforReview = (req, res, next) => {
  // 1) Find all the bookings for the logged in user
  // 2) Extract the tours from bookings
};

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
