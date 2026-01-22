import React, { useState, useEffect } from 'react';
import { 
  ArrowRight,
  ArrowLeft,
  Music,
  X,
  Search,
  Check,
  CircleUserRound,
  Dot 
} from 'lucide-react';
import './Onboarding_3.css';

function Onboarding_3({ onNext, onBack }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);

  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const MAX_SELECTION = 5;

  useEffect(() => {
    if (!inputValue || inputValue.length < 2) {
      setArtistSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const url = `http://127.0.0.1:5001/api/db_artists?keyword=${encodeURIComponent(inputValue)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();

        const selectedLabels = new Set(selectedArtists.map(a => a.displayLabel || a.name));

        const filtered = (Array.isArray(data) ? data : []).filter(d => {
          const label = d.displayLabel || d.display_name || d.name;
          return label && !selectedLabels.has(label);
        });

        setArtistSuggestions(filtered);
      } catch (e) {
        console.error("Error fetching artists:", e);
        setArtistSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [inputValue, selectedArtists]);

  const handleAddArtist = (artistRecord) => {
    setError(null);
    if (selectedArtists.length >= MAX_SELECTION) return;

    const label = artistRecord?.displayLabel || artistRecord?.display_name || artistRecord?.name || '';
    if (!label) return;

    setSelectedArtists(prev => [
      ...prev,
      { ...artistRecord, name: label, displayLabel: label }
    ]);
    setInputValue('');
    setIsSearchFocused(false);
  };

  const handleRemoveArtist = (artistToRemove) => {
    const removeLabel = artistToRemove.displayLabel || artistToRemove.name;
    setSelectedArtists(prev =>
      prev.filter(a => (a.displayLabel || a.name) !== removeLabel)
    );
  };

  const handleFocus = (field) => setFocusedField(field);

  const handleBlur = (field) => {
    setFocusedField(null);
    if (field === 'favoriteArtists') {
      setTimeout(() => setIsSearchFocused(false), 200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem('current_email');
    const artistIds = selectedArtists.map(a => a.id);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/save_favorite_artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, artist_ids: artistIds })
      });

      if (response.ok) {
        if (onNext) onNext(selectedArtists);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save artists.");
      }
    } catch (error) {
      console.error("Error saving favorite artists:", error);
      alert("Server error. Please try again.");
    }
  };

  const isMaxReached = selectedArtists.length >= MAX_SELECTION;

  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return isFocused
      ? { color: '#0096a6', fill: 'none' }
      : { color: '#161616', fill: 'none' };
  };

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '640px' }}>
      <div className="stepper-container">
        <div className="step-item completed">
          <div className="step-circle"><Check size={18} strokeWidth={3} /></div>
        </div>
        <div className="step-line filled"></div>
        <div className="step-item completed">
          <div className="step-circle"><Check size={18} strokeWidth={3} /></div>
        </div>
        <div className="step-line filled"></div>
        <div className="step-item active">
          <div className="step-circle">3</div>
          <span className="step-label">Music</span>
        </div>
        <div className="step-line"></div>
        <div className="step-item">
          <div className="step-circle">4</div>
        </div>
      </div>

      <div className="auth-header">
        <h2 className="auth-title">Who do you listen to?</h2>
        <p className="auth-subtitle">Select up to 5 favorite artists to help us find your perfect set.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="fade-in" style={{ position: 'relative' }}>
          
          <div className="form-group" style={{ position: 'relative', zIndex: 50 }}>
            <div className={`auth-input-wrapper ${focusedField === 'favoriteArtists' ? 'focused' : ''} ${isMaxReached ? 'disabled' : ''}`}>
              <Search className="auth-icon" size={22} {...getIconProps('favoriteArtists')} />
              <div className="input-stack">
                <span className="input-label-small" style={{ color: isMaxReached ? '#94a3b8' : getIconProps('favoriteArtists').color }}>
                  Favorite Artists {isMaxReached && "(Limit Reached)"}
                </span>
                <input
                  type="text"
                  name="favoriteArtists"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => { if (!isMaxReached) { handleFocus('favoriteArtists'); setIsSearchFocused(true); } }}
                  onBlur={() => handleBlur('favoriteArtists')}
                  placeholder={isMaxReached ? "Max 5 artists selected" : "Search artists..."}
                  className="auth-input stacked"
                  autoComplete="off"
                  disabled={isMaxReached}
                />
              </div>
            </div>

            {error && (
              <div style={{ color: '#FF2C2C', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                {error}
              </div>
            )}

            {isSearchFocused && artistSuggestions.length > 0 && (
              <div className="artist-dropdown">
                {artistSuggestions.map((artist) => {
                  const label = artist.displayLabel || artist.display_name || artist.name;
                  return (
                    <div
                      key={artist.id || label}
                      className="artist-dropdown-item"
                      onMouseDown={() => handleAddArtist({ ...artist, displayLabel: label })}
                    >
                      <CircleUserRound size={24} className="artist-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />
                      
                      <div className="artist-text-group">
                        <div className="artist-main">{label}</div>
                        
                        {artist.genres && (
                          <div className="artist-genres" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            {artist.genres
                              .split('|')
                              .map(g => g.trim())        // 1. Trim whitespace
                              .filter(g => g.length > 0) // 2. Remove empty strings (fixes leading/trailing dots)
                              .map((genre, i, arr) => (
                                <React.Fragment key={i}>
                                  <span style={{ whiteSpace: 'nowrap' }}>
                                    {genre.toUpperCase()}
                                  </span>
                                  {/* Only show Dot if this is NOT the last item */}
                                  {i < arr.length - 1 && (
                                    <Dot 
                                      size={12} 
                                      strokeWidth={4} 
                                      style={{ margin: '0 2px', flexShrink: 0, color: '#94a3b8' }} 
                                    />
                                  )}
                                </React.Fragment>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedArtists.length > 0 && (
            <div className="selected-artists-group fade-in">
              <label className="section-label">Current Selected Artists</label>
              <div className="chips-container">
                {selectedArtists.map((artist, index) => (
                  <div key={index} className="artist-chip">
                    <span className="chip-text">{artist.name}</span>
                    <button type="button" className="chip-remove-btn" onClick={() => handleRemoveArtist(artist)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="auth-button-group">
          <button type="button" className="auth-back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <button type="submit" className="auth-button" style={{ marginTop: 0, flex: 1 }}>
            <span>Continue</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Onboarding_3;