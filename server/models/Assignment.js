const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    requestId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Request',   required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
    status: {
      type: String,
      enum: ['Assigned', 'Accepted', 'Rejected', 'Completed'],
      default: 'Assigned',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
