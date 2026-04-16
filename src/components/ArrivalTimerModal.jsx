import React, { useState } from 'react';
import { Clock, Shield, X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ArrivalTimerModal({ onClose, onStartTimer }) {
  const [minutes, setMinutes] = useState(15);

  const presets = [5, 15, 30, 60];

  const handleStart = () => {
    onStartTimer(minutes);
    onClose();
  };

  return (
    <div className="sos-modal" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="sos-modal-content glass-panel-strong" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} color="var(--brand-primary)" />
            Safety Timer
          </h2>
          <button className="btn btn-icon" onClick={onClose} style={{ background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>
          Set an expected arrival time. If you do not check in safely before the timer runs out, the emergency SOS protocol will automatically trigger.
        </p>

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>Select Duration (Minutes)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {presets.map(m => (
              <button 
                key={m}
                onClick={() => setMinutes(m)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${minutes === m ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  background: minutes === m ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                +{m}m
              </button>
            ))}
          </div>
          
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <label style={{ display: 'block', marginBottom: 'var(--space-sm)', color: 'var(--text-muted)' }}>Or custom minutes:</label>
            <input 
              type="number" 
              value={minutes} 
              onChange={e => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
                fontSize: '16px'
              }}
            />
          </div>
        </div>

        <div className="nav-actions">
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleStart} style={{ flex: 2, background: 'var(--brand-gradient)' }}>
            <Shield size={18} />
            Start Timer
          </button>
        </div>
      </div>
    </div>
  );
}
