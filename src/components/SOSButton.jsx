import React, { useState } from 'react';
import { Phone, MapPin, X, Shield, MessageCircle } from 'lucide-react';

export default function SOSButton({ userLocation, isNavigating }) {
  const [showModal, setShowModal] = useState(false);
  const [activated, setActivated] = useState(false);

  const handleSOS = () => {
    setShowModal(true);
  };

  const callEmergency = () => {
    setActivated(true);
    // Simulate calling emergency
    if (userLocation) {
      const msg = `EMERGENCY! Location: ${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`;
      console.log('SOS:', msg);
    }
    // In real app: window.open('tel:112')
    alert('Emergency services contacted! Your location has been shared.');
    setTimeout(() => {
      setActivated(false);
      setShowModal(false);
    }, 2000);
  };

  const shareLocation = () => {
    if (userLocation && navigator.share) {
      navigator.share({
        title: 'Emergency - My Location',
        text: `I need help! My location: https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`,
      }).catch(() => {});
    } else if (userLocation) {
      const url = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`;
      navigator.clipboard?.writeText(url);
      alert('Location link copied to clipboard!');
    }
  };

  return (
    <>
      <button
        className={`sos-button ${activated ? 'active' : ''}`}
        onClick={handleSOS}
        id="sos-btn"
        style={isNavigating ? { bottom: '260px' } : {}}
      >
        SOS
      </button>

      {showModal && (
        <div className="sos-modal" onClick={() => setShowModal(false)}>
          <div className="sos-modal-content glass-panel-strong" onClick={e => e.stopPropagation()}>
            <h2>🆘 Emergency SOS</h2>
            <p>Your current location will be shared with emergency services.</p>

            {userLocation && (
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-lg)' }}>
                📍 {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
              </p>
            )}

            <div className="sos-actions">
              <button className="btn btn-danger" onClick={callEmergency}>
                <Phone size={18} />
                Call Emergency (112)
              </button>
              <button className="btn btn-primary" onClick={shareLocation}>
                <MapPin size={18} />
                Share Live Location
              </button>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                <X size={18} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
