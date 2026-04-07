const Request = require('../models/Request');

const predefinedRequests = [
  { title: 'Food shortage in Bapunagar',    description: 'Severe lack of food supplies for 120 families after flooding', category: 'Food',      city: 'Ahmedabad', area: 'Bapunagar', urgency: 3, peopleAffected: 120, latitude: 23.0225, longitude: 72.5714 },
  { title: 'Medical camp needed urgently',  description: 'No doctors available, 80 patients need immediate attention',   category: 'Health',    city: 'Surat',     area: 'Adajan',    urgency: 3, peopleAffected: 80,  latitude: 21.1702, longitude: 72.8311 },
  { title: 'School supplies for children',  description: 'Children need books and stationery to resume education',       category: 'Education', city: 'Vadodara',  area: 'Alkapuri',  urgency: 2, peopleAffected: 50,  latitude: 22.3072, longitude: 73.1812 },
  { title: 'Flood shelter for families',    description: '200 families displaced by floods need emergency shelter',      category: 'Shelter',   city: 'Rajkot',    area: 'Raiya',     urgency: 3, peopleAffected: 200, latitude: 22.3039, longitude: 70.8022 },
  { title: 'Clean water distribution',      description: 'Contaminated water supply affecting 300 residents',           category: 'Health',    city: 'Ahmedabad', area: 'Vatva',     urgency: 3, peopleAffected: 300, latitude: 22.9734, longitude: 72.6446 },
  { title: 'Winter clothing drive',         description: 'Elderly and children need warm clothing for winter',          category: 'Shelter',   city: 'Surat',     area: 'Katargam',  urgency: 2, peopleAffected: 90,  latitude: 21.2200, longitude: 72.8400 },
];

const seedRequests = async () => {
  const count = await Request.countDocuments();
  if (count > 0) return;
  await Promise.all(predefinedRequests.map((d) => new Request(d).save()));
  console.log('Predefined requests seeded (6 records)');
};

module.exports = seedRequests;
