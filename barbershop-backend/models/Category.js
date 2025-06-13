

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    business_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Business', // Assuming you have a Business model
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

module.exports = mongoose.model('Category', CategorySchema);
