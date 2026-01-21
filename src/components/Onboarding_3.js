import React, { useState, useEffect } from 'react';
import { 
  ArrowRight,
  ArrowLeft,
  Music,
  X,
  Search,
  Check,
  CircleUserRound
} from 'lucide-react';
import './Onboarding_3.css';

function Onboarding_3({ onNext, onBack }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);

  // ✅ NEW: Suggestions from DB artists table
  const [artistSuggestions, setArtistSuggestions] = useState([]);

  // Maximum number of selectable artists
  const MAX_SELECTION = 5;

  // ✅ NEW: Fetch artist suggestions from DB when user types (mirrors Onboarding_2 behavior)
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

        // Filter out artists already selected (by display label/name)
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
      {
        ...artistRecord,
        name: label,          // keep existing UI logic (chips display artist.name)
        displayLabel: label   // keep consistent key for comparisons
      }
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
      // Delay closing to allow click event on dropdown item
      setTimeout(() => setIsSearchFocused(false), 200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('current_email');

    // ✅ CHANGED: Send list of Artist IDs instead of string name
    // The "artistRecord" from handleAddArtist comes from DB, so it includes 'id'
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
      {/* STEPPER PROGRESS BAR */}
      <div className="stepper-container">
        {/* Step 1 Complete */}
        <div className="step-item completed">
          <div className="step-circle">
            <Check size={18} strokeWidth={3} />
          </div>
        </div>
        <div className="step-line filled"></div>

        {/* Step 2 Complete */}
        <div className="step-item completed">
          <div className="step-circle">
            <Check size={18} strokeWidth={3} />
          </div>
        </div>
        <div className="step-line filled"></div>

        {/* Step 3 Active (Music) */}
        <div className="step-item active">
          <div className="step-circle">3</div>
          <span className="step-label">Music</span>
        </div>
        <div className="step-line"></div>

        {/* Step 4 Pending */}
        <div className="step-item">
          <div className="step-circle">4</div>
        </div>
      </div>

      <div className="auth-header">
        <h2 className="auth-title">
          Who do you listen to?
        </h2>
        <p className="auth-subtitle">
          Select up to 5 favorite artists to help us find your perfect set.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="auth-form"
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        <div className="fade-in" style={{ position: 'relative' }}>
          {/* FAVORITE ARTISTS INPUT */}
          <div className="form-group" style={{ position: 'relative', zIndex: 50 }}>
            <div className={`auth-input-wrapper ${focusedField === 'favoriteArtists' ? 'focused' : ''} ${isMaxReached ? 'disabled' : ''}`}>
              <Search className="auth-icon" size={22} {...getIconProps('favoriteArtists')} />
              <div className="input-stack">
                <span
                  className="input-label-small"
                  style={{ color: isMaxReached ? '#94a3b8' : getIconProps('favoriteArtists').color }}
                >
                  Favorite Artists {isMaxReached && "(Limit Reached)"}
                </span>
                <input
                  type="text"
                  name="favoriteArtists"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    if (!isMaxReached) {
                      handleFocus('favoriteArtists');
                      setIsSearchFocused(true);
                    }
                  }}
                  onBlur={() => handleBlur('favoriteArtists')}
                  placeholder={isMaxReached ? "Max 5 artists selected" : "Search artists..."}
                  className="auth-input stacked"
                  autoComplete="off"
                  disabled={isMaxReached}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{ color: '#FF2C2C', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', marginLeft: '0.5rem' }}>
                {error}
              </div>
            )}

            {/* FLOATING DROPDOWN */}
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
                      
                      {/* Wrap name and genre to stack them vertically */}
                      <div className="artist-text-group">
                        <div className="artist-main">
                          {label}
                        </div>
                        {/* Conditionally render genre if it exists */}
                        {artist.genres && (
                          <div className="artist-genres">
                            {artist.genres}
                          </div>
                        )}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CURRENT SELECTED ARTISTS GROUP */}
          {selectedArtists.length > 0 && (
            <div className="selected-artists-group fade-in">
              <label className="section-label">Current Selected Artists</label>
              <div className="chips-container">
                {selectedArtists.map((artist, index) => (
                  <div key={index} className="artist-chip">
                    <span className="chip-text">{artist.name}</span>
                    <button
                      type="button"
                      className="chip-remove-btn"
                      onClick={() => handleRemoveArtist(artist)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BUTTON CONTAINER: Back and Continue */}
        <div className="auth-button-group">
          {/* BACK BUTTON */}
          <button
            type="button"
            className="auth-back-btn"
            onClick={onBack}
          >
            <ArrowLeft size={24} />
          </button>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            className="auth-button"
            style={{ marginTop: 0, flex: 1 }}
          >
            <span>Continue</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Onboarding_3;