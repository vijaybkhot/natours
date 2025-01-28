import Tour from '../models/tourModel.js';
import User from '../models/userModel.js';
import Booking from '../models/bookingModel.js';

import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

export const getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collections
  const tours = await Tour.find();

  // 2) Build Template

  // 3) Render that template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  // 1) Get the data for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug })
    .populate({
      path: 'reviews',
      fields: 'review rating user',
    })
    .populate({
      path: 'guides',
    });

  // 2) Handle case where tour is not found
  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 3) Render template using the data
  res
    .status(200)
    .set(
      'Content-Security-Policy',
      "default-src 'self'; " +
        "script-src 'self' https://api.mapbox.com https://cdnjs.cloudflare.com https://unpkg.com; " +
        "style-src 'self' https://api.mapbox.com https://fonts.googleapis.com https://unpkg.com; " +
        'font-src https://fonts.gstatic.com; ' +
        "img-src 'self' https://tile.openstreetmap.org https://api.mapbox.com data:;",
    )
    .render('tour', {
      title: `${tour.name} Tour`,
      tour: tour,
    });
});

// Get Login form
export const getLoginForm = (req, res) => {
  // 1) Authenticate Login

  // 2) Build template

  // 3) Render Template

  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('login', {
      title: 'Log into your account',
    });
};

// Get Signup form
export const getSignupForm = (req, res) => {
  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('signup', {
      title: 'Create your account',
    });
};

// Get Account
export const getAccount = (req, res) => {
  // 2) Build template

  // 3) Render Template

  res
    .status(200)
    .set('Content-Security-Policy', "frame-src 'self'")
    .render('account', {
      title: 'Your account',
    });
};

// Section 215 - Rendering a User's Booked tours:
// -----------------------
export const getMyTours = catchAsync(async (req, res, next) => {
  // Find all the bookings for the currently logged in user
  // Then we will get the tourIds related to these bookings
  // Then we can find the tours with those ids
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIds = bookings.map((el) => el.tour._id);
  const tours = await Tour.find({ _id: { $in: tourIds } });

  res.status(200).render('overview', {
    title: 'My Tours',
    tours: tours,
  });
});

//------------------------

// Section 196 - Updating User data with our API
export const updateUserData = catchAsync(async (req, res, next) => {
  // Section 195 - Updating User data - Using url encoding on the form
  // const updatedUser = await User.findByIdAndUpdate(
  //   req.user.id,
  //   {
  //     name: req.body.name, // name and email are the names of the fields, because we gave them the name attribute in the html form in the account.pug
  //     email: req.body.email,
  //   },
  //   {
  //     new: true,
  //     runValidators: true,
  //   },
  // );

  res.status(200).render('account', {
    title: 'Your account',
  });
});
