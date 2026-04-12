const Volunteer  = require('../models/Volunteer');
const Assignment = require('../models/Assignment');
const Request    = require('../models/Request');
const User       = require('../models/User');
const Notification = require('../models/Notification');

// ── Skill map: category → required skills ──────────────────────────────────
const SKILL_MAP = {
  Food:      ['General', 'Logistics'],
  Health:    ['Medical'],
  Education: ['Teaching'],
  Shelter:   ['Logistics'],
};

// ── Haversine distance in km ───────────────────────────────────────────────
function distanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Smart match score (0–100) ──────────────────────────────────────────────
// Factors:
//   40pts  skill match (exact skill = 40, partial = 20)
//   30pts  location    (same city = 30, within 50km = 15, within 100km = 5)
//   20pts  urgency     (high urgency request gets priority volunteers)
//   10pts  workload    (volunteers with fewer active assignments score higher)
function matchScore(volunteer, request, activeAssignmentCount) {
  const required = SKILL_MAP[request.category] || [];
  const matched  = volunteer.skills.filter(s => required.includes(s));

  let score   = 0;
  const reasons = [];

  // Skill score
  if (matched.length > 0) {
    const skillPts = matched.length === required.length ? 40 : 20;
    score += skillPts;
    reasons.push(`Skill match: ${matched.join(', ')} (${skillPts}pts)`);
  } else {
    return null; // hard requirement — no skill match = no assignment
  }

  // Location score
  const sameCity = volunteer.city.toLowerCase() === request.city.toLowerCase();
  const dist     = distanceKm(volunteer.latitude, volunteer.longitude, request.latitude, request.longitude);

  if (sameCity) {
    score += 30;
    reasons.push('Same city (30pts)');
  } else if (dist !== null && dist <= 50) {
    score += 15;
    reasons.push(`Within 50km — ${dist.toFixed(0)}km away (15pts)`);
  } else if (dist !== null && dist <= 100) {
    score += 5;
    reasons.push(`Within 100km — ${dist.toFixed(0)}km away (5pts)`);
  } else if (dist !== null) {
    reasons.push(`${dist.toFixed(0)}km away (0pts)`);
  } else {
    reasons.push('Distance unknown (0pts)');
  }

  // Urgency score — high urgency requests prefer volunteers with more skills
  if (request.urgency === 3) {
    const urgencyPts = Math.min(volunteer.skills.length * 5, 20);
    score += urgencyPts;
    reasons.push(`High urgency bonus (${urgencyPts}pts)`);
  } else if (request.urgency === 2) {
    score += 10;
    reasons.push('Medium urgency (10pts)');
  } else {
    score += 5;
    reasons.push('Low urgency (5pts)');
  }

  // Workload score — fewer active assignments = higher score
  const workloadPts = Math.max(0, 10 - activeAssignmentCount * 3);
  score += workloadPts;
  if (workloadPts > 0) reasons.push(`Low workload (${workloadPts}pts)`);

  return { score: Math.min(score, 100), reasons, distance: dist, sameCity };
}

