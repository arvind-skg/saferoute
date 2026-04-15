// Risk Engine - Simulated AI for route risk scoring
import { accidentZones } from '../data/accidentZones.js';
import { wildlifeZones } from '../data/wildlifeZones.js';

// Calculate risk score for an entire route (0-100, higher = more dangerous)
export function calculateRouteRisk(route, options = {}) {
  const { timeOfDay = new Date().getHours(), weather = 'clear', trafficDensity = 'moderate' } = options;
  
  const coords = route.coordinates || [];
  if (coords.length < 2) return { score: 0, level: 'low', factors: {} };

  // Factor 1: Accident zone proximity
  let accidentScore = 0;
  let accidentZoneCount = 0;
  coords.forEach(([lat, lng]) => {
    for (const zone of accidentZones) {
      const dist = getDistance(lat, lng, zone.lat, zone.lng);
      if (dist < zone.radius * 1.5) {
        const proximity = 1 - (dist / (zone.radius * 1.5));
        const severityMult = zone.severity === 'high' ? 1.0 : zone.severity === 'medium' ? 0.6 : 0.3;
        accidentScore += proximity * severityMult;
        if (dist < zone.radius) accidentZoneCount++;
      }
    }
  });
  accidentScore = Math.min(accidentScore / coords.length * 100, 40);

  // Factor 2: Time of day
  let timeFactor = 0;
  if (timeOfDay >= 22 || timeOfDay < 5) timeFactor = 20; // Night - high risk
  else if (timeOfDay >= 17 && timeOfDay < 22) timeFactor = 10; // Evening rush
  else if (timeOfDay >= 7 && timeOfDay < 10) timeFactor = 8; // Morning rush
  else timeFactor = 3;

  // Factor 3: Weather
  let weatherFactor = 0;
  switch (weather) {
    case 'rain': weatherFactor = 15; break;
    case 'heavy_rain': weatherFactor = 25; break;
    case 'fog': weatherFactor = 20; break;
    case 'snow': weatherFactor = 30; break;
    case 'storm': weatherFactor = 35; break;
    default: weatherFactor = 0;
  }

  // Factor 4: Traffic density
  let trafficFactor = 0;
  switch (trafficDensity) {
    case 'low': trafficFactor = 2; break;
    case 'moderate': trafficFactor = 8; break;
    case 'high': trafficFactor = 15; break;
    case 'very_high': trafficFactor = 22; break;
    default: trafficFactor = 5;
  }

  // Factor 5: Route characteristics (distance-based complexity)
  const distKm = (route.distance || 0) / 1000;
  let distanceFactor = Math.min(distKm * 0.3, 10);

  // Factor 6: Wildlife zones
  let wildlifeFactor = 0;
  coords.forEach(([lat, lng]) => {
    for (const zone of wildlifeZones) {
      const dist = getDistance(lat, lng, zone.lat, zone.lng);
      if (dist < zone.radius) {
        wildlifeFactor += zone.frequency === 'high' ? 2 : zone.frequency === 'medium' ? 1 : 0.5;
      }
    }
  });
  wildlifeFactor = Math.min(wildlifeFactor / coords.length * 50, 10);

  const totalScore = Math.min(
    accidentScore + timeFactor + weatherFactor + trafficFactor + distanceFactor + wildlifeFactor,
    100
  );

  const level = totalScore < 30 ? 'low' : totalScore < 60 ? 'medium' : 'high';

  return {
    score: Math.round(totalScore),
    level,
    accidentZoneCount,
    factors: {
      accidentProximity: Math.round(accidentScore),
      timeOfDay: timeFactor,
      weather: weatherFactor,
      traffic: trafficFactor,
      routeComplexity: Math.round(distanceFactor),
      wildlife: Math.round(wildlifeFactor),
    }
  };
}

// Get risk level for a specific point on the route
export function getPointRisk(lat, lng, options = {}) {
  const { timeOfDay = new Date().getHours(), weather = 'clear' } = options;
  
  let risk = 10; // Base risk

  // Check accident zones
  for (const zone of accidentZones) {
    const dist = getDistance(lat, lng, zone.lat, zone.lng);
    if (dist < zone.radius) {
      risk += zone.severity === 'high' ? 40 : zone.severity === 'medium' ? 25 : 15;
    } else if (dist < zone.radius * 2) {
      risk += 10;
    }
  }

  // Time factor
  if (timeOfDay >= 22 || timeOfDay < 5) risk += 15;
  else if (timeOfDay >= 17 || timeOfDay < 10) risk += 5;

  // Weather
  if (weather === 'rain') risk += 10;
  if (weather === 'fog') risk += 15;
  if (weather === 'heavy_rain') risk += 20;

  return Math.min(Math.round(risk), 100);
}

// Generate segment-level risk for route coloring
export function getRouteSegmentRisks(route, options = {}) {
  const coords = route.coordinates || [];
  const segmentSize = Math.max(1, Math.floor(coords.length / 20));
  const segments = [];

  for (let i = 0; i < coords.length; i += segmentSize) {
    const segCoords = coords.slice(i, i + segmentSize + 1);
    const midIdx = Math.floor(segCoords.length / 2);
    const [lat, lng] = segCoords[midIdx] || segCoords[0];
    const risk = getPointRisk(lat, lng, options);
    segments.push({
      coordinates: segCoords,
      risk,
      level: risk < 30 ? 'low' : risk < 60 ? 'medium' : 'high',
      color: risk < 30 ? '#22c55e' : risk < 60 ? '#f59e0b' : '#ef4444',
    });
  }

  return segments;
}

// Classify route types
export function classifyRoutes(routes, options = {}) {
  if (!routes || routes.length === 0) return [];

  const analyzed = routes.map(route => {
    const risk = calculateRouteRisk(route, options);
    return { ...route, risk };
  });

  // Sort by different criteria
  const byDuration = [...analyzed].sort((a, b) => a.duration - b.duration);
  const byDistance = [...analyzed].sort((a, b) => a.distance - b.distance);
  const byRisk = [...analyzed].sort((a, b) => a.risk.score - b.risk.score);

  return analyzed.map(route => {
    const labels = [];
    if (route === byDuration[0]) labels.push('fastest');
    if (route === byDistance[0]) labels.push('shortest');
    if (route === byRisk[0]) labels.push('safest');
    
    // Calculate comparison to fastest
    const fastestDuration = byDuration[0].duration;
    const timeDiff = route.duration - fastestDuration;
    const fastestRisk = byDuration[0].risk.score;
    const riskDiff = fastestRisk - route.risk.score;

    return {
      ...route,
      labels,
      comparison: {
        timeDiff,
        riskDiff,
        saferPercent: fastestRisk > 0 ? Math.round((riskDiff / fastestRisk) * 100) : 0,
      }
    };
  });
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
