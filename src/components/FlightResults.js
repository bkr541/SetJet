import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  CircleDollarSign,
  Plane,
  Sunrise,
  Hourglass,
  Ticket,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  Archive,
  Map as MapIcon
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import './FlightResults.css';
import DestinationCard from './DestinationCard';

const HubMap = lazy(() => import('./HubMap'));

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

  // ✅ NEW: Has Events toggle (logic later)
  const [hasEventsOnly, setHasEventsOnly] = useState(false);

  const [showMap, setShowMap] = useState(false);

  const sp = searchParams || {
    origins: [],
    destinations: [],
    departureDate: '',
    returnDate: '',
    tripType: ''
  };

  useEffect(() => {
    const handleClick = () => {
      setIsSortOpen(false);
      setIsFilterOpen(false);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Dropdown UI for Sort / Filter (pill style)
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const mapData = useMemo(() => {
    if (!flights || flights.length === 0) return null;

    const origin = flights[0].origin;
    const destMap = {};
    flights.forEach((f) => {
      if (!destMap[f.destination] || f.price < destMap[f.destination].price) {
        destMap[f.destination] = { iata: f.destination, price: f.price };
      }
    });

    return {
      origin,
      destinations: Object.values(destMap)
    };
  }, [flights]);

  const availableDestinationsList = useMemo(() => {
    if (!flights || flights.length === 0) return '';
    const unique = [...new Set(flights.map((f) => f.destination))];
    return unique.sort().join(', ');
  }, [flights]);

  const getDaysAway = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `+ ${diffDays} days away`;
    return null;
  };

  const formatPrettyDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'EEE, MMM do, yyyy');
    } catch (e) {
      return dateStr;
    }
  };

  const groupedFlights = useMemo(() => {
    if (!flights) return [];

    let filteredFlights = flights;
    if (nonstopOnly) filteredFlights = filteredFlights.filter((f) => f.stops === 0);
    if (gowildOnly) filteredFlights = filteredFlights.filter((f) => f.gowild_eligible);

    // ✅ Has Events filtering will be added later.
    // For now, it just toggles UI state.
    // if (hasEventsOnly) filteredFlights = filteredFlights.filter((f) => f.has_events);

    const groups = {};
    if (Array.isArray(filteredFlights)) {
      filteredFlights.forEach((flight) => {
        const routeKey = `${flight.origin}-${flight.destination}`;
        if (!groups[routeKey]) groups[routeKey] = [];
        groups[routeKey].push(flight);
      });
    }

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        switch (sortBy) {
          case 'nonstop':
            if (a.stops === 0 && b.stops !== 0) return -1;
            if (a.stops !== 0 && b.stops === 0) return 1;
            return a.price - b.price;
          case 'earliest': {
            const dateA = new Date(`${a.departure_date} ${a.departure_time}`);
            const dateB = new Date(`${b.departure_date} ${b.departure_time}`);
            return dateA - dateB;
          }
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
      const minPriceA = Math.min(...groups[keyA].map((f) => f.price));
      const minPriceB = Math.min(...groups[keyB].map((f) => f.price));
      return minPriceA - minPriceB;
    });

    return sortedRouteKeys.map((key) => ({
      destination: groups[key][0].destination,
      origin: groups[key][0].origin,
      flights: groups[key]
    }));
  }, [flights, sortBy, nonstopOnly, gowildOnly, hasEventsOnly]);

  const isAnyAirportSearch = sp.destinations.includes('ANY');
  const destinationText = isAnyAirportSearch ? 'Any Airport' : sp.destinations.join(', ');

  const daysAwayText = getDaysAway(sp.departureDate);

  return (
    <div className="results-container" onClick={() => { setIsSortOpen(false); setIsFilterOpen(false); }}>
      <div className="results-header">
        <div className="results-title-row">
          <h2>
            <span style={{ color: '#004e5a' }}>{flights.length}</span> Flight Results
          </h2>

          {fromCache && (
            <span className="cache-badge">
              <Archive size={14} />
              From Cache
            </span>
          )}
        </div>

        <div className="search-summary">
          <div className="search-fields-container">
            <div className="search-field">
              <strong>From:</strong> {sp.origins.join(', ')} <span className="route-arrow">→</span>{' '}
              <strong>To:</strong> {destinationText}
            </div>

            <div className="search-field">
              <strong>Departure:</strong> {formatPrettyDate(sp.departureDate)}
              {daysAwayText && <span className="days-away">{daysAwayText}</span>}
              {sp.returnDate && (
                <>
                  <span className="route-sep"> | </span>
                  <strong>Return:</strong> {formatPrettyDate(sp.returnDate)}
                </>
              )}
            </div>
          </div>

          {isAnyAirportSearch && availableDestinationsList && (
            <p className="results-info subtle-line">
              <strong>Available Destinations:</strong> {availableDestinationsList}
            </p>
          )}

          {tripPlannerInfo && tripPlannerInfo.days_searched > 1 && flights.length > 0 && (
            <div className="trip-planner-notice">
              ℹ️ No matches found for {formatPrettyDate(sp.departureDate)}. Showing results starting{' '}
              {tripPlannerInfo.earliest_departure} (searched {tripPlannerInfo.days_searched} days)
            </div>
          )}
        </div>

{mapData && (
          <div className="map-section-container flightresults-map-section">
            <div
              className="map-toggle-header"
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setShowMap((prev) => !prev);
              }}
              onKeyDown={(e) => e.key === 'Enter' && setShowMap((prev) => !prev)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="dest-stat-icon-box map-icon-box">
                  <MapIcon size={20} className="dest-stat-icon" />
                </div>
                <span className="dest-stat-label map-label-text">
                  {showMap ? 'Hide Destinations' : 'Show Destinations'}
                </span>
              </div>
              {showMap ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {showMap && (
              <div className="map-content-wrapper" onClick={(e) => e.stopPropagation()}>
                <Suspense fallback={<div className="fr-map-loading">Loading map…</div>}>
                  <HubMap originIATA={mapData.origin} destinations={mapData.destinations} />
                </Suspense>
              </div>
            )}
          </div>
        )}


      </div>

      {flights.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">✈️</div>
          <h3>Ready to search!</h3>
          <p>Flight results will appear here after you search.</p>
        </div>
      ) : (
        <>
          <div className="sort-controls">
            <div className="pill-controls-row">
              <div className="pill-control" onClick={(e) => e.stopPropagation()}>
                <span className="pill-control-label">Sort:</span>
                <button
                  type="button"
                  className="pill-control-button"
                  onClick={() => {
                    setIsSortOpen((prev) => !prev);
                    setIsFilterOpen(false);
                  }}
                >
                  {sortBy === 'price' && 'Lowest Price'}
                  {sortBy === 'nonstop' && 'Non-Stop'}
                  {sortBy === 'earliest' && 'Earliest'}
                  {sortBy === 'longest-trip' && 'Longest Trip'}
                  <ChevronDown size={16} />
                </button>

                {isSortOpen && (
                  <div className="pill-menu">
                    <button
                      type="button"
                      className={`pill-menu-item ${sortBy === 'price' ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy('price');
                        setIsSortOpen(false);
                      }}
                    >
                      <CircleDollarSign size={16} />
                      Lowest Price
                    </button>

                    <button
                      type="button"
                      className={`pill-menu-item ${sortBy === 'nonstop' ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy('nonstop');
                        setIsSortOpen(false);
                      }}
                    >
                      <Plane size={16} />
                      Non-Stop
                    </button>

                    <button
                      type="button"
                      className={`pill-menu-item ${sortBy === 'earliest' ? 'active' : ''}`}
                      onClick={() => {
                        setSortBy('earliest');
                        setIsSortOpen(false);
                      }}
                    >
                      <Sunrise size={16} />
                      Earliest
                    </button>

                    {(sp.tripType === 'round-trip' || sp.tripType === 'day-trip') && (
                      <button
                        type="button"
                        className={`pill-menu-item ${sortBy === 'longest-trip' ? 'active' : ''}`}
                        onClick={() => {
                          setSortBy('longest-trip');
                          setIsSortOpen(false);
                        }}
                      >
                        <Hourglass size={16} />
                        Longest Trip
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="pill-control" onClick={(e) => e.stopPropagation()}>
                <span className="pill-control-label">Filter:</span>
                <button
                  type="button"
                  className="pill-control-button"
                  onClick={() => {
                    setIsFilterOpen((prev) => !prev);
                    setIsSortOpen(false);
                  }}
                >
                  {([nonstopOnly, gowildOnly, hasEventsOnly].filter(Boolean).length === 0)
                    ? 'All Flights'
                    : `${[nonstopOnly, gowildOnly, hasEventsOnly].filter(Boolean).length} Active`}
                  <ChevronDown size={16} />
                </button>

                {isFilterOpen && (
                  <div className="pill-menu">
                    <button
                      type="button"
                      className={`pill-menu-item ${nonstopOnly ? 'active' : ''}`}
                      onClick={() => setNonstopOnly(!nonstopOnly)}
                    >
                      <Plane size={16} />
                      Non-Stop Only
                    </button>

                    <button
                      type="button"
                      className={`pill-menu-item ${gowildOnly ? 'active' : ''}`}
                      onClick={() => setGowildOnly(!gowildOnly)}
                    >
                      <Ticket size={16} />
                      GoWild Only
                    </button>

                    <button
                      type="button"
                      className={`pill-menu-item ${hasEventsOnly ? 'active' : ''}`}
                      onClick={() => setHasEventsOnly(!hasEventsOnly)}
                    >
                      <CalendarCheck size={16} />
                      Has Events
                    </button>
                  </div>
                )}
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
                onSelectFlight={() => {}}
                onSelectOutbound={onSelectOutbound}
                onSelectReturn={onSelectReturn}
                selectedOutboundFlight={selectedOutboundFlight}
                onResetBuildYourOwn={onResetBuildYourOwn}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FlightResults;