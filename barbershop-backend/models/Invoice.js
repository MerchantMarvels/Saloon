const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  contactId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: true
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    // required: true
  },
  serviceIds: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service'
    }],
    validate: [arr => arr.length > 0, 'At least one service is required'],
    required: true
  },
  miscItems: [{
    name: {
      type: String,
      // required: true,
      trim: true
    },
    price: {
      type: Number,
      // required: true,
      min: 0
    }
  }],
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price_per_unit: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  productsTotal: {
    type: Number,
    required: true,
    min: 0
  },

  taxPercent: {
    type: Number,
    default: 0,
    min: 0
  },
  tipAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceTotal: {
    type: Number,
    required: true,
    min: 0
  },
  miscTotal: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card'],
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Paid'
  }
}, {
  collection: 'invoices',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

//
// Virtuals for derived values
//

// Tax amount = (serviceTotal + miscTotal) * (taxPercent / 100)
invoiceSchema.virtual('taxAmount').get(function () {
  const base = (this.serviceTotal || 0) + (this.miscTotal || 0);
  return (base * (this.taxPercent || 0)) / 100;
});

// Total amount = serviceTotal + miscTotal + taxAmount + tipAmount
invoiceSchema.virtual('totalAmount').get(function () {
  const base = (this.serviceTotal || 0) + (this.miscTotal || 0);
  const tax = (base * (this.taxPercent || 0)) / 100;
  return base + tax + (this.tipAmount || 0);
});

module.exports = mongoose.model('Invoice', invoiceSchema);
