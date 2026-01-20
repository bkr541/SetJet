import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  Map,
  Users,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowRight,
  ArrowLeftRight,
  Sunrise,
  PlaneTakeoff,
  PlaneLanding,
  X,
  Settings,
  LogOut,
  User,
  UserPen,    // New for Edit Profile
  Sparkles,   // New for Smart Preferences
  Bell,       // New for Notifications
  History,    // New for History
  ChevronRight // New for menu arrows
} from 'lucide-react';
import './UserHome.css';

// --- Dashboard Sub-Views ---
const HomeView = ({ favoriteArtists }) => (
  <div className="dashboard-panel fade-in">
    <div className="headliners-section">
      <h3 className="section-title">YOUR HEADLINERS</h3>

      <div className="headliners-scroll">
        {favoriteArtists && favoriteArtists.length > 0 ? (
          favoriteArtists.map((artist, index) => (
            <div key={index} className="headliner-card">
              <div className="headliner-image-wrapper">
                <img
                  src={artist.image || "https://via.placeholder.com/150/1e293b/ffffff?text=SJ"}
                  alt={artist.name}
                  onError={(e) => { e.target.src = "https://via.placeholder.com/150/1e293b/ffffff?text=SJ"; }}
                />
                <div className="headliner-overlay"></div>
                <span className="headliner-name">{artist.name}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data-msg">No favorite artists added yet.</p>
        )}
      </div>
    </div>
  </div>
);

const EventsView = () => (
  <div className="dashboard-panel fade-in">
    <h2>Events</h2>
    <p>Discover upcoming events and festivals.</p>
  </div>
);

const PlacesView = () => {
  const [tripMode, setTripMode] = useState('one-way');

  // Input Values (Search Queries)
  const [departingQuery, setDepartingQuery] = useState('');
  const [arrivalQuery, setArrivalQuery] = useState('');

  // Date Values
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');

  // Multi-Select Arrays
  const [departingSelections, setDepartingSelections] = useState([]);
  const [arrivalSelections, setArrivalSelections] = useState([]);

  // All Destinations Toggle
  const [isAllDestinations, setIsAllDestinations] = useState(false);

  const [departingSuggestions, setDepartingSuggestions] = useState([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState([]);

  const [isDepartingFocused, setIsDepartingFocused] = useState(false);
  const [isArrivalFocused, setIsArrivalFocused] = useState(false);

  // Refs to focus input after selection
  const departInputRef = useRef(null);
  const arriveInputRef = useRef(null);

  const tripOptions = [
    { key: 'one-way', label: 'One Way', Icon: ArrowRight },
    { key: 'round-trip', label: 'Round Trip', Icon: ArrowLeftRight },
    { key: 'day-trip', label: 'Day Trip', Icon: Sunrise },
    { key: 'trip-planner', label: 'Trip Planner', Icon: Calendar },
  ];

  // ✅ Auto-clear Arrival Date if switching to One Way
  useEffect(() => {
    if (tripMode === 'one-way') {
      setArrivalDate('');
    }
  }, [tripMode]);

  // ✅ Debounced fetch for Departing
  useEffect(() => {
    const q = departingQuery;
    if (!q || q.length < 2) {
      setDepartingSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const url = `http://127.0.0.1:5001/api/db_airports?keyword=${encodeURIComponent(q)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();
        setDepartingSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching departing airports:', e);
        setDepartingSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [departingQuery]);

  // ✅ Debounced fetch for Arrival
  useEffect(() => {
    const q = arrivalQuery;
    if (!q || q.length < 2) {
      setArrivalSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const url = `http://127.0.0.1:5001/api/db_airports?keyword=${encodeURIComponent(q)}&limit=25`;
        const res = await fetch(url);
        const data = await res.json();
        setArrivalSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Error fetching arrival airports:', e);
        setArrivalSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [arrivalQuery]);

  // --- Helpers ---
  const groupAirportsByCity = (airports) => {
    const groups = {};
    const result = [];
    airports.forEach(airport => {
      const city = airport.location_label || 'Other';
      if (!groups[city]) groups[city] = [];
      groups[city].push(airport);
    });
    Object.keys(groups).forEach(city => {
      const items = groups[city];
      if (items.length > 1) {
        result.push({ type: 'header', label: city, items: items });
        items.forEach(item => result.push({ type: 'item', data: item, indented: true }));
      } else {
        result.push({ type: 'item', data: items[0], indented: false });
      }
    });
    return result;
  };

  // --- Handlers ---
  const handleSelectDeparting = (airport) => {
    if (!departingSelections.some(s => s.iata_code === airport.iata_code)) {
      setDepartingSelections([...departingSelections, airport]);
    }
    setDepartingQuery('');
    departInputRef.current?.focus();
  };

  const handleSelectDepartingGroup = (groupAirports) => {
    const newToAdd = groupAirports.filter(
      (a) => !departingSelections.some((s) => s.iata_code === a.iata_code)
    );
    if (newToAdd.length > 0) {
      setDepartingSelections([...departingSelections, ...newToAdd]);
    }
    setDepartingQuery('');
    departInputRef.current?.focus();
  };

  const handleRemoveDeparting = (code) => {
    setDepartingSelections(departingSelections.filter(s => s.iata_code !== code));
  };

  const handleSelectArrival = (airport) => {
    if (!arrivalSelections.some(s => s.iata_code === airport.iata_code)) {
      setArrivalSelections([...arrivalSelections, airport]);
    }
    setArrivalQuery('');
    arriveInputRef.current?.focus();
  };

  const handleSelectArrivalGroup = (groupAirports) => {
    const newToAdd = groupAirports.filter(
      (a) => !arrivalSelections.some((s) => s.iata_code === a.iata_code)
    );
    if (newToAdd.length > 0) {
      setArrivalSelections([...arrivalSelections, ...newToAdd]);
    }
    setArrivalQuery('');
    arriveInputRef.current?.focus();
  };

  const handleRemoveArrival = (code) => {
    setArrivalSelections(arrivalSelections.filter(s => s.iata_code !== code));
  };

  const handleToggleAllDestinations = (e) => {
    const checked = e.target.checked;
    setIsAllDestinations(checked);
    if (checked) {
      setArrivalSelections([]);
      setArrivalQuery('');
    }
  };

  const airportKey = (a) => (a && (a.id || a.iata_code)) ? (a.id || a.iata_code) : Math.random().toString(36);

  const renderDropdown = (suggestions, onSelect, onSelectGroup) => {
    const groupedItems = groupAirportsByCity(suggestions);
    return (
      <div className="places-dropdown">
        {groupedItems.map((obj, i) => {
          if (obj.type === 'header') {
            return (
              <div 
                key={`header-${i}`} 
                className="places-dropdown-group-label"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelectGroup(obj.items);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Map size={14} style={{ marginRight: 6 }}/>
                  {obj.label}
                </div>
                <span className="places-group-action">Select All</span>
              </div>
            );
          }
          const a = obj.data;
          const isIndented = obj.indented;
          return (
            <div
              key={airportKey(a)}
              className={`places-dropdown-item ${isIndented ? 'indented' : ''}`}
              onMouseDown={() => onSelect(a)}
            >
              <div className="places-dropdown-icon-wrap">
                <PlaneTakeoff size={16} className="places-dropdown-icon" />
              </div>
              <div className="places-dropdown-stack">
                <div className="places-dropdown-top">
                  <span className="places-dropdown-code">{a.iata_code || ''}</span>
                  {!isIndented && (
                    <span className="places-dropdown-city">{a.location_label || ''}</span>
                  )}
                </div>
                <div className="places-dropdown-sub">
                  {a.airport_name || ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-panel fade-in">
      <div className="headliners-section">
        <h3 className="section-title">EXPLORE PLACES</h3>

        <div className="trip-type-label">Trip Type</div>

        <div className="trip-mode-toggle" role="tablist" aria-label="Trip Mode">
          {tripOptions.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={`trip-mode-option ${tripMode === key ? 'active' : ''}`}
              onClick={() => setTripMode(key)}
              role="tab"
              aria-selected={tripMode === key}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* --- Airports Row --- */}
        <div className="places-airport-row">
          
          {/* DEPARTING FIELD */}
          <div className="places-airport-field">
            <div className="places-field-label">Departing Airport</div>
            <div className="places-input-wrap">
              <PlaneTakeoff size={18} className="places-input-icon" />
              <div className="places-input-scroll">
                {departingSelections.map((sel) => (
                  <div key={sel.iata_code} className="places-chip fade-in">
                    <span className="places-chip-text">{sel.iata_code}</span>
                    <button 
                      className="places-chip-remove" 
                      onClick={() => handleRemoveDeparting(sel.iata_code)}
                      type="button"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <input
                  ref={departInputRef}
                  type="text"
                  value={departingQuery}
                  onChange={(e) => setDepartingQuery(e.target.value)}
                  onFocus={() => setIsDepartingFocused(true)}
                  onBlur={() => setTimeout(() => setIsDepartingFocused(false), 200)}
                  placeholder={departingSelections.length > 0 ? "" : "e.g. DEN"}
                  className="places-airport-input"
                  autoComplete="off"
                />
              </div>
            </div>
            {isDepartingFocused && departingSuggestions.length > 0 && 
              renderDropdown(departingSuggestions, handleSelectDeparting, handleSelectDepartingGroup)
            }
          </div>

          {/* ARRIVAL FIELD */}
          <div className="places-airport-field">
            <div className="places-field-label">Arrival Airport</div>

            <div className={`places-input-wrap ${isAllDestinations ? 'disabled' : ''}`}>
              <PlaneLanding size={18} className="places-input-icon" />
              <div className="places-input-scroll">
                {arrivalSelections.map((sel) => (
                  <div key={sel.iata_code} className="places-chip fade-in">
                    <span className="places-chip-text">{sel.iata_code}</span>
                    <button 
                      className="places-chip-remove" 
                      onClick={() => handleRemoveArrival(sel.iata_code)}
                      type="button"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                <input
                  ref={arriveInputRef}
                  type="text"
                  value={arrivalQuery}
                  onChange={(e) => setArrivalQuery(e.target.value)}
                  onFocus={() => !isAllDestinations && setIsArrivalFocused(true)}
                  onBlur={() => setTimeout(() => setIsArrivalFocused(false), 200)}
                  placeholder={isAllDestinations ? "Anywhere" : (arrivalSelections.length > 0 ? "" : "e.g. MIA")}
                  className="places-airport-input"
                  autoComplete="off"
                  disabled={isAllDestinations}
                />
              </div>
            </div>

            {/* Right-Justified Toggle Switch */}
            <div className="places-destination-toggle-row">
              <span className="places-toggle-text">All Destinations</span>
              <label className="switch-container">
                <input
                  type="checkbox"
                  checked={isAllDestinations}
                  onChange={handleToggleAllDestinations}
                />
                <span className="switch-slider"></span>
              </label>
            </div>

            {!isAllDestinations && isArrivalFocused && arrivalSuggestions.length > 0 && 
              renderDropdown(arrivalSuggestions, handleSelectArrival, handleSelectArrivalGroup)
            }
          </div>
        </div>

        {/* --- DATES ROW --- */}
        <div className="places-airport-row">
          
          {/* DEPARTURE DATE */}
          <div className="places-airport-field">
            <div className="places-field-label">Departure Date</div>
            <div className="places-input-wrap">
              <Calendar size={18} className="places-input-icon" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="places-airport-input"
                onClick={(e) => e.target.showPicker && e.target.showPicker()} /* Open calendar on click */
              />
            </div>
          </div>

          {/* ARRIVAL DATE */}
          <div className="places-airport-field">
            <div className="places-field-label">Arrival Date</div>
            <div className={`places-input-wrap ${tripMode === 'one-way' ? 'disabled' : ''}`}>
              <Calendar size={18} className="places-input-icon" />
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="places-airport-input"
                disabled={tripMode === 'one-way'}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

const PlanView = () => (
  <div className="dashboard-panel fade-in">
    <h2>Plan Your Trip</h2>
    <p>Create and manage your travel itineraries.</p>
  </div>
);

const FriendsView = () => (
  <div className="dashboard-panel fade-in">
    <h2>Friends</h2>
    <p>See where your friends are traveling.</p>
  </div>
);

// ✅ Updated Profile View
const ProfileView = ({ userFirstName, userProfilePic }) => (
  <div className="dashboard-panel fade-in profile-container">
    {/* 1. Profile Image & Name */}
    <div className="profile-header-card">
      <div className="profile-avatar-large">
        <img
          src={`http://127.0.0.1:5001/static/profile_pics/${userProfilePic || 'default.jpg'}`}
          alt="Profile"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
        />
      </div>
      <h2 className="profile-name">{userFirstName || 'Traveler'}</h2>
    </div>

    {/* 2. Main Navigational Group */}
    <div className="profile-menu-group">
      <button className="profile-menu-item">
        <div className="profile-menu-icon-wrap"><UserPen size={20} /></div>
        <span className="profile-menu-text">Edit Profile</span>
        <ChevronRight size={18} className="profile-menu-arrow" />
      </button>

      <button className="profile-menu-item">
        <div className="profile-menu-icon-wrap"><Sparkles size={20} /></div>
        <span className="profile-menu-text">Smart Preferences</span>
        <ChevronRight size={18} className="profile-menu-arrow" />
      </button>

      <button className="profile-menu-item">
        <div className="profile-menu-icon-wrap"><Bell size={20} /></div>
        <span className="profile-menu-text">Notifications</span>
        <ChevronRight size={18} className="profile-menu-arrow" />
      </button>

      <button className="profile-menu-item">
        <div className="profile-menu-icon-wrap"><History size={20} /></div>
        <span className="profile-menu-text">History</span>
        <ChevronRight size={18} className="profile-menu-arrow" />
      </button>
    </div>

    {/* 3. Divider */}
    <hr className="profile-divider" />

    {/* 4. Settings & Logout */}
    <div className="profile-menu-group">
      <button className="profile-menu-item">
        <div className="profile-menu-icon-wrap"><Settings size={20} /></div>
        <span className="profile-menu-text">Settings</span>
        <ChevronRight size={18} className="profile-menu-arrow" />
      </button>

      <button className="profile-menu-item logout">
        <div className="profile-menu-icon-wrap"><LogOut size={20} /></div>
        <span className="profile-menu-text">Logout</span>
      </button>
    </div>
  </div>
);

function UserHome({ onNavigate, userFirstName, userProfilePic, favoriteArtists }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('home');

  const renderContent = () => {
    switch (activeView) {
      case 'events': return <EventsView />;
      case 'places': return <PlacesView />;
      case 'plan': return <PlanView />;
      case 'friends': return <FriendsView />;
      case 'profile': return <ProfileView userFirstName={userFirstName} userProfilePic={userProfilePic} />;
      default: return <HomeView favoriteArtists={favoriteArtists} />;
    }
  };

  return (
    <div className="user-home-root">
      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <img
            src="/logos/Logo5.png"
            alt="SetJet"
            className="sidebar-logo"
            onClick={() => setActiveView('home')}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="sidebar-search">
          <Search size={18} />
          <input type="text" placeholder="Search" />
        </div>

        <div className="sidebar-section">
          <button
            onClick={() => setActiveView('home')}
            className={activeView === 'home' ? 'active' : ''}
          >
            <Home size={20} />
            <span>Home</span>
          </button>
        </div>

        <div className="sidebar-section">
          <h4>Explore</h4>

          <button onClick={() => onNavigate('search')}>
            <PlaneTakeoff size={20} />
            <span>Flights</span>
          </button>

          <button
            onClick={() => setActiveView('events')}
            className={activeView === 'events' ? 'active' : ''}
          >
            <Calendar size={20} />
            <span>Events</span>
          </button>

          <button
            onClick={() => setActiveView('places')}
            className={activeView === 'places' ? 'active' : ''}
          >
            <MapPin size={20} />
            <span>Places</span>
          </button>
        </div>

        <div className="sidebar-section">
          <h4>Tools</h4>

          <button
            onClick={() => setActiveView('plan')}
            className={activeView === 'plan' ? 'active' : ''}
          >
            <Map size={20} />
            <span>Plan</span>
          </button>

          <button
            onClick={() => setActiveView('friends')}
            className={activeView === 'friends' ? 'active' : ''}
          >
            <Users size={20} />
            <span>Friends</span>
          </button>
        </div>
      </aside>

      <div className={`main-wrapper ${collapsed ? 'collapsed' : ''}`}>
        <header className="main-header">
          <div className="header-left">
            <button
              className="header-toggle-btn"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
            </button>
          </div>

          <div className="header-center">
            <div className="places-input-wrap header-airport-search">
              <Search size={18} className="places-input-icon" />
              <input
                type="text"
                placeholder="Artists, venues..."
                className="places-airport-input"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="header-right">
            <img
              src={`http://127.0.0.1:5001/static/profile_pics/${userProfilePic || 'default.jpg'}`}
              alt="Profile"
              className={`header-profile-pic ${activeView === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveView('profile')}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
            />
          </div>
        </header>

        <main className="user-home-content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default UserHome;