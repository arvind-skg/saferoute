import React, { useState, useEffect } from 'react';

export default function AlertOverlay({ alerts }) {
  const [visibleAlerts, setVisibleAlerts] = useState([]);

  useEffect(() => {
    if (!alerts || alerts.length === 0) return;

    // Add new alerts
    const newAlerts = alerts.map((a, i) => ({
      ...a,
      uid: Date.now() + i,
      fading: false,
    }));

    setVisibleAlerts(prev => [...newAlerts, ...prev].slice(0, 3));

    // Auto-dismiss after 5 seconds
    const timers = newAlerts.map(a =>
      setTimeout(() => {
        setVisibleAlerts(prev =>
          prev.map(p => p.uid === a.uid ? { ...p, fading: true } : p)
        );
        setTimeout(() => {
          setVisibleAlerts(prev => prev.filter(p => p.uid !== a.uid));
        }, 300);
      }, 5000)
    );

    return () => timers.forEach(clearTimeout);
  }, [alerts]);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="alert-overlay">
      {visibleAlerts.map(alert => (
        <div
          key={alert.uid}
          className={`alert-toast ${alert.fading ? 'fading' : ''}`}
          style={{ borderLeftColor: alert.color || 'var(--warning)' }}
        >
          <span className="icon">{alert.icon || '⚠️'}</span>
          <div className="content">
            <div className="title">{alert.message}</div>
            {alert.detail && <div className="detail">{alert.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
