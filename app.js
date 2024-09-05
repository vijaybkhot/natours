const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes'); // Section 211 - Integrating Stripe to the Back-End
const viewRouter = require('./routes/viewRoutes');

const app = express();

// Section 176: Setting up Pug in Express
// Setting up template engine for express app
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) Global Middlewares

// Serving static files
// All the static files will be served from the public folder. Example, the stylesheet.css, images, html, etc
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public'))); // Using the path module

// Set security http headers
// Put the helmet middleware right at the beginning of the middleware stack.
// In app.use() we always need a function, not a function call
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://cdnjs.cloudflare.com',
          'https://unpkg.com',
          'https://js.stripe.com',
        ],
        styleSrc: [
          "'self'",
          'https://api.mapbox.com',
          'https://fonts.googleapis.com',
          'https://unpkg.com',
        ],
        fontSrc: ['https://fonts.gstatic.com'],
        connectSrc: ["'self'", 'ws://127.0.0.1:1234', 'https://js.stripe.com'],
        frameSrc: ['https://js.stripe.com'],
      },
    },
  }),
);
// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same IP address
// rateLimit is a function, which will, based on our object, create a middleware
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // one hour
  message: 'Too many requestes from this IP. Please try again in an hour!',
});

// We can use the above middleware function using app.use().
// To limit the access to the api route, we specify the route on which the middleware is used i.e. api.
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Middleware

// Section 195: Udating User Data - URL encoding parser
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// Cookie parser, reading data from cookie into req.body
app.use(cookieParser()); // Section 189 - Cookies parser middleware for login

// Data sanitization against NoSQL query injection - eg: "email": {"$gt":""}
// What this middleware does is look at all of the req.body, req.params and req.queryString and
// remove all the instances of $ signs and dots.
// As the dollar sign is removed, anybody cannot use the above query {"$gt":""}.
app.use(mongoSanitize());

// Data sanitization against XSS
// This will clean any input from a malicious html code. Imagine some user tries to insert some malicious html code with some javascript code aatached to it.
// If that could then later be injected into our html file can create problems.
// Using this middleware will prevent this by converting all the html symbols
// Also, mongoose validation is already a very good protection against XSS,
// because it wont allow any crazy stuff to go into our database as long as we use it correctly
app.use(xss());

// Prevent parameter pollution - In case some attacker uses multiple parameters
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupSize',
      'difficulty',
      'price',
    ], // We whitelist or exclude the parameters for which we want to allow duplicate values
  }),
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toString();
  console.log(req.cookies); // Section 189
  //   console.log('Hello from the second middleware');
  next();
});

// 3) ROUTES
app.use('/', viewRouter); // View Router is mounted on the root url
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter); // Section 211 - Integrating Stripe to the Back-End

// Handling incorrect routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
