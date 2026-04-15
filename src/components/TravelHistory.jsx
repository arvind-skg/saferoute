import React from 'react';
import { X, MapPin, Clock, Route, Shield, TrendingUp } from 'lucide-react';
import { formatDistance, formatDuration } from '../services/routingService';

export default function TravelHistory({ trips, onClose }) {
  // Calculate overview stats
  const totalTrips = trips.length;
  const totalDist = trips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);
  const avgSafety = totalTrips > 0
    ? Math.round(trips.reduce((sum, t) => sum + (t.safetyScore || 0), 0) / totalTrips)
    : 0;

  return (
    <div className="travel-history-overlay" onClick={onClose}>
      <div className="travel-history glass-panel-strong" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xs)' }}>
          <h2>🗺️ Travel History</h2>
          <button className="btn btn-icon btn-secondary" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <p className="subtitle">Your journey log & safety analytics</p>

        {/* Overview Stats */}
        <div className="travel-history-stats">
          <div className="travel-overview-stat">
            <div className="val">{totalTrips}</div>
            <div className="lbl">Trips</div>
          </div>
          <div className="travel-overview-stat">
            <div className="val">{formatDistance(totalDist)}</div>
            <div className="lbl">Distance</div>
          </div>
          <div className="travel-overview-stat">
            <div className="val">{avgSafety}</div>
            <div className="lbl">Avg Safety</div>
          </div>
        </div>

        {/* Trip List */}
        <div className="trip-history-list">
          {totalTrips === 0 ? (
            <div className="trip-no-data">
              <div className="icon">🛣️</div>
              <p>No trips yet. Start navigating to build your travel history!</p>
            </div>
          ) : (
            trips.map((trip, idx) => {
              const date = new Date(trip.endTime || trip.startTime);
              const day = date.getDate();
              const month = date.toLocaleString('en', { month: 'short' });
              const scoreColor = trip.safetyScore >= 70 ? 'var(--risk-low)' :
                trip.safetyScore >= 40 ? 'var(--risk-medium)' : 'var(--risk-high)';
              const scoreBg = trip.safetyScore >= 70 ? 'var(--risk-low-bg)' :
                trip.safetyScore >= 40 ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)';

              return (
                <div key={idx} className="trip-history-card">
                  <div className="trip-date-badge">
                    <div className="day">{day}</div>
                    <div className="month">{month}</div>
                  </div>
                  <div className="trip-history-info">
                    <div className="trip-history-route">
                      {trip.origin || 'Start'} → {trip.destination || 'End'}
                    </div>
                    <div className="trip-history-meta">
                      <span>📏 {formatDistance(trip.totalDistance)}</span>
                      <span>⏱️ {formatDuration(trip.totalTime)}</span>
                      <span>⚠️ {trip.alertsReceived} alerts</span>
                    </div>
                  </div>
                  <div
                    className="trip-history-score"
                    style={{ background: scoreBg, color: scoreColor }}
                  >
                    {trip.safetyScore}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalTrips > 0 && (
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: '100%', marginTop: 'var(--space-lg)' }}
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
