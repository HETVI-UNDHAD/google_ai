const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
  {
    title:          { type: String, required: true, trim: true },
    description:    { type: String, required: true },
    category:       { type: String, enum: ['Food', 'Health', 'Education', 'Shelter'], required: true },
    city:           { type: String, required: true },
    area:           { type: String, required: true },
    latitude:       { type: Number, default: null },
    longitude:      { type: Number, default: null },
    urgency:        { type: Number, min: 1, max: 3, required: true },
    peopleAffected: { type: Number, required: true },
    priorityScore:  { type: Number, default: 0 },
    imageUrl:       { type: String, default: null },
    status:         { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// priorityScore = (urgency × 3) + (peopleAffected × 2)
requestSchema.pre('save', function (next) {
  this.priorityScore = (this.urgency * 3) + (this.peopleAffected * 2);
  next();
});

module.exports = mongoose.model('Request', requestSchema);
