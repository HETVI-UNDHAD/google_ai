const mongoose = require('mongoose');

// Severity weight per category
const SEVERITY_MAP = { Health: 5, Shelter: 4, Food: 3, Education: 2 };

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
    severity:       { type: Number, default: 0 },
    priorityScore:  { type: Number, default: 0 },
    imageUrl:       { type: String, default: null },
    status:         { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

requestSchema.pre('save', function (next) {
  this.severity     = SEVERITY_MAP[this.category] || 2;
  this.priorityScore = (this.urgency * 3) + (this.peopleAffected * 2) + this.severity;
  next();
});

module.exports = mongoose.model('Request', requestSchema);
