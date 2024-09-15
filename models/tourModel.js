const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel');
// const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ],
      minlength: [10, 'A tour name must have atleast 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: { type: String },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be greater than 1.0'],
      max: [5, 'Rating must be less than 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: { type: Number, required: [true, 'A tour must have a price'] },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a sumamry'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a description'],
    },
    imageCover: {
      type: String,
      required: [true, 'A Tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // select: false, // Hide this field from the output
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Create a reference to another model. We effectively create a relationship between these two datasets.
      },
    ], // Reference the user ids of the available guides for any particular tour
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// // Single field Index
// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });

// Compound field index
tourSchema.index({ price: 1, ratingesAverage: -1 }); // -1 for descending order and +1 for ascending order

// Index for geospatial queries
tourSchema.index({ startLocation: '2dsphere' }); // Options for startLocation as '2dsphere' if the data describes real points on a earth like sphere or it can be just '2d' if we are using just fictional points on a simple two dimensional plane

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populate - Access reviews on tour documents
tourSchema.virtual('reviews', {
  ref: 'Review', // Name of the model we want to reference
  foreignField: 'tour', // Name of the field in the other model (reviewModel in this case) where the reference to the current model is stored( tour model in this case)
  localField: '_id', // Where that id is stored in this current model. i.e. tour model is referenced as _id in local model
});

// Document middleware: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// Modelling tour guides using embedding:
// This is not recommended. This is just an example of how to embedd documents.
// In embedding, we store the entire user document of the corresponding guides, in the guides array.
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// Query Middleware
tourSchema.pre(/^find/, function (next) {
  // tourSchema.pre('find', function (next) {

  this.find({ secretTour: { $ne: true } });
  next();
});

tourSchema.pre(/^find/, function (next) {
  // Using the .populate method, we populate the entire document of the user in the guides array of the queried tour.
  // The user documents of all the user ids in the guides array is shown only in the output.
  // In the database only the user_ids are stored in the guides array as reference to the users who are available as guides to that particular tour.
  // The 'this' always points to the current query
  this.populate({
    path: 'guides', // Populate this field with the entire user document of the corresponding user_id inside guides array
    select: '-__v -passwordChangedAt', // Remove these fields from the output with a minus sign. Remember, there is no comma in between!
  });
  next();
});

// // Comment this out for section 172. $geoNear aggregation needs to be the first in the aggregation pipeline
// // Aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
