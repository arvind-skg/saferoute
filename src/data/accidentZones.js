// Simulated accident-prone zones for demo
// Each zone has center coordinates, radius, severity, and description
export const accidentZones = [
  // Delhi NCR
  { id: 1, lat: 28.6139, lng: 77.2090, radius: 800, severity: 'high', name: 'Connaught Place Junction', description: 'High traffic intersection, frequent rear-end collisions', incidents: 47 },
  { id: 2, lat: 28.5355, lng: 77.2510, radius: 600, severity: 'high', name: 'Nehru Place Flyover', description: 'Accident-prone flyover exit', incidents: 38 },
  { id: 3, lat: 28.6304, lng: 77.2177, radius: 500, severity: 'medium', name: 'Karol Bagh Market', description: 'Congested market area with pedestrian conflicts', incidents: 25 },
  { id: 4, lat: 28.6692, lng: 77.4538, radius: 700, severity: 'high', name: 'NH-24 Ghaziabad Entry', description: 'Highway merge point with frequent accidents', incidents: 52 },
  { id: 5, lat: 28.4595, lng: 77.0266, radius: 900, severity: 'high', name: 'Gurugram-Delhi Expressway', description: 'High-speed corridor with fog-related incidents', incidents: 61 },
  
  // Mumbai
  { id: 6, lat: 19.0760, lng: 72.8777, radius: 600, severity: 'high', name: 'Mumbai Central Junction', description: 'Dense traffic hub', incidents: 43 },
  { id: 7, lat: 19.0596, lng: 72.8295, radius: 500, severity: 'medium', name: 'Worli Sea Link Approach', description: 'High-speed merging zone', incidents: 28 },
  { id: 8, lat: 19.1136, lng: 72.8697, radius: 700, severity: 'high', name: 'Western Express Highway', description: 'Multi-lane highway with frequent lane-change accidents', incidents: 55 },

  // Bangalore
  { id: 9, lat: 12.9716, lng: 77.5946, radius: 500, severity: 'medium', name: 'MG Road Signal', description: 'Heavy pedestrian crossing zone', incidents: 22 },
  { id: 10, lat: 12.9352, lng: 77.6245, radius: 600, severity: 'high', name: 'Silk Board Junction', description: 'Infamous congestion and accident hotspot', incidents: 48 },
  { id: 11, lat: 13.0358, lng: 77.5970, radius: 800, severity: 'high', name: 'Hebbal Flyover', description: 'Complex interchange with merge conflicts', incidents: 41 },

  // Generic highway zones
  { id: 12, lat: 28.7041, lng: 77.1025, radius: 1200, severity: 'high', name: 'NH-44 Stretch', description: 'High-speed national highway with poor lighting', incidents: 67 },
  { id: 13, lat: 28.4089, lng: 77.3178, radius: 1000, severity: 'medium', name: 'Faridabad Bypass', description: 'Sharp curves with limited visibility', incidents: 33 },
  
  // US Demo zones
  { id: 14, lat: 40.7580, lng: -73.9855, radius: 400, severity: 'high', name: 'Times Square Area', description: 'Extreme pedestrian-vehicle conflicts', incidents: 89 },
  { id: 15, lat: 40.7484, lng: -73.9857, radius: 300, severity: 'medium', name: 'Herald Square', description: 'Busy commercial intersection', incidents: 34 },
  { id: 16, lat: 34.0522, lng: -118.2437, radius: 600, severity: 'high', name: 'Downtown LA Interchange', description: 'Multi-highway junction point', incidents: 72 },
  { id: 17, lat: 37.7749, lng: -122.4194, radius: 500, severity: 'medium', name: 'SF Market Street', description: 'Mixed-mode traffic conflict zone', incidents: 29 },

  // London
  { id: 18, lat: 51.5074, lng: -0.1278, radius: 400, severity: 'medium', name: 'Westminster Bridge', description: 'Tourist congestion area', incidents: 31 },
  { id: 19, lat: 51.5155, lng: -0.1410, radius: 500, severity: 'high', name: 'Oxford Circus', description: 'Pedestrian-heavy junction', incidents: 45 },
];

// Generate heatmap data points from accident zones
export function generateHeatmapData() {
  const points = [];
  accidentZones.forEach(zone => {
    const intensity = zone.severity === 'high' ? 1.0 : zone.severity === 'medium' ? 0.6 : 0.3;
    // Generate cluster of points around each zone
    const numPoints = zone.incidents || 20;
    for (let i = 0; i < numPoints; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * (zone.radius / 111000); // Convert meters to degrees approx
      points.push([
        zone.lat + r * Math.cos(angle),
        zone.lng + r * Math.sin(angle),
        intensity * (0.5 + Math.random() * 0.5)
      ]);
    }
  });
  return points;
}

// Check if a point is in an accident zone
export function isInAccidentZone(lat, lng) {
  for (const zone of accidentZones) {
    const dist = getDistance(lat, lng, zone.lat, zone.lng);
    if (dist <= zone.radius) {
      return zone;
    }
  }
  return null;
}

// Haversine distance in meters
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
