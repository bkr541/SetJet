import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Wrench, 
  ArrowRight, 
  Repeat, 
  Sun, 
  CalendarRange,
  PlaneTakeoff,
  PlaneLanding,
  Calendar,
  MapPin,
  Building2,
  X // Added X icon
} from 'lucide-react';
import './SearchForm.css';

function SearchForm({ onSearch, loading }) {
  const [searchMode, setSearchMode] = useState('package');
  
  // --- ORIGIN SEARCH STATE ---
  const [origins, setOrigins] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [isOriginSelected, setIsOriginSelected] = useState(false);
  // ---------------------------

  const [destinations, setDestinations] = useState('');
  const [anyDestination, setAnyDestination] = useState(false);
  const [tripType, setTripType] = useState('round-trip');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [tripLength, setTripLength] = useState('');
  const [tripLengthUnit, setTripLengthUnit] = useState('days');
  const [maxTripDuration, setMaxTripDuration] = useState('');
  const [maxTripDurationUnit, setMaxTripDurationUnit] = useState('days');
  const [nonstopPreferred, setNonstopPreferred] = useState(false);

  // Debounce logic for Origin Search
  useEffect(() => {
    const searchLocations = async () => {
      if (isOriginSelected) return;

      if (origins.length < 2) {
        setOriginResults([]);
        setShowOriginDropdown(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:5001/api/locations?keyword=${origins}`);
        if (response.ok) {
          const data = await response.json();
          setOriginResults(data);
          setShowOriginDropdown(true);
        }
      } catch (error) {
        console.error("Error searching locations:", error);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!isOriginSelected && (showOriginDropdown || origins.length >= 2)) { 
        searchLocations();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [origins, showOriginDropdown, isOriginSelected]);

  const handleSelectOrigin = (code) => {
    setOrigins(code);
    setIsOriginSelected(true);
    setShowOriginDropdown(false);
    setOriginResults([]);
  };

  // NEW: Handle clearing the origin selection
  const handleClearOrigin = (e) => {
    e.stopPropagation(); // Prevent event bubbling
    setOrigins('');
    setIsOriginSelected(false);
    setShowOriginDropdown(false);
    setOriginResults([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const originAirports = origins.split(',').map(s => s.trim()).filter(s => s);
    const destinationAirports = anyDestination
      ? ['ANY']
      : destinations.split(',').map(s => s.trim()).filter(s => s);

    const searchParams = {
      searchMode,
      origins: originAirports,
      destinations: destinationAirports,
      tripType: searchMode === 'build-your-own' ? 'one-way' : tripType,
      departureDate,
      returnDate: tripType === 'one-way' || searchMode === 'build-your-own' ? null : returnDate,
    };

    if (searchMode === 'build-your-own' && returnDate) {
      searchParams.desiredReturnDate = returnDate;
    }

    if (tripType === 'trip-planner') {
      searchParams.tripLength = tripLength;
      searchParams.tripLengthUnit = tripLengthUnit;
      searchParams.nonstopPreferred = nonstopPreferred;
      if (maxTripDuration) {
        searchParams.maxTripDuration = maxTripDuration;
        searchParams.maxTripDurationUnit = maxTripDurationUnit;
      }
    }

    onSearch(searchParams);
  };

  return (
    <div className="search-form-container">
      <h2>Search Flights</h2>
      <form onSubmit={handleSubmit} className="search-form">
        
        {/* Search Mode Toggle */}
        <div className="form-group">
          <label htmlFor="searchMode">Search Mode</label>
          <div className="trip-type-selector">
            <label className={`trip-type-option ${searchMode === 'package' ? 'active' : ''}`}>
              <input
                type="radio"
                name="searchMode"
                value="package"
                checked={searchMode === 'package'}
                onChange={(e) => setSearchMode(e.target.value)}
              />
              <Package size={18} className="option-icon" />
              <span>Package Trip</span>
            </label>
            <label className={`trip-type-option ${searchMode === 'build-your-own' ? 'active' : ''}`}>
              <input
                type="radio"
                name="searchMode"
                value="build-your-own"
                checked={searchMode === 'build-your-own'}
                onChange={(e) => setSearchMode(e.target.value)}
              />
              <Wrench size={18} className="option-icon" />
              <span>Build Your Own</span>
            </label>
          </div>
          <small>
            {searchMode === 'package'
              ? 'Search for complete round-trip packages'
              : 'Select outbound flight first, then choose your return flight'}
          </small>
        </div>

        {/* Trip Type Toggle */}
        {searchMode === 'package' && (
          <div className="form-group">
            <label htmlFor="tripType">Trip Type</label>
            <div className="trip-type-selector">
              <label className={`trip-type-option ${tripType === 'one-way' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="tripType"
                  value="one-way"
                  checked={tripType === 'one-way'}
                  onChange={(e) => setTripType(e.target.value)}
                />
                <ArrowRight size={18} className="option-icon" />
                <span>One Way</span>
              </label>
              <label className={`trip-type-option ${tripType === 'round-trip' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="tripType"
                  value="round-trip"
                  checked={tripType === 'round-trip'}
                  onChange={(e) => setTripType(e.target.value)}
                />
                <Repeat size={18} className="option-icon" />
                <span>Round Trip</span>
              </label>
              <label className={`trip-type-option ${tripType === 'day-trip' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="tripType"
                  value="day-trip"
                  checked={tripType === 'day-trip'}
                  onChange={(e) => setTripType(e.target.value)}
                />
                <Sun size={18} className="option-icon" />
                <span>Day Trip</span>
              </label>
              <label className={`trip-type-option ${tripType === 'trip-planner' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="tripType"
                  value="trip-planner"
                  checked={tripType === 'trip-planner'}
                  onChange={(e) => setTripType(e.target.value)}
                />
                <CalendarRange size={18} className="option-icon" />
                <span>Trip Planner</span>
              </label>
            </div>
          </div>
        )}

        {/* Origin and Destination Row */}
        <div className="form-row">
          {/* Origin Column */}
          <div className="form-group"> 
            <label htmlFor="origins">Origin Airports</label>
            
            <div className="relative-input-container">
              <div className={`search-input-wrapper ${isOriginSelected ? 'has-value' : ''}`}>
                <PlaneTakeoff className="search-icon" size={20} />
                <input
                  type="text"
                  id="origins"
                  value={origins}
                  onChange={(e) => {
                    setOrigins(e.target.value);
                    setIsOriginSelected(false);
                    setShowOriginDropdown(true);
                  }}
                  onFocus={() => {
                    if (origins.length >= 2 && !isOriginSelected) setShowOriginDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                  placeholder="e.g., DEN, LAX, SFO"
                  required
                  className="search-box-input"
                  autoComplete="off"
                />
                {/* NEW CLEAR BUTTON */}
                {isOriginSelected && (
                  <X 
                    className="clear-icon" 
                    size={18} 
                    onClick={handleClearOrigin}
                  />
                )}
              </div>

              {/* FLOATING DROPDOWN GROUP */}
              {showOriginDropdown && originResults.length > 0 && (
                <div className="autocomplete-dropdown">
                  {originResults.map((result) => (
                    <div 
                      key={result.value} 
                      className="autocomplete-item"
                      onClick={() => handleSelectOrigin(result.value)}
                    >
                      <div className="item-icon">
                        {result.type === 'City' ? <Building2 size={16} /> : <MapPin size={16} />}
                      </div>
                      <div className="item-info">
                        <span className="item-label">{result.label}</span>
                        <span className="item-sub">{result.country}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <small>Comma-separated (e.g., DEN, LAX)</small>
          </div>

          {/* Destination Column */}
          <div className="form-group">
            <label htmlFor="destinations">Destination Airports</label>
            
            <div className={`search-input-wrapper ${anyDestination ? 'disabled' : ''} ${!anyDestination && destinations ? 'has-value' : ''}`}>
              <PlaneLanding className="search-icon" size={20} />
              <input
                type="text"
                id="destinations"
                value={anyDestination ? '' : destinations}
                onChange={(e) => setDestinations(e.target.value)}
                placeholder={anyDestination ? "Searching all airports..." : "e.g., MCO, MIA, LAS"}
                disabled={anyDestination}
                required={!anyDestination}
                className={`search-box-input ${anyDestination ? 'input-disabled-placeholder' : ''}`}
              />
            </div>

            <small>
              {anyDestination 
                ? "We'll search every available route from your origin." 
                : "Comma-separated (e.g., MCO, MIA)"}
            </small>

            {/* Right-aligned Toggle */}
            <div className="toggle-group right-align">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={anyDestination}
                  onChange={(e) => {
                    setAnyDestination(e.target.checked);
                    if (e.target.checked) {
                      setDestinations('');
                    }
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Any Airport</span>
            </div>
          </div>
        </div>

        {searchMode === 'build-your-own' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="departureDate">Outbound Departure Date</label>
                <div className={`search-input-wrapper ${departureDate ? 'has-value' : ''}`}>
                  <Calendar className="search-icon" size={20} />
                  <input
                    type="date"
                    id="departureDate"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    required
                    className="search-box-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="returnDate">Desired Return Date</label>
                <div className={`search-input-wrapper ${returnDate ? 'has-value' : ''}`}>
                  <Calendar className="search-icon" size={20} />
                  <input
                    type="date"
                    id="returnDate"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                    className="search-box-input"
                  />
                </div>
                <small>We'll show return flights on or near this date</small>
              </div>
            </div>
          </>
        )}

        {searchMode === 'package' && tripType !== 'trip-planner' && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="departureDate">
                {tripType === 'day-trip' ? 'Travel Date' : 'Departure Date'}
              </label>
              <div className={`search-input-wrapper ${departureDate ? 'has-value' : ''}`}>
                <Calendar className="search-icon" size={20} />
                <input
                  type="date"
                  id="departureDate"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="search-box-input"
                />
              </div>
            </div>

            {tripType !== 'one-way' && (
              <div className="form-group">
                <label htmlFor="returnDate">
                  {tripType === 'day-trip' ? 'Return Date (same day)' : 'Return Date'}
                </label>
                <div className={`search-input-wrapper ${tripType === 'day-trip' ? 'disabled' : ''} ${tripType !== 'day-trip' && returnDate ? 'has-value' : ''}`}>
                  <Calendar className="search-icon" size={20} />
                  <input
                    type="date"
                    id="returnDate"
                    value={tripType === 'day-trip' ? departureDate : returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    required
                    disabled={tripType === 'day-trip'}
                    className="search-box-input"
                  />
                </div>
                {tripType === 'day-trip' && (
                  <small>Automatically set to same day as departure</small>
                )}
              </div>
            )}
          </div>
        )}

        {tripType === 'trip-planner' && (
          <>
            <div className="form-group">
              <label htmlFor="departureDate">Earliest Departure Date</label>
              <div className={`search-input-wrapper ${departureDate ? 'has-value' : ''}`}>
                <Calendar className="search-icon" size={20} />
                <input
                  type="date"
                  id="departureDate"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                  className="search-box-input"
                />
              </div>
              <small>We'll find flights on or after this date</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tripLength">Trip Length</label>
                <input
                  type="number"
                  id="tripLength"
                  value={tripLength}
                  onChange={(e) => setTripLength(e.target.value)}
                  min="1"
                  placeholder="e.g., 3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tripLengthUnit">Unit</label>
                <select
                  id="tripLengthUnit"
                  value={tripLengthUnit}
                  onChange={(e) => setTripLengthUnit(e.target.value)}
                  className="unit-select"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maxTripDuration">Max Trip Duration (optional)</label>
                <input
                  type="number"
                  id="maxTripDuration"
                  value={maxTripDuration}
                  onChange={(e) => setMaxTripDuration(e.target.value)}
                  min="1"
                  placeholder="e.g., 5"
                />
                <small>Trips longer than this will be filtered out</small>
              </div>

              <div className="form-group">
                <label htmlFor="maxTripDurationUnit">Unit</label>
                <select
                  id="maxTripDurationUnit"
                  value={maxTripDurationUnit}
                  onChange={(e) => setMaxTripDurationUnit(e.target.value)}
                  className="unit-select"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={nonstopPreferred}
                    onChange={(e) => setNonstopPreferred(e.target.checked)}
                  />
                  <span>Prefer non-stop flights (when available)</span>
                </label>
              </div>
              <small>We'll try to find non-stop options, but show connecting flights if needed</small>
            </div>
          </>
        )}

        <button type="submit" className="search-button" disabled={loading}>
          {loading ? 'Searching...' : 'Search Flights'}
        </button>
      </form>
    </div>
  );
}

export default SearchForm;