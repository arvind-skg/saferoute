import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import AuthPage from './components/AuthPage';
import MapView from './components/MapView';
import SearchPanel from './components/SearchPanel';
import RouteOptions from './components/RouteOptions';
import NavigationPanel from './components/NavigationPanel';
import AlertOverlay from './components/AlertOverlay';
import SOSButton from './components/SOSButton';
import ReportModal from './components/ReportModal';
import TripSummary from './components/TripSummary';
import TravelHistory from './components/TravelHistory';
import ArrivalTimerModal from './components/ArrivalTimerModal';
import SettingsPanel from './components/SettingsPanel';
import {
  Settings, Layers, Plus, Locate, History, LogOut,
  Moon, Shield, X,
} from 'lucide-react';

import { getRoutes, reverseGeocode } from './services/routingService';
import { classifyRoutes, getRouteSegmentRisks, getPointRisk } from './services/riskEngine';
import { getWeather } from './services/weatherService';
import { initVoice, setVoiceEnabled, speakNavigation, speakAlert } from './services/voiceService';
import { getCurrentPosition, watchPosition, simulateMovement, stopWatching } from './services/locationService';
import { getReports, addReport } from './services/communityService';
import { checkAlerts, onAlert } from './services/alertService';
import { generateHeatmapData } from './data/accidentZones';
import { apiSaveTrip, apiGetTrips, apiCreateReport, apiGetReports } from './services/apiService';
import { fetchSafeHavens } from './services/placesService';

