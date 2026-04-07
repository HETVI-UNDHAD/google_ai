const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills:       { type: [{ type: String, enum: ['General', 'Logistics', 'Medical', 'Teaching'] }], required: true },
    availability: { type: Boolean, default: true },
    availableSlots: { type: [String], default: [] }, // e.g. ['Morning', 'Evening']
    city:         { type: String, required: true },
    latitude:     { type: Number, default: null },
    longitude:    { type: Number, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
