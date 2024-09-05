const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');
const { resizeTourImages } = require('./tourController');

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  // Cookie options. The secure should be set to true only in production mode
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // Calculate the expires timestamp from current timestamp
    ),
    // secure: true, // The cookie will only be sent on an encrypted connection i.e. https
    httpOnly: true, // The cookie cannot be accessed of modified by the browser in any way.
    // On httpOnly:true, the browser will automatically receive, store and send the cookie with every request.
  };
  // Setting secure:true in production
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // The cookie will only be sent on an encrypted connection i.e. https
  // Sending token via cookie to prevent the jwt token being accessed on the browser in XSS attacks
  // Following is the way to define and send a cookie.
  res.cookie('jwt', token, cookieOptions);

  // Remove/hide password from output
  user.password = undefined;

  // Send response
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  // Section - 207 - Email templates with pug
  const url = `${req.protocol}://${req.get('host')}/me`;
  // console.log(url);
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  // 3) If everything is ok, send token to client
  createSendToken(user, 200, res);
});

// Section 192 - Logging out users
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    // We send the cookie with the same name jwt but without the original token and with some dummy text
    expires: new Date(Date.now() + 10 * 1000), // The cookie expires in 10 seconds
    httpOnly: true,
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    // Section 189 - to login using jwt in cookies
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log into get access.', 401),
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError(
        'The user to whom this token belongs no longer exists.',
        401,
      ),
    );

  // 4) Check if user changed password after the JWT was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please login again.', 401),
    );
  }

  // Grant access to protected route
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

// Section 190 - Check if user is loggedin
// Only for rendered pages, no errors!!
// We apply this middleware to every single route
exports.isLoggedIn = async (req, res, next) => {
  // 1) Getting token and check if its there
  // Token here will always be sent using cookies - req.cookies.token
  if (req.cookies.jwt) {
    try {
      // 2) Verify token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();

      // 4) Check if user changed password after the JWT was issued
      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }

      // Grant access to protected route
      // If we have reached this stage, it means that there is a logged in user
      // We save the user in the res.locals.user variable
      res.locals.user = currentUser; // This is similar to passing data using render function to pug templates
      return next();
    } catch (err) {
      // If there is no user logged in, move to next middleware
      // This will occur when you logout and the jwt.verify will throw an error because of failure to match jwt token after logging out
      // In this case, instead of catching the error, we move to the next middleware to logout the user
      return next();
    }
  }
  next();
};

// Restrict the
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array eg: ['admin', 'lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // This is very important to save. Since when we call the above function "createPasswordResetToken",
  // we only modify the values of the the user
  await user.save({ validateBeforeSave: false });

  try {
    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    // const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password please ignore this email!`;
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10 mins)',
    //   message: message,
    // });

    // Section - 208 - Sending password reset emails - New method
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passworResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invaliid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) Update changePasswordAt property for the user
  // This step is executed automatically as part of the save middleware if the password is changed
  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // Get the user data from the current user which is loggedin
  // We have the current user stored in the user variable from the protect method which is already executed before this method
  // Also add the select ('+password') to show the password which is hidden
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current password is correct
  // Use the correctPassword method to check if the POSTed current password and the password in the database match
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }
  // 3) If so, update Password
  // User.findByIdAndUpdate will not work here!! Use user.save()
  // That is because our password confirm validator only works forc create and save, not on update
  // Dont use update for anything related to passwords
  // Also the pre save middlewares wont work which we have used to encrypt the password and store the passwordChangedAt timestamp
  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.newPasswordConfirm;
  await user.save();
  // 4) Log User In, send JWT
  createSendToken(user, 200, res);
});
