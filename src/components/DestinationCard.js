import React, { useState } from 'react';
import { 
  Layers, 
  MapPin, 
  Plane, 
  Clock, 
  CalendarDays 
} from 'lucide-react';
import './DestinationCard.css';
import FlightCard from './FlightCard';
import RouteMap from './RouteMap'; // <--- Map Import

function DestinationCard({ destination, flights, origin, buildYourOwnMode = false, buildYourOwnStep = 'outbound', onSelectFlight }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Find the cheapest flight for the summary
  const cheapestFlight = flights.reduce((min, flight) =>
    flight.price < min.price ? flight : min
  , flights[0]);

  // Count non-stop flights
  const nonstopCount = flights.filter(f => f.stops === 0).length;

  // Calculate distinct origin airports
  const uniqueOrigins = [...new Set(flights.map(f => f.origin))].length;

  // Check if this is trip planner mode (has trip_duration_display)
  const isTripPlanner = cheapestFlight.trip_duration_display !== undefined;

  return (
    <div className="destination-card">
      <div
        className="destination-summary"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="destination-header">
          <div className="destination-route">
            <span className="destination-origin">{origin}</span>
            <span className="destination-arrow">→</span>
            <span className="destination-name">{destination}</span>
            {isTripPlanner && cheapestFlight.trip_duration_display && (
              <span className="trip-duration-badge">
                ⏱️ {cheapestFlight.trip_duration_display}
              </span>
            )}
          </div>
          <div className="destination-price">
            <span className="price-from">from</span>
            {cheapestFlight.gowild_eligible ? (
              <>
                <span className="price-amount gowild-price-amount">GoWild Pass</span>
                <span className="gowild-taxes">+ taxes (~$5-15)</span>
              </>
            ) : (
              <span className="price-amount">${cheapestFlight.price}</span>
            )}
          </div>
        </div>

        {/* Updated Stats Section using Cards */}
        <div className="destination-stats-container">
          
          {/* Options Card */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box">
              <Layers size={20} className="dest-stat-icon" />
            </div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Options</span>
              <span className="dest-stat-value">{flights.length}</span>
            </div>
          </div>

          {/* Airports Card */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box">
              <MapPin size={20} className="dest-stat-icon" />
            </div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Airports</span>
              <span className="dest-stat-value">{uniqueOrigins}</span>
            </div>
          </div>

          {/* Nonstop Card */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box">
              <Plane size={20} className="dest-stat-icon" />
            </div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Nonstop</span>
              <span className="dest-stat-value">{nonstopCount}</span>
            </div>
          </div>

          {/* Earliest / Trip Time Card */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box">
              <Clock size={20} className="dest-stat-icon" />
            </div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">
                {isTripPlanner ? 'Trip Time' : 'Earliest'}
              </span>
              <span className="dest-stat-value">
                {isTripPlanner 
                  ? (cheapestFlight.trip_duration_display || 'N/A')
                  : cheapestFlight.departure_time
                }
              </span>
            </div>
          </div>

          {/* Events Card (Placeholder) */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box">
              <CalendarDays size={20} className="dest-stat-icon" />
            </div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Events</span>
              <span className="dest-stat-value">-</span>
            </div>
          </div>

        </div>

        <div className="expand-indicator">
          <span className={`arrow-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
          <span className="expand-text">
            {isExpanded ? 'Hide flights' : 'Show all flights'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="destination-flights">
          
          {/* --- MAP SECTION --- */}
          <RouteMap originIATA={origin} destinationIATA={destination} />
          
          {/* Add a little spacing below the map */}
          <div style={{ marginBottom: '1.5rem' }}></div> 

          <div className="flights-list">
            {flights.map((flight, index) => (
              <FlightCard
                key={index}
                flight={flight}
                buildYourOwnMode={buildYourOwnMode}
                buildYourOwnStep={buildYourOwnStep}
                onSelectFlight={onSelectFlight}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DestinationCard;