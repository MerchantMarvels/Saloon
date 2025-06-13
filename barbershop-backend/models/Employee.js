const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  services_id: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  }],
  business_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  disabledDates: {
    type: [String],
    default: []
  },

  // ✅ UPDATED FIELDS:
  workingDays: [String], // e.g., ['Monday', 'Tuesday']

  workingHours: {
  type: Map,
  of: new mongoose.Schema({
    opensAt: String,
    closesAt: String
  }, { _id: false }) // <-- disables automatic _id on subdocuments
},

breaks: {
  type: Map,
  of: [{
    start: String,
    end: String
  }]
}

}, { collection: 'employees' });

module.exports = mongoose.model('Employee', employeeSchema);
