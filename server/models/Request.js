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

// Priority formula:
//   base     = urgency^2 * 10  (urgency 3 = 90, urgency 2 = 40, urgency 1 = 10)
//   people   = log10(peopleAffected + 1) * 20  (diminishing returns on large numbers)
//   agebonus = hours pending * 0.5, capped at 100  (older requests rise over time)
// Total is recalculated on save AND via a scheduled refresh
function calcPriority(urgency, peopleAffected, createdAt) {
  const base      = Math.pow(urgency, 2) * 10;
  const people    = Math.log10((peopleAffected || 1) + 1) * 20;
  const hoursOld  = (Date.now() - new Date(createdAt || Date.now())) / 3600000;
  const ageBonus  = Math.min(hoursOld * 0.5, 100);
  return Math.round(base + people + ageBonus);
}

requestSchema.pre('save', function (next) {
  this.priorityScore = calcPriority(this.urgency, this.peopleAffected, this.createdAt);
  next();
});

// Export so the refresh job can reuse it
requestSchema.statics.recalcPriority = calcPriority;

module.exports = mongoose.model('Request', requestSchema);
