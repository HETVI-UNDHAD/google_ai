// Run once: node server/utils/patch_respond.js
const fs   = require('fs');
const path = require('path');

const file    = path.join(__dirname, '../controllers/volunteerController.js');
const content = fs.readFileSync(file, 'utf8');

const newBlock = `exports.respondToAssignment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['Accepted', 'Rejected', 'Completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status, notes: notes || '' },
      { new: true }
    ).populate('requestId', 'title status _id category city');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (status === 'Completed') await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Resolved' });
    if (status === 'Rejected') {
      await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Pending' });
      autoReassign(assignment.requestId._id, assignment.volunteerId).catch(() => {});
    }
    res.json(assignment);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

async function autoReassign(requestId) {
  const request = await Request.findById(requestId);
  if (!request || request.status !== 'Pending') return;
  const alreadyRejected = await Assignment.distinct('volunteerId', { requestId, status: 'Rejected' });
  const excluded = new Set(alreadyRejected.map(id => id.toString()));
  const volunteers = await Volunteer.find({ availability: true });
  const active = await Assignment.find({ status: { $in: ['Assigned', 'Accepted'] } });
  const wmap = {};
  active.forEach(a => { wmap[a.volunteerId.toString()] = (wmap[a.volunteerId.toString()] || 0) + 1; });
  const candidates = volunteers
    .filter(v => !excluded.has(v._id.toString()))
    .map(v => ({ v, r: matchScore(v, request, wmap[v._id.toString()] || 0) }))
    .filter(x => x.r !== null)
    .sort((a, b) => b.r.score - a.r.score);
  if (!candidates.length) return;
  const best = candidates[0];
  await Assignment.create({ requestId, volunteerId: best.v._id, notes: \`Auto-reassigned. Score: \${best.r.score}/100.\` });
  await Request.findByIdAndUpdate(requestId, { status: 'In Progress' });
  await Notification.create({ volunteerId: best.v._id, requestId, message: \`Assigned: \${request.title} (\${request.category} - \${request.city})\`, read: false }).catch(() => {});
}`;

// Find and replace the old function
const oldStart = content.indexOf('exports.respondToAssignment');
const afterOld = content.indexOf('\nexports.', oldStart + 10);
const before   = content.slice(0, oldStart);
const after    = content.slice(afterOld);

fs.writeFileSync(file, before + newBlock + '\n' + after, 'utf8');
console.log('Patched successfully');
