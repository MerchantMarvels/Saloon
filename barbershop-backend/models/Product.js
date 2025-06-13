const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({     
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  unit: { type: String, required: true }, // e.g., ml, pcs, bottle
  price_per_unit: { type: Number, required: true, min: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
