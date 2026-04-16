import { accidentZones } from '../data/accidentZones.js';
import { wildlifeZones } from '../data/wildlifeZones.js';
import { chennaiSafeZones, chennaiDangerZones } from '../data/chennaiSafetyData.js';

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract features to pass to the Backend ML model
function extractFeatures(route, options = {}) {
  const { timeOfDay = new Date().getHours(), weather = 'clear', trafficDensity = 'moderate', womenSafety = false } = options;
  const coords = route.coordinates || [];
  
  let timeNorm = timeOfDay / 24.0;
  let weatherRain = (weather === 'rain' || weather === 'heavy_rain' || weather === 'storm') ? 1 : 0;
  let weatherFog = (weather === 'fog' || weather === 'snow') ? 1 : 0;
  
  let trafficMap = { 'low': 0.2, 'moderate': 0.5, 'high': 0.8, 'very_high': 1.0 };
  let trafficVal = trafficMap[trafficDensity] || 0.5;
  
  let distanceKm = (route.distance || 0) / 1000;
  let distanceNorm = Math.min(1.0, distanceKm / 30);
  
  let accidentHighCount = 0;
  let accidentMedCount = 0;
  let wildlifeCount = 0;
  let dangerZoneCount = 0;
  let safeZoneCount = 0;

  if (coords.length > 0) {
    coords.forEach(([lat, lng]) => {
      // Accidents
      for (const zone of accidentZones) {
        if (getDistance(lat, lng, zone.lat, zone.lng) < zone.radius) {
          if (zone.severity === 'high') accidentHighCount++;
          else accidentMedCount++;
        }
      }
      // Wildlife
      for (const zone of wildlifeZones) {
        if (getDistance(lat, lng, zone.lat, zone.lng) < zone.radius) {
          wildlifeCount++;
        }
      }
      // Women Safety
      if (womenSafety) {
        for (const zone of chennaiDangerZones) {
          if (getDistance(lat, lng, zone.lat, zone.lng) < zone.radius) dangerZoneCount++;
        }
        for (const zone of chennaiSafeZones) {
          if (getDistance(lat, lng, zone.lat, zone.lng) < zone.radius) safeZoneCount++;
        }
      }
    });
  }

  const len = coords.length > 0 ? coords.length : 1;
  return [
    timeNorm, weatherRain, weatherFog, trafficVal, distanceNorm, 
    accidentHighCount / len, 
    accidentMedCount / len, 
    wildlifeCount / len, 
    womenSafety ? 1 : 0, 
    dangerZoneCount / len, 
    safeZoneCount / len
  ];
}

// Calculate overall risk via TensorFlow ML Backend
export async function calculateRouteRisk(route, options = {}) {
  const features = extractFeatures(route, options);
  
  try {
    const response = await fetch('http://localhost:3001/api/risk/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { 
        score: data.score, 
        level: data.level, 
        accidentZoneCount: features[5] + features[6],
        factors: {} // Prevent UI errors looking for old exact factor properties
      };
    }
  } catch (err) {
    console.error("ML Prediction Failed, using fallback", err);
  }

  // Fallback if server is not running
  return { score: 50, level: 'medium', accidentZoneCount: 0, factors: {} };
}

// Evaluate routes asynchronously with ML model
export async function classifyRoutes(routes, options = {}) {
  if (!routes || routes.length === 0) return [];

  const analyzed = await Promise.all(routes.map(async route => {
    const risk = await calculateRouteRisk(route, options);
    return { ...route, risk };
  }));

  const byDuration = [...analyzed].sort((a, b) => a.duration - b.duration);
  const byDistance = [...analyzed].sort((a, b) => a.distance - b.distance);
  const byRisk = [...analyzed].sort((a, b) => a.risk.score - b.risk.score);

  return analyzed.map(route => {
    const labels = [];
    if (route === byDuration[0]) labels.push('fastest');
    if (route === byDistance[0]) labels.push('shortest');
    if (route === byRisk[0]) labels.push('safest');
    
    const fastestDuration = byDuration[0].duration;
    const fastestRisk = byDuration[0].risk.score;
    const riskDiff = fastestRisk - route.risk.score;

    return {
      ...route,
      labels,
      comparison: {
        timeDiff: route.duration - fastestDuration,
        riskDiff: riskDiff,
        saferPercent: fastestRisk > 0 ? Math.round((riskDiff / fastestRisk) * 100) : 0,
      }
    };
  });
}

// Point logic remains static fallback to retain seamless UI live segment styling
export function getPointRisk(lat, lng, options = {}) {
  const { timeOfDay = new Date().getHours(), weather = 'clear', womenSafety = false } = options;
  let risk = 10; // Base
  
  for (const zone of accidentZones) {
    const dist = getDistance(lat, lng, zone.lat, zone.lng);
    if (dist < zone.radius) risk += zone.severity === 'high' ? 40 : 25;
    else if (dist < zone.radius * 2) risk += 10;
  }
  
  if (timeOfDay >= 22 || timeOfDay < 5) risk += 15;
  if (weather === 'rain') risk += 10;
  if (weather === 'heavy_rain') risk += 20;

  if (womenSafety) {
    for (const zone of chennaiDangerZones) {
      if (getDistance(lat, lng, zone.lat, zone.lng) < zone.radius) risk += 60;
    }
    for (const zone of chennaiSafeZones) {
      if (getDistance(lat, lng, zone.lat, zone.lng) < zone.radius) risk -= 40;
    }
  }
  
  return Math.max(0, Math.min(Math.round(risk), 100));
}

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
      color: risk < 30 ? '#3b82f6' : risk < 60 ? '#f59e0b' : '#ef4444',
    });
  }
  
  return segments;
}
