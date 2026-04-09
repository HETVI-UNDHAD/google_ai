const INDIA_LOCATIONS = {
  Gujarat: {
    Ahmedabad: {
      cities: ['Ahmedabad'],
      areas: {
        Ahmedabad: [
          'Bapunagar','Navrangpura','Satellite','Bopal','Maninagar','Vatva',
          'Gota','Chandkheda','Nikol','Naroda','Vastral','Isanpur','Vejalpur',
          'Thaltej','Prahlad Nagar','Ambawadi','Ellis Bridge','Paldi',
          'Naranpura','Sabarmati','Ranip','Odhav','Shahibaug','Gomtipur',
        ],
      },
    },
    Surat: {
      cities: ['Surat'],
      areas: {
        Surat: [
          'Adajan','Vesu','Katargam','Udhna','Varachha','Piplod','Althan',
          'Pal','Dumas','Bhatar','Rander','Limbayat','Majura Gate','Nanpura',
          'Athwa','Citylight','Palanpur','Sachin','Hazira','Kamrej',
        ],
      },
    },
    Vadodara: {
      cities: ['Vadodara'],
      areas: {
        Vadodara: [
          'Alkapuri','Fatehgunj','Gotri','Manjalpur','Waghodia Road',
          'Karelibaug','Subhanpura','Sama','Harni','Makarpura',
          'Nizampura','Gorwa','Chhani','Tarsali','Akota',
          'Pratapnagar','Sayajigunj','Raopura',
        ],
      },
    },
    Rajkot: {
      cities: ['Rajkot'],
      areas: {
        Rajkot: [
          'Raiya','Kalawad Road','Mavdi','Kothariya','Bhaktinagar',
          'Aji Dam Road','University Road','Gondal Road','Pedak Road',
          'Tagore Road','150 Feet Ring Road','Metoda',
        ],
      },
    },
    Gandhinagar: {
      cities: ['Gandhinagar'],
      areas: {
        Gandhinagar: [
          'Sector 1','Sector 7','Sector 11','Sector 16','Sector 21',
          'Sector 28','Kudasan','Sargasan','Pethapur','Randesan',
        ],
      },
    },
    Bhavnagar: {
      cities: ['Bhavnagar'],
      areas: {
        Bhavnagar: [
          'Waghawadi Road','Crescent Circle','Kalanala','Atabhai Chowk',
          'Ghogha Circle','Nilambag','Sardarnagar','Shastrinagar',
        ],
      },
    },
    Jamnagar: {
      cities: ['Jamnagar'],
      areas: {
        Jamnagar: [
          'Bedi Gate','Digvijay Plot','Indira Nagar','Lal Bungalow',
          'Narayan Nagar','Patel Colony','Shastri Nagar',
        ],
      },
    },
    Junagadh: {
      cities: ['Junagadh','Keshod','Veraval'],
      areas: {
        Junagadh: ['Kalwa Chowk','Majewadi Gate','Dhal Rd','Ranavav','Bhesan'],
        Keshod:   ['Keshod Town','Keshod Airport Area'],
        Veraval:  ['Veraval Port','Sasan Gir Road','Prabhas Patan'],
      },
    },
    Kutch: {
      cities: ['Bhuj','Gandhidham','Anjar','Mandvi'],
      areas: {
        Bhuj:       ['Station Road','Bhujpur','Mirzapar','Madhapar'],
        Gandhidham: ['Sector 1','Sector 8','Adipur','Kandla Port'],
        Anjar:      ['Anjar Town','Anjar GIDC'],
        Mandvi:     ['Mandvi Beach','Mandvi Town'],
      },
    },
    Anand: {
      cities: ['Anand','Vallabh Vidyanagar','Karamsad'],
      areas: {
        Anand:               ['Anand Town','Grid Road','Station Road','Bakrol'],
        'Vallabh Vidyanagar':['VV Nagar Town','Karamsad Road'],
        Karamsad:            ['Karamsad Town'],
      },
    },
    Navsari: {
      cities: ['Navsari','Bilimora'],
      areas: {
        Navsari:  ['Navsari Town','Dudhia Talav','Sayaji Road'],
        Bilimora: ['Bilimora Town','Bilimora Station'],
      },
    },
    Mehsana: {
      cities: ['Mehsana','Unjha','Visnagar'],
      areas: {
        Mehsana:  ['Mehsana Town','Highway Road','GIDC Mehsana'],
        Unjha:    ['Unjha Town'],
        Visnagar: ['Visnagar Town'],
      },
    },
    Bharuch: {
      cities: ['Bharuch','Ankleshwar'],
      areas: {
        Bharuch:    ['Bharuch Town','Zadeshwar','Bharuch GIDC'],
        Ankleshwar: ['Ankleshwar GIDC','Ankleshwar Town'],
      },
    },
    Surendranagar: {
      cities: ['Surendranagar','Wadhwan','Dhrangadhra'],
      areas: {
        Surendranagar: ['Surendranagar Town','Wadhwan Road'],
        Wadhwan:       ['Wadhwan Town'],
        Dhrangadhra:   ['Dhrangadhra Town'],
      },
    },
    Patan: {
      cities: ['Patan','Sidhpur'],
      areas: {
        Patan:   ['Patan Town','Rani ki Vav Area'],
        Sidhpur: ['Sidhpur Town'],
      },
    },
    Dahod: {
      cities: ['Dahod'],
      areas: { Dahod: ['Dahod Town','Limkheda','Devgadh Baria'] },
    },
    Valsad: {
      cities: ['Valsad','Vapi'],
      areas: {
        Valsad: ['Valsad Town','Tithal Road'],
        Vapi:   ['Vapi GIDC','Vapi Town','Silvassa Road'],
      },
    },
    Amreli: {
      cities: ['Amreli','Rajula'],
      areas: {
        Amreli: ['Amreli Town','Savarkundla'],
        Rajula: ['Rajula Town','Rajula Port'],
      },
    },
    Porbandar: {
      cities: ['Porbandar'],
      areas: { Porbandar: ['Porbandar Town','Chowpatty','Kirti Mandir Area'] },
    },
    Morbi: {
      cities: ['Morbi','Wankaner'],
      areas: {
        Morbi:    ['Morbi Town','Ravapar Road','Morbi GIDC'],
        Wankaner: ['Wankaner Town'],
      },
    },
    Nadiad: {
      cities: ['Nadiad','Kheda'],
      areas: {
        Nadiad: ['Nadiad Town','College Road','Station Road'],
        Kheda:  ['Kheda Town'],
      },
    },
    Botad: {
      cities: ['Botad'],
      areas: { Botad: ['Botad Town','Gadhada'] },
    },
    Tapi: {
      cities: ['Vyara'],
      areas: { Vyara: ['Vyara Town','Songadh','Nizar'] },
    },
    Narmada: {
      cities: ['Rajpipla','Dediapada'],
      areas: {
        Rajpipla:  ['Rajpipla Town','Kevadia Colony'],
        Dediapada: ['Dediapada Town'],
      },
    },
    Dwarka: {
      cities: ['Dwarka','Okha'],
      areas: {
        Dwarka: ['Dwarka Town','Bet Dwarka','Nageshwar'],
        Okha:   ['Okha Port','Okha Town'],
      },
    },
  },
  Maharashtra: {
    Mumbai: {
      cities: ['Mumbai'],
      areas: {
        Mumbai: [
          'Andheri','Bandra','Borivali','Dadar','Dharavi','Goregaon',
          'Juhu','Kurla','Malad','Mulund','Powai','Vikhroli','Worli','Colaba',
        ],
      },
    },
    Pune: {
      cities: ['Pune','Pimpri-Chinchwad'],
      areas: {
        Pune:               ['Kothrud','Hadapsar','Wakad','Baner','Hinjewadi','Viman Nagar','Koregaon Park'],
        'Pimpri-Chinchwad': ['Pimpri','Chinchwad','Akurdi','Nigdi'],
      },
    },
    Nagpur: {
      cities: ['Nagpur'],
      areas: { Nagpur: ['Dharampeth','Sitabuldi','Sadar','Manish Nagar','Wardha Road'] },
    },
  },
  Rajasthan: {
    Jaipur: {
      cities: ['Jaipur'],
      areas: { Jaipur: ['Malviya Nagar','Vaishali Nagar','Mansarovar','C-Scheme','Tonk Road'] },
    },
    Jodhpur: {
      cities: ['Jodhpur'],
      areas: { Jodhpur: ['Ratanada','Paota','Sardarpura','Shastri Nagar'] },
    },
    Udaipur: {
      cities: ['Udaipur'],
      areas: { Udaipur: ['Fatehpura','Hiran Magri','Sukhadia Circle','Udaipole'] },
    },
  },
  'Madhya Pradesh': {
    Indore: {
      cities: ['Indore'],
      areas: { Indore: ['Vijay Nagar','Palasia','Rajwada','Scheme 54','AB Road'] },
    },
    Bhopal: {
      cities: ['Bhopal'],
      areas: { Bhopal: ['Arera Colony','Kolar Road','Habibganj','MP Nagar'] },
    },
  },
  Karnataka: {
    Bangalore: {
      cities: ['Bangalore'],
      areas: { Bangalore: ['Koramangala','Indiranagar','Whitefield','HSR Layout','Jayanagar','Marathahalli'] },
    },
    Mysore: {
      cities: ['Mysore'],
      areas: { Mysore: ['Vijayanagar','Kuvempunagar','Hebbal','Nazarbad'] },
    },
  },
  'Tamil Nadu': {
    Chennai: {
      cities: ['Chennai'],
      areas: { Chennai: ['Anna Nagar','T Nagar','Adyar','Velachery','Porur','Tambaram'] },
    },
    Coimbatore: {
      cities: ['Coimbatore'],
      areas: { Coimbatore: ['RS Puram','Gandhipuram','Peelamedu','Saibaba Colony'] },
    },
  },
  'Uttar Pradesh': {
    Lucknow: {
      cities: ['Lucknow'],
      areas: { Lucknow: ['Hazratganj','Gomti Nagar','Aliganj','Indira Nagar','Alambagh'] },
    },
    Agra: {
      cities: ['Agra'],
      areas: { Agra: ['Taj Ganj','Sikandra','Kamla Nagar','Shahganj'] },
    },
    Varanasi: {
      cities: ['Varanasi'],
      areas: { Varanasi: ['Assi Ghat','Lanka','Sigra','Cantonment'] },
    },
  },
  Delhi: {
    'New Delhi': {
      cities: ['New Delhi','Dwarka','Rohini'],
      areas: {
        'New Delhi': ['Connaught Place','Karol Bagh','Lajpat Nagar','Saket','Vasant Kunj'],
        Dwarka:      ['Sector 10','Sector 12','Sector 21','Uttam Nagar'],
        Rohini:      ['Sector 3','Sector 7','Sector 11','Sector 16'],
      },
    },
  },
};

export const STATES       = Object.keys(INDIA_LOCATIONS).sort();
export const getDistricts = (state) => Object.keys(INDIA_LOCATIONS[state] || {}).sort();
export const getCities    = (state, district) => INDIA_LOCATIONS[state]?.[district]?.cities || [];
export const getAreas     = (state, district, city) => INDIA_LOCATIONS[state]?.[district]?.areas?.[city] || [];

export default INDIA_LOCATIONS;
