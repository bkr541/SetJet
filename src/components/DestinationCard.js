import React, { useState } from 'react';
import { 
  Layers, 
  Plane, 
  Clock, 
  CalendarDays,
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import './DestinationCard.css';
import FlightCard from './FlightCard';
import RouteMap from './RouteMap'; 

function DestinationCard({ destination, flights, origin, buildYourOwnMode = false, buildYourOwnStep = 'outbound', onSelectFlight }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const cheapestFlight = flights.reduce((min, flight) =>
    flight.price < min.price ? flight : min
  , flights[0]);

  const nonstopCount = flights.filter(f => f.stops === 0).length;
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

        {/* --- STATS SECTION (4x1 Row) --- */}
        <div 
          className="destination-stats-container" 
          style={{ 
            display: 'grid',                      
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '10px', 
            marginTop: '1rem'
          }}
        >
          {/* 1. Options */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box"><Layers size={20} className="dest-stat-icon" /></div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Options</span>
              <span className="dest-stat-value">{flights.length}</span>
            </div>
          </div>

          {/* 2. Nonstop */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box"><Plane size={20} className="dest-stat-icon" /></div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Nonstop</span>
              <span className="dest-stat-value">{nonstopCount}</span>
            </div>
          </div>

          {/* 3. Time */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box"><Clock size={20} className="dest-stat-icon" /></div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">{isTripPlanner ? 'Trip Time' : 'Earliest'}</span>
              <span className="dest-stat-value">
                {isTripPlanner ? (cheapestFlight.trip_duration_display || 'N/A') : cheapestFlight.departure_time}
              </span>
            </div>
          </div>

          {/* 4. Events */}
          <div className="dest-stat-card">
            <div className="dest-stat-icon-box"><CalendarDays size={20} className="dest-stat-icon" /></div>
            <div className="dest-stat-info">
              <span className="dest-stat-label">Events</span>
              <span className="dest-stat-value">-</span>
            </div>
          </div>
        </div>

        {/* --- MAP SECTION (Below Stats) --- */}
        <div 
          style={{ 
            marginTop: '1rem', 
            width: '100%'      
          }} 
          onClick={(e) => e.stopPropagation()}
        >
           <RouteMap originIATA={origin} destinationIATA={destination} />
        </div>

        {/* --- EXPAND INDICATOR (Styled like FlightResults map toggle) --- */}
        <div 
          className="expand-indicator"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            color: '#475569', // Matched color
            fontWeight: '600',
            gap: '8px',
            marginTop: '0.75rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid #f0f4f8'
          }}
        >
          {/* Added Plane Icon */}
          <Plane size={18} />
          
          <span className="expand-text">
            {isExpanded ? 'Hide All Flights' : 'Show All Flights'}
          </span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {isExpanded && (
        <div className="destination-flights">
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