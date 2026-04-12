const jwt     = require('jsonwebtoken');
const bcrypt  = require('bcryptjs');
const supabase = require('../utils/supabase');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const { data: user, error } = await supabase
      .from('users')
      .insert({ name, email, password: hashed, role: role || 'Volunteer', phone: '' })
      .select().single();

    if (error) return res.status(500).json({ message: error.message });

    res.status(201).json({
      _id: user.id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user.id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user } = await supabase
      .from('users').select('*').eq('email', email).single();

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user.id, name: user.name, email: user.email,
      role: user.role, token: generateToken(user.id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
