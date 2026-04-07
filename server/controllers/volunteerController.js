const Volunteer  = require('../models/Volunteer');
const Assignment = require('../models/Assignment');
const Request    = require('../models/Request');

const SKILL_MAP = {
  Food:      ['General', 'Logistics'],
  Health:    ['Medical'],
  Education: ['Teaching'],
  Shelter:   ['Logistics'],
};

// Haversine distance in km
function distanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/volunteer
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

// GET /api/volunteers
exports.getVolunteers = async (req, res) => {
  try {
    const volunteers = await Volunteer.find().populate('userId', 'name email');
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/volunteer/me  — volunteer's own profile + assignments
exports.getMyProfile = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/assign
exports.runMatching = async (req, res) => {
  try {
    const pendingRequests    = await Request.find({ status: 'Pending' }).sort({ priorityScore: -1 });
    const availableVolunteers = await Volunteer.find({ availability: true });

    const assignedVolunteerIds = new Set(
      (await Assignment.find({ status: { $in: ['Assigned', 'Accepted'] } })).map((a) => a.volunteerId.toString())
    );

    const newAssignments = [];

    for (const request of pendingRequests) {
      const requiredSkills = SKILL_MAP[request.category];

      // Filter by skill match
      let candidates = availableVolunteers.filter(
        (v) =>
          v.skills.some((s) => requiredSkills.includes(s)) &&
          !assignedVolunteerIds.has(v._id.toString())
      );

      if (candidates.length === 0) continue;

      // Sort by city match first, then distance
      candidates.sort((a, b) => {
        const aCity = a.city.toLowerCase() === request.city.toLowerCase() ? 0 : 1;
        const bCity = b.city.toLowerCase() === request.city.toLowerCase() ? 0 : 1;
        if (aCity !== bCity) return aCity - bCity;
        return (
          distanceKm(a.latitude, a.longitude, request.latitude, request.longitude) -
          distanceKm(b.latitude, b.longitude, request.latitude, request.longitude)
        );
      });

      const match = candidates[0];
      const assignment = await Assignment.create({ requestId: request._id, volunteerId: match._id });
      await Request.findByIdAndUpdate(request._id, { status: 'In Progress' });
      assignedVolunteerIds.add(match._id.toString());
      newAssignments.push(assignment);
    }

    res.json({ matched: newAssignments.length, assignments: newAssignments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate('requestId', 'title category city status priorityScore urgency')
      .populate({ path: 'volunteerId', populate: { path: 'userId', select: 'name email' } })
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/assignments/mine  — for logged-in volunteer
exports.getMyAssignments = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({ userId: req.user._id });
    if (!volunteer) return res.json([]);
    const assignments = await Assignment.find({ volunteerId: volunteer._id })
      .populate('requestId', 'title description category city area urgency peopleAffected priorityScore status')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/assignments/:id/respond  — volunteer accepts/rejects/completes
exports.respondToAssignment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const allowed = ['Accepted', 'Rejected', 'Completed'];
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { status, notes: notes || '' },
      { new: true }
    ).populate('requestId', 'title status');

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // If rejected → revert request to Pending so it can be re-matched
    if (status === 'Rejected') {
      await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Pending' });
    }
    // If completed → mark request resolved
    if (status === 'Completed') {
      await Request.findByIdAndUpdate(assignment.requestId._id, { status: 'Resolved' });
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
