const mongoose = require('mongoose');

const BusinessDetailSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId, // or String if you're storing token-user mapping
    required: true,
    ref: 'User',
  },
  owner: {
    firstName: String,
    lastName: String,
    phone: String,
  },
  timezone: {
    type: String,
    enum: ['EST', 'CST', 'MST', 'PST'],
    required: true,
  },
  workingDays: [String], // e.g., ['Monday', 'Tuesday']
  workingHours: {
    type: Map,
    of: {
      opensAt: String,  // Format: "09:00"
      closesAt: String  // Format: "17:00"
    }
  },
   // ✅ ADD THIS FIELD:
  disabledDates: {
    type: [String], // ISO date strings like '2025-05-20'
    default: [],
  }
  
}, { timestamps: true });

module.exports = mongoose.model('BusinessDetail', BusinessDetailSchema);
