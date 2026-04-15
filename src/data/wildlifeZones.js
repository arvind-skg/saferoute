// Wildlife/Animal crossing zones
export const wildlifeZones = [
  { id: 1, lat: 28.7200, lng: 77.1200, radius: 2000, animal: 'deer', name: 'Ridge Forest Area', description: 'Nilgai and deer crossing zone', frequency: 'high' },
  { id: 2, lat: 28.5500, lng: 77.1700, radius: 1500, animal: 'cattle', name: 'South Delhi Rural Belt', description: 'Stray cattle crossing area', frequency: 'medium' },
  { id: 3, lat: 28.3800, lng: 77.3200, radius: 2500, animal: 'deer', name: 'Aravalli Foothills', description: 'Wildlife corridor - deer and nilgai', frequency: 'high' },
  { id: 4, lat: 19.2200, lng: 72.9800, radius: 3000, animal: 'leopard', name: 'Sanjay Gandhi National Park', description: 'Leopard and deer crossing zone', frequency: 'medium' },
  { id: 5, lat: 12.9500, lng: 77.4500, radius: 2000, animal: 'elephant', name: 'Bannerghatta Road', description: 'Elephant crossing corridor', frequency: 'low' },
  { id: 6, lat: 40.8000, lng: -73.9600, radius: 1500, animal: 'deer', name: 'Central Park North', description: 'Urban wildlife zone', frequency: 'low' },
  { id: 7, lat: 34.1200, lng: -118.3000, radius: 3000, animal: 'coyote', name: 'Griffith Park Area', description: 'Coyote and deer crossing', frequency: 'medium' },
  { id: 8, lat: 37.7700, lng: -122.4600, radius: 2000, animal: 'deer', name: 'Golden Gate Park', description: 'Deer crossing zone', frequency: 'low' },
  { id: 9, lat: 51.5400, lng: -0.1700, radius: 1500, animal: 'fox', name: 'Regent\'s Park', description: 'Urban fox crossing area', frequency: 'medium' },
];

export function isInWildlifeZone(lat, lng) {
  for (const zone of wildlifeZones) {
    const dist = getDistance(lat, lng, zone.lat, zone.lng);
    if (dist <= zone.radius) {
      return zone;
    }
  }
  return null;
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
