import React from 'react';
import {
  ArrowUp, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight,
  RotateCcw, Navigation, Square, Volume2, VolumeX, Flag,
} from 'lucide-react';
import { formatDistance, formatDuration } from '../services/routingService';

function getManeuverIcon(maneuver) {
  if (!maneuver) return <ArrowUp size={24} />;
  const mod = maneuver.modifier || '';
  const type = maneuver.type || '';

  if (type === 'arrive') return <Flag size={24} />;
  if (type === 'depart') return <Navigation size={24} />;
  if (mod.includes('left') && mod.includes('sharp')) return <CornerUpLeft size={24} />;
  if (mod.includes('right') && mod.includes('sharp')) return <CornerUpRight size={24} />;
  if (mod.includes('left')) return <ArrowLeft size={24} />;
  if (mod.includes('right')) return <ArrowRight size={24} />;
  if (type === 'roundabout' || type === 'rotary') return <RotateCcw size={24} />;
  return <ArrowUp size={24} />;
}

export default function NavigationPanel({
  route,
  currentStep,
  distanceToNext,
  eta,
  remainingDistance,
  remainingTime,
  riskLevel,
  speed,
  voiceEnabled,
  onToggleVoice,
  onEndNav,
  onReport,
  womenSafety,
}) {
  if (!route) return null;

  const step = route.steps?.[currentStep];
  const riskClass = riskLevel === 'low' ? 'low' : riskLevel === 'medium' ? 'medium' : 'high';
  const riskText = riskLevel === 'low' ? '🟢 Low Risk Zone' : riskLevel === 'medium' ? '🟡 Moderate Risk' : '🔴 High Risk Zone';

  return (
    <div className="nav-panel glass-panel-strong" id="nav-panel">
      <div className="nav-panel-handle" />

      {/* Current step */}
      <div className="nav-current-step">
        <div className={`nav-maneuver-icon ${womenSafety ? 'women-safety' : ''}`}>
          {step ? getManeuverIcon(step.maneuver) : <Navigation size={24} />}
        </div>
        <div className="nav-instruction">
          <div className="distance">
            {distanceToNext != null ? formatDistance(distanceToNext) : '—'}
          </div>
          <div className="text">
            {step?.instruction || 'Calculating route...'}
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="nav-info-bar">
        <div className="nav-info-item">
          <span className="value">{eta || '--:--'}</span>
          <span className="label">ETA</span>
        </div>
        <div className="nav-info-item">
          <span className="value">{remainingDistance ? formatDistance(remainingDistance) : '--'}</span>
          <span className="label">Left</span>
        </div>
        <div className="nav-info-item">
          <span className="value">{remainingTime ? formatDuration(remainingTime) : '--'}</span>
          <span className="label">Time</span>
        </div>
        <div className="nav-info-item">
          <span className="value">{speed != null ? `${Math.round(speed)}` : '--'}</span>
          <span className="label">km/h</span>
        </div>
      </div>

      {/* Risk indicator strip */}
      <div className={`nav-risk-strip ${riskClass}`}>
        {riskText}
      </div>

      {/* Actions */}
      <div className="nav-actions">
        <button
          className="btn btn-secondary btn-icon"
          onClick={onToggleVoice}
          title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onReport}
          style={{ flex: 0 }}
        >
          ⚠️ Report
        </button>
        <button
          className="btn btn-danger"
          onClick={onEndNav}
          style={{ flex: 1 }}
          id="end-nav-btn"
        >
          <Square size={16} />
          End Trip
        </button>
      </div>
    </div>
  );
}
