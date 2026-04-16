import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './HeatmapLayer';
import { getReports, getReportIcon } from '../services/communityService';
import { wildlifeZones } from '../data/wildlifeZones';
import { chennaiSafeZones, chennaiDangerZones } from '../data/chennaiSafetyData';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom(), { animate: true });
    }
  }, [center, zoom]);
  return null;
}

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [bounds]);
  return null;
}

const userIcon = L.divIcon({
  className: 'user-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const destIcon = L.divIcon({
  className: 'destination-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 16],
});

export default function MapView({
  darkMode,
  userLocation,
  destination,
  origin,
  routes,
  selectedRouteIdx,
  segments,
  showHeatmap,
  heatmapData,
  isNavigating,
  mapCenter,
  mapZoom,
  fitBounds,
  onMapClick,
  communityReports,
  womenSafety,
  safeHavens,
  waypoints,
  onAddWaypoint,
}) {
  const tileUrl = darkMode ? DARK_TILES : LIGHT_TILES;

  const defaultCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [28.6139, 77.209];

  return (
    <div className="map-container">
      <MapContainer
        center={mapCenter || defaultCenter}
        zoom={mapZoom || 13}
        zoomControl={false}
        attributionControl={true}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          key={darkMode ? 'dark' : 'light'}
          url={tileUrl}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {mapCenter && <MapUpdater center={mapCenter} zoom={mapZoom} />}
        {fitBounds && <FitBounds bounds={fitBounds} />}

        {/* Heatmap overlay */}
        {showHeatmap && heatmapData && heatmapData.length > 0 && (
          <HeatmapLayer data={heatmapData} />
        )}

        {/* Route polylines */}
        {routes && routes.map((route, idx) => {
          if (idx === selectedRouteIdx) return null;
          // Different colors for unselected alternate routes
          const altColors = ['#8b5cf6', '#0ea5e9', '#f43f5e', '#14b8a6', '#eab308'];
          const routeColor = altColors[(idx > selectedRouteIdx ? idx - 1 : idx) % altColors.length];
          return (
            <Polyline
              key={`route-${idx}`}
              positions={route.coordinates}
              pathOptions={{
                color: routeColor,
                weight: 5,
                opacity: 0.6,
                dashArray: '8 6',
              }}
            />
          );
        })}

        {/* Selected route with risk coloring */}
        {segments && segments.length > 0 ? (
          segments.map((seg, idx) => (
            <Polyline
              key={`seg-${idx}`}
              positions={seg.coordinates}
              pathOptions={{
                color: seg.color,
                weight: 6,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))
        ) : (
          routes && routes[selectedRouteIdx] && (
            <Polyline
              positions={routes[selectedRouteIdx].coordinates}
              pathOptions={{
                color: '#3b82f6',
                weight: 6,
                opacity: 0.85,
              }}
            />
          )
        )}

        {/* Wildlife zone circles */}
        {showHeatmap && wildlifeZones.map(zone => (
          <CircleMarker
            key={`wild-${zone.id}`}
            center={[zone.lat, zone.lng]}
            radius={12}
            pathOptions={{
              color: '#f59e0b',
              fillColor: '#fbbf24',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '4 4',
            }}
          >
            <Popup>
              <strong>🦌 {zone.name}</strong><br />
              {zone.description}
            </Popup>
          </CircleMarker>
        ))}

        {/* Women Safety Zones */}
        {womenSafety && chennaiDangerZones.map(zone => (
          <Circle
            key={`danger-${zone.id}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '6 6',
            }}
          >
            <Popup>
              <strong>⚠️ Danger Zone</strong><br />
              {zone.name}<br />
              <small>{zone.description}</small>
            </Popup>
          </Circle>
        ))}

        {womenSafety && chennaiSafeZones.map(zone => (
          <Circle
            key={`safe-${zone.id}`}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{
              color: '#f472b6',
              fillColor: '#f472b6',
              fillOpacity: 0.25,
              weight: 2,
            }}
          >
            <Popup>
              <strong>🛡️ Safe Zone</strong><br />
              {zone.name}<br />
              <small>{zone.description}</small>
            </Popup>
          </Circle>
        ))}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {/* Origin marker */}
        {origin && !isNavigating && (
          <Marker position={[origin.lat, origin.lng]}>
            <Popup>{origin.displayName || 'Start'}</Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destIcon}
          >
            <Popup>{destination.displayName || 'Destination'}</Popup>
          </Marker>
        )}

        {/* Waypoints markers */}
        {waypoints && waypoints.map((wp, idx) => (
          <Marker
            key={`wp-${idx}`}
            position={[wp.lat, wp.lng]}
            icon={L.divIcon({
              className: 'waypoint-marker',
              html: `<div style="background:var(--brand-primary);color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;">${idx + 1}</div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <strong>Stop {idx + 1}</strong><br/>
              {wp.name || wp.displayName}
            </Popup>
          </Marker>
        ))}

        {/* Safe Havens markers */}
        {safeHavens && safeHavens.map((haven, idx) => (
          <Marker
            key={`haven-${idx}`}
            position={[haven.lat, haven.lng]}
            icon={L.divIcon({
              className: 'safehaven-marker',
              html: `<div style="background:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 0 10px rgba(16,185,129,0.5);border:2px solid white;font-size:16px;">🛡️</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            })}
          >
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ color: '#10b981' }}>🛡️ {haven.name}</strong><br />
                <span style={{ textTransform: 'capitalize', color: 'var(--text-muted)' }}>{haven.type}</span>
                <div style={{ marginTop: '10px' }}>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '6px' }} onClick={() => onAddWaypoint(haven)}>
                    Add to Route
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Community report markers */}
        {communityReports && communityReports.map(report => (
          <Marker
            key={`report-${report.id}`}
            position={[report.lat, report.lng]}
            icon={L.divIcon({
              className: 'report-marker',
              html: getReportIcon(report.type),
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <strong>{report.type.charAt(0).toUpperCase() + report.type.slice(1)}</strong><br />
              {report.description}<br />
              <small>👍 {report.upvotes} upvotes</small>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
