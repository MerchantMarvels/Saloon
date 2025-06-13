const mongoose = require('mongoose');

const SupplierOrderSchema = new mongoose.Schema({
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Consistent with Inventory and Product
    required: true
  },
  supplier_name: {
    type: String,
    required: true,
    trim: true
  },
  order_date: {
    type: Date,
    default: Date.now
  },
  received_date: {
    type: Date
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price_per_unit: { type: Number, required: true, min: 0 }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Received'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SupplierOrder', SupplierOrderSchema);
