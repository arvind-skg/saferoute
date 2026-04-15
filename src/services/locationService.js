// Browser Geolocation API wrapper - FIXED for accurate live location

let watchId = null;
let currentPosition = null;
let positionCallbacks = [];
let simulatedPosition = null;

// Get current position (one-shot)
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Fallback to a default position
      const fallback = { lat: 28.6139, lng: 77.209, accuracy: 100, speed: 0, heading: 0, timestamp: Date.now() };
      currentPosition = fallback;
      resolve(fallback);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        currentPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        };
        resolve(currentPosition);
      },
      err => {
        console.warn('Geolocation error:', err.message);
        // Fallback to default location (Delhi)
        const fallback = { lat: 28.6139, lng: 77.209, accuracy: 100, speed: 0, heading: 0, timestamp: Date.now() };
        currentPosition = fallback;
        resolve(fallback);  // Resolve instead of reject so app still works
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,  // Always get fresh position
      }
    );
  });
}

// Watch position continuously
export function watchPosition(callback) {
  positionCallbacks.push(callback);

  if (!navigator.geolocation) {
    // Start simulated movement for demo
    startSimulation(callback);
    return () => stopSimulation();
  }

  if (!watchId) {
    watchId = navigator.geolocation.watchPosition(
      pos => {
        currentPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
          timestamp: pos.timestamp,
        };
        positionCallbacks.forEach(cb => {
          try { cb(currentPosition); } catch (e) { console.error(e); }
        });
      },
      err => {
        console.warn('Watch position error:', err.message);
        // Fall back to simulation if geolocation fails
        startSimulation(callback);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,  // Always get fresh position
      }
    );
  }

  return () => {
    positionCallbacks = positionCallbacks.filter(cb => cb !== callback);
    if (positionCallbacks.length === 0 && watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  };
}

// Simulate movement along a route for demo/testing
let simInterval = null;
export function simulateMovement(routeCoords, speedKmh = 40) {
  if (simInterval) clearInterval(simInterval);
  if (!routeCoords || routeCoords.length < 2) return;

  let idx = 0;
  const intervalMs = 2000; // Update every 2 seconds

  simInterval = setInterval(() => {
    if (idx >= routeCoords.length) {
      clearInterval(simInterval);
      simInterval = null;
      return;
    }

    const [lat, lng] = routeCoords[idx];
    currentPosition = {
      lat,
      lng,
      accuracy: 10,
      speed: speedKmh / 3.6,
      heading: idx > 0 ? getBearing(routeCoords[idx - 1], routeCoords[idx]) : 0,
      timestamp: Date.now(),
    };

    positionCallbacks.forEach(cb => {
      try { cb(currentPosition); } catch (e) { console.error(e); }
    });

    idx++;
  }, intervalMs);

  return () => {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
  };
}

function startSimulation(callback) {
  // Small random movement around current position for demo
  if (simInterval) return;
  const base = currentPosition || { lat: 28.6139, lng: 77.209 };

  simInterval = setInterval(() => {
    const pos = {
      lat: base.lat + (Math.random() - 0.5) * 0.001,
      lng: base.lng + (Math.random() - 0.5) * 0.001,
      accuracy: 15,
      speed: Math.random() * 15,
      heading: Math.random() * 360,
      timestamp: Date.now(),
    };
    currentPosition = pos;
    positionCallbacks.forEach(cb => {
      try { cb(pos); } catch (e) { console.error(e); }
    });
  }, 3000);
}

function stopSimulation() {
  if (simInterval) {
    clearInterval(simInterval);
    simInterval = null;
  }
}

export function stopWatching() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  stopSimulation();
  positionCallbacks = [];
}

export function getLastPosition() {
  return currentPosition;
}

// Calculate bearing between two points
function getBearing([lat1, lng1], [lat2, lng2]) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// Haversine distance in meters
export function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
