const User = require('../models/User');

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit),
      User.countDocuments(),
    ]);
    res.json({ data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
