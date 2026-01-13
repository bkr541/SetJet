import React, { useState } from 'react';
import { TicketsPlane, Circle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import './FlightCard.css';

function FlightCard({ flight, buildYourOwnMode = false, buildYourOwnStep = 'outbound', onSelectFlight }) {
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false); // New state for stops toggle

  // Format date helper: "Thursday, Mar 05, 2025"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: '2-digit',
      year: 'numeric' 
    });
  };

  // Convert 24h time to 12h: "13:31" -> "01:31 PM"
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) {
        return timeStr.trim();
    }
    const [hours, minutes] = timeStr.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, '0')}:${minutes} ${suffix}`;
  };

  // Determine active alerts
  const hasBlackout = flight.blackout_dates?.has_blackout && flight.gowild_eligible;
  const hasSeatAlert = flight.seats_remaining && flight.seats_remaining <= 9;
  const hasAlerts = hasBlackout || hasSeatAlert;
  const alertCount = (hasBlackout ? 1 : 0) + (hasSeatAlert ? 1 : 0);

  // Check if flight has stops (to show the new group)
  const hasStops = flight.stops > 0;

  // Helper to render the vertical timeline for segments
  const renderSegments = (segments) => {
    if (!segments || segments.length === 0) return null;

    return (
      <div className="segments-timeline">
        {segments.map((seg, i) => (
          <div key={i} className="segment-group">
            {/* SEGMENT START */}
            <div className="timeline-node">
              <div className="timeline-dot top"></div>
              <div className="timeline-line"></div>
              <div className="timeline-content">
                <div className="time-col">
                  <span className="node-time">{formatTime(seg.departure_time)}</span>
                </div>
                <div className="info-col">
                  <span className="node-city">{seg.origin_city || seg.origin} <span className="node-code">({seg.origin})</span></span>
                  <span className="node-airport">{seg.origin_airport_name || 'Airport Name'}</span>
                </div>
              </div>
            </div>

            {/* SEGMENT DURATION / IN-FLIGHT INFO */}
            <div className="timeline-duration-row">
              <div className="timeline-line-filler"></div>
              <div className="duration-pill-box">
                {seg.duration}
              </div>
            </div>

            {/* SEGMENT END */}
            <div className="timeline-node">
              <div className="timeline-dot bottom"></div>
              {/* Only continue line if there is a layover next */}
              {i < segments.length - 1 && <div className="timeline-line"></div>}
              
              <div className="timeline-content">
                <div className="time-col">
                  <span className="node-time">{formatTime(seg.arrival_time)}</span>
                </div>
                <div className="info-col">
                  <span className="node-city">{seg.destination_city || seg.destination} <span className="node-code">({seg.destination})</span></span>
                  <span className="node-airport">{seg.destination_airport_name || 'Airport Name'}</span>
                </div>
              </div>
            </div>

            {/* LAYOVER INFO (if not last segment) */}
            {i < segments.length - 1 && (
               <div className="layover-banner">
                 <Clock size={14} />
                 <span>Layover in {seg.destination}: {seg.layover_duration || '2h 15m'}</span>
               </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFlightRow = (segment, isReturn = false) => (
    <div className={`flight-row-grid ${isReturn ? 'return-leg' : ''}`}>
      <div className="grid-cell left">
        <span className="airport-code">{segment.origin}</span>
      </div>
      <div className="grid-cell center icon-cell">
        <div className="plane-icon-wrapper">
            <TicketsPlane size={28} className="plane-icon" />
        </div>
      </div>
      <div className="grid-cell right">
        <span className="airport-code">{segment.destination}</span>
      </div>

      <div className="grid-cell left">
        <span className="city-name">
            {segment.origin === 'ATL' ? 'Atlanta, GA' : segment.origin === 'LAS' ? 'Las Vegas, NV' : segment.origin === 'ORD' ? 'Chicago, IL' : 'Origin City'}
        </span>
      </div>
      <div className="grid-cell center"></div>
      <div className="grid-cell right">
        <span className="city-name">
            {segment.destination === 'ATL' ? 'Atlanta, GA' : segment.destination === 'LAS' ? 'Las Vegas, NV' : segment.destination === 'ORD' ? 'Chicago, IL' : 'Dest City'}
        </span>
      </div>

      <div className="grid-cell left">
        <span className="flight-time">{formatTime(segment.departure_time)}</span>
      </div>
      <div className="grid-cell center duration-cell">
        <div className="duration-pill">
            {segment.duration}
        </div>
      </div>
      <div className="grid-cell right">
        <span className="flight-time">{formatTime(segment.arrival_time)}</span>
      </div>

      <div className="grid-cell left">
        <span className="flight-date">{formatDate(segment.departure_date)}</span>
      </div>
      <div className="grid-cell center stops-cell">
        <div className="stops-text">
            {segment.stops === 0 ? 'Nonstop' : `${segment.stops} Stop(s)`}
        </div>
      </div>
      <div className="grid-cell right">
        <span className="flight-date">{formatDate(segment.arrival_date)}</span>
      </div>
    </div>
  );

  return (
    <div className={`flight-card ${flight.is_round_trip ? 'round-trip' : ''}`}>
      
      <div className="card-top-header">
        <div className="airline-info">
            <img src="/Logos/Frontier_Logo.svg" alt="Frontier Airlines" className="airline-logo" />
            <div className="airline-text-container">
              <span className="airline-name">Frontier Airlines</span>
              <span className="flight-number-text">{flight.flight_number || flight.flightNumber}</span>
            </div>
        </div>
        
        <div className="price-display">
            <span className="from-label">FROM</span>
            {flight.gowild_eligible ? (
                <div className="price-value gowild">
                    GoWild Pass
                    <span className="tax-subtext">+ taxes (~$5-15)</span>
                </div>
            ) : (
                <div className="price-value standard">
                    ${flight.price}
                </div>
            )}
        </div>
      </div>

      <div className="flight-body">
        {renderFlightRow(flight)}
        
        {flight.is_round_trip && flight.return_flight && (
            <>
                <div className="trip-divider">
                    <span className="divider-label">Return Flight</span>
                </div>
                {renderFlightRow(flight.return_flight, true)}
            </>
        )}
      </div>

      {/* --- NEW: FLIGHT DETAILS (STOPS) --- */}
      {/* Placed ABOVE the Alerts group */}
      {hasStops && (
        <div className="flight-status-group details-group">
          <div 
            className={`alerts-toggle-header ${isDetailsExpanded ? 'expanded' : ''}`}
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
          >
            <div className="alerts-title-wrapper">
              <span className="alerts-title">
                Flight Details
                <span className="stops-count-badge">{flight.stops} Stop{flight.stops > 1 ? 's' : ''}</span>
              </span>
            </div>
            {isDetailsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {isDetailsExpanded && (
            <div className="details-content">
              {/* If segments exist in data, map them. Otherwise show placeholder for demo */}
              {flight.segments && flight.segments.length > 0 
                 ? renderSegments(flight.segments) 
                 : <div className="no-segments-msg">Detailed connection info unavailable</div>
              }
            </div>
          )}
        </div>
      )}

      {/* --- ALERTS GROUP --- */}
      {hasAlerts && (
        <div className="flight-status-group">
          <div 
            className={`alerts-toggle-header ${isAlertsExpanded ? 'expanded' : ''}`}
            onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
          >
            <div className="alerts-title-wrapper">
              <span className="alerts-title">
                Alerts 
                <span className="alert-count-badge">{alertCount}</span>
              </span>
              <div className="alerts-header-icons">
                {hasBlackout && <Circle size={16} className="summary-icon blackout-icon" fill="currentColor" />}
                {hasSeatAlert && <Circle size={16} className="summary-icon seats-icon" fill="currentColor" />}
              </div>
            </div>
            {isAlertsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>

          {isAlertsExpanded && (
            <div className="alerts-content">
              {hasBlackout && (
                  <div className="status-alert blackout">
                    <div className="alert-icon-box">
                      <Circle size={20} className="alert-icon" fill="currentColor" />
                    </div>
                    <div className="alert-content">
                      <h4 className="alert-title">GoWild Pass Blackout</h4>
                      <p className="alert-message">
                          Not eligible for GoWild Pass on {flight.blackout_dates.message}.
                      </p>
                    </div>
                  </div>
              )}
              {hasSeatAlert && (
                  <div className="status-alert seats">
                      <div className="alert-icon-box">
                          <Circle size={20} className="alert-icon" fill="currentColor" />
                      </div>
                      <div className="alert-content">
                          <h4 className="alert-title">Only {flight.seats_remaining} Seats Remain</h4>
                          <p className="alert-message">
                              Only {flight.seats_remaining} GoWild-eligible seats left.
                          </p>
                      </div>
                  </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="card-footer">
        <div className="footer-actions">
            {buildYourOwnMode ? (
                <button
                    className="action-button"
                    onClick={() => onSelectFlight && onSelectFlight(flight)}
                >
                    {buildYourOwnStep === 'outbound' ? 'Select Outbound' : 'Select Return'}
                </button>
            ) : (
                <button className="action-button">Select</button>
            )}
        </div>
      </div>

    </div>
  );
}

export default FlightCard;