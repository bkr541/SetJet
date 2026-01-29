import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Filter,
  ArrowUpDown,
  Music,
  Globe,
  Loader,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import './ExploreEvents.css';

// Reuse your configuration
const API_BASE_URL = "";

const ExploreEvents = ({ onBack }) => {
  // --- State Management ---
  const [viewMode, setViewMode] = useState('locations'); // 'locations' | 'events' | 'tours'
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [tours, setTours] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationEvents, setLocationEvents] = useState([]);

  // --- Filter & Sort State (Based on your JSON payload) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  const [sortBy, setSortBy] = useState('state'); // 'state', 'city', 'country'

  // --- 1. Fetch Locations on Mount ---
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/edmtrain/locations`);
        if (res.ok) {
          const json = await res.json();
          // EDMTrain usually returns { data: [...] } or just [...]
          setLocations(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        console.error("Failed to fetch locations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // --- 2. Fetch Tours (Lazy Load) ---
  const handleLoadTours = async () => {
    setViewMode('tours');
    if (tours.length > 0) return; // Cached

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/edmtrain/tours`);
      if (res.ok) {
        const json = await res.json();
        setTours(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch tours", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Fetch Events for Location ---
  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setViewMode('events');
    setLoading(true);
    setLocationEvents([]);

    try {
      // Calls your existing app.py endpoint
      const res = await fetch(`${API_BASE_URL}/api/edmtrain/events/city?locationIds=${location.id}`);
      if (res.ok) {
        const json = await res.json();
        setLocationEvents(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch events", err);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. Filtering Logic (Based on your JSON fields) ---
  const filteredLocations = useMemo(() => {
    let result = [...locations];

    // A. Search Query (matches City or State)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(loc => 
        (loc.city && loc.city.toLowerCase().includes(q)) || 
        (loc.state && loc.state.toLowerCase().includes(q)) ||
        (loc.stateCode && loc.stateCode.toLowerCase().includes(q))
      );
    }

    // B. Country Filter
    if (filterCountry !== 'All') {
      result = result.filter(loc => loc.country === filterCountry);
    }

    // C. Sorting
    result.sort((a, b) => {
      if (sortBy === 'state') {
        const stateA = a.state || '';
        const stateB = b.state || '';
        return stateA.localeCompare(stateB);
      } else if (sortBy === 'city') {
        const cityA = a.city || 'ZZZ'; // Put null cities at end
        const cityB = b.city || 'ZZZ';
        return cityA.localeCompare(cityB);
      } else if (sortBy === 'country') {
        return a.country.localeCompare(b.country);
      }
      return 0;
    });

    return result;
  }, [locations, searchQuery, filterCountry, sortBy]);

  // Extract unique countries for filter dropdown
  const uniqueCountries = useMemo(() => {
    const countries = new Set(locations.map(l => l.country).filter(Boolean));
    return ['All', ...Array.from(countries).sort()];
  }, [locations]);

  // --- RENDER HELPERS ---

  const renderLocationCard = (loc) => {
    // Generate a pseudo-image based on state code or random color if no image available
    // In a real app, you might map state codes to static assets
    const bgColors = ['#0f172a', '#1e293b', '#334155', '#004e5a', '#be185d', '#b45309'];
    const randomColor = bgColors[loc.id % bgColors.length];

    return (
      <div 
        key={loc.id} 
        className="explore-card location-card fade-in"
        onClick={() => handleLocationSelect(loc)}
      >
        <div className="explore-card-bg" style={{ backgroundColor: randomColor }}></div>
        <div className="explore-card-content">
          <div className="explore-card-header">
            <span className="explore-badge">{loc.countryCode}</span>
            {loc.stateCode && <span className="explore-badge secondary">{loc.stateCode}</span>}
          </div>
          <div className="explore-card-main">
            <h3>{loc.city || loc.state}</h3>
            <p>{loc.city ? `${loc.state}, ${loc.country}` : loc.country}</p>
          </div>
          <div className="explore-card-footer">
            <div className="coordinates">
              <MapPin size={12} />
              {loc.latitude?.toFixed(2)}, {loc.longitude?.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEventCard = (evt) => (
    <div key={evt.id} className="explore-card event-card fade-in">
      <div className="explore-card-bg" style={{ 
        backgroundImage: evt.link ? `url(${API_BASE_URL}/api/edmtrain/event-image?link=${encodeURIComponent(evt.link)})` : undefined,
        backgroundColor: '#0f172a'
      }}></div>
      <div className="explore-card-overlay"></div>
      
      <div className="explore-card-content">
        <div className="event-date-badge">
          <span className="event-month">{evt.date ? format(new Date(evt.date), 'MMM') : 'TBA'}</span>
          <span className="event-day">{evt.date ? format(new Date(evt.date), 'dd') : '--'}</span>
        </div>
        
        <div className="explore-card-main">
          <h3>{evt.name || (evt.artistList && evt.artistList[0]?.name) || 'Event'}</h3>
          <p className="event-venue">
            <MapPin size={14} style={{ marginRight: 4 }}/> 
            {evt.venue?.name} - {evt.venue?.location}
          </p>
        </div>
        
        {evt.artistList && evt.artistList.length > 0 && (
          <div className="event-artists-preview">
            {evt.artistList.slice(0, 3).map((artist, idx) => (
              <span key={idx} className="artist-pill">{artist.name}</span>
            ))}
            {evt.artistList.length > 3 && <span className="artist-pill">+{evt.artistList.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-panel full explore-events-container">
      {/* --- HEADER --- */}
      <div className="explore-header">
        <div className="explore-title-row">
          {viewMode === 'events' ? (
            <button className="explore-back-btn" onClick={() => setViewMode('locations')}>
              <ArrowLeft size={20} /> Back
            </button>
          ) : (
            <h3 className="section-title">
              <span>EXPLORE </span>
              <span className="accent">EVENTS</span>
            </h3>
          )}
          
          <div className="explore-tabs">
            <button 
              className={`explore-tab ${viewMode !== 'tours' ? 'active' : ''}`}
              onClick={() => setViewMode('locations')}
            >
              Locations
            </button>
            <button 
              className={`explore-tab ${viewMode === 'tours' ? 'active' : ''}`}
              onClick={handleLoadTours}
            >
              Tours
            </button>
          </div>
        </div>

        {/* --- FILTERS (Only show in Locations mode) --- */}
        {viewMode === 'locations' && (
          <div className="explore-filters-wrapper">
            <div className="places-input-wrap explore-search">
              <Search size={18} className="places-input-icon" />
              <input 
                type="text" 
                placeholder="Search City, State..." 
                className="places-airport-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="explore-filter-controls">
              <div className="explore-dropdown-wrapper">
                <Globe size={16} className="control-icon" />
                <select 
                  value={filterCountry} 
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="explore-select"
                >
                  {uniqueCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="explore-dropdown-wrapper">
                <ArrowUpDown size={16} className="control-icon" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="explore-select"
                >
                  <option value="state">Sort: State</option>
                  <option value="city">Sort: City</option>
                  <option value="country">Sort: Country</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- CONTENT CONTENT --- */}
      <div className="explore-content-scroll">
        
        {loading && (
          <div className="explore-loading">
            <div className="spinner"></div>
            <p>Loading {viewMode}...</p>
          </div>
        )}

        {!loading && viewMode === 'locations' && (
          <div className="explore-grid">
            {filteredLocations.map(renderLocationCard)}
            {filteredLocations.length === 0 && (
              <div className="explore-empty">No locations found matching your filters.</div>
            )}
          </div>
        )}

        {!loading && viewMode === 'events' && (
          <div className="explore-events-wrapper">
            <div className="events-location-header">
              <h2>{selectedLocation?.city || selectedLocation?.state}</h2>
              <p>{selectedLocation?.stateCode}, {selectedLocation?.country}</p>
            </div>
            <div className="explore-grid">
              {locationEvents.map(renderEventCard)}
              {locationEvents.length === 0 && (
                <div className="explore-empty">No upcoming events found for this location.</div>
              )}
            </div>
          </div>
        )}

        {!loading && viewMode === 'tours' && (
          <div className="explore-list">
            {/* The tours API returns a complex object, simplified list here for example */}
            {Array.isArray(tours) && tours.length > 0 ? (
              tours.map((tour, i) => (
                <div key={i} className="tour-row">
                  <div className="tour-icon"><Music size={20}/></div>
                  <div className="tour-info">
                    <h4>{tour.artist?.name || "Unknown Artist"}</h4>
                    <p>{tour.eventCount || 0} stops</p>
                  </div>
                  <ChevronRight size={18} className="tour-arrow"/>
                </div>
              ))
            ) : (
              <div className="explore-empty">No active tours found.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreEvents;