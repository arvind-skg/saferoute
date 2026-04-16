// Chennai Safety Data for Women Safety Mode

export const chennaiDangerZones = [
  {
    id: 'danger_ennore',
    name: 'Ennore Industrial Stretch',
    lat: 13.2166,
    lng: 80.3283,
    radius: 3000, // Very large industrial zone, poorly lit
    description: 'Isolated industrial area with heavy truck traffic and poor lighting at night.',
  },
  {
    id: 'danger_maduravoyal',
    name: 'Maduravoyal Bypass',
    lat: 13.0642,
    lng: 80.1652,
    radius: 2000,
    description: 'Long highway stretches with minimal residential presence and occasional lack of streetlights.',
  },
  {
    id: 'danger_pallikaranai',
    name: 'Pallikaranai Marsh Road',
    lat: 12.9298,
    lng: 80.2132,
    radius: 2500,
    description: 'Dark, isolated stretch alongside the marshland. Historically higher risk at late hours.',
  },
  {
    id: 'danger_sriperumbudur',
    name: 'Sriperumbudur Highway',
    lat: 12.9675,
    lng: 79.9468,
    radius: 3500,
    description: 'Outskirts highway limits with low police patrolling late at night.',
  }
];

export const chennaiSafeZones = [
  {
    id: 'safe_anna_nagar',
    name: 'Anna Nagar Tower Area',
    lat: 13.0844,
    lng: 80.2104,
    radius: 1500,
    description: 'Well-lit residential area with active police patrol and high commercial activity.',
  },
  {
    id: 'safe_besant_nagar',
    name: 'Besant Nagar (Elliot\'s Beach)',
    lat: 13.0002,
    lng: 80.2737,
    radius: 1200,
    description: 'Bustling area with strong community presence and active policing.',
  },
  {
    id: 'safe_t_nagar',
    name: 'Pondy Bazaar / T. Nagar',
    lat: 13.0405,
    lng: 80.2337,
    radius: 1500,
    description: 'Extremely busy commercial hub, well-lit with CCTV surveillance.',
  },
  {
    id: 'safe_mylapore',
    name: 'Mylapore Temple Zone',
    lat: 13.0335,
    lng: 80.2698,
    radius: 1000,
    description: 'Dense residential and cultural hub with continuous activity.',
  },
  {
    id: 'safe_tidel',
    name: 'Tidel Park / OMR Entry',
    lat: 12.9896,
    lng: 80.2483,
    radius: 1000,
    description: 'High security IT corridor junction with 24/7 activity.',
  }
];
