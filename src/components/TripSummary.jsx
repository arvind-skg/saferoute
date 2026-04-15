import React from 'react';
import { formatDistance, formatDuration } from '../services/routingService';

export default function TripSummary({ tripData, onClose }) {
  if (!tripData) return null;

  const {
    totalDistance = 0,
    totalTime = 0,
    riskExposure = { low: 60, medium: 30, high: 10 },
    alertsReceived = 0,
    safetyScore = 78,
    startTime,
    endTime,
  } = tripData;

  const scoreColor = safetyScore >= 70 ? 'var(--risk-low)' :
    safetyScore >= 40 ? 'var(--risk-medium)' : 'var(--risk-high)';

  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (safetyScore / 100) * circumference;

  return (
    <div className="trip-summary-overlay" onClick={onClose}>
      <div className="trip-summary glass-panel-strong" onClick={e => e.stopPropagation()}>
        <h2>🏁 Trip Complete!</h2>
        <p className="subtitle">
          {startTime && endTime
            ? `${new Date(startTime).toLocaleTimeString()} – ${new Date(endTime).toLocaleTimeString()}`
            : 'Trip Summary'
          }
        </p>

        {/* Safety Score Ring */}
        <div className="safety-score-ring">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke="var(--bg-primary)"
              strokeWidth="8"
            />
            <circle
              cx="60" cy="60" r="50"
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="safety-score-value">
            <span className="number" style={{ color: scoreColor }}>{safetyScore}</span>
            <span className="label">Safety Score</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="trip-stats-grid">
          <div className="trip-stat-card">
            <div className="icon">📏</div>
            <div className="value">{formatDistance(totalDistance)}</div>
            <div className="label">Distance</div>
          </div>
          <div className="trip-stat-card">
            <div className="icon">⏱️</div>
            <div className="value">{formatDuration(totalTime)}</div>
            <div className="label">Duration</div>
          </div>
          <div className="trip-stat-card">
            <div className="icon">⚠️</div>
            <div className="value">{alertsReceived}</div>
            <div className="label">Alerts</div>
          </div>
          <div className="trip-stat-card">
            <div className="icon">🛡️</div>
            <div className="value">{safetyScore >= 70 ? 'Safe' : safetyScore >= 40 ? 'Moderate' : 'Risky'}</div>
            <div className="label">Rating</div>
          </div>
        </div>

        {/* Risk Exposure Breakdown */}
        <div className="risk-breakdown">
          <h4>Risk Exposure</h4>
          <div className="risk-breakdown-bars">
            <div className="risk-bar-row">
              <span className="risk-bar-label" style={{ color: 'var(--risk-low)' }}>Low</span>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-track-fill"
                  style={{ width: `${riskExposure.low}%`, background: 'var(--risk-low)' }}
                />
              </div>
              <span className="risk-bar-percent">{riskExposure.low}%</span>
            </div>
            <div className="risk-bar-row">
              <span className="risk-bar-label" style={{ color: 'var(--risk-medium)' }}>Medium</span>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-track-fill"
                  style={{ width: `${riskExposure.medium}%`, background: 'var(--risk-medium)' }}
                />
              </div>
              <span className="risk-bar-percent">{riskExposure.medium}%</span>
            </div>
            <div className="risk-bar-row">
              <span className="risk-bar-label" style={{ color: 'var(--risk-high)' }}>High</span>
              <div className="risk-bar-track">
                <div
                  className="risk-bar-track-fill"
                  style={{ width: `${riskExposure.high}%`, background: 'var(--risk-high)' }}
                />
              </div>
              <span className="risk-bar-percent">{riskExposure.high}%</span>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
          Done
        </button>
      </div>
    </div>
  );
}
