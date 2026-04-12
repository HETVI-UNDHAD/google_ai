const bcrypt   = require('bcryptjs');
const supabase = require('../utils/supabase');

const volunteers = [
  { name: 'Ravi Patel',   email: 'ravi@sras.com',   password: 'Ravi@1234',   city: 'Ahmedabad', skills: ['Medical', 'General'],   latitude: 23.03, longitude: 72.58 },
  { name: 'Priya Shah',   email: 'priya@sras.com',  password: 'Priya@1234',  city: 'Surat',     skills: ['Medical', 'Teaching'],  latitude: 21.18, longitude: 72.84 },
  { name: 'Amit Kumar',   email: 'amit@sras.com',   password: 'Amit@1234',   city: 'Vadodara',  skills: ['Teaching', 'General'],  latitude: 22.31, longitude: 73.19 },
  { name: 'Neha Joshi',   email: 'neha@sras.com',   password: 'Neha@1234',   city: 'Rajkot',    skills: ['Logistics', 'General'], latitude: 22.31, longitude: 70.81 },
  { name: 'Suresh Mehta', email: 'suresh@sras.com', password: 'Suresh@1234', city: 'Ahmedabad', skills: ['Logistics', 'General'], latitude: 22.98, longitude: 72.65 },
];

const seedVolunteers = async () => {
  const { count } = await supabase.from('volunteers').select('*', { count: 'exact', head: true });
  if (count > 0) return;

  for (const v of volunteers) {
    let { data: user } = await supabase.from('users').select('id').eq('email', v.email).single();
    if (!user) {
      const hashed = await bcrypt.hash(v.password, 10);
      const { data } = await supabase.from('users').insert({ name: v.name, email: v.email, password: hashed, role: 'Volunteer', phone: '' }).select().single();
      user = data;
    }
    await supabase.from('volunteers').insert({
      user_id: user.id, skills: v.skills, availability: true,
      available_slots: ['Morning', 'Evening'],
      city: v.city, latitude: v.latitude, longitude: v.longitude,
    });
  }
  console.log('Volunteers seeded (5 records)');
};

module.exports = seedVolunteers;
