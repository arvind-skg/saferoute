import React from 'react';
import {
  Moon, Sun, Volume2, VolumeX, Eye, EyeOff, X, Shield,
} from 'lucide-react';

export default function SettingsPanel({
  darkMode, onToggleDarkMode,
  voiceEnabled, onToggleVoice,
  showHeatmap, onToggleHeatmap,
  womenSafety, onToggleWomenSafety,
  onClose,
}) {
  return (
    <div className="settings-panel glass-panel-strong" id="settings-panel">
      <h3>
        Settings
        <button className="btn btn-icon btn-secondary" onClick={onClose}>
          <X size={16} />
        </button>
      </h3>

      <div className="setting-item">
        <span className="setting-label">
          {darkMode ? <Moon size={16} /> : <Sun size={16} />}
          Dark Mode
        </span>
        <button
          className={`toggle ${darkMode ? 'active' : ''}`}
          onClick={onToggleDarkMode}
          aria-label="Toggle dark mode"
        />
      </div>

      <div className="setting-item">
        <span className="setting-label">
          {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Voice Alerts
        </span>
        <button
          className={`toggle ${voiceEnabled ? 'active' : ''}`}
          onClick={onToggleVoice}
          aria-label="Toggle voice alerts"
        />
      </div>

      <div className="setting-item">
        <span className="setting-label">
          {showHeatmap ? <Eye size={16} /> : <EyeOff size={16} />}
          Risk Heatmap
        </span>
        <button
          className={`toggle ${showHeatmap ? 'active' : ''}`}
          onClick={onToggleHeatmap}
          aria-label="Toggle heatmap"
        />
      </div>

      <div className="setting-item">
        <span className="setting-label">
          <Shield size={16} style={womenSafety ? { color: 'var(--women-safety)' } : {}} />
          <span style={womenSafety ? { color: 'var(--women-safety)', fontWeight: 700 } : {}}>
            Women Safety Mode
          </span>
        </span>
        <button
          className={`toggle ${womenSafety ? 'women-active' : ''}`}
          onClick={onToggleWomenSafety}
          aria-label="Toggle women safety mode"
        />
      </div>
    </div>
  );
}
