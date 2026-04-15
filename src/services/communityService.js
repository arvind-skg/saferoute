// Community Reports Service - in-memory for prototype

let reports = [
  // Some seed reports
  { id: 1, type: 'accident', lat: 28.6200, lng: 77.2100, description: 'Minor fender-bender', timestamp: Date.now() - 600000, upvotes: 5 },
  { id: 2, type: 'hazard', lat: 28.6350, lng: 77.2200, description: 'Pothole on road', timestamp: Date.now() - 1200000, upvotes: 12 },
  { id: 3, type: 'police', lat: 28.5400, lng: 77.2500, description: 'Speed check ahead', timestamp: Date.now() - 300000, upvotes: 8 },
  { id: 4, type: 'roadblock', lat: 19.0800, lng: 72.8800, description: 'Construction zone', timestamp: Date.now() - 1800000, upvotes: 3 },
  { id: 5, type: 'animal', lat: 28.7200, lng: 77.1180, description: 'Stray cattle on road', timestamp: Date.now() - 900000, upvotes: 6 },
];

let nextId = 100;
let listeners = [];

const REPORT_EXPIRY = 2 * 60 * 60 * 1000; // 2 hours

const reportIcons = {
  accident: '🚗💥',
  hazard: '⚠️',
  police: '👮',
  roadblock: '🚧',
  animal: '🦌',
  flood: '🌊',
};

const reportLabels = {
  accident: 'Accident',
  hazard: 'Hazard',
  police: 'Police',
  roadblock: 'Road Block',
  animal: 'Animal',
  flood: 'Flooding',
};

export function getReports() {
  const now = Date.now();
  reports = reports.filter(r => now - r.timestamp < REPORT_EXPIRY);
  return reports;
}

export function addReport(report) {
  const newReport = {
    ...report,
    id: nextId++,
    timestamp: Date.now(),
    upvotes: 0,
  };
  reports.push(newReport);
  notifyListeners();
  return newReport;
}

export function upvoteReport(id) {
  const report = reports.find(r => r.id === id);
  if (report) {
    report.upvotes++;
    notifyListeners();
  }
}

export function removeReport(id) {
  reports = reports.filter(r => r.id !== id);
  notifyListeners();
}

export function getNearbyReports(lat, lng, radiusMeters = 5000) {
  return getReports().filter(r => {
    const dist = getDistance(lat, lng, r.lat, r.lng);
    return dist <= radiusMeters;
  });
}

export function onReportsChange(callback) {
  listeners.push(callback);
  return () => { listeners = listeners.filter(l => l !== callback); };
}

function notifyListeners() {
  listeners.forEach(l => l(getReports()));
}

export function getReportIcon(type) {
  return reportIcons[type] || '📍';
}

export function getReportLabel(type) {
  return reportLabels[type] || type;
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
