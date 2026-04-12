const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills:             { type: [{ type: String, enum: ['General', 'Logistics', 'Medical', 'Teaching'] }], required: true },
    availability:       { type: Boolean, default: true },
    availableSlots:     { type: [String], default: [] },
    city:               { type: String, required: true },
    area:               { type: String, default: '' },
    latitude:           { type: Number, default: null }, // registered location
    longitude:          { type: Number, default: null },
    currentLatitude:    { type: Number, default: null }, // live GPS
    currentLongitude:   { type: Number, default: null },
    lastLocationUpdate: { type: Date,   default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
