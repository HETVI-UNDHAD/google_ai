const supabase = require('../utils/supabase');

const SKILL_MAP = {
  Food:      ['General', 'Logistics'],
  Health:    ['Medical'],
  Education: ['Teaching'],
  Shelter:   ['Logistics'],
};

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

function matchScore(volunteer, request, activeCount) {
  const required = SKILL_MAP[request.category] || [];
  const matched  = volunteer.skills.filter(s => required.includes(s));
  if (!matched.length) return null;

  let score = 0, reasons = [];
  const skillPts = matched.length === required.length ? 40 : 20;
  score += skillPts;
  reasons.push(`Skill match: ${matched.join(', ')} (${skillPts}pts)`);

  const sameCity = volunteer.city?.toLowerCase() === request.city?.toLowerCase();
  const dist     = distanceKm(volunteer.latitude, volunteer.longitude, request.latitude, request.longitude);
  if (sameCity)                        { score += 30; reasons.push('Same city (30pts)'); }
  else if (dist !== null && dist <= 50) { score += 15; reasons.push(`Within 50km (15pts)`); }
  else if (dist !== null && dist <= 100){ score += 5;  reasons.push(`Within 100km (5pts)`); }

  if (request.urgency === 3)      { const p = Math.min(volunteer.skills.length * 5, 20); score += p; reasons.push(`High urgency (${p}pts)`); }
  else if (request.urgency === 2) { score += 10; reasons.push('Medium urgency (10pts)'); }
  else                            { score += 5;  reasons.push('Low urgency (5pts)'); }

  const workloadPts = Math.max(0, 10 - activeCount * 3);
  score += workloadPts;
  if (workloadPts > 0) reasons.push(`Low workload (${workloadPts}pts)`);

  return { score: Math.min(score, 100), reasons, distance: dist, sameCity };
}

function fmtVol(v) {
  if (!v) return v;
  return {
    _id: v.id, skills: v.skills, availability: v.availability,
    availableSlots: v.available_slots, city: v.city, area: v.area,
    latitude: v.latitude, longitude: v.longitude,
    currentLatitude: v.current_latitude, currentLongitude: v.current_longitude,
    userId: v.users ? { _id: v.users.id, name: v.users.name, email: v.users.email } : v.user_id,
  };
}

function fmtAssignment(a) {
  if (!a) return a;
  return {
    _id: a.id, status: a.status, notes: a.notes, createdAt: a.created_at,
    requestId:   a.requests   ? { _id: a.requests.id,   ...a.requests }   : a.request_id,
    volunteerId: a.volunteers ? fmtVol(a.volunteers) : a.volunteer_id,
  };
}

