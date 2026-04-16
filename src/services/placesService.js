export async function fetchSafeHavens(centerLat, centerLng, radiusMeters = 5000) {
  // Queries Overpass API for hospitals, police stations, and 24/7 convenience stores
  const query = `
    [out:json][timeout:15];
    (
      nwr["amenity"="hospital"](around:${radiusMeters},${centerLat},${centerLng});
      nwr["amenity"="police"](around:${radiusMeters},${centerLat},${centerLng});
      nwr["shop"="convenience"]["opening_hours"="24/7"](around:${radiusMeters},${centerLat},${centerLng});
    );
    out center 15;
  `;

  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query,
    });
    
    if (!res.ok) throw new Error('Overpass API failed');
    
    const data = await res.json();
    return data.elements.map(e => {
      const lat = e.lat || e.center?.lat;
      const lng = e.lon || e.center?.lon;
      return {
        id: e.id,
        lat,
        lng,
        name: e.tags?.name || e.tags?.amenity || e.tags?.shop || 'Safe Haven',
        type: e.tags?.amenity || e.tags?.shop || 'safe_haven',
      };
    }).filter(e => e.lat && e.lng);
  } catch (err) {
    console.error('Failed to fetch safe havens:', err);
    return [];
  }
}
