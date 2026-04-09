const Request = require('../models/Request');

const predefinedRequests = [
  {
    title: 'Food shortage in slum',
    description: 'Daily wage workers lack food',
    category: 'Food',
    city: 'Ahmedabad',
    area: 'Bapunagar',
    urgency: 3,
    peopleAffected: 120,
  },
  {
    title: 'Medical camp required',
    description: 'No doctors available',
    category: 'Health',
    city: 'Surat',
    area: 'Adajan',
    urgency: 3,
    peopleAffected: 80,
  },
  {
    title: 'School supplies needed',
    description: 'Children need books',
    category: 'Education',
    city: 'Vadodara',
    area: 'Alkapuri',
    urgency: 2,
    peopleAffected: 50,
  },
  {
    title: 'Flood shelter needed',
    description: 'Families displaced',
    category: 'Shelter',
    city: 'Rajkot',
    area: 'Raiya',
    urgency: 3,
    peopleAffected: 200,
  },
  {
    title: 'Water shortage',
    description: 'No clean drinking water',
    category: 'Food',
    city: 'Ahmedabad',
    area: 'Navrangpura',
    urgency: 2,
    peopleAffected: 90,
  },
  {
    title: 'Health awareness',
    description: 'Hygiene awareness needed',
    category: 'Health',
    city: 'Surat',
    area: 'Vesu',
    urgency: 1,
    peopleAffected: 40,
  },
];

const seedRequests = async () => {
  const count = await Request.countDocuments();
  if (count > 0) return;
  await Promise.all(predefinedRequests.map((d) => new Request(d).save()));
  console.log('Predefined requests seeded (6 records)');
};

module.exports = seedRequests;
