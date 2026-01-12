import React, { useState, useMemo } from 'react';
import {
  Layers,
  MapPin,
  Plane,
  Clock,
  CalendarDays,
  CircleDollarSign,
  Sunrise,
  Hourglass,
  Ticket,
  Filter
} from 'lucide-react';
import './FlightResults.css';
import DestinationCard from './DestinationCard';

// New StatCard component
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon-container">
        <Icon size={24} className="stat-icon" />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <span className="stat-value">{value}</span>
      </div>
    </div>
  );
}

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

  // Group flights by destination and sort
  const groupedFlights = useMemo(() => {
    if (!flights) return [];

    let filteredFlights = flights;
    if (nonstopOnly) {
      filteredFlights = filteredFlights.filter(flight => flight.stops === 0);
    }
    if (gowildOnly) {
      filteredFlights = filteredFlights.filter(flight => flight.gowild_eligible);
    }

    const groups = {};
    if (Array.isArray(filteredFlights)) {
      filteredFlights.forEach(flight => {
        const dest = flight.destination;
        if (!groups[dest]) {
          groups[dest] = [];
        }
        groups[dest].push(flight);
      });
    }

    Object.keys(groups).forEach(dest => {
      groups[dest].sort((a, b) => {
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
              const aDepartTime = new Date(`${a.departure_date} ${a.departure_time}`);
              const bDepartTime = new Date(`${b.departure_date} ${b.departure_time}`);
              const aReturnTime = new Date(`${a.return_flight.arrival_date} ${a.return_flight.arrival_time}`);
              const bReturnTime = new Date(`${b.return_flight.arrival_date} ${b.return_flight.arrival_time}`);
              const aDuration = aReturnTime - aDepartTime;
              const bDuration = bReturnTime - bDepartTime;
              return bDuration - aDuration;
            }
            return a.price - b.price;

          case 'price':
          default:
            return a.price - b.price;
        }
      });
    });

    const sortedDestinations = Object.keys(groups).sort((destA, destB) => {
      const minPriceA = Math.min(...groups[destA].map(f => f.price));
      const minPriceB = Math.min(...groups[destB].map(f => f.price));
      return minPriceA - minPriceB;
    });

    return sortedDestinations.map(dest => ({
      destination: dest,
      flights: groups[dest],
      origin: groups[dest][0].origin
    }));
  }, [flights, sortBy, nonstopOnly, gowildOnly]);

  if (!searchParams) {
    return null;
  }

  const getTripTypeLabel = (tripType) => {
    const labels = {
      'one-way': 'One Way',
      'round-trip': 'Round Trip',
      'day-trip': 'Day Trip',
      'trip-planner': 'Trip Planner',
    };
    return labels[tripType] || tripType;
  };

  const destinationText = searchParams.destinations.includes('ANY')
    ? 'Any Airport'
    : searchParams.destinations.join(', ');

  // --- STATS CALCULATIONS ---
  const totalOptions = flights ? flights.length : 0;
  const nonstopFlightsCount = flights ? flights.filter(f => f.stops === 0).length : 0;
  
  // Calculate earliest departure from actual flights if tripPlannerInfo isn't available
  const getEarliestDeparture = () => {
    if (tripPlannerInfo && tripPlannerInfo.earliest_departure) {
      return tripPlannerInfo.earliest_departure;
    }
    if (flights && flights.length > 0) {
      // Create a shallow copy and sort by date/time
      const sortedByTime = [...flights].sort((a, b) => {
        const dateA = new Date(`${a.departure_date} ${a.departure_time}`);
        const dateB = new Date(`${b.departure_date} ${b.departure_time}`);
        return dateA - dateB;
      });
      return sortedByTime[0].departure_time;
    }
    return 'N/A';
  };
  const earliestDeparture = getEarliestDeparture();

  return (
    <div className="results-container">
      <div className="results-header">
        <div className="results-title-row">
          <h2>Flight Results</h2>
          {fromCache && <span className="cache-badge">📦 From Cache</span>}
        </div>
        <div className="search-summary">
          <span className="summary-badge">{getTripTypeLabel(searchParams.tripType)}</span>
          <p className="results-info">
            <strong>From:</strong> {searchParams.origins.join(', ')} → <strong>To:</strong> {destinationText}
          </p>
          <p className="results-info">
            <strong>Departure:</strong> {searchParams.departureDate}
            {searchParams.returnDate && ` | `}
            {searchParams.returnDate && <><strong>Return:</strong> {searchParams.returnDate}</>}
          </p>
          {tripPlannerInfo && tripPlannerInfo.days_searched > 1 && flights.length > 0 && (
            <div className="trip-planner-notice">
              ℹ️ No matches found for {searchParams.departureDate}. Showing results starting {tripPlannerInfo.earliest_departure} (searched {tripPlannerInfo.days_searched} days)
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview Section */}
      {flights && flights.length > 0 && (
        <div className="stats-overview">
          <StatCard icon={Layers} label="Total Options" value={totalOptions} />
          <StatCard icon={MapPin} label="Airports" value="-" />
          <StatCard icon={Plane} label="Nonstop Flights" value={nonstopFlightsCount} />
          <StatCard icon={Clock} label="Earliest Departure" value={earliestDeparture} />
          <StatCard icon={CalendarDays} label="Events" value="-" />
        </div>
      )}

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

      {(!flights || flights.length === 0) ? (
        <div className="no-results">
          <div className="no-results-icon">✈️</div>
          <h3>Ready to search!</h3>
          <p>When you implement the scraping functionality, flight results will appear here.</p>
          <p className="hint">
            Each flight will show the origin, destination, price, departure time, and airline details.
          </p>
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