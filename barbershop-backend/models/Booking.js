const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  bookingDateTime: { type: Date, required: true },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_at: { type: Date, default: Date.now },
  additionalServices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
  status: {
    type: String,
    enum: ['Booked','confirmed', 'checkout', 'no_show', 'Billed', 'cancelled' ],
    default: 'confirmed'
  },
});

module.exports = mongoose.model('Booking', bookingSchema);
