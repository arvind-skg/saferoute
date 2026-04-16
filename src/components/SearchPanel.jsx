import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, ArrowUpDown, Navigation, X, Crosshair } from 'lucide-react';
import { geocode } from '../services/routingService';

export default function SearchPanel({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onSearch,
  onUseMyLocation,
  isNavigating,
  loading,
  user,
  onUserClick,
  waypoints,
  onClearWaypoints,
}) {
  const [originText, setOriginText] = useState(origin?.shortName || '');
  const [destText, setDestText] = useState(destination?.shortName || '');
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setOriginText(origin?.shortName || origin?.displayName || '');
  }, [origin]);

  useEffect(() => {
    setDestText(destination?.shortName || destination?.displayName || '');
  }, [destination]);

  const handleInputChange = useCallback((value, field) => {
    if (field === 'origin') setOriginText(value);
    else setDestText(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await geocode(value);
      setSuggestions(results);
      setActiveField(field);
    }, 400);
  }, []);

  const selectSuggestion = (suggestion) => {
    if (activeField === 'origin') {
      setOriginText(suggestion.shortName);
      onOriginChange(suggestion);
    } else {
      setDestText(suggestion.shortName);
      onDestinationChange(suggestion);
    }
    setSuggestions([]);
    setActiveField(null);
  };

  const handleSwap = () => {
    const tmpOrigin = origin;
    const tmpText = originText;
    onOriginChange(destination);
    onDestinationChange(tmpOrigin);
    setOriginText(destText);
    setDestText(tmpText);
  };

  const handleSearch = () => {
    if (origin && destination) {
      setSuggestions([]);
      onSearch();
    }
  };

  if (isNavigating) return null;

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="search-panel glass-panel" id="search-panel">
      <div className="search-header">
        <div className="search-logo">
          <Navigation size={22} />
          SafeRoute
        </div>
        {user && (
          <button className="search-user-btn" onClick={onUserClick} title={user.name}>
            {userInitial}
          </button>
        )}
      </div>

      <div className="search-inputs">
        <div className="search-input-row">
          <span className="dot origin" />
          <input
            type="text"
            placeholder="Choose starting point..."
            value={originText}
            onChange={(e) => handleInputChange(e.target.value, 'origin')}
            onFocus={() => setActiveField('origin')}
            id="origin-input"
          />
          <button
            className="btn btn-icon btn-secondary"
            onClick={onUseMyLocation}
            title="Use my location"
            style={{ width: 28, height: 28, minWidth: 28 }}
          >
            <Crosshair size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="search-swap-btn" onClick={handleSwap} title="Swap">
            <ArrowUpDown size={16} />
          </button>
        </div>

        <div className="search-input-row">
          <span className="dot dest" />
          <input
            type="text"
            placeholder="Choose destination..."
            value={destText}
            onChange={(e) => handleInputChange(e.target.value, 'destination')}
            onFocus={() => setActiveField('destination')}
            id="destination-input"
          />
          {destText && (
            <button
              className="btn btn-icon btn-secondary"
              onClick={() => { setDestText(''); onDestinationChange(null); }}
              style={{ width: 28, height: 28, minWidth: 28 }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="search-actions">
        <button
          className="btn btn-primary"
          onClick={handleSearch}
          disabled={!origin || !destination || loading}
          id="search-route-btn"
        >
          {loading ? (
            <div className="loading-dots"><span /><span /><span /></div>
          ) : (
            <>
              <Search size={16} />
              Find Routes
            </>
          )}
        </button>
      </div>

      {waypoints && waypoints.length > 0 && (
        <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
            🛡️ {waypoints.length} Safe-Haven{waypoints.length > 1 ? 's' : ''} Added
          </div>
          <button className="btn btn-icon btn-secondary" onClick={onClearWaypoints} style={{ width: 24, height: 24, padding: 0 }} title="Clear waypoints">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Autocomplete dropdown */}
      {suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="autocomplete-item"
              onClick={() => selectSuggestion(s)}
            >
              <MapPin size={16} />
              <span className="place-name">{s.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
