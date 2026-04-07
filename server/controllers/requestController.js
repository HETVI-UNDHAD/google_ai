const XLSX    = require('xlsx');
const Request = require('../models/Request');

// GET /api/requests
exports.getAllRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    const requests = await Request.find(filter).populate('submittedBy', 'name email').sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/requests/sorted
exports.getSortedRequests = async (req, res) => {
  try {
    const requests = await Request.find().populate('submittedBy', 'name email').sort({ priorityScore: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/requests/:id
exports.getRequestById = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate('submittedBy', 'name email');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/requests
exports.createRequest = async (req, res) => {
  try {
    const { title, description, category, city, area, urgency, peopleAffected, latitude, longitude } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const request = await new Request({
      title, description, category, city, area,
      urgency: Number(urgency),
      peopleAffected: Number(peopleAffected),
      latitude:  latitude  ? Number(latitude)  : null,
      longitude: longitude ? Number(longitude) : null,
      imageUrl,
      submittedBy: req.user?._id || null,
    }).save();

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/requests/:id/status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await Request.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/requests/upload  — CSV / Excel
exports.uploadRequests = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const rows     = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) return res.status(400).json({ message: 'File is empty' });

    const docs = rows.map((row) => ({
      title:          row.title          || row.Title          || 'Untitled',
      description:    row.description    || row.Description    || '',
      category:       row.category       || row.Category       || 'Food',
      city:           row.city           || row.City           || 'Unknown',
      area:           row.area           || row.Area           || 'Unknown',
      urgency:        Number(row.urgency || row.Urgency)       || 1,
      peopleAffected: Number(row.peopleAffected || row.PeopleAffected) || 1,
      submittedBy:    req.user?._id || null,
    }));

    // Use save() per doc so pre-save hook fires for priorityScore
    const saved = await Promise.all(docs.map((d) => new Request(d).save()));
    res.status(201).json({ inserted: saved.length, requests: saved });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
