const supabase = require('../utils/supabase');

const requests = [
  { title: 'Food shortage in slum',  description: 'Daily wage workers lack food',  category: 'Food',      city: 'Ahmedabad', area: 'Bapunagar', urgency: 3, people_affected: 120 },
  { title: 'Medical camp required',  description: 'No doctors available',           category: 'Health',    city: 'Surat',     area: 'Adajan',    urgency: 3, people_affected: 80  },
  { title: 'School supplies needed', description: 'Children need books',            category: 'Education', city: 'Vadodara',  area: 'Alkapuri',  urgency: 2, people_affected: 50  },
  { title: 'Flood shelter needed',   description: 'Families displaced',             category: 'Shelter',   city: 'Rajkot',    area: 'Raiya',     urgency: 3, people_affected: 200 },
  { title: 'Water shortage',         description: 'No clean drinking water',        category: 'Food',      city: 'Ahmedabad', area: 'Navrangpura',urgency: 2, people_affected: 90 },
  { title: 'Health awareness',       description: 'Hygiene awareness needed',       category: 'Health',    city: 'Surat',     area: 'Vesu',      urgency: 1, people_affected: 40  },
];

const seedRequests = async () => {
  const { count } = await supabase.from('requests').select('*', { count: 'exact', head: true });
  if (count > 0) return;

  const docs = requests.map(r => ({
    ...r,
    priority_score: Math.round(Math.pow(r.urgency, 2) * 10 + Math.log10(r.people_affected + 1) * 20),
    status: 'Pending',
  }));

  await supabase.from('requests').insert(docs);
  console.log('Requests seeded (6 records)');
};

module.exports = seedRequests;
