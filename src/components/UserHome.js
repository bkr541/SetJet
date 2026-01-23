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
  UserPen,
  Sparkles,
  Bell,
  History,
  ChevronRight,
  ArrowLeft,
  Check,
  Camera,
  AtSign, // Added for Username
  Type,
  UserRound,
  MicVocal
} from 'lucide-react';
import './UserHome.css';

// --- Dashboard Sub-Views ---
const HomeView = ({ favoriteArtists, favoriteDestinations }) => {
  // 1. New State for Tour Counts
  const [tourCounts, setTourCounts] = useState({});

  // 2. Fetch Tour Data on Mount
  useEffect(() => {
    const fetchTours = async () => {
      try {
        const res = await fetch('http://127.0.0.1:5001/api/edmtrain/tours?includeElectronic=true&includeOther=false');
        if (!res.ok) return;
        
        const json = await res.json();
        
        // The map is deeply nested in: data.artistIdEventCountMap
        if (json.data && json.data.artistIdEventCountMap) {
          setTourCounts(json.data.artistIdEventCountMap);
        }
      } catch (err) {
        console.error("Failed to fetch tour counts:", err);
      }
    };

    fetchTours();
  }, []);

  // Demo destinations fallback
  const demoDestinations = [
    { id: 'chicago', city: 'Chicago', name: 'Chicago' },
  ];

  const destinations =
    Array.isArray(favoriteDestinations) && favoriteDestinations.length > 0
      ? favoriteDestinations
      : demoDestinations;

  return (
    <div className="dashboard-panel fade-in">
      {/* HEADLINERS SECTION */}
      <div className="headliners-section">
        <h3 className="section-title">YOUR HEADLINERS</h3>
        <div className="headliners-scroll">
          {favoriteArtists && favoriteArtists.length > 0 ? (
            /* ⚠️ FIXED: Switched to curly braces { } to allow variable definition */
            favoriteArtists.map((artist, index) => {
              
              // 1. Define the count variable here
              const count = artist.edmtrain_id ? tourCounts[artist.edmtrain_id] : 0;
              
              // 2. Explicitly return the JSX
              return (
                <div key={index} className="headliner-card">
                  <div
                    className="headliner-image-wrapper"
                    style={{
                      backgroundImage: `url(${artist.image || "/artifacts/defaultprofileillenium.png"})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat'
                    }}
                  >
                    <div className="headliner-overlay"></div>
                    <span className="headliner-name">{artist.name}</span>
                    {count > 0 && (
                    <div className="headliner-event-count fade-in">
                      {count} {count === 1 ? 'Event' : 'Events'}
                    </div>
                  )}
                  </div>

                  
                </div>
              );
            })
          ) : (
            <p className="no-data-msg">No favorite artists added yet.</p>
          )}
        </div>
      </div>

      {/* YOUR DESTINATIONS (poster style) */}
      <div className="destinations-section">
        <h3 className="section-title">YOUR DESTINATIONS</h3>

        <div className="destinations-scroll">
          {destinations.map((d, idx) => {
            const raw =
              d?.city ||
              d?.location ||
              d?.name ||
              d?.title ||
              d?.location_label ||
              d?.label ||
              '';

            // Extract city name (handle "City, State")
            const cityName = (raw || 'Unknown').split(',')[0].trim() || 'Unknown';

            // Construct image path: /artifacts/cities/<lowercase_city_nospaces>.png
            const safeName = cityName.toLowerCase().replace(/\s+/g, '');
            const imgPath = `/artifacts/cities/${safeName}.png`;

            const key = d?.id || d?.location_id || d?.iata_code || `${cityName}-${idx}`;

            return (
              <button
                key={key}
                type="button"
                className="destination-card destination-poster"
                style={{
                  backgroundImage: `url(${imgPath})`
                }}
                aria-label={cityName}
              >
                <div className="destination-poster-overlay" />
                <div className="destination-poster-title">{cityName}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EventsView = () => (
  <div className="dashboard-panel fade-in">
    <h2>Events</h2>
    <p>Discover upcoming events and festivals.</p>
  </div>
);

const ArtistsView = ({ favoriteArtists }) => (
  <div className="dashboard-panel fade-in">
    <h2>Artists</h2>
    <p>Browse and manage your artists.</p>

    <div style={{ marginTop: 16 }}>
      {favoriteArtists && favoriteArtists.length > 0 ? (
        <ul style={{ paddingLeft: 18, color: '#475569', fontWeight: 600 }}>
          {favoriteArtists.map((a, i) => (
            <li key={`${a.name}-${i}`} style={{ marginBottom: 6 }}>
              {a.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="no-data-msg">No artists yet.</p>
      )}
    </div>
  </div>
);

const PlacesView = () => {
  const [tripMode, setTripMode] = useState('one-way');
  const [departingQuery, setDepartingQuery] = useState('');
  const [arrivalQuery, setArrivalQuery] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [departingSelections, setDepartingSelections] = useState([]);
  const [arrivalSelections, setArrivalSelections] = useState([]);
  const [isAllDestinations, setIsAllDestinations] = useState(false);
  const [departingSuggestions, setDepartingSuggestions] = useState([]);
  const [arrivalSuggestions, setArrivalSuggestions] = useState([]);
  const [isDepartingFocused, setIsDepartingFocused] = useState(false);
  const [isArrivalFocused, setIsArrivalFocused] = useState(false);
  const departInputRef = useRef(null);
  const arriveInputRef = useRef(null);

  const tripOptions = [
    { key: 'one-way', label: 'One Way', Icon: ArrowRight },
    { key: 'round-trip', label: 'Round Trip', Icon: ArrowLeftRight },
    { key: 'day-trip', label: 'Day Trip', Icon: Sunrise },
    { key: 'trip-planner', label: 'Trip Planner', Icon: Calendar },
  ];

  useEffect(() => {
    if (tripMode === 'one-way') setArrivalDate('');
  }, [tripMode]);

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
        console.error(e);
        setDepartingSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [departingQuery]);

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
        console.error(e);
        setArrivalSuggestions([]);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [arrivalQuery]);

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

  const handleSelectDeparting = (airport) => {
    if (!departingSelections.some(s => s.iata_code === airport.iata_code)) {
      setDepartingSelections([...departingSelections, airport]);
    }
    setDepartingQuery('');
    departInputRef.current?.focus();
  };
  const handleSelectDepartingGroup = (groupAirports) => {
    const newToAdd = groupAirports.filter(a => !departingSelections.some(s => s.iata_code === a.iata_code));
    if (newToAdd.length > 0) setDepartingSelections([...departingSelections, ...newToAdd]);
    setDepartingQuery('');
    departInputRef.current?.focus();
  };
  const handleRemoveDeparting = (code) => setDepartingSelections(departingSelections.filter(s => s.iata_code !== code));

  const handleSelectArrival = (airport) => {
    if (!arrivalSelections.some(s => s.iata_code === airport.iata_code)) {
      setArrivalSelections([...arrivalSelections, airport]);
    }
    setArrivalQuery('');
    arriveInputRef.current?.focus();
  };
  const handleSelectArrivalGroup = (groupAirports) => {
    const newToAdd = groupAirports.filter(a => !arrivalSelections.some(s => s.iata_code === a.iata_code));
    if (newToAdd.length > 0) setArrivalSelections([...arrivalSelections, ...newToAdd]);
    setArrivalQuery('');
    arriveInputRef.current?.focus();
  };
  const handleRemoveArrival = (code) => setArrivalSelections(arrivalSelections.filter(s => s.iata_code !== code));

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
                onMouseDown={(e) => { e.preventDefault(); onSelectGroup(obj.items); }}
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
                  {!isIndented && <span className="places-dropdown-city">{a.location_label || ''}</span>}
                </div>
                <div className="places-dropdown-sub">{a.airport_name || ''}</div>
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
        <div className="trip-mode-toggle" role="tablist">
          {tripOptions.map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              className={`trip-mode-option ${tripMode === key ? 'active' : ''}`}
              onClick={() => setTripMode(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <div className="places-airport-row">
          <div className="places-airport-field">
            <div className="places-field-label">Departing Airport</div>
            <div className="places-input-wrap">
              <PlaneTakeoff size={18} className="places-input-icon" />
              <div className="places-input-scroll">
                {departingSelections.map((sel) => (
                  <div key={sel.iata_code} className="places-chip fade-in">
                    <span className="places-chip-text">{sel.iata_code}</span>
                    <button className="places-chip-remove" onClick={() => handleRemoveDeparting(sel.iata_code)}><X size={12} /></button>
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
            {isDepartingFocused && departingSuggestions.length > 0 && renderDropdown(departingSuggestions, handleSelectDeparting, handleSelectDepartingGroup)}
          </div>

          <div className="places-airport-field">
            <div className="places-field-label">Arrival Airport</div>
            <div className={`places-input-wrap ${isAllDestinations ? 'disabled' : ''}`}>
              <PlaneLanding size={18} className="places-input-icon" />
              <div className="places-input-scroll">
                {arrivalSelections.map((sel) => (
                  <div key={sel.iata_code} className="places-chip fade-in">
                    <span className="places-chip-text">{sel.iata_code}</span>
                    <button className="places-chip-remove" onClick={() => handleRemoveArrival(sel.iata_code)}><X size={12} /></button>
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
            <div className="places-destination-toggle-row">
              <span className="places-toggle-text">All Destinations</span>
              <label className="switch-container">
                <input type="checkbox" checked={isAllDestinations} onChange={handleToggleAllDestinations} />
                <span className="switch-slider"></span>
              </label>
            </div>
            {!isAllDestinations && isArrivalFocused && arrivalSuggestions.length > 0 && renderDropdown(arrivalSuggestions, handleSelectArrival, handleSelectArrivalGroup)}
          </div>
        </div>

        <div className="places-airport-row">
          <div className="places-airport-field">
            <div className="places-field-label">Departure Date</div>
            <div className="places-input-wrap">
              <Calendar size={18} className="places-input-icon" />
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="places-airport-input"
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
              />
            </div>
          </div>
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

// ✅ Profile Main View
const ProfileView = ({ userFirstName, userProfilePic, onEditProfile }) => (
  <div className="dashboard-panel fade-in profile-container">
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

    <div className="profile-menu-group">
      <button className="profile-menu-item" onClick={onEditProfile}>
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

    <hr className="profile-divider" />

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

// ✅ NEW: Edit Profile View (Updated: Username field instead of Phone)
const EditProfileView = ({ userInfo, onBack, onSaved }) => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    dob: '' // mm/dd/yyyy (matches Onboarding_1)
  });

  const [initialData, setInitialData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [focusedField, setFocusedField] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userInfo) return;

    const next = {
      firstName: userInfo.first_name || '',
      lastName: userInfo.last_name || '',
      username: userInfo.username || '',
      dob: userInfo.dob || ''
    };

    setFormData(next);
    setInitialData(next);
    setSelectedFile(null);
    setPreviewImage(null);
  }, [userInfo]);

  const isDirty = () => {
    if (!initialData) return false;
    const changed =
      (formData.firstName || '') !== (initialData.firstName || '') ||
      (formData.lastName || '') !== (initialData.lastName || '') ||
      (formData.username || '') !== (initialData.username || '') ||
      (formData.dob || '') !== (initialData.dob || '');
    return changed || !!selectedFile;
  };

  const handleProfilePicClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const handleSave = async () => {
    if (!isDirty() || isSaving) return;

    const email = localStorage.getItem('current_email');
    if (!email) return;

    setIsSaving(true);

    try {
      const payload = new FormData();
      payload.append('email', email);

      payload.append('username', formData.username || '');
      payload.append('dob', formData.dob || '');
      payload.append('first_name', formData.firstName || '');
      payload.append('last_name', formData.lastName || '');

      if (selectedFile) {
        payload.append('profile_photo', selectedFile);
      }

      const res = await fetch('http://127.0.0.1:5001/api/update_profile', {
        method: 'POST',
        body: payload
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Profile update failed:', data);
        return;
      }

      if (typeof onSaved === 'function') await onSaved();
      if (typeof onBack === 'function') onBack();
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const profileSrc = previewImage
    ? previewImage
    : `http://127.0.0.1:5001/static/profile_pics/${userInfo?.image_file || 'default.jpg'}`;

  return (
    <div className="dashboard-panel fade-in">
      <div className="edit-profile-container">
        <div className="edit-profile-header">
          <button className="edit-profile-nav-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <h2 className="edit-profile-title">Edit Profile</h2>
          <button
            className={`edit-profile-nav-btn save ${(!isDirty() || isSaving) ? 'disabled' : ''}`}
            onClick={handleSave}
            disabled={!isDirty() || isSaving}
            aria-disabled={!isDirty() || isSaving}
            title={!isDirty() ? 'No changes to save' : 'Save changes'}
          >
            <Check size={24} />
          </button>
        </div>

        <div className="edit-profile-content">
          <div className="edit-profile-pic-section">
            <div
              className="edit-profile-pic-wrapper clickable"
              onClick={handleProfilePicClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleProfilePicClick(); }}
            >
              <img
                src={profileSrc}
                alt="Profile"
                className="edit-profile-pic-img"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="edit-profile-file-input"
                onChange={handleFileChange}
              />
            </div>
            <p className="edit-profile-pic-hint">Tap to change photo</p>
          </div>

          <div className="edit-profile-fields">
            <div className="form-row">
              <div className="places-airport-field">
                <div className="places-field-label">First Name</div>
                <div className={`places-input-wrap ${focusedField === 'firstName' ? 'focused' : ''}`}>
                  <UserRound size={18} className="places-input-icon" />
                  <input
                    type="text"
                    className="places-airport-input"
                    placeholder="e.g. Jane"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    onFocus={() => setFocusedField('firstName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              <div className="places-airport-field">
                <div className="places-field-label">Last Name</div>
                <div className={`places-input-wrap ${focusedField === 'lastName' ? 'focused' : ''}`}>
                  <UserRound size={18} className="places-input-icon" />
                  <input
                    type="text"
                    className="places-airport-input"
                    placeholder="e.g. Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="places-airport-field">
                <div className="places-field-label">Username</div>
                <div className={`places-input-wrap ${focusedField === 'username' ? 'focused' : ''}`}>
                  <AtSign size={18} className="places-input-icon" />
                  <input
                    type="text"
                    className="places-airport-input"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              <div className="places-airport-field">
                <div className="places-field-label">Date of Birth</div>
                <div className={`places-input-wrap ${focusedField === 'dob' ? 'focused' : ''}`}>
                  <Calendar size={18} className="places-input-icon" />
                  <input
                    type="text"
                    className="places-airport-input"
                    placeholder="mm/dd/yyyy"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    onFocus={() => setFocusedField('dob')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

function UserHome({ onNavigate, userFirstName, userProfilePic, favoriteArtists, favoriteDestinations }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('home');
  // State to hold fetched destinations from backend (which override/supplement props)
  const [userDestinations, setUserDestinations] = useState(favoriteDestinations || []);

  const MOBILE_BP = 768; // pick your breakpoint
  const isMobile = () => window.innerWidth <= MOBILE_BP;
  useEffect(() => {
    // start collapsed on mobile
    if (isMobile()) setCollapsed(true);

    const onResize = () => {
      // if you enter mobile, collapse; if you leave mobile, expand (optional)
      if (isMobile()) setCollapsed(true);
      // else setCollapsed(false); // uncomment if you want it to auto-open on desktop
    };

      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
  }, []);


  

// ✅ (2) Close the sidebar after any sidebar navigation on mobile
const handleNav = (action) => {
  if (typeof action === 'function') action();
  if (isMobile()) setCollapsed(true);
};

const [userInfo, setUserInfo] = useState({
    first_name: userFirstName || '',
    last_name: '',
    username: '',
    dob: '',
    image_file: userProfilePic || 'default.jpg'
  });

  const refreshUserInfo = async () => {
    const email = localStorage.getItem('current_email');
    if (!email) return;

    try {
      const res = await fetch('http://127.0.0.1:5001/api/get_user_info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Failed to refresh user info:', data);
        return;
      }

      setUserInfo({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        username: data.username || '',
        dob: data.dob || '',
        image_file: data.image_file || 'default.jpg'
      });

      // Update destinations state if returned from API
      if (data.favorite_destinations && Array.isArray(data.favorite_destinations)) {
        setUserDestinations(data.favorite_destinations);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  useEffect(() => {
    refreshUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUserInfo((prev) => ({
      ...prev,
      first_name: userFirstName || prev.first_name,
      image_file: userProfilePic || prev.image_file
    }));
  }, [userFirstName, userProfilePic]);

  const renderContent = () => {
    switch (activeView) {
      case 'events': return <EventsView />;
      case 'places': return <PlacesView />;
      case 'artists': return <ArtistsView favoriteArtists={favoriteArtists} />;
      case 'plan': return <PlanView />;
      case 'friends': return <FriendsView />;
      case 'profile':
        return <ProfileView
          userFirstName={userInfo.first_name}
          userProfilePic={userInfo.image_file}
          onEditProfile={() => {
            refreshUserInfo();
            setActiveView('edit-profile');
          }}
        />;
      case 'edit-profile':
        return <EditProfileView
          userInfo={userInfo}
          onBack={() => setActiveView('profile')}
          onSaved={refreshUserInfo}
        />;
      default:
        return <HomeView favoriteArtists={favoriteArtists} favoriteDestinations={userDestinations} />;
    }
  };

  return (
    <div className="user-home-root">
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <img
            src="/logos/Logo5.png"
            alt="SetJet"
            className="sidebar-logo"
            onClick={() => handleNav(() => setActiveView('home'))}
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="sidebar-search">
          <Search size={18} />
          <input type="text" placeholder="Search" />
        </div>

        <div className="sidebar-section">
          <button onClick={() => handleNav(() => setActiveView('home'))} className={activeView === 'home' ? 'active' : ''}>
            <Home size={20} />
            <span>Home</span>
          </button>
        </div>

        <div className="sidebar-section">
          <h4>Explore</h4>

          <button onClick={() => handleNav(() => onNavigate('search'))}>
            <PlaneTakeoff size={20} />
            <span>Flights</span>
          </button>

          <button onClick={() => handleNav(() => setActiveView('events'))} className={activeView === 'events' ? 'active' : ''}>
            <Calendar size={20} />
            <span>Events</span>
          </button>

          <button onClick={() => handleNav(() => setActiveView('places'))} className={activeView === 'places' ? 'active' : ''}>
            <MapPin size={20} />
            <span>Places</span>
          </button>

          {/* ✅ NEW: Artists (below Places) */}
          <button onClick={() => handleNav(() => setActiveView('artists'))} className={activeView === 'artists' ? 'active' : ''}>
            <MicVocal size={20} />
            <span>Artists</span>
          </button>
        </div>

        <div className="sidebar-section">
          <h4>Tools</h4>
          <button onClick={() => handleNav(() => setActiveView('plan'))} className={activeView === 'plan' ? 'active' : ''}>
            <Map size={20} />
            <span>Plan</span>
          </button>
          <button onClick={() => handleNav(() => setActiveView('friends'))} className={activeView === 'friends' ? 'active' : ''}>
            <Users size={20} />
            <span>Friends</span>
          </button>
        </div>
      </aside>


{/* ✅ (3) Mobile overlay: tap outside to close the sidebar */}
{!collapsed && isMobile() && (
  <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />
)}

      <div className={`main-wrapper ${collapsed ? 'collapsed' : ''}`}>
        <header className="main-header">
          <div className="header-left">
            <button className="header-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
            </button>
          </div>

          <div className="header-center">
            <div className="places-input-wrap header-airport-search">
              <Search size={18} className="places-input-icon" />
              <input type="text" placeholder="Artists, venues..." className="places-airport-input" autoComplete="off" />
            </div>
          </div>

          <div className="header-right">
            <img
              src={`http://127.0.0.1:5001/static/profile_pics/${userProfilePic || 'default.jpg'}`}
              alt="Profile"
              className={`header-profile-pic ${activeView === 'profile' || activeView === 'edit-profile' ? 'active' : ''}`}
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