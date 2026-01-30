import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Filter,
  Globe,
  Loader,
  ArrowLeft,
  Ticket,
  UserRound
} from 'lucide-react';
import { format } from 'date-fns';
import './ExploreEvents.css';

// Reuse your configuration
const API_BASE_URL = "";

const ExploreEvents = ({ onBack, onArtistClick }) => {

  const normalizeArtistForDetails = (a) => ({
    id: a?.id,
    name: a?.display_name || a?.name || a?.artist_name || '',
    display_name: a?.display_name || a?.name || a?.artist_name || '',
    edmtrain_id: a?.edmtrain_id ?? a?.edmtrainId ?? a?.edmtrainID ?? null,
    genres: a?.genres ?? null,
    image: a?.image || a?.image_url || a?.photo || a?.photo_url || null,
    image_url: a?.image_url || null,
  });

  const [viewMode, setViewMode] = useState('artists'); 
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [dbArtists, setDbArtists] = useState([]); 
  const [tourData, setTourData] = useState({});   
  const [locationEvents, setLocationEvents] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCountry, setFilterCountry] = useState('All');
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        const locRes = await fetch(`${API_BASE_URL}/api/edmtrain/locations`);
        if (locRes.ok) {
          const json = await locRes.json();
          setLocations(Array.isArray(json.data) ? json.data : []);
        }

        const artRes = await fetch(`${API_BASE_URL}/api/db_artists?limit=1000`); 
        if (artRes.ok) {
          const json = await artRes.json();
          setDbArtists(json || []);
        }

        const tourRes = await fetch(`${API_BASE_URL}/api/edmtrain/tours`);
        if (tourRes.ok) {
          const json = await tourRes.json();
          const map = json?.data?.artistIdEventCountMap || {};
          setTourData(map);
        }

      } catch (err) {
        console.error("Failed to initialize Explore data", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  const handleLocationSelect = async (location) => {
    setSelectedLocation(location);
    setViewMode('events');
    setLoading(true);
    setLocationEvents([]);

    try {
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

  const filteredArtists = useMemo(() => {
    let processed = dbArtists.map(localArtist => {
      const count = tourData[localArtist.edmtrain_id] || 0;
      return {
        ...localArtist,
        eventCount: count
      };
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      processed = processed.filter(a => a.display_name.toLowerCase().includes(q));
    }

    processed.sort((a, b) => b.eventCount - a.eventCount);

    return processed;
  }, [dbArtists, tourData, searchQuery]);

  const filteredLocations = useMemo(() => {
    let result = [...locations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(loc => 
        (loc.city && loc.city.toLowerCase().includes(q)) || 
        (loc.state && loc.state.toLowerCase().includes(q)) ||
        (loc.stateCode && loc.stateCode.toLowerCase().includes(q))
      );
    }

    if (filterCountry !== 'All') {
      result = result.filter(loc => loc.country === filterCountry);
    }

    result.sort((a, b) => {
      const countryA = (a.country || '').toString();
      const countryB = (b.country || '').toString();
      const stateA = (a.state || a.stateCode || '').toString();
      const stateB = (b.state || b.stateCode || '').toString();
      const cityA = (a.city || '').toString();
      const cityB = (b.city || '').toString();

      const c = countryA.localeCompare(countryB);
      if (c !== 0) return c;

      const s = stateA.localeCompare(stateB);
      if (s !== 0) return s;

      return cityA.localeCompare(cityB);
    });

    return result;
  }, [locations, searchQuery, filterCountry]);

  const uniqueCountries = useMemo(() => {
    const countries = new Set(locations.map(l => l.country).filter(Boolean));
    return ['All', ...Array.from(countries).sort()];
  }, [locations]);

  // --- CARD RENDERERS ---

  const renderLocationCard = (loc) => {
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
            {evt.venue?.name}
          </p>
        </div>
      </div>
    </div>
  );

  // ✅ ARTIST CARD: CENTERED LAYOUT
  const renderArtistCard = (artist) => (
    <div key={artist.id} className="explore-card artist-card fade-in" role="button" tabIndex={0} onClick={() => onArtistClick?.(normalizeArtistForDetails(artist))} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onArtistClick?.(normalizeArtistForDetails(artist)); } }}>
      <div className="explore-card-bg" style={{ 
        backgroundImage: artist.image_url ? `url(${artist.image_url})` : undefined,
        backgroundColor: '#0f172a' 
      }}></div>
      <div className="explore-card-overlay"></div>
      
      {/* Single centered container. 
         No absolute positioning on children. 
         Flexbox handles the centering. 
      */}
      <div className="artist-card-center-overlay">
          <h3 className="artist-card-name">{artist.display_name}</h3>

          {artist.eventCount > 0 && (
             <div className="artist-card-count">
               <Ticket size={12} style={{ marginRight: 4 }}/>
               {artist.eventCount} EVENTS
             </div>
          )}
      </div>
    </div>
  );

  return (
    <div className="dashboard-panel full explore-events-container">
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
          
          <div className="explore-mode-toggle">
            <button
              type="button"
              className={`explore-mode-option ${viewMode === 'artists' ? 'active' : ''}`}
              onClick={() => setViewMode('artists')}
              aria-pressed={viewMode === 'artists'}
            >
              <UserRound size={16} className="explore-toggle-icon" />
              <span className="explore-toggle-label">Artists</span>
            </button>
            <button
              type="button"
              className={`explore-mode-option ${viewMode === 'locations' ? 'active' : ''}`}
              onClick={() => setViewMode('locations')}
              aria-pressed={viewMode === 'locations'}
            >
              <MapPin size={16} className="explore-toggle-icon" />
              <span className="explore-toggle-label">Locations</span>
            </button>
          </div>
        </div>

        {viewMode !== 'events' && (
          <div className="explore-filters-wrapper">
            <div className="places-input-wrap explore-search">
              <Search size={18} className="places-input-icon" />
              <input 
                type="text" 
                placeholder={viewMode === 'artists' ? "Search Artist..." : "Search City, State..."}
                className="places-airport-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {viewMode === 'locations' && (
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
</div>
            )}
</div>
        )}
      </div>

      <div className="explore-content-scroll">
        {loading && (
          <div className="explore-loading">
            <div className="spinner"></div>
            <p>Loading {viewMode}...</p>
          </div>
        )}

        {!loading && viewMode === 'artists' && (
          <div className="explore-grid">
            {filteredArtists.map(renderArtistCard)}
            {filteredArtists.length === 0 && (
              <div className="explore-empty">No artists found.</div>
            )}
          </div>
        )}

        {!loading && viewMode === 'locations' && (
          <div className="explore-grid">
            {filteredLocations.map(renderLocationCard)}
            {filteredLocations.length === 0 && (
              <div className="explore-empty">No locations found.</div>
            )}
          </div>
        )}

        {!loading && viewMode === 'events' && (
          <div className="explore-events-wrapper">
            <div className="events-location-header">
              <h2>{selectedLocation?.city || selectedLocation?.state}</h2>
              <p>{selectedLocation?.stateCode}, {selectedLocation?.country}</p>
            </div>
            <div className="explore-grid events-grid">
              {locationEvents.map(renderEventCard)}
              {locationEvents.length === 0 && (
                <div className="explore-empty">No upcoming events found for this location.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreEvents;