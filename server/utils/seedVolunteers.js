const User      = require('../models/User');
const Volunteer = require('../models/Volunteer');

const sampleVolunteers = [
  { name: 'Ravi Patel',   email: 'ravi@sras.com',   password: 'Ravi@1234',   city: 'Ahmedabad', skills: ['Medical', 'General'],    latitude: 23.0300, longitude: 72.5800 },
  { name: 'Priya Shah',   email: 'priya@sras.com',  password: 'Priya@1234',  city: 'Surat',     skills: ['Medical', 'Teaching'],   latitude: 21.1800, longitude: 72.8400 },
  { name: 'Amit Kumar',   email: 'amit@sras.com',   password: 'Amit@1234',   city: 'Vadodara',  skills: ['Teaching', 'General'],   latitude: 22.3100, longitude: 73.1900 },
  { name: 'Neha Joshi',   email: 'neha@sras.com',   password: 'Neha@1234',   city: 'Rajkot',    skills: ['Logistics', 'General'],  latitude: 22.3100, longitude: 70.8100 },
  { name: 'Suresh Mehta', email: 'suresh@sras.com', password: 'Suresh@1234', city: 'Ahmedabad', skills: ['Logistics', 'General'],  latitude: 22.9800, longitude: 72.6500 },
];

const seedVolunteers = async () => {
  const count = await Volunteer.countDocuments();
  if (count > 0) return;

  for (const v of sampleVolunteers) {
    let user = await User.findOne({ email: v.email });
    if (!user) {
      user = await User.create({ name: v.name, email: v.email, password: v.password, role: 'Volunteer' });
    }
    await Volunteer.create({
      userId: user._id, skills: v.skills, availability: true,
      availableSlots: ['Morning', 'Evening'],
      city: v.city, latitude: v.latitude, longitude: v.longitude,
    });
  }
  console.log('Sample volunteers seeded (5 records)');
};

module.exports = seedVolunteers;
