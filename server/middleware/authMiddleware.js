const jwt      = require('jsonwebtoken');
const supabase  = require('../utils/supabase');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user } = await supabase
      .from('users').select('id, name, email, role, phone').eq('id', decoded.id).single();

    if (!user) return res.status(401).json({ message: 'User not found' });

    req.user = { _id: user.id, ...user };
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' });
  next();
};

module.exports = { protect, authorizeRoles };
