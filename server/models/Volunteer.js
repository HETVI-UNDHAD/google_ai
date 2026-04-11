const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills:         { type: [{ type: String, enum: ['General', 'Logistics', 'Medical', 'Teaching'] }], required: true },
    availability:   { type: Boolean, default: true },
    availableSlots: { type: [String], default: [] },
    city:           { type: String, required: true },

    // Registration-time location (static)
    latitude:       { type: Number, default: null },
    longitude:      { type: Number, default: null },

    // Live location — updated whenever volunteer opens the app
    liveLocation: {
      latitude:  { type: Number, default: null },
      longitude: { type: Number, default: null },
      updatedAt: { type: Date,   default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Volunteer', volunteerSchema);
