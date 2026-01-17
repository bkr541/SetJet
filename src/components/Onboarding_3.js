import React, { useState, useMemo } from 'react';
import { 
  ArrowRight,
  ArrowLeft,
  Music, // Changed from MapPin
  X,
  Search,
  Check
} from 'lucide-react';
import './Onboarding_3.css';

// Dummy Data for Artists (Placeholder for future API)
const DUMMY_ARTISTS = [
  { id: 1, name: 'Illenium', genre: 'Melodic Bass' },
  { id: 2, name: 'Excision', genre: 'Dubstep' },
  { id: 3, name: 'Seven Lions', genre: 'Melodic Dubstep' },
  { id: 4, name: 'Odesza', genre: 'Electronic' },
  { id: 5, name: 'Griz', genre: 'Funk' },
  { id: 6, name: 'Subtronics', genre: 'Dubstep' },
  { id: 7, name: 'Slander', genre: 'Trap/Bass' },
  { id: 8, name: 'Above & Beyond', genre: 'Trance' },
  { id: 9, name: 'Porter Robinson', genre: 'Electronic' },
  { id: 10, name: 'Martin Garrix', genre: 'House' },
  { id: 11, name: 'Zeds Dead', genre: 'Dubstep/House' },
  { id: 12, name: 'Flume', genre: 'Future Bass' },
  { id: 13, name: 'Skrillex', genre: 'Dubstep' },
  { id: 14, name: 'Rezz', genre: 'Midtempo' },
  { id: 15, name: 'RL Grime', genre: 'Trap' }
];

function Onboarding_3({ onNext, onBack }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);

  // Maximum number of selectable artists
  const MAX_SELECTION = 5;

  // Filter Logic
  const filteredArtists = useMemo(() => {
    if (!inputValue || inputValue.length < 1) return [];
    
    const lowerInput = inputValue.toLowerCase();
    
    // Filter out artists already selected
    const selectedNames = new Set(selectedArtists.map(a => a.name));

    return DUMMY_ARTISTS.filter(artist => 
      artist.name.toLowerCase().includes(lowerInput) && 
      !selectedNames.has(artist.name)
    );
  }, [inputValue, selectedArtists]);

  const handleAddArtist = (artistRecord) => {
    setError(null);

    if (selectedArtists.length < MAX_SELECTION) {
      setSelectedArtists(prev => [...prev, artistRecord]);
      setInputValue(''); // Clear input after selection
      setIsSearchFocused(false);
    }
  };

  const handleRemoveArtist = (artistToRemove) => {
    setSelectedArtists(prev => prev.filter(artist => artist.name !== artistToRemove.name));
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
    
    // Create pipe-separated string of artists
    const artistsString = selectedArtists.map(a => a.name).join('|');

    try {
        // Placeholder endpoint for saving artists
        const response = await fetch('http://127.0.0.1:5001/api/save_favorite_artists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, artists: artistsString })
        });
        
        if (response.ok) {
            if (onNext) {
                onNext(selectedArtists);
            }
        } else {
            // For now, since the API might not exist yet, you might want to force success 
            // if developing locally without the backend update:
            // if (onNext) onNext(selectedArtists);
            
            const data = await response.json();
            alert(data.error || "Failed to save artists.");
        }
    } catch (error) {
        console.error("Error saving favorite artists:", error);
        // Fallback for development if API isn't ready
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
            {isSearchFocused && filteredArtists.length > 0 && (
              <div className="artist-dropdown">
                {filteredArtists.map((artist, index) => (
                  <div 
                    key={index} 
                    className="artist-dropdown-item"
                    onMouseDown={() => handleAddArtist(artist)}
                  >
                    <Music size={16} className="artist-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />
                    <div className="artist-main">
                      {artist.name}
                    </div>
                  </div>
                ))}
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