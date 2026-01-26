import React, { useEffect, useMemo, useState } from 'react';
import { TicketsPlane, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import './FlightCard.css';

// ✅ AIRPORT DATA LOOKUP (Derived from FrontierDestinationInfo_numeric.json)
const AIRPORT_DB = {
  "AGU": { city: "Aguascalientes", state: null, country: "Mexico" },
  "ATL": { city: "Atlanta", state: "GA", country: "United States" },
  "AUA": { city: "Oranjestad", state: null, country: "Aruba" },
  "AUS": { city: "Austin", state: "TX", country: "United States" },
  "BDL": { city: "Hartford / Springfield", state: "CT", country: "United States" },
  "BJX": { city: "Silao (León/Guanajuato)", state: null, country: "Mexico" },
  "BNA": { city: "Nashville", state: "TN", country: "United States" },
  "BOI": { city: "Boise", state: "ID", country: "United States" },
  "BOS": { city: "Boston", state: "MA", country: "United States" },
  "BQN": { city: "Aguadilla", state: "PR", country: "United States" },
  "BTV": { city: "Burlington", state: "VT", country: "United States" },
  "BUF": { city: "Buffalo", state: "NY", country: "United States" },
  "BUR": { city: "Burbank", state: "CA", country: "United States" },
  "BWI": { city: "Baltimore", state: "MD", country: "United States" },
  "CHS": { city: "Charleston", state: "SC", country: "United States" },
  "CID": { city: "Cedar Rapids", state: "IA", country: "United States" },
  "CLE": { city: "Cleveland", state: "OH", country: "United States" },
  "CLT": { city: "Charlotte", state: "NC", country: "United States" },
  "CMH": { city: "Columbus", state: "OH", country: "United States" },
  "CRP": { city: "Corpus Christi", state: "TX", country: "United States" },
  "CUN": { city: "Cancún", state: null, country: "Mexico" },
  "CUU": { city: "Chihuahua", state: null, country: "Mexico" },
  "CVG": { city: "Hebron (Cincinnati)", state: "KY", country: "United States" },
  "DCA": { city: "Washington", state: "DC", country: "United States" },
  "DEN": { city: "Denver", state: "CO", country: "United States" },
  "DFW": { city: "Dallas / Fort Worth", state: "TX", country: "United States" },
  "DGO": { city: "Durango", state: null, country: "Mexico" },
  "DSM": { city: "Des Moines", state: "IA", country: "United States" },
  "DTW": { city: "Detroit", state: "MI", country: "United States" },
  "ELP": { city: "El Paso", state: "TX", country: "United States" },
  "EWR": { city: "Newark", state: "NJ", country: "United States" },
  "FAR": { city: "Fargo", state: "ND", country: "United States" },
  "FLL": { city: "Fort Lauderdale", state: "FL", country: "United States" },
  "FSD": { city: "Sioux Falls", state: "SD", country: "United States" },
  "GDL": { city: "Guadalajara", state: null, country: "Mexico" },
  "GEG": { city: "Spokane", state: "WA", country: "United States" },
  "GRR": { city: "Grand Rapids", state: "MI", country: "United States" },
  "GUA": { city: "Guatemala City", state: null, country: "Guatemala" },
  "HUX": { city: "Huatulco", state: null, country: "Mexico" },
  "IAD": { city: "Dulles (Washington, D.C.)", state: "VA", country: "United States" },
  "IAH": { city: "Houston", state: "TX", country: "United States" },
  "IND": { city: "Indianapolis", state: "IN", country: "United States" },
  "ISP": { city: "Islip", state: "NY", country: "United States" },
  "JAX": { city: "Jacksonville", state: "FL", country: "United States" },
  "JFK": { city: "New York", state: "NY", country: "United States" },
  "LAS": { city: "Las Vegas", state: "NV", country: "United States" },
  "LAX": { city: "Los Angeles", state: "CA", country: "United States" },
  "LGA": { city: "New York", state: "NY", country: "United States" },
  "LIT": { city: "Little Rock", state: "AR", country: "United States" },
  "MBJ": { city: "Montego Bay", state: null, country: "Jamaica" },
  "MCI": { city: "Kansas City", state: "MO", country: "United States" },
  "MCO": { city: "Orlando", state: "FL", country: "United States" },
  "MDT": { city: "Harrisburg", state: "PA", country: "United States" },
  "MDW": { city: "Chicago", state: "IL", country: "United States" },
  "MEM": { city: "Memphis", state: "TN", country: "United States" },
  "MEX": { city: "Mexico City", state: null, country: "Mexico" },
  "MIA": { city: "Miami", state: "FL", country: "United States" },
  "MKE": { city: "Milwaukee", state: "WI", country: "United States" },
  "MLM": { city: "Morelia", state: null, country: "Mexico" },
  "MSN": { city: "Madison", state: "WI", country: "United States" },
  "MSO": { city: "Missoula", state: "MT", country: "United States" },
  "MSP": { city: "Minneapolis / St. Paul", state: "MN", country: "United States" },
  "MSY": { city: "New Orleans", state: "LA", country: "United States" },
  "MTY": { city: "Monterrey", state: null, country: "Mexico" },
  "MYR": { city: "Myrtle Beach", state: "SC", country: "United States" },
  "NAS": { city: "Nassau", state: null, country: "Bahamas" },
  "NLU": { city: "Zumpango (Mexico City)", state: null, country: "Mexico" },
  "OAX": { city: "Oaxaca", state: null, country: "Mexico" },
  "OKC": { city: "Oklahoma City", state: "OK", country: "United States" },
  "OMA": { city: "Omaha", state: "NE", country: "United States" },
  "ONT": { city: "Ontario", state: "CA", country: "United States" },
  "ORD": { city: "Chicago", state: "IL", country: "United States" },
  "ORF": { city: "Norfolk", state: "VA", country: "United States" },
  "PAE": { city: "Everett (Seattle)", state: "WA", country: "United States" },
  "PBI": { city: "West Palm Beach", state: "FL", country: "United States" },
  "PDX": { city: "Portland", state: "OR", country: "United States" },
  "PHL": { city: "Philadelphia", state: "PA", country: "United States" },
  "PHX": { city: "Phoenix", state: "AZ", country: "United States" },
  "PIT": { city: "Pittsburgh", state: "PA", country: "United States" },
  "PLS": { city: "Providenciales", state: null, country: "United Kingdom" },
  "PNS": { city: "Pensacola", state: "FL", country: "United States" },
  "PSE": { city: "Ponce", state: "PR", country: "United States" },
  "PSP": { city: "Palm Springs", state: "CA", country: "United States" },
  "PUJ": { city: "Punta Cana", state: null, country: "Dominican Republic" },
  "PVR": { city: "Puerto Vallarta", state: null, country: "Mexico" },
  "QRO": { city: "Santiago de Querétaro", state: null, country: "Mexico" },
  "RDU": { city: "Raleigh / Durham", state: "NC", country: "United States" },
  "RIC": { city: "Richmond", state: "VA", country: "United States" },
  "RNO": { city: "Reno", state: "NV", country: "United States" },
  "RSW": { city: "Fort Myers", state: "FL", country: "United States" },
  "SAL": { city: "San Salvador", state: null, country: "El Salvador" },
  "SAN": { city: "San Diego", state: "CA", country: "United States" },
  "SAP": { city: "San Pedro Sula", state: null, country: "Honduras" },
  "SAT": { city: "San Antonio", state: "TX", country: "United States" },
  "SDQ": { city: "Santo Domingo", state: null, country: "Dominican Republic" },
  "SEA": { city: "Seattle / Tacoma", state: "WA", country: "United States" },
  "SFO": { city: "San Francisco", state: "CA", country: "United States" },
  "SJC": { city: "San Jose", state: "CA", country: "United States" },
  "SJD": { city: "San José del Cabo", state: null, country: "Mexico" },
  "SJO": { city: "Alajuela (San José)", state: null, country: "Costa Rica" },
  "SJU": { city: "San Juan", state: "PR", country: "United States" },
  "SLC": { city: "Salt Lake City", state: "UT", country: "United States" },
  "SMF": { city: "Sacramento", state: "CA", country: "United States" },
  "SNA": { city: "Santa Ana", state: "CA", country: "United States" },
  "SRQ": { city: "Sarasota / Bradenton", state: "FL", country: "United States" },
  "STI": { city: "Santiago de los Caballeros", state: null, country: "Dominican Republic" },
  "STL": { city: "St. Louis", state: "MO", country: "United States" },
  "SXM": { city: "Philipsburg", state: null, country: "Sint Maarten" },
  "SYR": { city: "Syracuse", state: "NY", country: "United States" },
  "TIJ": { city: "Tijuana", state: null, country: "Mexico" },
  "TLC": { city: "Toluca", state: null, country: "Mexico" },
  "UPN": { city: "Uruapan", state: null, country: "Mexico" },
  "TPA": { city: "Tampa", state: "FL", country: "United States" },
  "TTN": { city: "Trenton", state: "NJ", country: "United States" },
  "TUL": { city: "Tulsa", state: "OK", country: "United States" },
  "TUS": { city: "Tucson", state: "AZ", country: "United States" },
  "XNA": { city: "Bentonville / Fayetteville", state: "AR", country: "United States" },
  "ZCL": { city: "Zacatecas", state: null, country: "Mexico" }
};

function FlightCard({ flight, buildYourOwnMode = false, buildYourOwnStep = 'outbound', onSelectFlight }) {
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);

  // =========================
  // Saved Flight (user_flights)
  // =========================
  const [isSelected, setIsSelected] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  // Build a deterministic key for this flight (used to upsert + check selection)
  const flightKey = useMemo(() => {
    const safe = (v) => (v ?? '').toString().trim();
    const base = [
      safe(flight.origin || flight.origin_iata),
      safe(flight.destination || flight.destination_iata),
      safe(flight.departure_date),
      safe(flight.departure_time),
      safe(flight.arrival_date),
      safe(flight.arrival_time),
      safe(flight.flight_number || flight.flightNumber),
      safe(flight.is_round_trip ? 'RT' : 'OW')
    ].join('|');

    if (flight.is_round_trip && flight.return_flight) {
      const r = flight.return_flight;
      return base + '||RET|' + [
        safe(r.origin),
        safe(r.destination),
        safe(r.departure_date),
        safe(r.departure_time),
        safe(r.arrival_date),
        safe(r.arrival_time),
        safe(r.flight_number || r.flightNumber)
      ].join('|');
    }
    return base;
  }, [flight]);

  // Check DB to see if this flight is already saved for the current user
  useEffect(() => {
    if (buildYourOwnMode) return; // Build-your-own selections are handled separately
    const email = localStorage.getItem('current_email');
    if (!email || !flightKey) return;

    let cancelled = false;

    const checkSelected = async () => {
      try {
        const res = await fetch(
          `/api/user_flights/is_selected?email=${encodeURIComponent(email)}&flight_key=${encodeURIComponent(flightKey)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setIsSelected(!!data.selected);
      } catch (err) {
        // silent fail
      }
    };

    checkSelected();
    return () => { cancelled = true; };
  }, [buildYourOwnMode, flightKey]);

  const handleSelectAndSave = async () => {
    if (buildYourOwnMode) {
      onSelectFlight && onSelectFlight(flight);
      return;
    }

    const email = localStorage.getItem('current_email');
    if (!email) {
      alert('No user email found. Please log in again.');
      return;
    }

    setIsSelecting(true);
    try {
      // Build a minimal, indexable payload + full snapshot for later viewing
      const payload = {
        email,
        flight_key: flightKey,
        provider: flight.provider || 'frontier',
        provider_offer_id: flight.provider_offer_id || flight.offer_id || null,

        origin_iata: flight.origin,
        destination_iata: flight.destination,

        // Prefer ISO strings if present; otherwise fall back to date+time strings
        start_time: flight.start_time || `${flight.departure_date}T${(flight.departure_time || '').trim()}`,
        end_time: flight.end_time || `${flight.arrival_date || flight.departure_date}T${(flight.arrival_time || '').trim()}`,

        trip_type: flight.is_round_trip ? 'round-trip' : 'one-way',
        airline: 'Frontier Airlines',
        flight_number: flight.flight_number || flight.flightNumber || null,

        stops: typeof flight.stops === 'number' ? flight.stops : null,
        duration_minutes: flight.duration_minutes || null,

        price_total: flight.gowild_eligible ? 0 : (typeof flight.price === 'number' ? flight.price : parseFloat(flight.price)),
        currency: flight.currency || 'USD',

        gowild_eligible: !!flight.gowild_eligible,
        nonstop: (flight.stops === 0) || false,

        snapshot_json: flight
      };

      const res = await fetch('/api/user_flights/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save flight');
      }

      setIsSelected(true);
      onSelectFlight && onSelectFlight(flight);
    } catch (err) {
      alert(err.message || 'Failed to save flight');
    } finally {
      setIsSelecting(false);
    }
  };


  // Format date helper: "Tue, Jan 13, 2026"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
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

  // ✅ NEW: Helper to get City, State format based on IATA
  const getCityState = (iata) => {
    const info = AIRPORT_DB[iata];
    if (!info) return iata; // Fallback to code if not found
    
    // For domestic (US), show "City, StateAbbr" (e.g., "Atlanta, GA")
    if (info.country === "United States" && info.state) {
      return `${info.city}, ${info.state}`;
    }
    // For international, show "City, Country"
    return `${info.city}, ${info.country}`;
  };

  // Determine active alerts
  const hasBlackout = flight.blackout_dates?.has_blackout && flight.gowild_eligible;
  const hasSeatAlert = flight.seats_remaining && flight.seats_remaining <= 9;
  const hasAlerts = hasBlackout || hasSeatAlert;
  const alertCount = (hasBlackout ? 1 : 0) + (hasSeatAlert ? 1 : 0);

  const renderFlightRow = (segment, isReturn = false) => (
    <div className={`flight-row-grid ${isReturn ? 'return-leg' : ''}`}>
      <div className="grid-cell left">
        <span className="airport-code">{segment.origin}</span>
      </div>
      <div className="grid-cell center icon-cell">
        <div className="plane-icon-wrapper">
          <TicketsPlane size={42} className="plane-icon" />
        </div>
      </div>
      <div className="grid-cell right">
        <span className="airport-code">{segment.destination}</span>
      </div>

      <div className="grid-cell left">
        {/* ✅ UPDATED: Use getCityState helper */}
        <span className="city-name">
          {getCityState(segment.origin)}
        </span>
      </div>
      <div className="grid-cell center"></div>
      <div className="grid-cell right">
        {/* ✅ UPDATED: Use getCityState helper */}
        <span className="city-name">
          {getCityState(segment.destination)}
        </span>
      </div>

      <div className="grid-cell left">
        <span className="flight-time">{formatTime(segment.departure_time)}</span>
      </div>
      <div className="grid-cell center duration-cell">
        <div className="duration-pill">{segment.duration}</div>
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
            </div>
          ) : (
            <div className="price-value standard">${flight.price}</div>
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

      {/* Alerts group */}
      {hasAlerts && (
        <div className="flight-status-group">
          <div
            className={`alerts-toggle-header ${isAlertsExpanded ? 'expanded' : ''}`}
            onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
          >
            <div className="alerts-title-wrapper">
              <span className="alerts-title">
                Alerts <span className="alert-count-badge">{alertCount}</span>
              </span>
              <div className="alerts-header-icons">
                {hasBlackout && <Circle size={14} className="summary-icon blackout-icon" fill="currentColor" />}
                {hasSeatAlert && <Circle size={14} className="summary-icon seats-icon" fill="currentColor" />}
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
                    <p className="alert-message">Not eligible for GoWild Pass on {flight.blackout_dates.message}.</p>
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
                    <p className="alert-message">Only {flight.seats_remaining} GoWild-eligible seats left.</p>
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
            <button className="action-button" onClick={() => onSelectFlight && onSelectFlight(flight)} disabled={isSelecting}>
              {buildYourOwnStep === 'outbound' ? 'Select Outbound' : 'Select Return'}
            </button>
          ) : (
            <button className={`action-button ${isSelected ? "selected" : ""}`} onClick={handleSelectAndSave} disabled={isSelecting || isSelected}>
              {isSelected ? "Selected" : (isSelecting ? "Selecting..." : "Select")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default FlightCard;