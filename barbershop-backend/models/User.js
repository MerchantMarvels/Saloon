const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password_hash: String,
  role: String,
  business_id: String,
  business_name: String,
  inventoryEnabled: {
    type: Boolean,
    default: false
  },
   reset_token: String,
  reset_token_expiry: Date,
  created_at: Date
});

module.exports = mongoose.model('User', userSchema);
