// node server/utils/patch_notify.js
const fs   = require('fs');
const path = require('path');
const file = path.join(__dirname, '../controllers/volunteerController.js');
let c = fs.readFileSync(file, 'utf8');

// 1. After Assignment.create in runMatching, add notification
c = c.replace(
  `const assignment = await Assignment.create({
        requestId:   request._id,
        volunteerId: best.vol._id,
        notes:       \`Auto-matched. Score: \${best.score}/100. \${best.reasons.join(' | ')}\`,
      });

      await Request.findByIdAndUpdate(request._id, { status: 'In Progress' });`,
  `const assignment = await Assignment.create({
        requestId:   request._id,
        volunteerId: best.vol._id,
        notes:       \`Auto-matched. Score: \${best.score}/100. \${best.reasons.join(' | ')}\`,
      });
      await Notification.create({ volunteerId: best.vol._id, requestId: request._id, message: \`📢 You have been assigned: "\${request.title}" (\${request.category} · \${request.city})\`, read: false }).catch(() => {});
      await Request.findByIdAndUpdate(request._id, { status: 'In Progress' });`
);

// 2. After Assignment.create in manualAssign, add notification
c = c.replace(
  `const assignment = await Assignment.create({ requestId, volunteerId, notes: 'Manually assigned by admin' });
    await Request.findByIdAndUpdate(requestId, { status: 'In Progress' });`,
  `const assignment = await Assignment.create({ requestId, volunteerId, notes: 'Manually assigned by admin' });
    const reqDoc = await Request.findByIdAndUpdate(requestId, { status: 'In Progress' }, { new: true });
    await Notification.create({ volunteerId, requestId, message: \`📢 You have been manually assigned: "\${reqDoc?.title}" (\${reqDoc?.category} · \${reqDoc?.city})\`, read: false }).catch(() => {});`
);

fs.writeFileSync(file, c, 'utf8');
console.log('Notification patch done');
