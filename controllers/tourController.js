const multer = require('multer'); // Section 204  Upload multiple images/files
const sharp = require('sharp'); // Section 204  Upload multiple images/files
const Tour = require('../models/tourModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Section 204 + 205 Upload and resize/process multiple images/files
// ---------------------
const multerStorage = multer.memoryStorage(); // Stored file available at req.file

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  // req.files
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 },
]);

// upload.single('image'); // When uploading just a single image - req.file
// upload.array('images', 5);  // When uploading multilple images for the same field - req.files

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  // Section 205 - Resizing Images
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover Image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333) // 2000, 1333 => width and height.
    .toFormat('jpeg')
    .jpeg({
      quality: 90, // quality: 90 => 90 % compressed
    })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];

  await Promise.all(
    // The map function returns an array of all the promises which are awaited and resolved by the above Promise.all
    req.files.images.map(async (file, index) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

      // await sharp(req.files.images[index].buffer);
      await sharp(file.buffer)
        .resize(2000, 1333) // 2000, 1333 => width and height.
        .toFormat('jpeg')
        .jpeg({
          quality: 90, // quality: 90 => 90 % compressed
        })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    }),
  );

  next();
});

// ---------------------

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = 'ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,duration,summary,difficulty';

  next();
};

exports.getAllTours = factory.getAll(Tour);
exports.getTour = factory.getOne(Tour, { path: 'reviews' });
exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingsAverage' },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1; // 2021
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: plan,
  });
});

// Section 171: Geospatial queries - Async handler for getting tours within a certain distance from a center point
exports.getToursWithin = catchAsync(async (req, res, next) => {
  // Extract distance, latlng (latitude and longitude), and unit (mi or km) from the URL parameters
  const { distance, latlng, unit } = req.params;

  // Split the latlng parameter into latitude and longitude
  const [lat, lng] = latlng.split(',');

  // Convert the distance to radians based on the unit of measurement
  // Radius of Earth in miles is approximately 3963.2
  // Radius of Earth in kilometers is approximately 6378.1
  // Convert distance to radians by dividing the distance by the Earth's radius in the given unit
  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  // Check if latitude and longitude are provided
  if (!lat || !lng) {
    // If either latitude or longitude is missing, return an error
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng',
        400,
      ),
    );
  }

  // Find tours within the specified radius from the center point
  // $geoWithin is used to query for documents where a location field is within a specified geometric area
  // $centerSphere specifies a spherical area around a central point with a given radius in radians
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
    // Note: In MongoDB, the order for coordinates is longitude first, then latitude.
    // Ensure the [lng, lat] format is correct for MongoDB queries.
  });

  // Send the response with the list of tours found
  res.status(200).json({
    status: 'success', // Status of the response
    results: tours.length, // Number of tours found
    data: {
      data: tours, // The list of tours
    },
  });
});

// Section 172: Geospatial aggregation - Calculating Distances from a point
// Async handler for calculating distances from a point to various tours

exports.getDistances = catchAsync(async (req, res, next) => {
  // Extract distance, latlng (latitude and longitude), and unit (mi or km) from the URL parameters
  const { latlng, unit } = req.params;

  // Split the latlng parameter into latitude and longitude
  const [lat, lng] = latlng.split(',');

  // Multiplier to convert the default distance in meters to miles or KiloMeters according to input 'unit'
  // 0.000621371 is the conversion factor from meters to miles
  // 0.001 is the conversion factor from meters to kilometers
  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  // Check if latitude and longitude are provided
  if (!lat || !lng) {
    // If either latitude or longitude is missing, return an error with a status code of 400 (Bad Request)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng',
        400,
      ),
    );
  }

  // Perform geospatial aggregation to calculate distances from the specified point
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        // Specify the point to which distances will be calculated
        near: {
          type: 'Point', // Define the type of the point
          coordinates: [lng * 1, lat * 1], // Convert lng and lat to numbers and define coordinates as [longitude, latitude]
        },
        distanceField: 'distance', // The field in the output documents where the distance will be stored (in meters by default)
        distanceMultiplier: multiplier, // Convert distance from meters to the desired unit (miles or kilometers)
        spherical: true, // Use spherical geometry to calculate distances on the surface of the Earth
      }, // For geoSpatial aggregation, this is the only stage. This stage - geoNear - always needs to be the first in the pipeline
      // Another requirement for the above aggregation is that atleast one of our fields contains geoSpatial index. e.g.: '2dsphere'
      // If you only have one field with geoSpatial index - eg: startLocation in our case, it will automatically be used.
      // If you have multiple fields with geoSpatial index, you have to specify with keys
    },
    {
      $project: {
        // Specify the fields to include in the output
        distance: 1, // Include the distance field
        name: 1, // Include the name field
      },
    },
  ]);

  // Send the response with the distances of tours found
  res.status(200).json({
    status: 'success', // Status of the response
    data: {
      data: distances, // The list of tours with their calculated distances
    },
  });
});
