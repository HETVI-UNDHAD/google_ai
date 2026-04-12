const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
    requestId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Request',   required: true },
    message:     { type: String, required: true },
    distanceKm:  { type: Number, default: null },
    read:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate notification for same volunteer + request
notificationSchema.index({ volunteerId: 1, requestId: 1 }, { unique: true });

module.exports = mongoose.model('Notification', notificationSchema);
