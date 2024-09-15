const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// Section 211 -Integrating Stripe into the Backend
// ---------------------------
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`, // Section 214 - The query string is not really secure. Anyone who has the url and the data can create a booking - it is temporary
    success_url: `${req.protocol}://${req.get('host')}/my-tours`, // Section 227 - Stripe webhook payments
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    mode: 'payment',
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${tour.name} Tour`,
            description: tour.summary,
            images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], // Update URL if needed
          },
          unit_amount: tour.price * 100, // Convert to cents
        },
        quantity: 1,
      },
    ], // Details about the product
  });
  // 3) Create session as response
  res.status(200).json({ status: 'success', session: session });
});
// ---------------------------

// // Section 214 - Creating new Booking on Checkout success
// // ------------------------------------------------------
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only temporary, because its unsecure: anyone can make bookings without paying

//   const { tour, user, price } = req.query;

//   if (!tour || !user || !price) return next();

//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]); // What redirect does is to create a new request to the url that is passed
//   // We will be redirected to the same route which will again call the createBookingChekout. Only this time, since there will be no tour, user or price, it will go to the next middleware
//   // next(); // Not needed
// });

// // ------------------------------------------------------

// Section 214 - Creating new Booking on Checkout success
// ------------------------------------------------------

// A middleware to set Tour and User ids from the parameters if not provided in the req.body
// This will run before the createReview function, setting the tour and user ids.
exports.setTourUserIds = catchAsync(async (req, res, next) => {
  // Allow nested routes for tours/bookings
  if (!req.body.tour && req.params.tourId) req.body.tour = req.params.tourId; // We get the tourId from the params field because of the nested routes

  // Allow nested routes for users/bookings. If there is no userId in the body, get it from the parameters
  if (!req.body.user && req.params.userId) req.body.user = req.params.userId;
  // If there is no userId in parameters either, get it from req.user which we get from authController.protect function
  if (!req.body.user && !req.params.userId) req.body.user = req.user.id;

  // This assignment only applies when creating a new Booking
  if (req.method === 'POST' && req.body.tour && !req.body.price)
    req.body.price = (await Tour.findById(req.body.tour)).price; // Get the price of the tour from the tour itself. This will execute only on the POST request. For the GET request we do not need the price in body

  next();
});

exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// ------------------------------------------------------

// Section 227 - Payments with Stripe webhooks
//----------------------------------

const createBookingCheckout = async (session) => {
  const tour = session.client_reference_id; // tourId
  const user = (await User.findOne({ email: session.customer_email })).id; // userId
  const price = session.amount_total / 100; // Convert from cents to dollars
  await Booking.create({ tour, user, price });
};
exports.webhookCheckout = (req, res, next) => {
  const signature = req.headers['stripe-signature']; // Read stripe signature out of our headers

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook error: ${err.message}`); // Send the error to Stripe. Stripe will receive the response because Stripe has called the url which inturn calls the current function.
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};
//----------------------------------
