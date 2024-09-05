const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
    trim: true,
    validate: {
      validator: function (val) {
        return /^[a-zA-Z\s]+$/.test(val); // Allows letters and spaces
      },
      message: 'User name must only contain alphabetic characters and spaces',
    },
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    lowercase: true,
    required: [true, 'Email address is required'],
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  photo: {
    type: String,
    default: 'default.jpg', // Section 201 - Add default name to image file
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    trim: true,
    required: 'Please enter a password',
    minlength: [8, 'Password must be atleast 8 characters'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete password confirm
  this.passwordConfirm = undefined;

  next();
});

// Middleware to add passwordChangedAt after the change of password
userSchema.pre('save', function (next) {
  // Check if the password has been changed
  // return next if password not changed or the user is newly created
  if (!this.isModified('password') || this.isNew) return next();

  // If password changed add passwordChangedAt. Add a one second buffer, as adding passwordChangedAt might take a little longer than the time of actual creation of the token
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// A query middleware to filter out the not active users
// Useful when a user deletes the account. The account is set to inactive and hence,
// any query starting with find will not contain the not active user.
userSchema.pre(/^find/, function (next) {
  // this points to the current user
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimeStamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // Generate a password reset token using the built in JS library - Crypto
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Since we need to store it in the database, we need to hash/encrypt it. Again, use the
  // built in crypto library since it is not that necessary to hash this reset token using external libraries
  // Store the hashed reset token to the database
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // Set a token expiry time, normally 10 minutes
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  console.log({ resetToken }, { passwordResetToken: this.passwordResetToken });
  // Return the unhashed resetToken so that we can send it to the user via email.
  // Once the user accesses the resetToken
  return resetToken;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
