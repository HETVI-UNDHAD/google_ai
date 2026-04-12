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

  // Location score — prefer live GPS over static registration coords
  const sameCity = volunteer.city.toLowerCase() === request.city.toLowerCase();
  const vLat = volunteer.liveLocation?.latitude  || volunteer.latitude;
  const vLng = volunteer.liveLocation?.longitude || volunteer.longitude;
  const dist  = distanceKm(vLat, vLng, request.latitude, request.longitude);

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

// ── PATCH /api/volunteer/profile ─────────────────────────────────────────
// Edit name, phone, skills, city, availableSlots
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, skills, city, availableSlots, latitude, longitude } = req.body;

    // Update name/phone on User model
    if (name || phone) {
      const userUpdate = {};
      if (name)  userUpdate.name  = name.trim();
      if (phone) userUpdate.phone = phone.trim();
      await require('../models/User').findByIdAndUpdate(req.user._id, userUpdate);
    }

    // Build volunteer update
    const volUpdate = {};
    if (skills)         volUpdate.skills         = skills;
    if (city)           volUpdate.city           = city;
    if (availableSlots) volUpdate.availableSlots = availableSlots;

    // If online and new coords provided, update live location too
    if (latitude != null && longitude != null) {
      volUpdate.liveLocation = { latitude: parseFloat(latitude), longitude: parseFloat(longitude), updatedAt: new Date() };
    }

    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: req.user._id },
      volUpdate,
      { new: true }
    ).populate('userId', 'name email');

    if (!volunteer) return res.status(404).json({ message: 'Volunteer profile not found' });
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/volunteer/availability ─────────────────────────────────────
// Toggle availability ON/OFF. When ON: save location + return nearby requests.
exports.toggleAvailability = async (req, res) => {
  try {
    const { availability, latitude, longitude } = req.body;

    const volUpdate = { availability };

    // When going ONLINE, save live location if provided
    if (availability && latitude != null && longitude != null) {
      volUpdate.liveLocation = {
        latitude:  parseFloat(latitude),
        longitude: parseFloat(longitude),
        updatedAt: new Date(),
      };
    }

    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: req.user._id },
      volUpdate,
      { new: true }
    );

    if (!volunteer) return res.status(404).json({ message: 'Volunteer profile not found' });

    // When going ONLINE — find nearby pending requests matching skills
    let nearbyRequests = [];
    if (availability) {
      const required = SKILL_MAP;
      const matchedCategories = Object.entries(required)
        .filter(([, skills]) => skills.some(s => volunteer.skills.includes(s)))
        .map(([cat]) => cat);

      const pending = await Request.find({
        status: 'Pending',
        category: { $in: matchedCategories },
      }).sort({ priorityScore: -1 }).limit(5);

      const vLat = volunteer.liveLocation?.latitude  || volunteer.latitude;
      const vLng = volunteer.liveLocation?.longitude || volunteer.longitude;

      nearbyRequests = pending
        .map(r => {
          const dist = distanceKm(vLat, vLng, r.latitude, r.longitude);
          return { ...r.toObject(), distance: dist };
        })
        .filter(r => {
          // same city OR within 100km OR distance unknown (city-only match)
          if (r.city.toLowerCase() === volunteer.city.toLowerCase()) return true;
          if (r.distance !== null && r.distance <= 100) return true;
          return false;
        })
        .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
        .slice(0, 3);
    }

    res.json({ availability: volunteer.availability, liveLocation: volunteer.liveLocation, nearbyRequests });
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

// GET /api/volunteers/online — returns online volunteers with location (admin only)
exports.getOnlineVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find({
      availability: true,
      currentLatitude:  { $ne: null },
      currentLongitude: { $ne: null },
    }).populate('userId', 'name');
    res.json(volunteers.map(v => ({
      _id:  v._id,
      name: v.userId?.name || 'Volunteer',
      city: v.city,
      lat:  v.currentLatitude,
      lng:  v.currentLongitude,
      skills: v.skills,
    })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── GET /api/volunteers ────────────────────────────────────────────────────
exports.getVolunteers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const [volunteers, total] = await Promise.all([
      Volunteer.find().populate('userId', 'name email').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Volunteer.countDocuments(),
    ]);
    res.json({ data: volunteers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/volunteer/me ──────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id }).populate('userId', 'name email phone');
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/volunteer/location ─────────────────────────────────────────
// Volunteer sends their current GPS coordinates — always overwrites previous
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null)
      return res.status(400).json({ message: 'latitude and longitude are required' });

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180)
      return res.status(400).json({ message: 'Invalid coordinates' });

    const volunteer = await Volunteer.findOneAndUpdate(
      { userId: req.user._id },
      { liveLocation: { latitude: lat, longitude: lng, updatedAt: new Date() } },
      { new: true }
    );

    if (!volunteer)
      return res.status(404).json({ message: 'Volunteer profile not found. Please register first.' });

    res.json({
      message: 'Location updated',
      liveLocation: volunteer.liveLocation,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/assignments ───────────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const [assignments, total] = await Promise.all([
      Assignment.find()
        .populate('requestId', 'title category city area status priorityScore urgency peopleAffected')
        .populate({ path: 'volunteerId', populate: { path: 'userId', select: 'name email' } })
        .sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      Assignment.countDocuments(),
    ]);
    res.json({ data: assignments, total, page, pages: Math.ceil(total / limit) });
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
  await Assignment.create({ requestId, volunteerId: best.v._id, notes: `Auto-reassigned. Score: ${best.r.score}/100.` });
  await Request.findByIdAndUpdate(requestId, { status: 'In Progress' });
  await Notification.create({ volunteerId: best.v._id, requestId, message: `Assigned: ${request.title} (${request.category} - ${request.city})`, read: false }).catch(() => {});
}

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
