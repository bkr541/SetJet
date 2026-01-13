import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Package, 
  Wrench, 
  ArrowRight, 
  Repeat, 
  Sun, 
  CalendarRange,
  PlaneTakeoff,
  PlaneLanding,
  Calendar as CalendarIcon,
  Building2,
  TowerControl,
  X 
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO } from 'date-fns';
import './SearchForm.css';

// --- CUSTOM DATE INPUT COMPONENT ---
// Defined outside the main component to prevent re-rendering/focus issues
const CustomDateInput = forwardRef(({ value, onClick, placeholder, disabled }, ref) => (
  <div 
    className={`search-input-wrapper ${value ? 'has-value' : ''} ${disabled ? 'disabled' : ''} date-picker-trigger`}
    onClick={onClick}
    ref={ref}
  >
    <CalendarIcon className="search-icon" size={20} />
    <span className={`date-display-text ${!value ? 'placeholder' : ''}`}>
      {/* If a date is selected (value), show it. Otherwise show the placeholder passed from DatePicker */}
      {value || placeholder}
    </span>
  </div>
));

function SearchForm({ onSearch, loading }) {
  const [searchMode, setSearchMode] = useState('package');
  
  // --- ORIGIN SEARCH STATE ---
  const [originPills, setOriginPills] = useState([]);
  const [originSearchText, setOriginSearchText] = useState('');
  const [originResults, setOriginResults] = useState([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  
  // --- DESTINATION SEARCH STATE ---
  const [destinationPills, setDestinationPills] = useState([]);
  const [destinationSearchText, setDestinationSearchText] = useState('');
  const [destinationResults, setDestinationResults] = useState([]);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);

  const [destinations, setDestinations] = useState('');
  const [anyDestination, setAnyDestination] = useState(false);
  const [tripType, setTripType] = useState('round-trip');
  
  // Dates state
  const [departureDate, setDepartureDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  
  const [tripLength, setTripLength] = useState('');
  const [tripLengthUnit, setTripLengthUnit] = useState('days');
  const [maxTripDuration, setMaxTripDuration] = useState('');
  const [maxTripDurationUnit, setMaxTripDurationUnit] = useState('days');
  const [nonstopPreferred, setNonstopPreferred] = useState(false);

  // Generate today's date string for placeholders (e.g. "Jan 13th, 2026")
  const todayPlaceholder = format(new Date(), 'MMM do, yyyy');

  // --- ORIGIN SEARCH LOGIC ---
  useEffect(() => {
    const searchLocations = async () => {
      if (originSearchText.length < 2) {
        setOriginResults([]);
        setShowOriginDropdown(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5001/api/locations?keyword=${originSearchText}`);
        if (response.ok) {
          const data = await response.json();
          setOriginResults(data);
          setShowOriginDropdown(true);
        }
      } catch (error) {
        console.error("Error searching origin locations:", error);
      }
    };
    const timeoutId = setTimeout(() => {
      if (originSearchText.length >= 2) searchLocations();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [originSearchText]);

  const handleSelectOrigin = (code) => {
    const newCodes = code.split(',').map(c => c.trim());
    const uniqueNewCodes = newCodes.filter(c => !originPills.includes(c));
    if (uniqueNewCodes.length > 0) {
      setOriginPills([...originPills, ...uniqueNewCodes]);
    }
    setOriginSearchText('');
    setShowOriginDropdown(false);
    setOriginResults([]);
  };

  const handleRemoveOrigin = (codeToRemove) => {
    setOriginPills(originPills.filter(code => code !== codeToRemove));
  };

  const handleOriginKeyDown = (e) => {
    if (e.key === 'Backspace' && originSearchText === '' && originPills.length > 0) {
      const newPills = [...originPills];
      newPills.pop();
      setOriginPills(newPills);
    }
  };

  // --- DESTINATION SEARCH LOGIC ---
  useEffect(() => {
    const searchLocations = async () => {
      if (destinationSearchText.length < 2) {
        setDestinationResults([]);
        setShowDestinationDropdown(false);
        return;
      }
      try {
        const response = await fetch(`http://localhost:5001/api/locations?keyword=${destinationSearchText}`);
        if (response.ok) {
          const data = await response.json();
          setDestinationResults(data);
          setShowDestinationDropdown(true);
        }
      } catch (error) {
        console.error("Error searching destination locations:", error);
      }
    };
    const timeoutId = setTimeout(() => {
      if (destinationSearchText.length >= 2) searchLocations();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [destinationSearchText]);

  const handleSelectDestination = (code) => {
    const newCodes = code.split(',').map(c => c.trim());
    const uniqueNewCodes = newCodes.filter(c => !destinationPills.includes(c));
    if (uniqueNewCodes.length > 0) {
      setDestinationPills([...destinationPills, ...uniqueNewCodes]);
    }
    setDestinationSearchText('');
    setShowDestinationDropdown(false);
    setDestinationResults([]);
  };

  const handleRemoveDestination = (codeToRemove) => {
    setDestinationPills(destinationPills.filter(code => code !== codeToRemove));
  };

  const handleDestinationKeyDown = (e) => {
    if (e.key === 'Backspace' && destinationSearchText === '' && destinationPills.length > 0) {
      const newPills = [...destinationPills];
      newPills.pop();
      setDestinationPills(newPills);
    }
  };

  // --- SUBMIT LOGIC ---
  const handleSubmit = (e) => {
    e.preventDefault();

    const originAirports = [...originPills];
    if (originAirports.length === 0 && originSearchText.length === 3) {
        originAirports.push(originSearchText.toUpperCase());
    }

    let destinationAirports = [];
    if (anyDestination) {
      destinationAirports = ['ANY'];
    } else {
      destinationAirports = [...destinationPills];
      if (destinationAirports.length === 0 && destinationSearchText.length === 3) {
        destinationAirports.push(destinationSearchText.toUpperCase());
      }
    }

    const searchParams = {
      searchMode,
      origins: originAirports,
      destinations: destinationAirports,
      tripType: searchMode === 'build-your-own' ? 'one-way' : tripType,
      departureDate: departureDate ? format(departureDate, 'yyyy-MM-dd') : '',
      returnDate: (tripType === 'one-way' || searchMode === 'build-your-own') ? null : (returnDate ? format(returnDate, 'yyyy-MM-dd') : ''),
    };

    if (searchMode === 'build-your-own' && returnDate) {
      searchParams.desiredReturnDate = format(returnDate, 'yyyy-MM-dd');
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
          
          {/* --- ORIGIN COLUMN --- */}
          <div className="form-group"> 
            <label htmlFor="origins">Origin Airports</label>
            
            <div className="relative-input-container">
              <div className={`search-input-wrapper ${originPills.length > 0 ? 'has-value' : ''}`}>
                <PlaneTakeoff className="search-icon" size={24} />
                
                <div className="pills-container">
                  {originPills.map((code) => (
                    <div key={code} className="airport-pill">
                      <span>{code}</span>
                      <X 
                        className="pill-remove-icon" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleRemoveOrigin(code);
                        }}
                      />
                    </div>
                  ))}
                  
                  <input
                    type="text"
                    id="origins"
                    value={originSearchText}
                    onChange={(e) => {
                        setOriginSearchText(e.target.value);
                        if (e.target.value.length >= 2) setShowOriginDropdown(true);
                    }}
                    onKeyDown={handleOriginKeyDown}
                    onFocus={() => {
                        if (originSearchText.length >= 2) setShowOriginDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                    placeholder={originPills.length === 0 ? "Search Airport, City, etc." : ""}
                    className="search-box-input"
                    autoComplete="off"
                  />
                </div>

                {(originPills.length > 0 || originSearchText) && (
                  <X 
                    className="clear-icon" 
                    size={24} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setOriginPills([]);
                        setOriginSearchText('');
                    }}
                  />
                )}
              </div>

              {/* ORIGIN DROPDOWN */}
              {showOriginDropdown && originResults.length > 0 && (
                <div className="autocomplete-dropdown">
                  {originResults.map((result, index) => (
                    <div 
                      key={`${result.value}-${index}`}
                      className={`autocomplete-item ${result.indent ? 'indented' : ''} ${result.is_header ? 'is-header' : ''}`}
                      onClick={() => handleSelectOrigin(result.value)}
                    >
                      <div className="item-icon">
                        {result.type === 'Airport' ? <TowerControl size={16} /> : <Building2 size={16} />}
                      </div>
                      <div className="item-info">
                        {result.is_header ? (
                          <span className="item-label">{result.label}</span>
                        ) : (
                          <>
                            <span className="item-code">{result.value}</span>
                            <span className="item-name">{result.label.replace(/^\([^)]+\)\s*/, '')}</span>
                            {!result.indent && <span className="item-sub">{result.country}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <small>Search and select multiple airports</small>
          </div>

          {/* --- DESTINATION COLUMN --- */}
          <div className="form-group">
            <label htmlFor="destinations">Destination Airports</label>
            
            <div className="relative-input-container">
              <div className={`search-input-wrapper ${anyDestination ? 'disabled' : ''} ${destinationPills.length > 0 && !anyDestination ? 'has-value' : ''}`}>
                <PlaneLanding className="search-icon" size={24} />
                
                <div className="pills-container">
                  {destinationPills.map((code) => (
                    <div key={code} className="airport-pill">
                      <span>{code}</span>
                      <X 
                        className="pill-remove-icon" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleRemoveDestination(code);
                        }}
                      />
                    </div>
                  ))}

                  <input
                    type="text"
                    id="destinations"
                    value={anyDestination ? '' : destinationSearchText}
                    onChange={(e) => {
                        setDestinationSearchText(e.target.value);
                        if (e.target.value.length >= 2) setShowDestinationDropdown(true);
                    }}
                    onKeyDown={handleDestinationKeyDown}
                    onFocus={() => {
                        if (destinationSearchText.length >= 2 && !anyDestination) setShowDestinationDropdown(true);
                    }}
                    onBlur={() => setTimeout(() => setShowDestinationDropdown(false), 200)}
                    placeholder={anyDestination ? "Searching all airports..." : (destinationPills.length === 0 ? "Search Airport, City, etc." : "")}
                    disabled={anyDestination}
                    className={`search-box-input ${anyDestination ? 'input-disabled-placeholder' : ''}`}
                    autoComplete="off"
                  />
                </div>

                {/* Clear Destination Button */}
                {!anyDestination && (destinationPills.length > 0 || destinationSearchText) && (
                  <X 
                    className="clear-icon" 
                    size={24} 
                    onClick={(e) => {
                        e.stopPropagation();
                        setDestinationPills([]);
                        setDestinationSearchText('');
                    }}
                  />
                )}
              </div>

              {/* DESTINATION DROPDOWN */}
              {showDestinationDropdown && destinationResults.length > 0 && !anyDestination && (
                <div className="autocomplete-dropdown">
                  {destinationResults.map((result, index) => (
                    <div 
                      key={`${result.value}-${index}`}
                      className={`autocomplete-item ${result.indent ? 'indented' : ''} ${result.is_header ? 'is-header' : ''}`}
                      onClick={() => handleSelectDestination(result.value)}
                    >
                      <div className="item-icon">
                        {result.type === 'Airport' ? <TowerControl size={16} /> : <Building2 size={16} />}
                      </div>
                      <div className="item-info">
                        {result.is_header ? (
                          <span className="item-label">{result.label}</span>
                        ) : (
                          <>
                            <span className="item-code">{result.value}</span>
                            <span className="item-name">{result.label.replace(/^\([^)]+\)\s*/, '')}</span>
                            {!result.indent && <span className="item-sub">{result.country}</span>}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <small>
              {anyDestination 
                ? "We'll search every available route from your origin." 
                : "Search and select multiple airports"}
            </small>

            <div className="toggle-group right-align">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={anyDestination}
                  onChange={(e) => {
                    setAnyDestination(e.target.checked);
                    if (e.target.checked) {
                      setDestinationPills([]);
                      setDestinationSearchText('');
                    }
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className="toggle-label">Any Airport</span>
            </div>
          </div>
        </div>

        {/* --- DATE INPUTS REPLACED WITH REACT-DATEPICKER --- */}
        {searchMode === 'build-your-own' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label>Outbound Departure Date</label>
                <DatePicker
                  selected={departureDate}
                  onChange={(date) => setDepartureDate(date)}
                  customInput={<CustomDateInput />}
                  placeholderText={todayPlaceholder}
                  dateFormat="PP"
                  minDate={new Date()}
                  fixedHeight
                />
              </div>

              <div className="form-group">
                <label>Desired Return Date</label>
                <DatePicker
                  selected={returnDate}
                  onChange={(date) => setReturnDate(date)}
                  customInput={<CustomDateInput />}
                  placeholderText={todayPlaceholder}
                  dateFormat="PP"
                  minDate={departureDate || new Date()}
                  fixedHeight
                />
                <small>We'll show return flights on or near this date</small>
              </div>
            </div>
          </>
        )}

        {searchMode === 'package' && tripType !== 'trip-planner' && (
          <div className="form-row">
            <div className="form-group">
              <label>{tripType === 'day-trip' ? 'Travel Date' : 'Departure Date'}</label>
              <DatePicker
                selected={departureDate}
                onChange={(date) => {
                  setDepartureDate(date);
                  if (returnDate && date > returnDate && tripType !== 'day-trip') {
                    setReturnDate(null);
                  }
                }}
                customInput={<CustomDateInput />}
                placeholderText={todayPlaceholder}
                dateFormat="PP"
                minDate={new Date()}
                fixedHeight
              />
            </div>

            {tripType !== 'one-way' && (
              <div className="form-group">
                <label>{tripType === 'day-trip' ? 'Return Date (same day)' : 'Return Date'}</label>
                {tripType === 'day-trip' ? (
                  <div className="search-input-wrapper disabled has-value">
                    <CalendarIcon className="search-icon" size={20} />
                    <span className="date-display-text">
                      {departureDate ? format(departureDate, 'PP') : 'Same as departure'}
                    </span>
                  </div>
                ) : (
                  <DatePicker
                    selected={returnDate}
                    onChange={(date) => setReturnDate(date)}
                    customInput={<CustomDateInput />}
                    placeholderText={todayPlaceholder}
                    dateFormat="PP"
                    minDate={departureDate || new Date()}
                    fixedHeight
                  />
                )}
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
              <label>Earliest Departure Date</label>
              <DatePicker
                selected={departureDate}
                onChange={(date) => setDepartureDate(date)}
                customInput={<CustomDateInput />}
                placeholderText={todayPlaceholder}
                dateFormat="PP"
                minDate={new Date()}
                fixedHeight
              />
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