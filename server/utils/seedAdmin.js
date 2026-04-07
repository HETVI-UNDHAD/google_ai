const User = require('../models/User');

const seedAdmin = async () => {
  const adminExists = await User.findOne({ email: 'admin@sras.com' });
  if (!adminExists) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@sras.com',
      password: 'Admin@1234',
      role: 'Admin',
    });
    console.log('Default admin created → email: admin@sras.com | password: Admin@1234');
  }

  const ngoExists = await User.findOne({ email: 'ngo@sras.com' });
  if (!ngoExists) {
    await User.create({
      name: 'NGO Manager',
      email: 'ngo@sras.com',
      password: 'Ngo@1234',
      role: 'NGO',
    });
    console.log('Default NGO created   → email: ngo@sras.com | password: Ngo@1234');
  }
};

module.exports = seedAdmin;
