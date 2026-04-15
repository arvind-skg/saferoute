import React from 'react';
import { Clock, Route, Shield, TrendingDown, ChevronRight, Zap } from 'lucide-react';
import { formatDistance, formatDuration } from '../services/routingService';

export default function RouteOptions({
  routes,
  selectedIdx,
  onSelect,
  onStartNav,
  onClose,
  womenSafety,
}) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="route-options-panel glass-panel-strong" id="route-options">
      <div className="route-options-header">
        <h3>{womenSafety ? '🛡️ Safe Routes for You' : 'Route Options'}</h3>
        <button className="btn btn-icon btn-secondary" onClick={onClose}>
          ✕
        </button>
      </div>

      {routes.map((route, idx) => {
        const riskColor =
          route.risk?.level === 'low' ? 'var(--risk-low)' :
          route.risk?.level === 'medium' ? 'var(--risk-medium)' : 'var(--risk-high)';

        const isSelected = idx === selectedIdx;
        const isSafest = route.labels?.includes('safest');

        return (
          <div
            key={idx}
            className={`route-card ${isSelected ? 'selected' : ''} ${womenSafety && isSafest ? 'women-safety-route' : ''}`}
            onClick={() => onSelect(idx)}
          >
            <div className="route-card-header">
              <div className="route-labels">
                {route.labels?.includes('fastest') && (
                  <span className="route-label fastest">⚡ Fastest</span>
                )}
                {route.labels?.includes('shortest') && (
                  <span className="route-label shortest">📏 Shortest</span>
                )}
                {isSafest && !womenSafety && (
                  <span className="route-label safest">🛡️ Safest</span>
                )}
                {isSafest && womenSafety && (
                  <span className="route-label women-safe">🛡️ Women Safe</span>
                )}
                {isSafest && (
                  <span className="route-label recommended">★ Recommended</span>
                )}
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>

            <div className="route-stats">
              <div className="route-stat">
                <span className="value">{formatDuration(route.duration)}</span>
                <span className="label">Time</span>
              </div>
              <div className="route-stat">
                <span className="value">{formatDistance(route.distance)}</span>
                <span className="label">Distance</span>
              </div>
              <div className="route-stat">
                <span className="value" style={{ color: womenSafety && isSafest ? 'var(--women-safety)' : riskColor }}>
                  {route.risk?.score ?? '-'}
                </span>
                <span className="label">Risk Score</span>
              </div>
            </div>

            {/* Comparison badge */}
            {route.comparison && route.comparison.saferPercent > 0 && !route.labels?.includes('fastest') && (
              <div className="route-comparison">
                <Shield size={14} />
                +{formatDuration(route.comparison.timeDiff)} but {route.comparison.saferPercent}% safer
              </div>
            )}
            {route.comparison && route.comparison.saferPercent < 0 && (
              <div className="route-comparison negative">
                <Zap size={14} />
                {formatDuration(Math.abs(route.comparison.timeDiff))} faster
              </div>
            )}

            {/* Risk bar */}
            <div className="risk-bar">
              <div
                className="risk-bar-fill"
                style={{
                  width: `${route.risk?.score || 0}%`,
                  background: womenSafety && isSafest
                    ? 'var(--women-safety-gradient)'
                    : `linear-gradient(90deg, var(--risk-low), ${riskColor})`,
                }}
              />
            </div>
          </div>
        );
      })}

      <div className="route-actions">
        <button className="btn btn-secondary" onClick={onClose} style={{ flex: 0 }}>
          Cancel
        </button>
        <button
          className={`btn ${womenSafety ? 'btn-women-safety' : 'btn-primary'}`}
          onClick={() => onStartNav(selectedIdx)}
          id="start-nav-btn"
        >
          <Route size={16} />
          Start Navigation
        </button>
      </div>
    </div>
  );
}
