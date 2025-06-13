const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  business_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true // Each product should have one inventory record
  },
  quantity_in_stock: { type: Number, default: 0, min: 0 },
  reorder_level: { type: Number, default: 10, min: 0 },
  last_updated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Inventory', InventorySchema);