export default function App() {
  // Auth
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Core
  const [darkMode, setDarkMode] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [routeSegments, setRouteSegments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Navigation
  const [isNavigating, setIsNavigating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [distanceToNext, setDistanceToNext] = useState(null);
  const [eta, setEta] = useState(null);
  const [remainingDistance, setRemainingDistance] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [currentRiskLevel, setCurrentRiskLevel] = useState('low');
  const [speed, setSpeed] = useState(null);

  // Location - FIXED
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(13);
  const [fitBounds, setFitBounds] = useState(null);

  // UI
  const [showSettings, setShowSettings] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTripSummary, setShowTripSummary] = useState(false);
  const [showTravelHistory, setShowTravelHistory] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [womenSafety, setWomenSafety] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [communityReports, setCommunityReports] = useState(getReports());
  const heatmapData = useMemo(() => {
    const baseData = generateHeatmapData();
    const dynamicData = communityReports.map(r => [
      r.lat, 
      r.lng, 
      1.0 // high intensity for user reports
    ]);
    return [...baseData, ...dynamicData];
  }, [communityReports]);
  const [tripData, setTripData] = useState(null);
  const [weather] = useState(() => getWeather());
  const [travelHistory, setTravelHistory] = useState([]);

  // Safety Timer
  const [timerActive, setTimerActive] = useState(false);
  const [timerExpiresAt, setTimerExpiresAt] = useState(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [externalSOSTrigger, setExternalSOSTrigger] = useState(false);

  // Waypoints
  const [safeHavens, setSafeHavens] = useState([]);
  const [waypoints, setWaypoints] = useState([]);

  // Refs
  const navStartTimeRef = useRef(null);
  const alertCountRef = useRef(0);
  const locationUnsubRef = useRef(null);
  const navIntervalRef = useRef(null);
  const simStopRef = useRef(null);

  // ==================== AUTH ====================
  useEffect(() => {
    const savedUser = localStorage.getItem('saferoute_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.loggedIn) setUser(parsed);
      } catch {}
    }
    setAuthChecked(true);
  }, []);

  // Load travel history from DB when user logs in
  useEffect(() => {
    if (!user?.id) return;
    apiGetTrips(user.id).then(trips => {
      const mapped = trips.map(t => ({
        totalDistance: t.total_distance,
        totalTime: t.total_time,
        safetyScore: t.safety_score,
        riskExposure: { low: t.risk_low, medium: t.risk_medium, high: t.risk_high },
        alertsReceived: t.alerts_received,
        startTime: t.start_time ? new Date(t.start_time).getTime() : null,
        endTime: t.end_time ? new Date(t.end_time).getTime() : null,
        origin: t.origin_name,
        destination: t.destination_name,
      }));
      setTravelHistory(mapped);
    }).catch(() => {
      // Fallback to localStorage
      const saved = localStorage.getItem('saferoute_history');
      if (saved) try { setTravelHistory(JSON.parse(saved)); } catch {}
    });
  }, [user]);

  // Load community reports from DB
  useEffect(() => {
    if (!user) return;
    apiGetReports().then(reports => {
      if (reports && reports.length > 0) {
        setCommunityReports(reports.map(r => ({
          id: r.id, type: r.type, lat: r.lat, lng: r.lng,
          description: r.description, upvotes: r.upvotes,
          timestamp: new Date(r.created_at).getTime(),
        })));
      }
    }).catch(() => {});
  }, [user]);

  // Enhanced Timer Polling Loop
  useEffect(() => {
    let pollingInterval;
    if (timerActive && user?.id) {
      pollingInterval = setInterval(async () => {
        try {
          const res = await fetch(`/api/timer/status/${user.id}`);
          const data = await res.json();
          if (data.active && data.status === 'alert') {
            console.warn('🚨 Backend triggered SOS Rescue operation!');
            setExternalSOSTrigger(true);
            setTimerActive(false); // Stop polling
          }
        } catch (e) { }
      }, 5000);
    }
    return () => clearInterval(pollingInterval);
  }, [timerActive, user?.id]);

  const handleStartTimer = async (minutes) => {
    if (!user?.id) return;
    try {
      const res = await fetch('/api/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, durationMinutes: minutes })
      });
      const data = await res.json();
      setTimerActive(true);
      setTimerExpiresAt(data.expiresAt);
    } catch (e) {}
  };

  const handleTimerCheckIn = async () => {
    if (!user?.id) return;
    try {
      await fetch('/api/timer/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });
      setTimerActive(false);
      setTimerExpiresAt(null);
    } catch (e) {}
  };

  const handleLogin = (userData) => setUser(userData);

  const handleLogout = () => {
    localStorage.removeItem('saferoute_user');
    setUser(null);
    setShowUserMenu(false);
    stopWatching();
  };

  // ==================== THEME ====================
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // ==================== INIT & LIVE LOCATION ====================
  useEffect(() => {
    if (!user) return;
    initVoice();

    // Get the user's REAL location on load
    getCurrentPosition().then(pos => {
      setUserLocation(pos);
      setMapCenter([pos.lat, pos.lng]);
    });

    const unsub = onAlert(newAlerts => {
      setAlerts(newAlerts);
      alertCountRef.current += newAlerts.length;
    });

    return () => {
      unsub();
      stopWatching();
    };
  }, [user]);

  // ==================== USE MY LOCATION ====================
  const handleUseMyLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      setUserLocation(pos);
      setMapCenter([pos.lat, pos.lng]);
      setMapZoom(15);
      setFitBounds(null);

      const name = await reverseGeocode(pos.lat, pos.lng);
      setOrigin({
        lat: pos.lat, lng: pos.lng,
        displayName: name,
        shortName: name.split(',').slice(0, 2).join(','),
      });
    } catch {
      alert('Unable to get your location. Please enable location services and reload.');
    }
  }, []);

  // ==================== FETCH SAFE HAVENS ====================
  useEffect(() => {
    if (origin && destination) {
      const midLat = (origin.lat + destination.lat) / 2;
      const midLng = (origin.lng + destination.lng) / 2;
      // Fetch 24/7 places around the midpoint
      fetchSafeHavens(midLat, midLng, 5000).then(havens => {
        setSafeHavens(havens || []);
      });
    }
  }, [origin, destination]);

  // ==================== SEARCH ROUTES ====================
  const handleSearch = useCallback(async () => {
    if (!origin || !destination) return;
    setLoading(true);
    setRoutes(null);
    setRouteSegments([]);

    try {
      const rawRoutes = await getRoutes(origin.lat, origin.lng, destination.lat, destination.lng, waypoints);
      const options = { timeOfDay: new Date().getHours(), weather: weather.condition, trafficDensity: 'moderate', womenSafety };
      const classified = await classifyRoutes(rawRoutes, options);
      setRoutes(classified);

      const safestIdx = classified.findIndex(r => r.labels?.includes('safest'));
      const idx = safestIdx >= 0 ? safestIdx : 0;
      setSelectedRouteIdx(idx);

      const segments = getRouteSegmentRisks(classified[idx], options);
      if (womenSafety) {
        segments.forEach(seg => {
          seg.color = seg.level === 'low' ? '#f472b6' : seg.level === 'medium' ? '#ec4899' : '#be185d';
        });
      }
      setRouteSegments(segments);

      const allCoords = classified[idx].coordinates;
      if (allCoords.length > 0) {
        setFitBounds(allCoords);
        setMapCenter(null);
      }
    } catch {
      alert('Could not find routes. Please try different locations.');
    } finally {
      setLoading(false);
    }
  }, [origin, destination, waypoints, weather, womenSafety]);

  // ==================== SELECT ROUTE ====================
  const handleSelectRoute = useCallback((idx) => {
    setSelectedRouteIdx(idx);
    if (routes?.[idx]) {
      const opts = { timeOfDay: new Date().getHours(), weather: weather.condition, womenSafety };
      const segments = getRouteSegmentRisks(routes[idx], opts);
      if (womenSafety && routes[idx].labels?.includes('safest')) {
        segments.forEach(seg => {
          seg.color = seg.level === 'low' ? '#f472b6' : seg.level === 'medium' ? '#ec4899' : '#be185d';
        });
      }
      setRouteSegments(segments);
    }
  }, [routes, weather, womenSafety]);

  // ==================== START NAVIGATION ====================
  const handleStartNav = useCallback((idx) => {
    if (!routes?.[idx]) return;
    setSelectedRouteIdx(idx);
    setIsNavigating(true);
    setCurrentStep(0);
    navStartTimeRef.current = Date.now();
    alertCountRef.current = 0;

    const route = routes[idx];
    setRemainingDistance(route.distance);
    setRemainingTime(route.duration);
    setEta(new Date(Date.now() + route.duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

    if (route.steps?.[0]) setDistanceToNext(route.steps[0].distance);

    speakNavigation('Navigation started. Follow the route on the map.');

    // Start simulating movement along the route for demo
    if (route.coordinates?.length > 1) {
      simStopRef.current = simulateMovement(route.coordinates, 40);
    }

    // Watch real GPS too
    locationUnsubRef.current = watchPosition(pos => {
      setUserLocation(pos);
      setSpeed(pos.speed ? pos.speed * 3.6 : null);
      setMapCenter([pos.lat, pos.lng]);
      setMapZoom(16);

      checkAlerts(pos.lat, pos.lng, { timeOfDay: new Date().getHours(), weather: weather.condition });
      const risk = getPointRisk(pos.lat, pos.lng, { timeOfDay: new Date().getHours(), weather: weather.condition, womenSafety });
      setCurrentRiskLevel(risk < 30 ? 'low' : risk < 60 ? 'medium' : 'high');
    });

    // Advance navigation steps
    navIntervalRef.current = setInterval(() => {
      setCurrentStep(prev => {
        const steps = route.steps || [];
        if (prev < steps.length - 1) {
          const next = steps[prev + 1];
          setDistanceToNext(next.distance);
          if (next.instruction) speakNavigation(next.instruction);

          let remDist = 0, remTime = 0;
          for (let i = prev + 1; i < steps.length; i++) {
            remDist += steps[i].distance;
            remTime += steps[i].duration;
          }
          setRemainingDistance(remDist);
          setRemainingTime(remTime);
          setEta(new Date(Date.now() + remTime * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          return prev + 1;
        }
        return prev;
      });
    }, 5000);
  }, [routes, weather]);

  // ==================== END NAVIGATION ====================
  const handleEndNav = useCallback(() => {
    setIsNavigating(false);

    // Clean up watchers
    if (locationUnsubRef.current) { locationUnsubRef.current(); locationUnsubRef.current = null; }
    if (navIntervalRef.current) { clearInterval(navIntervalRef.current); navIntervalRef.current = null; }
    if (simStopRef.current) { simStopRef.current(); simStopRef.current = null; }

    const route = routes?.[selectedRouteIdx];
    const totalTime = navStartTimeRef.current ? (Date.now() - navStartTimeRef.current) / 1000 : route?.duration || 0;
    const riskScore = route?.risk?.score || 50;
    const safetyScore = Math.max(0, Math.min(100, 100 - riskScore + Math.floor(Math.random() * 10)));

    const newTripData = {
      totalDistance: route?.distance || 0,
      totalTime,
      riskExposure: {
        low: Math.max(10, 70 - riskScore),
        medium: Math.min(50, 20 + Math.floor(riskScore * 0.3)),
        high: Math.min(40, 10 + Math.floor(riskScore * 0.3)),
      },
      alertsReceived: alertCountRef.current,
      safetyScore,
      startTime: navStartTimeRef.current,
      endTime: Date.now(),
      origin: origin?.shortName || 'Start',
      destination: destination?.shortName || 'End',
    };

    setTripData(newTripData);
    setShowTripSummary(true);

    // Save to DB
    if (user?.id) {
      apiSaveTrip({
        user_id: user.id,
        origin_name: origin?.shortName || 'Start',
        origin_lat: origin?.lat,
        origin_lng: origin?.lng,
        destination_name: destination?.shortName || 'End',
        destination_lat: destination?.lat,
        destination_lng: destination?.lng,
        total_distance: newTripData.totalDistance,
        total_time: newTripData.totalTime,
        safety_score: newTripData.safetyScore,
        risk_low: newTripData.riskExposure.low,
        risk_medium: newTripData.riskExposure.medium,
        risk_high: newTripData.riskExposure.high,
        alerts_received: newTripData.alertsReceived,
        start_time: newTripData.startTime,
        end_time: newTripData.endTime,
      }).catch(() => {});
    }

    // Update local history
    const updated = [newTripData, ...travelHistory].slice(0, 50);
    setTravelHistory(updated);
    localStorage.setItem('saferoute_history', JSON.stringify(updated));

    speakAlert('Trip complete. Here is your safety summary.');
    setMapZoom(13);
    setCurrentStep(0);
    setDistanceToNext(null);
    setSpeed(null);
  }, [routes, selectedRouteIdx, origin, destination, travelHistory, user]);

  // ==================== HANDLERS ====================
  const handleCloseRoutes = useCallback(() => { setRoutes(null); setRouteSegments([]); setFitBounds(null); }, []);

  const handleSubmitReport = useCallback((report) => {
    addReport(report);
    setCommunityReports(getReports());
    // Save to DB
    if (user?.id) {
      apiCreateReport({ ...report, user_id: user.id }).catch(() => {});
    }
    speakAlert('Report submitted. Thank you!');
  }, [user]);

  const handleToggleVoice = useCallback(() => {
    setVoiceOn(v => { setVoiceEnabled(!v); return !v; });
  }, []);

  const handleRecenter = useCallback(async () => {
    const pos = await getCurrentPosition();
    setUserLocation(pos);
    setMapCenter([pos.lat, pos.lng]);
    setMapZoom(15);
    setFitBounds(null);
  }, []);

  // ==================== AUTH GATE ====================
  if (!authChecked) return null;
  if (!user) return <AuthPage onLogin={handleLogin} />;

  const userInitial = user.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="app-container">
      <MapView
        darkMode={darkMode} userLocation={userLocation} origin={origin} destination={destination}
        routes={routes} selectedRouteIdx={selectedRouteIdx} segments={routeSegments}
        showHeatmap={showHeatmap} heatmapData={heatmapData} isNavigating={isNavigating}
        mapCenter={mapCenter} mapZoom={mapZoom} fitBounds={fitBounds}
        communityReports={communityReports} womenSafety={womenSafety}
        safeHavens={safeHavens} waypoints={waypoints}
        onAddWaypoint={(haven) => {
          setWaypoints(prev => [...prev, haven]);
          setTimeout(() => handleSearch(), 0);
        }}
      />

      {womenSafety && <div className="women-safety-badge"><Shield size={12} /> Women Safety Mode Active</div>}

      <SearchPanel
        origin={origin} destination={destination}
        onOriginChange={setOrigin} onDestinationChange={setDestination}
        onSearch={handleSearch} onUseMyLocation={handleUseMyLocation}
        isNavigating={isNavigating} loading={loading}
        user={user} onUserClick={() => setShowUserMenu(true)}
        waypoints={waypoints}
        onClearWaypoints={() => {
          setWaypoints([]);
          setTimeout(() => handleSearch(), 0);
        }}
      />

      {!isNavigating && (
        <div className="weather-widget glass-panel" id="weather-widget">
          <span>{weather.icon}</span>
          <span className="temp">{weather.temperature}°C</span>
          <span>{weather.label}</span>
        </div>
      )}

      {routes && !isNavigating && (
        <RouteOptions routes={routes} selectedIdx={selectedRouteIdx}
          onSelect={handleSelectRoute} onStartNav={handleStartNav}
          onClose={handleCloseRoutes} womenSafety={womenSafety} />
      )}

      {isNavigating && routes && (
        <NavigationPanel
          route={routes[selectedRouteIdx]} currentStep={currentStep}
          distanceToNext={distanceToNext} eta={eta}
          remainingDistance={remainingDistance} remainingTime={remainingTime}
          riskLevel={currentRiskLevel} speed={speed}
          voiceEnabled={voiceOn} onToggleVoice={handleToggleVoice}
          onEndNav={handleEndNav} onReport={() => setShowReportModal(true)}
          womenSafety={womenSafety}
          timerActive={timerActive} timerExpiresAt={timerExpiresAt}
          onOpenTimerSelection={() => setShowTimerModal(true)}
          onCheckIn={handleTimerCheckIn}
        />
      )}

      <AlertOverlay alerts={alerts} />

      <div className="map-controls" style={isNavigating ? { bottom: '280px' } : {}}>
        <button className="map-control-btn glass-panel" onClick={() => setShowSettings(s => !s)} title="Settings"><Settings size={18} /></button>
        <button className="map-control-btn glass-panel" onClick={() => setShowHeatmap(h => !h)} title="Heatmap"
          style={showHeatmap ? { background: 'var(--brand-primary)', color: 'white' } : {}}><Layers size={18} /></button>
        <button className="map-control-btn glass-panel" onClick={() => setShowReportModal(true)} title="Report"><Plus size={18} /></button>
        <button className="map-control-btn glass-panel" onClick={handleRecenter} title="My Location"><Locate size={18} /></button>
      </div>

      <SOSButton userLocation={userLocation} isNavigating={isNavigating} externalTrigger={externalSOSTrigger} onResetTrigger={() => setExternalSOSTrigger(false)} />

      {showTimerModal && <ArrivalTimerModal onClose={() => setShowTimerModal(false)} onStartTimer={handleStartTimer} />}

      {showSettings && (
        <SettingsPanel darkMode={darkMode} onToggleDarkMode={() => setDarkMode(d => !d)}
          voiceEnabled={voiceOn} onToggleVoice={handleToggleVoice}
          showHeatmap={showHeatmap} onToggleHeatmap={() => setShowHeatmap(h => !h)}
          womenSafety={womenSafety} onToggleWomenSafety={() => setWomenSafety(w => !w)}
          onClose={() => setShowSettings(false)} />
      )}

      {showUserMenu && (
        <div className="user-menu-overlay" onClick={() => setShowUserMenu(false)}>
          <div className="user-menu" onClick={e => e.stopPropagation()}>
            <div className="user-menu-header">
              <div className="user-avatar">{userInitial}</div>
              <div className="user-info">
                <h4>{user.name || user.username}</h4>
                <p>{user.username}</p>
              </div>
              <button className="btn btn-icon btn-secondary" onClick={() => setShowUserMenu(false)} style={{ marginLeft: 'auto' }}><X size={16} /></button>
            </div>
            <div className="user-menu-items">
              <button className="user-menu-item" onClick={() => { setShowTravelHistory(true); setShowUserMenu(false); }}><History size={18} />Travel History</button>
              <button className="user-menu-item" onClick={() => { setShowSettings(true); setShowUserMenu(false); }}><Settings size={18} />Settings</button>
              <button className="user-menu-item" onClick={() => setWomenSafety(w => !w)}>
                <Shield size={18} style={womenSafety ? { color: 'var(--women-safety)' } : {}} />
                {womenSafety ? 'Disable Women Safety' : 'Women Safety Mode'}
              </button>
              <button className="user-menu-item" onClick={() => setDarkMode(d => !d)}><Moon size={18} />{darkMode ? 'Light Mode' : 'Dark Mode'}</button>
              <button className="user-menu-item danger" onClick={handleLogout}><LogOut size={18} />Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {showReportModal && (
        <ReportModal userLocation={userLocation || { lat: 28.6139, lng: 77.209 }}
          onSubmit={handleSubmitReport} onClose={() => setShowReportModal(false)} />
      )}

      {showTripSummary && <TripSummary tripData={tripData} onClose={() => setShowTripSummary(false)} />}
      {showTravelHistory && <TravelHistory trips={travelHistory} onClose={() => setShowTravelHistory(false)} />}
    </div>
  );
}
