// OnboardingArtistStep.js
import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Search, X, CircleUserRound, Dot } from 'lucide-react';
import './Onboarding_3.css';

export default function OnboardingArtistStep({
  selectedArtists,
  setSelectedArtists,
  onBack,
  onFinish,
  maxSelection = 5,
}) {
  const [inputValue, setInputValue] = useState('');
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);

  // Fetch artist suggestions
  useEffect(() => {
    if (!inputValue || inputValue.length < 2) {
      setArtistSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const url = `/api/db_artists?keyword=${encodeURIComponent(inputValue)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();

        const selectedLabels = new Set((selectedArtists || []).map(a => a.displayLabel || a.name));
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

  const isMaxReached = (selectedArtists?.length || 0) >= maxSelection;

  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return isFocused
      ? { color: '#0096a6', fill: 'none' }
      : { color: '#161616', fill: 'none' };
  };

  const handleAddArtist = (artistRecord) => {
    setError(null);
    if (isMaxReached) return;

    const label = artistRecord?.displayLabel || artistRecord?.display_name || artistRecord?.name || '';
    if (!label) return;

    setSelectedArtists(prev => [
      ...(Array.isArray(prev) ? prev : []),
      { ...artistRecord, name: label, displayLabel: label }
    ]);

    setInputValue('');
    setIsSearchFocused(false);
  };

  const handleRemoveArtist = (artistToRemove) => {
    const removeLabel = artistToRemove.displayLabel || artistToRemove.name;
    setSelectedArtists(prev =>
      (Array.isArray(prev) ? prev : []).filter(a => (a.displayLabel || a.name) !== removeLabel)
    );
  };

  const handleBlur = (field) => {
    setFocusedField(null);
    if (field === 'favoriteArtists') {
      setTimeout(() => setIsSearchFocused(false), 200);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedArtists || selectedArtists.length === 0) {
      setError('Please select at least one artist.');
      return;
    }

    onFinish && onFinish();
  };

  return (
    <>
      <div className="auth-header">
        <h2 className="auth-title">Who do you listen to?</h2>
        <p className="auth-subtitle">Select up to 5 favorite artists to help us find your perfect set.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="fade-in" style={{ position: 'relative' }}>
          {/* ARTISTS INPUT */}
          <div className="form-group" style={{ position: 'relative', zIndex: 60 }}>
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
                  onFocus={() => { if (!isMaxReached) { setFocusedField('favoriteArtists'); setIsSearchFocused(true); } }}
                  onBlur={() => handleBlur('favoriteArtists')}
                  placeholder={isMaxReached ? `Max ${maxSelection} artists selected` : "Search artists..."}
                  className="auth-input stacked"
                  autoComplete="off"
                  disabled={isMaxReached}
                />
              </div>
            </div>

            {/* Suggestions Dropdown (reuse existing artist dropdown classes) */}
            {isSearchFocused && artistSuggestions.length > 0 && (
              <div className="artist-dropdown">
                {artistSuggestions.map((artist) => {
                  const label = artist.displayLabel || artist.display_name || artist.name;

                  // Truncation logic (same as your original Onboarding_3)
                  const genresList = artist.genres
                    ? artist.genres.split('|').map(g => g.trim()).filter(g => g.length > 0)
                    : [];
                  const visibleGenres = genresList.slice(0, 3);
                  const remainingCount = genresList.length - 3;

                  return (
                    <div
                      key={artist.id || label}
                      className="artist-dropdown-item"
                      onMouseDown={() => handleAddArtist({ ...artist, displayLabel: label })}
                    >
                      <CircleUserRound size={24} className="artist-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />

                      <div className="artist-text-group">
                        <div className="artist-main">{label}</div>

                        {genresList.length > 0 && (
                          <div className="artist-genres" style={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                            {visibleGenres.map((genre, i) => (
                              <React.Fragment key={i}>
                                <span style={{ whiteSpace: 'nowrap' }}>
                                  {genre
                                    .split(' ')
                                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(' ')
                                  }
                                </span>
                                {i < visibleGenres.length - 1 && (
                                  <Dot size={12} strokeWidth={4} style={{ margin: '0 2px', flexShrink: 0, color: '#94a3b8' }} />
                                )}
                              </React.Fragment>
                            ))}
                            {remainingCount > 0 && (
                              <span style={{ whiteSpace: 'nowrap', fontStyle: 'italic', marginLeft: '5px' }}>
                                + {remainingCount} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Artists Chips */}
          {Array.isArray(selectedArtists) && selectedArtists.length > 0 && (
            <div className="selected-artists-group fade-in" style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
              <label className="section-label">Current Selected Artists</label>
              <div className="chips-container">
                {selectedArtists.map((artist, index) => (
                  <div key={artist.id || index} className="artist-chip">
                    <span className="chip-text">{artist.name}</span>
                    <button type="button" className="chip-remove-btn" onClick={() => handleRemoveArtist(artist)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ color: '#FF2C2C', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', marginLeft: '0.5rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* ✅ Use your existing button styling */}
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
    </>
  );
}
