const supabase = require('../utils/supabase');

function calcPriority(urgency, peopleAffected, createdAt) {
  const base     = Math.pow(urgency, 2) * 10;
  const people   = Math.log10((peopleAffected || 1) + 1) * 20;
  const hoursOld = (Date.now() - new Date(createdAt || Date.now())) / 3600000;
  const ageBonus = Math.min(hoursOld * 0.5, 100);
  return Math.round(base + people + ageBonus);
}

// GET /api/requests
exports.getAllRequests = async (req, res) => {
  try {
    let query = supabase.from('requests').select('*, users(id, name, email)').order('created_at', { ascending: false });
    if (req.query.status)   query = query.eq('status', req.query.status);
    if (req.query.category) query = query.eq('category', req.query.category);
    const { data, error } = await query;
    if (error) return res.status(500).json({ message: error.message });
    res.json(data.map(formatRequest));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/requests/sorted
exports.getSortedRequests = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('requests').select('*, users(id, name, email)').order('priority_score', { ascending: false });
    if (error) return res.status(500).json({ message: error.message });
    res.json(data.map(formatRequest));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// GET /api/requests/:id
exports.getRequestById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('requests').select('*, users(id, name, email)').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ message: 'Request not found' });
    res.json(formatRequest(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    const { title, description, category, city, area, urgency, peopleAffected, latitude, longitude } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const score    = calcPriority(Number(urgency), Number(peopleAffected), new Date());

    const { data, error } = await supabase.from('requests').insert({
      title, description, category, city, area,
      urgency:         Number(urgency),
      people_affected: Number(peopleAffected),
      priority_score:  score,
      latitude:        latitude  ? Number(latitude)  : null,
      longitude:       longitude ? Number(longitude) : null,
      image_url:       imageUrl,
      submitted_by:    req.user?._id || null,
      status:          'Pending',
    }).select().single();

    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json(formatRequest(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// PATCH /api/requests/:id/status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('requests').update({ status: req.body.status }).eq('id', req.params.id).select().single();
    if (error || !data) return res.status(404).json({ message: 'Request not found' });
    res.json(formatRequest(data));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// POST /api/requests/upload
exports.uploadRequests = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    let XLSX;
    try { XLSX = require('xlsx'); } catch {
      return res.status(500).json({ message: 'xlsx package not installed' });
    }
    const workbook = XLSX.readFile(req.file.path);
    const rows     = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    if (!rows.length) return res.status(400).json({ message: 'File is empty' });

    const docs = rows.map((row) => {
      const urgency        = Number(row.urgency || row.Urgency) || 1;
      const peopleAffected = Number(row.peopleAffected || row.PeopleAffected) || 1;
      return {
        title:           row.title       || row.Title       || 'Untitled',
        description:     row.description || row.Description || '',
        category:        row.category    || row.Category    || 'Food',
        city:            row.city        || row.City        || 'Unknown',
        area:            row.area        || row.Area        || 'Unknown',
        urgency, people_affected: peopleAffected,
        priority_score:  calcPriority(urgency, peopleAffected, new Date()),
        submitted_by:    req.user?._id || null,
        status:          'Pending',
      };
    });

    const { data, error } = await supabase.from('requests').insert(docs).select();
    if (error) return res.status(500).json({ message: error.message });
    res.status(201).json({ inserted: data.length, requests: data.map(formatRequest) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// map snake_case DB columns → camelCase for frontend compatibility
function formatRequest(r) {
  if (!r) return r;
  return {
    _id:            r.id,
    title:          r.title,
    description:    r.description,
    category:       r.category,
    city:           r.city,
    area:           r.area,
    urgency:        r.urgency,
    peopleAffected: r.people_affected,
    priorityScore:  r.priority_score,
    imageUrl:       r.image_url,
    status:         r.status,
    latitude:       r.latitude,
    longitude:      r.longitude,
    submittedBy:    r.users ? { _id: r.users.id, name: r.users.name, email: r.users.email } : r.submitted_by,
    createdAt:      r.created_at,
    updatedAt:      r.updated_at,
  };
}
