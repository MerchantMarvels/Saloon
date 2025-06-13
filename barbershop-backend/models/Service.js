const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: String,
  price: Number,
  duration_minutes: Number,
  business_id: String
}, { collection: 'services' }); // <-- Force the correct collection name

module.exports = mongoose.model('Service', serviceSchema);