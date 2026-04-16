// OSRM Routing Service - uses the free OSRM demo server
const OSRM_BASE = 'https://router.project-osrm.org';

export async function getRoutes(startLat, startLng, endLat, endLng, waypoints = []) {
  const coords = [
    `${startLng},${startLat}`,
    ...waypoints.map(w => `${w.lng},${w.lat}`),
    `${endLng},${endLat}`
  ].join(';');
  const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=true&steps=true`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }
    
    return data.routes.map((route, index) => ({
      id: index,
      geometry: route.geometry,
      coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), // [lat, lng]
      distance: route.distance, // meters
      duration: route.duration, // seconds
      steps: parseSteps(route.legs[0]?.steps || []),
      summary: route.legs[0]?.summary || '',
    }));
  } catch (err) {
    console.error('Routing error:', err);
    throw err;
  }
}

function parseSteps(steps) {
  return steps.map((step, i) => ({
    id: i,
    instruction: buildInstruction(step),
    distance: step.distance,
    duration: step.duration,
    maneuver: step.maneuver,
    name: step.name || 'unnamed road',
    geometry: step.geometry,
    coordinates: step.geometry?.coordinates?.map(c => [c[1], c[0]]) || [],
  }));
}

function buildInstruction(step) {
  const m = step.maneuver;
  const name = step.name ? ` onto ${step.name}` : '';
  
  switch (m.type) {
    case 'depart': return `Head ${m.modifier || 'north'}${name}`;
    case 'arrive': return 'You have arrived at your destination';
    case 'turn': return `Turn ${m.modifier}${name}`;
    case 'merge': return `Merge ${m.modifier}${name}`;
    case 'fork': return `Keep ${m.modifier} at fork${name}`;
    case 'roundabout': return `Enter roundabout and take exit${name}`;
    case 'rotary': return `Enter rotary${name}`;
    case 'new name': return `Continue${name}`;
    case 'end of road': return `Turn ${m.modifier}${name}`;
    default: return `Continue${name}`;
  }
}

// Geocoding using Nominatim (free)
export async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    return data.map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      shortName: item.display_name.split(',').slice(0, 2).join(','),
    }));
  } catch (err) {
    console.error('Geocoding error:', err);
    return [];
  }
}

// Reverse geocoding
export async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  
  try {
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en' }
    });
    const data = await res.json();
    return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export function formatDistance(meters) {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

export function formatDuration(seconds) {
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
}
