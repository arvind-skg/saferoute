import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import HeatmapLayer from './HeatmapLayer';
import { getReports, getReportIcon } from '../services/communityService';
import { wildlifeZones } from '../data/wildlifeZones';

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
          return (
            <Polyline
              key={`route-${idx}`}
              positions={route.coordinates}
              pathOptions={{
                color: '#94a3b8',
                weight: 4,
                opacity: 0.4,
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
