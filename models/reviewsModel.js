const mongoose = require('mongoose');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: { type: String, required: [true, 'Review cannot be empty'] },
    rating: {
      type: Number,
      min: [1, 'Rating must be greater than 1.0'],
      max: [5, 'Rating must be less than 5.0'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    // A reference to the tour which this review belongs to. This is parent referencing.
    // We use this type of referencing because we want to avoid overcrowding of review references in the tour model.
    // A tour can have many reviews and we dont want to reference each review separately in the tour.
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour!'],
    },
    // Same parent referencing here.
    // A user can write many reviews but a review can belong to only one user. Here, user is the parent and review is the child.
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to an user!'],
    },
  },
  {
    // Turn on the virtual properties. I.e. when the field is not stored in the database but
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Index to prevent duplicate reviews
// We create a compound index on tour and user and make sure that each combination of tour and user is unique
// Hence, any one combination of tour and user is allowed to add only one review
// This prevents duplicate reviews, i.e. two reviews from same user for same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query Middleware

// Populate middleware:
// Keep in mind that the populate middleware will effect the performance of the query, because it adds additional queries.
reviewSchema.pre(/^find/, function (next) {
  //   // Using the .populate method, we populate the entire document of the user and tours in the output of the queried review.
  //   // The 'this' always points to the current query
  //   this.populate({
  //     path: 'user', // Populate this field with the entire user document of the corresponding user_id inside guides array
  //     select: 'name photo', // Display only name and photo of the user. We do not want to leak any other private data about the user. Remember, there is no comma in between!
  //   }).populate({
  //     path: 'tour',
  //     select: 'name', // Display only name. Remember, there is no comma in between!
  //   });

  // Using the .populate method, we populate the entire document of the user and tours in the output of the queried review.
  // We are turning off the populate for tour. This is because populating reviews inside a tour and then again populating a tour inside the reiew is inefficient.
  this.populate({
    path: 'user', // Populate this field with the entire user document of the corresponding user_id inside guides array
    select: 'name photo', // Display only name and photo of the user. We do not want to leak any other private data about the user. Remember, there is no comma in between!
  });

  next();
});

// Static method to calculate quantity and average ratings
//  We use the static method because we want to call the aggregate function on the Review model
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // aggregate the number of ratings and the average ratings for the given tour
  // Use the aggregate method
  const stats = await this.aggregate([
    // In a static method like this the'this' keyword here points to the model. We need to call aggregate on the model
    {
      $match: { tour: tourId }, // Select all the reviews that match the tour: tourId
    },
    {
      $group: {
        // Calculate the statistics for all of the matched reviews
        _id: '$tour', // Group with reviews wrt the tour property
        nRating: { $sum: 1 }, // Add 1 to each tour that was matched in the prevoious step
        avgRating: { $avg: '$rating' }, // Calculate the avgRating based on the rating field for each of the review in the current tour
      },
    },
  ]);

  console.log('Hello from here');

  console.log(stats); // Debugging line to check the output of aggregation

  // After calculating the nuber or reviews and the average ratings, update the current tour pro
  if (stats.length > 0) {
    // execute only if we have any review in the current tour
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    // If no reviews found in the current tour, set the values to default values
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Lecture 168 + 169
//  post-hook middleware, which runs after a document is updated or deleted using a query that matches the regular expression ^findOneAnd (e.g., findOneAndUpdate, findOneAndDelete).
// ***Asynchronous Function***
// If the call back function has only one argument, Mongoose assumes it to by synchronous.
// But, if we provide two arguments, as in the case below, Mongoose treats it as asynchronous
reviewSchema.post(/^findOneAnd/, async (doc) => {
  // The hook is triggered after a findOneAndUpdate or findOneAndDelete query is executed.
  // We get the Review model from doc.constructor. doc is the current review document.
  console.log('Hello from here');

  if (doc) {
    // Ensure doc exists before calling calcAverageRatings
    await doc.constructor.calcAverageRatings(doc.tour); // In post-hooks, the doc parameter represents the document that was returned by the query (e.g., the document that was updated or deleted).
  }
});

// Post middleware for saving a new review
reviewSchema.post('save', function () {
  // 'this' points to the current review document
  this.constructor.calcAverageRatings(this.tour);
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
