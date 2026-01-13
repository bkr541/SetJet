import React, { useState, useMemo } from 'react';
import { 
  CircleDollarSign, 
  Plane, 
  Sunrise, 
  Hourglass, 
  Ticket,
  ChevronDown,
  ChevronUp,
  Map as MapIcon 
} from 'lucide-react';
import './FlightResults.css';
import DestinationCard from './DestinationCard';
import HubMap from './HubMap'; 

function FlightResults({
  flights = [], 
  searchParams,
  fromCache,
  tripPlannerInfo,
  buildYourOwnMode = false,
  buildYourOwnStep = 'outbound',
  selectedOutboundFlight = null,
  onSelectOutbound,
  onSelectReturn,
  onResetBuildYourOwn
}) {
  const [sortBy, setSortBy] = useState('price'); 
  const [nonstopOnly, setNonstopOnly] = useState(false);
  const [gowildOnly, setGowildOnly] = useState(false);
  const [showMap, setShowMap] = useState(false); // State for Map Toggle

  // 1. PREPARE MAP DATA
  const mapData = useMemo(() => {
    if (!flights || flights.length === 0) return null;
    
    const origin = flights[0].origin;
    const destMap = {};
    flights.forEach(f => {
      if (!destMap[f.destination] || f.price < destMap[f.destination].price) {
        destMap[f.destination] = { iata: f.destination, price: f.price };
      }
    });

    return {
      origin,
      destinations: Object.values(destMap)
    };
  }, [flights]);

  // 2. HELPER: Get list of unique destinations for "Any Airport" display
  const availableDestinationsList = useMemo(() => {
    if (!flights || flights.length === 0) return '';
    const unique = [...new Set(flights.map(f => f.destination))];
    return unique.sort().join(', ');
  }, [flights]);

  // 3. HELPER: Calculate Days Away
  const getDaysAway = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T00:00:00`); 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `+ ${diffDays} days away`;
    }
    return null; 
  };

  // Group flights by Route (Origin + Destination) and sort
  const groupedFlights = useMemo(() => {
    if (!flights) return [];

    let filteredFlights = flights;
    if (nonstopOnly) filteredFlights = filteredFlights.filter(flight => flight.stops === 0);
    if (gowildOnly) filteredFlights = filteredFlights.filter(flight => flight.gowild_eligible);

    const groups = {};
    if (Array.isArray(filteredFlights)) {
      filteredFlights.forEach(flight => {
        const routeKey = `${flight.origin}-${flight.destination}`;
        if (!groups[routeKey]) groups[routeKey] = [];
        groups[routeKey].push(flight);
      });
    }

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        switch (sortBy) {
          case 'nonstop':
            if (a.stops === 0 && b.stops !== 0) return -1;
            if (a.stops !== 0 && b.stops === 0) return 1;
            return a.price - b.price;
          case 'earliest':
            const dateA = new Date(`${a.departure_date} ${a.departure_time}`);
            const dateB = new Date(`${b.departure_date} ${b.departure_time}`);
            return dateA - dateB;
          case 'longest-trip':
            if (a.is_round_trip && b.is_round_trip) {
              const durationA = new Date(a.return_flight.arrival_date) - new Date(a.departure_date);
              const durationB = new Date(b.return_flight.arrival_date) - new Date(b.departure_date);
              return durationB - durationA;
            }
            return a.price - b.price;
          case 'price':
          default:
            return a.price - b.price;
        }
      });
    });

    const sortedRouteKeys = Object.keys(groups).sort((keyA, keyB) => {
      const minPriceA = Math.min(...groups[keyA].map(f => f.price));
      const minPriceB = Math.min(...groups[keyB].map(f => f.price));
      return minPriceA - minPriceB;
    });

    return sortedRouteKeys.map(key => ({
      destination: groups[key][0].destination,
      origin: groups[key][0].origin,
      flights: groups[key]
    }));
  }, [flights, sortBy, nonstopOnly, gowildOnly]);

  if (!searchParams) return null;

  const getTripTypeLabel = (tripType) => {
    const labels = {
      'one-way': 'One Way',
      'round-trip': 'Round Trip',
      'day-trip': 'Day Trip',
      'trip-planner': 'Trip Planner',
    };
    return labels[tripType] || tripType;
  };

  const isAnyAirportSearch = searchParams.destinations.includes('ANY');
  const destinationText = isAnyAirportSearch
    ? 'Any Airport'
    : searchParams.destinations.join(', ');

  const daysAwayText = getDaysAway(searchParams.departureDate);
  const compactLineStyle = { margin: '2px 0', lineHeight: '1.4' };

  return (
    <div className="results-container">
      
      {/* HEADER SECTION */}
      <div className="results-header">
        
        {/* Title Row */}
        <div className="results-title-row" style={{ alignItems: 'center', display: 'flex' }}>
          <h2>
            <span style={{ color: '#004e5a' }}>{flights.length}</span> Flight Results
          </h2>
          
          {fromCache && <span className="cache-badge" style={{ marginLeft: '12px' }}>📦 From Cache</span>}
        </div>
        
        {/* Search Summary Text */}
        <div className="search-summary">
          <span className="summary-badge">{getTripTypeLabel(searchParams.tripType)}</span>
          
          <p className="results-info" style={compactLineStyle}>
            <strong>From:</strong> {searchParams.origins.join(', ')} → <strong>To:</strong> {destinationText}
          </p>

          {isAnyAirportSearch && availableDestinationsList && (
            <p className="results-info" style={compactLineStyle}>
              <strong>Available Destinations:</strong> {availableDestinationsList}
            </p>
          )}

          <p className="results-info" style={compactLineStyle}>
            <strong>Departure:</strong> {searchParams.departureDate}
            
            {daysAwayText && (
              <span style={{ color: '#16a34a', fontWeight: 'bold', marginLeft: '8px' }}>
                {daysAwayText}
              </span>
            )}

            {searchParams.returnDate && ` | `}
            {searchParams.returnDate && <><strong>Return:</strong> {searchParams.returnDate}</>}
          </p>

          {tripPlannerInfo && tripPlannerInfo.days_searched > 1 && flights.length > 0 && (
            <div className="trip-planner-notice" style={{ marginTop: '4px' }}>
              ℹ️ No matches found for {searchParams.departureDate}. Showing results starting {tripPlannerInfo.earliest_departure} (searched {tripPlannerInfo.days_searched} days)
            </div>
          )}
        </div>

        {/* HUB MAP TOGGLE - CENTERED & INLINE */}
        {mapData && (
          <div style={{ marginTop: '1rem', width: '100%' }}>
            
            {/* Clickable Header: Flex Row (Centered) */}
            <div 
              onClick={() => setShowMap(!showMap)}
              style={{ 
                display: 'flex', 
                alignItems: 'center',    // Center items vertically
                justifyContent: 'center', // Center group horizontally
                cursor: 'pointer',
                userSelect: 'none',
                color: '#475569',
                fontWeight: '600',
                marginBottom: '0.5rem',
                gap: '8px' // Spacing between icon, text, and arrow
              }}
            >
              <MapIcon size={18} />
              <span>{showMap ? "Hide" : "Show"} Destinations Map</span>
              {/* Arrow placed to the right */}
              {showMap ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {/* Collapsible Content */}
            {showMap && (
              <div style={{ height: '250px', width: '100%' }}>
                <HubMap 
                  originIATA={mapData.origin} 
                  destinations={mapData.destinations} 
                />
              </div>
            )}
          </div>
        )}

      </div>

      {buildYourOwnMode && (
        <div className="build-your-own-status">
          {buildYourOwnStep === 'outbound' && (
            <div className="step-indicator">
              <span className="step-number active">1</span>
              <span className="step-label">Select Outbound Flight</span>
              <span className="step-number">2</span>
              <span className="step-label">Select Return Flight</span>
            </div>
          )}
          {buildYourOwnStep === 'return' && selectedOutboundFlight && (
            <div className="step-indicator">
              <span className="step-number completed">✓</span>
              <span className="step-label">Outbound Selected</span>
              <span className="step-number active">2</span>
              <span className="step-label">Select Return Flight</span>
              <button className="change-outbound-btn" onClick={onResetBuildYourOwn}>
                Change Outbound
              </button>
            </div>
          )}
          {selectedOutboundFlight && buildYourOwnStep === 'return' && (
            <div className="selected-outbound-summary">
              <h3>Selected Outbound Flight</h3>
              <div className="flight-summary-compact">
                <span>{selectedOutboundFlight.origin} → {selectedOutboundFlight.destination}</span>
                <span>{selectedOutboundFlight.departure_date} at {selectedOutboundFlight.departure_time}</span>
                <span className="price">${selectedOutboundFlight.price}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {flights.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">✈️</div>
          <h3>Ready to search!</h3>
          <p>Flight results will appear here after you search.</p>
        </div>
      ) : (
        <>
          <div className="sort-controls">
            {/* Sort Section */}
            <div className="control-group">
              <span className="control-label">Sort by:</span>
              <div className="control-track">
                <button
                  className={`control-option ${sortBy === 'price' ? 'active' : ''}`}
                  onClick={() => setSortBy('price')}
                >
                  <CircleDollarSign size={16} className="option-icon" />
                  Lowest Price
                </button>
                <button
                  className={`control-option ${sortBy === 'nonstop' ? 'active' : ''}`}
                  onClick={() => setSortBy('nonstop')}
                >
                  <Plane size={16} className="option-icon" />
                  Non-Stop
                </button>
                <button
                  className={`control-option ${sortBy === 'earliest' ? 'active' : ''}`}
                  onClick={() => setSortBy('earliest')}
                >
                  <Sunrise size={16} className="option-icon" />
                  Earliest
                </button>
                {(searchParams.tripType === 'round-trip' || searchParams.tripType === 'day-trip') && (
                  <button
                    className={`control-option ${sortBy === 'longest-trip' ? 'active' : ''}`}
                    onClick={() => setSortBy('longest-trip')}
                  >
                    <Hourglass size={16} className="option-icon" />
                    Longest Trip
                  </button>
                )}
              </div>
            </div>

            {/* Filter Section */}
            <div className="control-group">
              <span className="control-label filter-label">
                Filter By:
              </span>
              <div className="control-track">
                <button
                  className={`control-option ${nonstopOnly ? 'active' : ''}`}
                  onClick={() => setNonstopOnly(!nonstopOnly)}
                >
                  <Plane size={16} className="option-icon" />
                  Non-Stop Only
                </button>
                <button
                  className={`control-option ${gowildOnly ? 'active' : ''}`}
                  onClick={() => setGowildOnly(!gowildOnly)}
                >
                  <Ticket size={16} className="option-icon" />
                  GoWild Only
                </button>
              </div>
            </div>

          </div>

          <div className="destinations-grid">
            {groupedFlights.map((group, index) => (
              <DestinationCard
                key={index}
                destination={group.destination}
                flights={group.flights}
                origin={group.origin}
                buildYourOwnMode={buildYourOwnMode}
                buildYourOwnStep={buildYourOwnStep}
                onSelectFlight={buildYourOwnStep === 'outbound' ? onSelectOutbound : onSelectReturn}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FlightResults;