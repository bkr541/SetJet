import React, { useState, useMemo } from 'react';
import { 
  ArrowRight,
  MapPin,
  X,
  Search,
  Check
} from 'lucide-react';
import './Onboarding_2.css';
// Ensure this path matches your project structure
import cityData from '../data/FrontierDestinationInfo_numeric.json';

function Onboarding_2({ onNext }) {
  const [inputValue, setInputValue] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Maximum number of selectable cities
  const MAX_SELECTION = 5;

  // Filter Logic (Distinct City, State)
  const filteredCities = useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    
    const lowerInput = inputValue.toLowerCase();
    const uniqueCities = new Set();
    const distinctResults = [];

    // Filter out cities already selected
    const selectedLabels = new Set(selectedCities.map(c => c.displayLabel));

    for (const item of cityData) {
      if (item.City && item.City.toLowerCase().includes(lowerInput)) {
        const locationStr = item['State Abbreviation'] 
          ? `${item.City}, ${item['State Abbreviation']}`
          : `${item.City}, ${item.Country}`;

        // Add if unique and not already selected
        if (!uniqueCities.has(locationStr) && !selectedLabels.has(locationStr)) {
          uniqueCities.add(locationStr);
          distinctResults.push({
            ...item,
            displayLabel: locationStr
          });
        }
      }
    }
    
    return distinctResults;
  }, [inputValue, selectedCities]);

  const handleAddCity = (cityRecord) => {
    if (selectedCities.length < MAX_SELECTION) {
      setSelectedCities(prev => [...prev, cityRecord]);
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onNext) {
      // Pass the selected data to the parent handler
      onNext(selectedCities);
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
          Where do you fly?
        </h2>
        <p className="auth-subtitle">
            Select up to 5 favorite cities to help us personalize your deals.
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

            {/* FLOATING DROPDOWN */}
            {isSearchFocused && filteredCities.length > 0 && (
              <div className="city-dropdown">
                {filteredCities.map((city, index) => (
                  <div 
                    key={index} 
                    className="city-dropdown-item"
                    onMouseDown={() => handleAddCity(city)}
                  >
                    <div className="city-main">
                      {city.displayLabel}
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

        {/* SUBMIT BUTTON */}
        <button 
          type="submit" 
          className="auth-button"
          style={{ marginTop: 'auto' }}
        >
          <span>Continue</span>
          <ArrowRight size={20} />
        </button>
      </form>

    </div>
  );
}

export default Onboarding_2;