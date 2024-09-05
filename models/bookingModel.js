const mongoose = require('mongoose');

// Section 213 - Modelling the Bookings
//-------------------------------------
const bookingSchema = new mongoose.Schema({
  // We will use the parent referencing here - referencing both the tourId and userId for the tour and the user to which the booking belongs
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Booking must belong to a User!'],
  },
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paid: {
    // Automatically set to true. But can be set to false if payment is made using some method other than stripe and it is pending
    type: Boolean,
    default: true,
  },
});

// Populating the tour and the user id on query using a middleware
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({ path: 'tour', select: 'name' });
  next();
});

//-------------------------------------

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
