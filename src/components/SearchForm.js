import React, { useState } from 'react';
import './SearchForm.css';
import {
  LuArrowRight,
  LuRepeat,
  LuSun,
  LuCalendarCheck,
  LuSearch,
  LuSlidersHorizontal,
} from 'react-icons/lu';

function SearchForm({ onSearch, loading }) {
  const [searchMode, setSearchMode] = useState('package'); // 'package' or 'build-your-own'
  const [origins, setOrigins] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();

    const originAirports = origins.split(',').map((s) => s.trim()).filter((s) => s);
    const destinationAirports = anyDestination
      ? ['ANY']
      : destinations.split(',').map((s) => s.trim()).filter((s) => s);

    const searchParams = {
      searchMode,
      origins: originAirports,
      destinations: destinationAirports,
      tripType: searchMode === 'build-your-own' ? 'one-way' : tripType, // Always one-way for build-your-own
      departureDate,
      returnDate: tripType === 'one-way' || searchMode === 'build-your-own' ? null : returnDate,
    };

    // Add build-your-own specific parameters
    if (searchMode === 'build-your-own' && returnDate) {
      searchParams.desiredReturnDate = returnDate;
    }

    // Add trip planner specific parameters
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
        <div className="form-group">
          <label htmlFor="searchMode">Search Mode</label>

          <div className="sj-toggle-group" aria-label="Search Mode">
            <button
              type="button"
              className={`sj-toggle ${searchMode === 'package' ? 'active' : ''}`}
              onClick={() => setSearchMode('package')}
              aria-pressed={searchMode === 'package'}
            >
              <LuSearch className="sj-toggle-icon" />
              <span>Package Trip</span>
            </button>

            <button
              type="button"
              className={`sj-toggle ${searchMode === 'build-your-own' ? 'active' : ''}`}
              onClick={() => setSearchMode('build-your-own')}
              aria-pressed={searchMode === 'build-your-own'}
            >
              <LuSlidersHorizontal className="sj-toggle-icon" />
              <span>Build Your Own</span>
            </button>
          </div>

          <small>
            {searchMode === 'package'
              ? 'Search for complete round-trip packages'
              : 'Select outbound flight first, then choose your return flight'}
          </small>
        </div>

        {searchMode === 'package' && (
          <div className="form-group">
            <label htmlFor="tripType">Trip Type</label>

            <div className="sj-toggle-group sj-toggle-group--wrap" aria-label="Trip Type">
              <button
                type="button"
                className={`sj-toggle ${tripType === 'one-way' ? 'active' : ''}`}
                onClick={() => setTripType('one-way')}
                aria-pressed={tripType === 'one-way'}
              >
                <LuArrowRight className="sj-toggle-icon" />
                <span>One Way</span>
              </button>

              <button
                type="button"
                className={`sj-toggle ${tripType === 'round-trip' ? 'active' : ''}`}
                onClick={() => setTripType('round-trip')}
                aria-pressed={tripType === 'round-trip'}
              >
                <LuRepeat className="sj-toggle-icon" />
                <span>Round Trip</span>
              </button>

              <button
                type="button"
                className={`sj-toggle ${tripType === 'day-trip' ? 'active' : ''}`}
                onClick={() => setTripType('day-trip')}
                aria-pressed={tripType === 'day-trip'}
              >
                <LuSun className="sj-toggle-icon" />
                <span>Day Trip</span>
              </button>

              <button
                type="button"
                className={`sj-toggle ${tripType === 'trip-planner' ? 'active' : ''}`}
                onClick={() => setTripType('trip-planner')}
                aria-pressed={tripType === 'trip-planner'}
              >
                <LuCalendarCheck className="sj-toggle-icon" />
                <span>Trip Planner</span>
              </button>
            </div>
          </div>
        )}

        {/* ORIGINS AND DESTINATIONS SIDE-BY-SIDE */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="origins">Origin Airports (comma-separated)</label>
            <input
              type="text"
              id="origins"
              value={origins}
              onChange={(e) => setOrigins(e.target.value)}
              placeholder="e.g., DEN, LAX, SFO"
              required
            />
            <small>Enter multiple origin airports separated by commas</small>
          </div>

          <div className="form-group">
            <label htmlFor="destinations">Destination Airports</label>
            
            {!anyDestination ? (
              <>
                <input
                  type="text"
                  id="destinations"
                  value={destinations}
                  onChange={(e) => setDestinations(e.target.value)}
                  placeholder="e.g., MCO, MIA, LAS"
                  required={!anyDestination}
                />
                <small>Enter multiple destination airports separated by commas</small>
              </>
            ) : (
              <small className="any-destination-note">
                Will search all available destinations
              </small>
            )}

            {/* --- NEW: Modern Toggle Switch --- */}
            <div className="toggle-group" style={{ marginTop: '0.5rem' }}>
              <label className="switch">
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
                <span className="slider round"></span>
              </label>
              <span className="toggle-label-text">Any Airport</span>
            </div>
            {/* --------------------------------- */}

          </div>
        </div>

        {searchMode === 'build-your-own' && (
          <>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="departureDate">Outbound Departure Date</label>
                <input
                  type="date"
                  id="departureDate"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="returnDate">Desired Return Date</label>
                <input
                  type="date"
                  id="returnDate"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                />
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
              <input
                type="date"
                id="departureDate"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
              />
            </div>

            {tripType !== 'one-way' && (
              <div className="form-group">
                <label htmlFor="returnDate">
                  {tripType === 'day-trip' ? 'Return Date (same day)' : 'Return Date'}
                </label>
                <input
                  type="date"
                  id="returnDate"
                  value={tripType === 'day-trip' ? departureDate : returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  required
                  disabled={tripType === 'day-trip'}
                />
                {tripType === 'day-trip' && <small>Automatically set to same day as departure</small>}
              </div>
            )}
          </div>
        )}

        {tripType === 'trip-planner' && (
          <>
            <div className="form-group">
              <label htmlFor="departureDate">Earliest Departure Date</label>
              <input
                type="date"
                id="departureDate"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                required
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