// ── Register volunteer ─────────────────────────────────────────────────────
exports.registerVolunteer = async (req, res) => {
  try {
    const { userId, skills, availability, availableSlots, city, latitude, longitude } = req.body;
    const { data: existing } = await supabase.from('volunteers').select('id').eq('user_id', userId).single();
    if (existing) return res.status(400).json({ message: 'Volunteer profile already exists' });

    const { data, error } = await supabase.from('volunteers').insert({
      user_id: userId, skills, availability, available_slots: availableSlots || [],
      city, latitude: latitude || null, longitude: longitude || null,
    }).select().single();

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json(fmtVol(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get all volunteers ─────────────────────────────────────────────────────
exports.getVolunteers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('volunteers').select('*, users(id, name, email)');
    if (error) return res.status(500).json({ message: error.message });
    res.json(data.map(fmtVol));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get online volunteers ──────────────────────────────────────────────────
exports.getOnlineVolunteers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('volunteers').select('*, users(id, name, email)').eq('availability', true);
    if (error) return res.status(500).json({ message: error.message });
    res.json(data.map(fmtVol));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get my profile ─────────────────────────────────────────────────────────
exports.getMyProfile = async (req, res) => {
  try {
    const { data, error } = await supabase.from('volunteers').select('*, users(id, name, email)').eq('user_id', req.user._id).single();
    if (error) return res.json(null);
    res.json(fmtVol(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Update profile ─────────────────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, skills, city, area, availableSlots, latitude, longitude } = req.body;
    const userUpdate = {};
    if (name?.trim())  userUpdate.name  = name.trim();
    if (phone?.trim()) userUpdate.phone = phone.trim();
    if (Object.keys(userUpdate).length)
      await supabase.from('users').update(userUpdate).eq('id', req.user._id);

    const volUpdate = {};
    if (skills?.length)    volUpdate.skills          = skills;
    if (city?.trim())      volUpdate.city            = city.trim();
    if (area?.trim())      volUpdate.area            = area.trim();
    if (availableSlots)    volUpdate.available_slots = availableSlots;
    if (latitude  != null) volUpdate.latitude        = Number(latitude);
    if (longitude != null) volUpdate.longitude       = Number(longitude);

    const { data, error } = await supabase.from('volunteers')
      .update(volUpdate).eq('user_id', req.user._id).select('*, users(id, name, email)').single();
    if (error || !data) return res.status(404).json({ message: 'Volunteer profile not found' });
    res.json(fmtVol(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Toggle availability ────────────────────────────────────────────────────
exports.toggleAvailability = async (req, res) => {
  try {
    const { availability, latitude, longitude } = req.body;
    const isOnline = Boolean(availability);
    const update   = { availability: isOnline };
    if (isOnline && latitude != null && longitude != null) {
      update.current_latitude    = Number(latitude);
      update.current_longitude   = Number(longitude);
      update.last_location_update = new Date().toISOString();
    } else if (!isOnline) {
      update.current_latitude    = null;
      update.current_longitude   = null;
      update.last_location_update = null;
    }

    const { data, error } = await supabase.from('volunteers')
      .update(update).eq('user_id', req.user._id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Volunteer profile not found' });
    res.json({ availability: data.availability, currentLatitude: data.current_latitude, currentLongitude: data.current_longitude, nearbyCount: 0 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get nearby tasks ───────────────────────────────────────────────────────
exports.getNearbyTasks = async (req, res) => {
  try {
    const { data: vol } = await supabase.from('volunteers').select('*').eq('user_id', req.user._id).single();
    if (!vol) return res.status(404).json({ message: 'Volunteer profile not found' });

    const lat = req.query.lat ? Number(req.query.lat) : vol.current_latitude;
    const lng = req.query.lng ? Number(req.query.lng) : vol.current_longitude;
    if (!lat || !lng) return res.json([]);

    const { data: requests } = await supabase.from('requests').select('*').eq('status', 'Pending');
    const nearby = (requests || [])
      .filter(r => r.latitude && r.longitude)
      .map(r => ({ ...r, distanceKm: parseFloat(distanceKm(lat, lng, r.latitude, r.longitude).toFixed(2)) }))
      .filter(r => r.distanceKm <= 50)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json(nearby);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get all assignments ────────────────────────────────────────────────────
exports.getAssignments = async (req, res) => {
  try {
    const { data, error } = await supabase.from('assignments')
      .select('*, requests(id, title, category, city, area, status, priority_score, urgency, people_affected), volunteers(*, users(id, name, email))')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data.map(fmtAssignment));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Get my assignments ─────────────────────────────────────────────────────
exports.getMyAssignments = async (req, res) => {
  try {
    const { data: vol } = await supabase.from('volunteers').select('id').eq('user_id', req.user._id).single();
    if (!vol) return res.json([]);

    const { data, error } = await supabase.from('assignments')
      .select('*, requests(id, title, description, category, city, area, urgency, people_affected, priority_score, status, latitude, longitude)')
      .eq('volunteer_id', vol.id).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data.map(fmtAssignment));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Accept task ────────────────────────────────────────────────────────────
exports.acceptTask = async (req, res) => {
  try {
    const { data, error } = await supabase.from('assignments')
      .update({ status: 'Accepted' }).eq('id', req.body.assignmentId).select('*, requests(title)').single();
    if (error || !data) return res.status(404).json({ message: 'Assignment not found' });
    res.json(fmtAssignment(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Reject task ────────────────────────────────────────────────────────────
exports.rejectTask = async (req, res) => {
  try {
    const { data, error } = await supabase.from('assignments')
      .update({ status: 'Rejected' }).eq('id', req.body.assignmentId).select('*, requests(id, title)').single();
    if (error || !data) return res.status(404).json({ message: 'Assignment not found' });
    await supabase.from('requests').update({ status: 'Pending' }).eq('id', data.requests.id);
    res.json(fmtAssignment(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Complete task ──────────────────────────────────────────────────────────
exports.completeTask = async (req, res) => {
  try {
    const { data, error } = await supabase.from('assignments')
      .update({ status: 'Completed' }).eq('id', req.body.assignmentId).select('*, requests(id, title)').single();
    if (error || !data) return res.status(404).json({ message: 'Assignment not found' });
    await supabase.from('requests').update({ status: 'Resolved' }).eq('id', data.requests.id);
    res.json(fmtAssignment(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Respond to assignment ──────────────────────────────────────────────────
exports.respondToAssignment = async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!['Accepted', 'Rejected', 'Completed'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const { data, error } = await supabase.from('assignments')
      .update({ status, notes: notes || '' }).eq('id', req.params.id)
      .select('*, requests(id, title, status)').single();
    if (error || !data) return res.status(404).json({ message: 'Assignment not found' });

    if (status === 'Rejected')  await supabase.from('requests').update({ status: 'Pending' }).eq('id', data.requests.id);
    if (status === 'Completed') await supabase.from('requests').update({ status: 'Resolved' }).eq('id', data.requests.id);

    res.json(fmtAssignment(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Preview matching ───────────────────────────────────────────────────────
exports.previewMatching = async (req, res) => {
  try {
    const { data: pendingRequests } = await supabase.from('requests').select('*').eq('status', 'Pending').order('priority_score', { ascending: false });
    const { data: availableVols }   = await supabase.from('volunteers').select('*, users(id, name, email)').eq('availability', true);
    const { data: activeAssignments } = await supabase.from('assignments').select('volunteer_id').in('status', ['Assigned', 'Accepted']);

    const workloadMap = {};
    (activeAssignments || []).forEach(a => { workloadMap[a.volunteer_id] = (workloadMap[a.volunteer_id] || 0) + 1; });
    const alreadyAssigned = new Set((activeAssignments || []).map(a => a.volunteer_id));

    const proposals = (pendingRequests || []).map(request => {
      const candidates = (availableVols || [])
        .filter(v => !alreadyAssigned.has(v.id))
        .map(v => { const r = matchScore(v, request, workloadMap[v.id] || 0); return r ? { volunteer: fmtVol(v), ...r } : null; })
        .filter(Boolean).sort((a, b) => b.score - a.score);

      return { request, bestMatch: candidates[0] || null, allCandidates: candidates.slice(0, 3) };
    });

    res.json({ proposals, totalPending: (pendingRequests || []).length, totalVolunteers: (availableVols || []).length });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Run matching ───────────────────────────────────────────────────────────
exports.runMatching = async (req, res) => {
  try {
    const { data: pendingRequests }   = await supabase.from('requests').select('*').eq('status', 'Pending').order('priority_score', { ascending: false });
    const { data: availableVols }     = await supabase.from('volunteers').select('*').eq('availability', true);
    const { data: activeAssignments } = await supabase.from('assignments').select('volunteer_id').in('status', ['Assigned', 'Accepted']);

    const workloadMap = {};
    (activeAssignments || []).forEach(a => { workloadMap[a.volunteer_id] = (workloadMap[a.volunteer_id] || 0) + 1; });
    const assignedIds = new Set((activeAssignments || []).map(a => a.volunteer_id));

    const newAssignments = [], details = [];

    for (const request of (pendingRequests || [])) {
      const candidates = (availableVols || [])
        .filter(v => !assignedIds.has(v.id))
        .map(v => { const r = matchScore(v, request, workloadMap[v.id] || 0); return r ? { vol: v, ...r } : null; })
        .filter(Boolean).sort((a, b) => b.score - a.score);

      if (!candidates.length) continue;
      const best = candidates[0];

      const { data: assignment } = await supabase.from('assignments').insert({
        request_id: request.id, volunteer_id: best.vol.id,
        notes: `Auto-matched. Score: ${best.score}/100. ${best.reasons.join(' | ')}`,
      }).select().single();

      await supabase.from('requests').update({ status: 'In Progress' }).eq('id', request.id);
      assignedIds.add(best.vol.id);
      newAssignments.push(assignment);
      details.push({ requestTitle: request.title, score: best.score, reasons: best.reasons });
    }

    res.json({ matched: newAssignments.length, assignments: newAssignments, details });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Manual assign ──────────────────────────────────────────────────────────
exports.manualAssign = async (req, res) => {
  try {
    const { requestId, volunteerId } = req.body;
    if (!requestId || !volunteerId) return res.status(400).json({ message: 'requestId and volunteerId required' });

    const { data: existing } = await supabase.from('assignments')
      .select('id').eq('request_id', requestId).eq('volunteer_id', volunteerId).in('status', ['Assigned', 'Accepted']).single();
    if (existing) return res.status(400).json({ message: 'Already assigned' });

    const { data, error } = await supabase.from('assignments').insert({
      request_id: requestId, volunteer_id: volunteerId, notes: 'Manually assigned by admin',
    }).select('*, requests(id, title, category, city, urgency, priority_score), volunteers(*, users(id, name, email))').single();

    if (error) return res.status(500).json({ message: error.message });
    await supabase.from('requests').update({ status: 'In Progress' }).eq('id', requestId);
    res.status(201).json(fmtAssignment(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};