// ── GET /api/match/preview ─────────────────────────────────────────────────
// Returns proposed matches with scores WITHOUT saving — for UI preview
exports.previewMatching = async (req, res) => {
  try {
    const pendingRequests     = await Request.find({ status: 'Pending' }).sort({ priorityScore: -1 });
    const availableVolunteers = await Volunteer.find({ availability: true }).populate('userId', 'name email');

    // Count active assignments per volunteer
    const activeAssignments = await Assignment.find({ status: { $in: ['Assigned', 'Accepted'] } });
    const workloadMap = {};
    activeAssignments.forEach(a => {
      const id = a.volunteerId.toString();
      workloadMap[id] = (workloadMap[id] || 0) + 1;
    });

    const alreadyAssigned = new Set(activeAssignments.map(a => a.volunteerId.toString()));

    const proposals = [];

    for (const request of pendingRequests) {
      const candidates = [];

      for (const vol of availableVolunteers) {
        if (alreadyAssigned.has(vol._id.toString())) continue;
        const result = matchScore(vol, request, workloadMap[vol._id.toString()] || 0);
        if (!result) continue;
        candidates.push({ volunteer: vol, ...result });
      }

      if (candidates.length === 0) {
        proposals.push({ request, bestMatch: null, allCandidates: [] });
        continue;
      }

      candidates.sort((a, b) => b.score - a.score);
      proposals.push({
        request,
        bestMatch:     candidates[0],
        allCandidates: candidates.slice(0, 3), // top 3 options
      });
    }

    res.json({ proposals, totalPending: pendingRequests.length, totalVolunteers: availableVolunteers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/assign ───────────────────────────────────────────────────────
// Runs matching and saves assignments
exports.runMatching = async (req, res) => {
  try {
    const pendingRequests     = await Request.find({ status: 'Pending' }).sort({ priorityScore: -1 });
    const availableVolunteers = await Volunteer.find({ availability: true });

    const activeAssignments = await Assignment.find({ status: { $in: ['Assigned', 'Accepted'] } });
    const workloadMap = {};
    activeAssignments.forEach(a => {
      const id = a.volunteerId.toString();
      workloadMap[id] = (workloadMap[id] || 0) + 1;
    });

    const assignedVolunteerIds = new Set(activeAssignments.map(a => a.volunteerId.toString()));
    const newAssignments = [];
    const details = [];

    for (const request of pendingRequests) {
      const candidates = [];

      for (const vol of availableVolunteers) {
        if (assignedVolunteerIds.has(vol._id.toString())) continue;
        const result = matchScore(vol, request, workloadMap[vol._id.toString()] || 0);
        if (!result) continue;
        candidates.push({ vol, ...result });
      }

      if (candidates.length === 0) continue;

      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0];

      const assignment = await Assignment.create({
        requestId:   request._id,
        volunteerId: best.vol._id,
        notes:       `Auto-matched. Score: ${best.score}/100. ${best.reasons.join(' | ')}`,
      });

      await Request.findByIdAndUpdate(request._id, { status: 'In Progress' });
      assignedVolunteerIds.add(best.vol._id.toString());
      newAssignments.push(assignment);
      details.push({
        requestTitle:   request.title,
        volunteerName:  best.vol.userId?.name || 'Unknown',
        score:          best.score,
        reasons:        best.reasons,
      });
    }

    res.json({ matched: newAssignments.length, assignments: newAssignments, details });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/assign/manual ────────────────────────────────────────────────
// Admin manually assigns a specific volunteer to a specific request
exports.manualAssign = async (req, res) => {
  try {
    const { requestId, volunteerId } = req.body;
    if (!requestId || !volunteerId) return res.status(400).json({ message: 'requestId and volunteerId required' });

    const existing = await Assignment.findOne({ requestId, volunteerId, status: { $in: ['Assigned', 'Accepted'] } });
    if (existing) return res.status(400).json({ message: 'Already assigned' });

    const assignment = await Assignment.create({ requestId, volunteerId, notes: 'Manually assigned by admin' });
    await Request.findByIdAndUpdate(requestId, { status: 'In Progress' });

    const populated = await Assignment.findById(assignment._id)
      .populate('requestId', 'title category city urgency priorityScore')
      .populate({ path: 'volunteerId', populate: { path: 'userId', select: 'name email' } });

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/volunteer ────────────────────────────────────────────────────
exports.registerVolunteer = async (req, res) => {
  try {
    const { userId, skills, availability, availableSlots, city, latitude, longitude } = req.body;
    const existing = await Volunteer.findOne({ userId });
    if (existing) return res.status(400).json({ message: 'Volunteer profile already exists' });
    const volunteer = await Volunteer.create({ userId, skills, availability, availableSlots, city, latitude, longitude });
    res.status(201).json(volunteer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/volunteers ────────────────────────────────────────────────────
exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find().populate('userId', 'name email');
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/volunteer/me ──────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/assignments ───────────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('requestId', 'title category city area status priorityScore urgency peopleAffected')
      .populate({ path: 'volunteerId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/assignments/mine ──────────────────────────────────────────────
exports.getMyAssignments = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.json([]);
    const assignments = await Assignment.find({ volunteerId: volunteer._id })
      .populate('requestId', 'title description category city area urgency peopleAffected priorityScore status latitude longitude')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/volunteer/tasks — nearby pending requests within 5km ──────────
exports.getNearbyTasks = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer)
      return res.status(404).json({ message: 'Volunteer profile not found. Please register first.' });

    const lat = req.query.lat ? Number(req.query.lat) : volunteer.currentLatitude;
    const lng = req.query.lng ? Number(req.query.lng) : volunteer.currentLongitude;

    // No location at all — return empty array, never show all
    if (!lat || !lng) return res.json([]);

    const RADIUS_KM = 50;
    const requests  = await Request.find({ status: 'Pending' });

    const nearby = requests
      .filter((r) => r.latitude && r.longitude)
      .map((r) => {
        const dist = distanceKm(lat, lng, r.latitude, r.longitude);
        return { ...r.toObject(), distanceKm: parseFloat(dist.toFixed(2)) };
      })
      .filter((r) => r.distanceKm <= RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(nearby);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/volunteer/accept  { assignmentId } ──────────────────────────
exports.acceptTask = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.body.assignmentId, { status: 'Accepted' }, { new: true }
    ).populate('requestId', 'title');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/volunteer/reject  { assignmentId } ──────────────────────────
exports.rejectTask = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.body.assignmentId, { status: 'Rejected' }, { new: true }
    ).populate('requestId', '_id title');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Pending' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/volunteer/complete  { assignmentId } ────────────────────────
exports.completeTask = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(
      req.body.assignmentId, { status: 'Completed' }, { new: true }
    ).populate('requestId', '_id title');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Resolved' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/assignments/:id/respond ────────────────────────────────────
exports.respondToAssignment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['Accepted', 'Rejected', 'Completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status, notes: notes || '' },
      { new: true }
    ).populate('requestId', 'title status');

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    if (status === 'Rejected')  await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Pending' });
    if (status === 'Completed') await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Resolved' });

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/volunteer/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, skills, city, area, availableSlots, latitude, longitude } = req.body;
    const userUpdate = {};
    if (name && name.trim())  userUpdate.name  = name.trim();
    if (phone && phone.trim()) userUpdate.phone = phone.trim();
    if (Object.keys(userUpdate).length) await User.findByIdAndUpdate(req.user._id, userUpdate);
    const volUpdate = {};
    if (skills && skills.length) volUpdate.skills = skills;
    if (city && city.trim())     volUpdate.city   = city.trim();
    if (area && area.trim())     volUpdate.area   = area.trim();
    if (availableSlots)          volUpdate.availableSlots = availableSlots;
    if (latitude  != null)       volUpdate.latitude  = Number(latitude);
    if (longitude != null)       volUpdate.longitude = Number(longitude);
    const existing = await Volunteer.findOne({ userId: req.user._id });
    if (existing && existing.availability && latitude != null && longitude != null) {
      volUpdate.currentLatitude    = Number(latitude);
      volUpdate.currentLongitude   = Number(longitude);
      volUpdate.lastLocationUpdate = new Date();
    }
    const volunteer = await Volunteer.findOneAndUpdate({ userId: req.user._id }, volUpdate, { new: true }).populate('userId', 'name email phone');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer profile not found' });
    res.json(volunteer);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/volunteer/availability
exports.toggleAvailability = async (req, res) => {
  try {
    const { availability, latitude, longitude } = req.body;
    const isOnline = Boolean(availability);
    const update = { availability: isOnline };
    if (isOnline && latitude != null && longitude != null) {
      update.currentLatitude    = Number(latitude);
      update.currentLongitude   = Number(longitude);
      update.lastLocationUpdate = new Date();
    } else if (!isOnline) {
      update.currentLatitude    = null;
      update.currentLongitude   = null;
      update.lastLocationUpdate = null;
    }
    const volunteer = await Volunteer.findOneAndUpdate({ userId: req.user._id }, update, { new: true });
    if (!volunteer) return res.status(404).json({ message: 'Volunteer profile not found' });
    let nearbyCount = 0;
    if (isOnline && update.currentLatitude && update.currentLongitude) {
      const RADIUS_KM = 50;
      const pendingReqs = await Request.find({ status: 'Pending', latitude: { ['$ne']: null }, longitude: { ['$ne']: null } });
      const nearbyDocs = pendingReqs.filter(r => { const d = distanceKm(update.currentLatitude, update.currentLongitude, r.latitude, r.longitude); return d !== null && d <= RADIUS_KM; }).map(r => ({ volunteerId: volunteer._id, requestId: r._id, message: 'Urgent need near you: ' + r.title + ' (' + r.category + ' - ' + r.city + ')', distanceKm: parseFloat(distanceKm(update.currentLatitude, update.currentLongitude, r.latitude, r.longitude).toFixed(2)), read: false }));
      if (nearbyDocs.length) { await Notification.insertMany(nearbyDocs, { ordered: false }).catch(() => {}); nearbyCount = nearbyDocs.length; }
    }
    res.json({ availability: volunteer.availability, currentLatitude: volunteer.currentLatitude, currentLongitude: volunteer.currentLongitude, nearbyCount });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
