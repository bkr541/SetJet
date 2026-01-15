import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  ArrowRight,
  X,
  Plus
} from 'lucide-react';
import './InitProfileCities.css';
// Assuming the data file is located one level up in the data folder based on your prompt
import cityData from '../data/FrontierDestinationInfo_numeric.json';

function InitProfileCities({ onComplete }) { // Changed prop to onComplete to match App.js flow
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCities, setSelectedCities] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');

  // Filter cities based on input (only if > 3 chars)
  const filteredCities = useMemo(() => {
    if (searchTerm.length <= 3) return [];
    
    return cityData.filter(item => 
      item.City && item.City.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleChange = (e) => {
    setSearchTerm(e.target.value);
    if (error) setError('');
  };

  const handleFocus = () => setIsFocused(true);
  // Delay blur to allow clicking on dropdown items
  const handleBlur = () => setTimeout(() => setIsFocused(false), 200);

  const handleSelectCity = (cityRecord) => {
    // 1. Validation: Max 5 cities
    if (selectedCities.length >= 5) {
      setError('You can only select up to 5 Key Cities.');
      setSearchTerm(''); // Optional: clear input on error to clean up UI
      return;
    }

    // 2. Format: "City, State Abbreviation" (or Country if international)
    const locationStr = cityRecord['State Abbreviation'] 
      ? `${cityRecord.City}, ${cityRecord['State Abbreviation']}`
      : `${cityRecord.City}, ${cityRecord.Country}`;

    // 3. Prevent Duplicates
    if (selectedCities.includes(locationStr)) {
      setSearchTerm('');
      return;
    }

    // 4. Add to state
    setSelectedCities(prev => [...prev, locationStr]);
    setSearchTerm(''); // Clear input
    setError('');
  };

  const handleRemoveCity = (cityToRemove) => {
    setSelectedCities(prev => prev.filter(c => c !== cityToRemove));
    if (error) setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // You might want to enforce at least 1 city, but for now we just pass it on
    console.log('Selected Cities:', selectedCities);
    if (onComplete) onComplete(selectedCities);
  };

  const getIconProps = () => {
    if (isFocused) return { color: '#0096a6', fill: 'none' };
    if (searchTerm.length > 0) return { color: '#004e5a', fill: 'none' };
    return { color: '#161616', fill: 'none' };
  };

  return (
    <div className="login-container">
      
      {/* LOGO SECTION */}
      <div className="logo-container">
        <img src="/logos/setjet_logoa.png" alt="SetJet Logo" className="auth-logo" />
      </div>

      <div className="auth-header">
        <h2 className="auth-title">
          Where do you fly?
        </h2>
        <p className="auth-subtitle">
            Select up to 5 cities to personalize your deals.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        
        <div className="fade-in" style={{ position: 'relative' }}>
          
          {/* CITY SEARCH INPUT */}
          <div className="form-group">
            <div className={`auth-input-wrapper ${error ? 'error' : ''}`}>
              {/* Changed icon to MapPin */}
              <MapPin className="auth-icon" size={22} {...getIconProps()} />
              <div className="input-stack">
                <span 
                    className="input-label-small"
                    style={{ color: getIconProps().color }}
                >
                    City Search
                </span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="e.g. Atlanta, Denver..."
                  className="auth-input stacked"
                  autoComplete="off"
                />
              </div>
            </div>
            {error && <span className="error-msg">{error}</span>}
            
            {/* FLOATING DROPDOWN */}
            {isFocused && searchTerm.length > 3 && filteredCities.length > 0 && (
              <div className="city-dropdown">
                {filteredCities.map((city, index) => (
                  <div 
                    key={index} 
                    className="city-dropdown-item"
                    onMouseDown={() => handleSelectCity(city)} // Use onMouseDown to trigger before onBlur
                  >
                    <div className="city-main">
                      {city.City}, {city['State Abbreviation'] || city.Country}
                    </div>
                    <div className="city-sub">
                      {city['Airport Name']} ({city['IATA Code']})
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* EMPTY STATE DROPDOWN (Optional UX improvement) */}
            {isFocused && searchTerm.length > 3 && filteredCities.length === 0 && (
              <div className="city-dropdown">
                 <div className="city-dropdown-item no-hover">
                    No cities found matching "{searchTerm}"
                 </div>
              </div>
            )}
          </div>

          {/* KEY CITIES GROUP */}
          {selectedCities.length > 0 && (
            <div className="key-cities-section">
              <h3 className="section-heading">Your Key Cities ({selectedCities.length}/5)</h3>
              <div className="chips-container">
                {selectedCities.map((city, idx) => (
                  <div key={idx} className="city-chip">
                    <span>{city}</span>
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
        <button type="submit" className="auth-button">
          <span>Continue</span>
          <ArrowRight size={20} />
        </button>
      </form>

    </div>
  );
}

export default InitProfileCities;