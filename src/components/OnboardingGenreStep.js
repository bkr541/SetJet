// OnboardingGenreStep.js
import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Music, X } from 'lucide-react';
import './Onboarding_3.css';

export default function OnboardingGenreStep({
  selectedGenres,
  setSelectedGenres,
  onBack,
  onNext,
  maxSelection = 5,
}) {
  const [genreInputValue, setGenreInputValue] = useState('');
  const [genreSuggestions, setGenreSuggestions] = useState([]);
  const [isGenreSearchFocused, setIsGenreSearchFocused] = useState(false);

  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);

  // Fetch genre suggestions
  useEffect(() => {
    if (!genreInputValue || genreInputValue.length < 2) {
      setGenreSuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const url = `/api/db_genres?keyword=${encodeURIComponent(genreInputValue)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();

        const selectedLabels = new Set((selectedGenres || []).map(g => g.name));
        const filtered = (Array.isArray(data) ? data : []).filter(d => {
          const label = d.name || d.displayLabel;
          return label && !selectedLabels.has(label);
        });

        setGenreSuggestions(filtered);
      } catch (e) {
        console.error('Error fetching genres:', e);
        setGenreSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [genreInputValue, selectedGenres]);

  const isMaxReached = (selectedGenres?.length || 0) >= maxSelection;

  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return isFocused
      ? { color: '#0096a6', fill: 'none' }
      : { color: '#161616', fill: 'none' };
  };

  const handleAddGenre = (genreRecord) => {
    setError(null);
    if (isMaxReached) return;

    const label = genreRecord?.name || genreRecord?.displayLabel || '';
    if (!label) return;

    setSelectedGenres(prev => [
      ...(Array.isArray(prev) ? prev : []),
      { ...genreRecord, name: label }
    ]);

    setGenreInputValue('');
    setIsGenreSearchFocused(false);
  };

  const handleRemoveGenre = (genreToRemove) => {
    setSelectedGenres(prev => (Array.isArray(prev) ? prev : []).filter(g => g.name !== genreToRemove.name));
  };

  const handleBlur = (field) => {
    setFocusedField(null);
    if (field === 'favoriteGenres') {
      setTimeout(() => setIsGenreSearchFocused(false), 200);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedGenres || selectedGenres.length === 0) {
      setError('Please select at least one genre.');
      return;
    }

    onNext && onNext();
  };

  return (
    <>
      <div className="auth-header">
        <h2 className="auth-title">What do you vibe with?</h2>
        <p className="auth-subtitle">Pick up to 5 genres first. You’ll choose artists next.</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="fade-in" style={{ position: 'relative' }}>
          {/* GENRES INPUT */}
          <div className="form-group" style={{ position: 'relative', zIndex: 60 }}>
            <div className={`auth-input-wrapper ${focusedField === 'favoriteGenres' ? 'focused' : ''} ${isMaxReached ? 'disabled' : ''}`}>
              <Music className="auth-icon" size={22} {...getIconProps('favoriteGenres')} />
              <div className="input-stack">
                <span className="input-label-small" style={{ color: isMaxReached ? '#94a3b8' : getIconProps('favoriteGenres').color }}>
                  Favorite Genres {isMaxReached && "(Limit Reached)"}
                </span>
                <input
                  type="text"
                  name="favoriteGenres"
                  value={genreInputValue}
                  onChange={(e) => setGenreInputValue(e.target.value)}
                  onFocus={() => { if (!isMaxReached) { setFocusedField('favoriteGenres'); setIsGenreSearchFocused(true); } }}
                  onBlur={() => handleBlur('favoriteGenres')}
                  placeholder={isMaxReached ? `Max ${maxSelection} genres selected` : "Search genres..."}
                  className="auth-input stacked"
                  autoComplete="off"
                  disabled={isMaxReached}
                />
              </div>
            </div>

            {/* Genre Suggestions Dropdown (reuse your existing dropdown classes) */}
            {isGenreSearchFocused && genreSuggestions.length > 0 && (
              <div className="artist-dropdown">
                {genreSuggestions.map((genre) => (
                  <div
                    key={genre.id || genre.name}
                    className="artist-dropdown-item"
                    onMouseDown={() => handleAddGenre(genre)}
                  >
                    <Music size={20} className="artist-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />
                    <div className="artist-text-group">
                      <div className="artist-main">
                        {String(genre.name || '').charAt(0).toUpperCase() + String(genre.name || '').slice(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Genres Chips (reuse your existing chip styling) */}
          {Array.isArray(selectedGenres) && selectedGenres.length > 0 && (
            <div className="selected-artists-group fade-in" style={{ marginTop: '0.5rem' }}>
              <label className="section-label">Current Selected Genres</label>
              <div className="chips-container">
                {selectedGenres.map((genre, index) => (
                  <div key={genre.id || index} className="artist-chip">
                    <span className="chip-text">
                      {String(genre.name || '').charAt(0).toUpperCase() + String(genre.name || '').slice(1)}
                    </span>
                    <button type="button" className="chip-remove-btn" onClick={() => handleRemoveGenre(genre)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ color: '#FF2C2C', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem', marginLeft: '0.5rem' }}>
              {error}
            </div>
          )}
        </div>

        {/* ✅ Use your existing button group styling */}
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
