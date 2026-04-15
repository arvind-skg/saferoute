import React, { useState } from 'react';
import { getReportIcon, getReportLabel } from '../services/communityService';

const reportTypes = ['accident', 'hazard', 'police', 'roadblock', 'animal', 'flood'];

export default function ReportModal({ userLocation, onSubmit, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedType || !userLocation) return;
    onSubmit({
      type: selectedType,
      lat: userLocation.lat,
      lng: userLocation.lng,
      description: description || getReportLabel(selectedType),
    });
    onClose();
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal glass-panel-strong" onClick={e => e.stopPropagation()}>
        <h3>📢 Report an Issue</h3>

        <div className="report-types">
          {reportTypes.map(type => (
            <button
              key={type}
              className={`report-type-btn ${selectedType === type ? 'selected' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              <span className="emoji">{getReportIcon(type)}</span>
              <span className="text">{getReportLabel(type)}</span>
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          placeholder="Add details (optional)..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="report-modal-actions">
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 0 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedType}
            style={{ flex: 1 }}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
