const bcrypt   = require('bcryptjs');
const supabase = require('../utils/supabase');

const seedAdmin = async () => {
  const accounts = [
    { name: 'Super Admin', email: 'admin@sras.com', password: 'Admin@1234', role: 'Admin' },
    { name: 'NGO Manager', email: 'ngo@sras.com',   password: 'Ngo@1234',   role: 'NGO'   },
  ];

  for (const acc of accounts) {
    const { data: existing } = await supabase.from('users').select('id').eq('email', acc.email).single();
    if (!existing) {
      const hashed = await bcrypt.hash(acc.password, 10);
      await supabase.from('users').insert({ name: acc.name, email: acc.email, password: hashed, role: acc.role, phone: '' });
      console.log(`Seeded: ${acc.email}`);
    }
  }
};

module.exports = seedAdmin;
