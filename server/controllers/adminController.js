const supabase = require('../utils/supabase');

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('users').select('id, name, email, role, phone, created_at', { count: 'exact' })
      .order('created_at', { ascending: false }).range(from, from + limit - 1);

    if (error) return res.status(500).json({ message: error.message });

    res.json({
      data: data.map(u => ({ _id: u.id, ...u })),
      total: count, page, pages: Math.ceil(count / limit),
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
