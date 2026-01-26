// Onboarding_2.js
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight,
  ArrowLeft,
  MapPin,
  X,
  Search,
  Check
} from 'lucide-react';
import './Onboarding_2.css';

function Onboarding_2({ onNext, onBack, homeCity }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [error, setError] = useState(null);

  // ✅ NEW: Suggestions from DB locations table
  const [citySuggestions, setCitySuggestions] = useState([]);

  // Maximum number of selectable cities
  const MAX_SELECTION = 5;

  // ✅ NEW: Fetch favorite city suggestions from DB when user types
  useEffect(() => {
    if (!inputValue || inputValue.length < 2) {
      setCitySuggestions([]);
      return;
    }

    const t = setTimeout(async () => {
      try {
        const url = `/api/db_locations?keyword=${encodeURIComponent(inputValue)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();

        const selectedLabels = new Set(selectedCities.map(c => c.displayLabel));
        const filtered = (Array.isArray(data) ? data : []).filter(d => {
          const label = d.displayLabel || d.name;
          return label && !selectedLabels.has(label);
        });

        setCitySuggestions(filtered);
      } catch (e) {
        console.error("Error fetching locations:", e);
        setCitySuggestions([]);
      }
    }, 150);

    return () => clearTimeout(t);
  }, [inputValue, selectedCities]);

  const handleAddCity = (cityRecord) => {
    setError(null); // Clear previous errors

    const label = cityRecord?.displayLabel || cityRecord?.name || '';

    // Check if the city is the user's Home City
    if (homeCity && label && label.toLowerCase() === homeCity.toLowerCase()) {
        setError("A Favorite City cannot be your Home City");
        setInputValue('');
        setIsSearchFocused(false);
        return;
    }

    if (selectedCities.length < MAX_SELECTION) {
      setSelectedCities(prev => [...prev, { ...cityRecord, displayLabel: label }]);
      setInputValue(''); // Clear input after selection
      setIsSearchFocused(false);
    }
  };

  const handleRemoveCity = (cityToRemove) => {
    setSelectedCities(prev => prev.filter(city => city.displayLabel !== cityToRemove.displayLabel));
  };

  const handleFocus = (field) => setFocusedField(field);
  
  const handleBlur = (field) => {
    setFocusedField(null);
    if (field === 'favoriteCities') {
      // Delay closing to allow click event on dropdown item
      setTimeout(() => setIsSearchFocused(false), 200);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const email = localStorage.getItem('current_email');
    
    // Create pipe-separated string of cities for the database
    const citiesString = selectedCities.map(c => c.displayLabel).join('|');

    try {
        const response = await fetch('/api/save_favorite_cities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cities: citiesString })
        });
        
        if (response.ok) {
            if (onNext) {
                onNext(selectedCities);
            }
        } else {
            const data = await response.json();
            alert(data.error || "Failed to save cities.");
        }
    } catch (error) {
        console.error("Error saving favorite cities:", error);
        alert("Server error. Please try again.");
    }
  };

  const isMaxReached = selectedCities.length >= MAX_SELECTION;

  const getIconProps = (fieldName) => {
    const isFocused = focusedField === fieldName;
    return isFocused 
      ? { color: '#0096a6', fill: 'none' } 
      : { color: '#161616', fill: 'none' };
  };

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
      
      {/* STEPPER PROGRESS BAR */}
      <div className="stepper-container">
        <div className="step-item completed">
          <div className="step-circle">
            <Check size={18} strokeWidth={3} />
          </div>
        </div>
        <div className="step-line filled"></div>
        <div className="step-item active">
          <div className="step-circle">2</div>
          <span className="step-label">Flights</span>
        </div>
        <div className="step-line"></div>
        <div className="step-item">
          <div className="step-circle">3</div>
        </div>
        <div className="step-line"></div>
        <div className="step-item">
          <div className="step-circle">4</div>
        </div>
      </div>
      
      <div className="auth-header">
        <h2 className="auth-title">
          Where to first?
        </h2>
        <p className="auth-subtitle">
            Select up to 5 cities that you either travel to often, or you've always wanted to explore.
        </p>
      </div>

      <form 
        onSubmit={handleSubmit} 
        className="auth-form"
        style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
      >
        
        <div className="fade-in" style={{ position: 'relative' }}>
          
          {/* FAVORITE CITIES INPUT */}
          <div className="form-group" style={{ position: 'relative', zIndex: 50 }}>
            <div className={`auth-input-wrapper ${focusedField === 'favoriteCities' ? 'focused' : ''} ${isMaxReached ? 'disabled' : ''}`}>
              <Search className="auth-icon" size={22} {...getIconProps('favoriteCities')} />
              <div className="input-stack">
                <span 
                  className="input-label-small"
                  style={{ color: isMaxReached ? '#94a3b8' : getIconProps('favoriteCities').color }}
                >
                  Favorite Cities {isMaxReached && "(Limit Reached)"}
                </span>
                <input
                  type="text"
                  name="favoriteCities"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onFocus={() => {
                    if (!isMaxReached) {
                      handleFocus('favoriteCities');
                      setIsSearchFocused(true);
                    }
                  }}
                  onBlur={() => handleBlur('favoriteCities')}
                  placeholder={isMaxReached ? "Max 5 cities selected" : "Search cities..."}
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
            {isSearchFocused && citySuggestions.length > 0 && (
              <div className="city-dropdown">
                {citySuggestions.map((loc) => (
                  <div 
                    key={loc.id || (loc.displayLabel || loc.name)} 
                    className="city-dropdown-item"
                    onMouseDown={() => handleAddCity({ ...loc, displayLabel: loc.displayLabel || loc.name })}
                  >
                    <MapPin size={16} className="city-icon" style={{ marginRight: '10px', color: '#94a3b8' }} />
                    <div className="city-main">
                      {loc.displayLabel || loc.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CURRENT SELECTED CITIES GROUP */}
          {selectedCities.length > 0 && (
            <div className="selected-cities-group fade-in">
              <label className="section-label">Current Selected Cities</label>
              <div className="chips-container">
                {selectedCities.map((city, index) => (
                  <div key={index} className="city-chip">
                    <span className="chip-text">{city.displayLabel}</span>
                    <button 
                      type="button" 
                      className="chip-remove-btn"
                      onClick={() => handleRemoveCity(city)}
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

export default Onboarding_2;