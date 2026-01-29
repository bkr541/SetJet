import React, { useState, useEffect, useRef, forwardRef } from 'react';
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
  ChevronLeft,
  ArrowLeft,
  Check,
  Camera,
  AtSign,
  Type,
  UserRound,
  MicVocal,
  Heart,
  TowerControl,
  CircleUserRound,
  CalendarDays,
  Plane,
  CalendarCheck,
  BookOpen,
  LayoutList,
  Calendar as CalendarIcon,
  Ticket,
  PartyPopper,
  UserStar,
  Trash
} from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isWithinInterval, startOfDay } from 'date-fns';
import './UserHome.css';
import SearchForm from './SearchForm';
import FlightResults from './FlightResults';

// --- CONFIGURATION ---
const API_BASE_URL = ""; 

// --- BLACKOUT DATES CONFIGURATION ---
const BLACKOUT_RANGES = [
  // 2025
  { start: "2025-01-01", end: "2025-01-01" },
  { start: "2025-01-04", end: "2025-01-05" },
  { start: "2025-01-16", end: "2025-01-17" },
  { start: "2025-01-20", end: "2025-01-20" },
  { start: "2025-02-13", end: "2025-02-14" },
  { start: "2025-02-17", end: "2025-02-17" },
  { start: "2025-03-14", end: "2025-03-16" },
  { start: "2025-03-21", end: "2025-03-23" },
  { start: "2025-03-28", end: "2025-03-30" },
  { start: "2025-04-04", end: "2025-04-06" },
  { start: "2025-04-11", end: "2025-04-13" },
  { start: "2025-04-18", end: "2025-04-21" },
  { start: "2025-05-22", end: "2025-05-23" },
  { start: "2025-05-26", end: "2025-05-26" },
  { start: "2025-06-22", end: "2025-06-22" },
  { start: "2025-06-26", end: "2025-06-29" },
  { start: "2025-07-03", end: "2025-07-07" },
  { start: "2025-08-28", end: "2025-08-29" },
  { start: "2025-09-01", end: "2025-09-01" },
  { start: "2025-10-09", end: "2025-10-10" },
  { start: "2025-10-12", end: "2025-10-13" },
  { start: "2025-11-25", end: "2025-11-26" },
  { start: "2025-11-29", end: "2025-11-30" },
  { start: "2025-12-01", end: "2025-12-01" },
  { start: "2025-12-20", end: "2025-12-23" },
  { start: "2025-12-26", end: "2025-12-31" },
  // 2026
  { start: "2026-01-01", end: "2026-01-01" },
  { start: "2026-01-03", end: "2026-01-04" },
  { start: "2026-01-15", end: "2026-01-16" },
  { start: "2026-01-19", end: "2026-01-19" },
  { start: "2026-02-12", end: "2026-02-13" },
  { start: "2026-02-16", end: "2026-02-16" },
  { start: "2026-03-13", end: "2026-03-15" },
  { start: "2026-03-20", end: "2026-03-22" },
  { start: "2026-03-27", end: "2026-03-29" },
  { start: "2026-04-03", end: "2026-04-06" },
  { start: "2026-04-10", end: "2026-04-12" },
  { start: "2026-05-21", end: "2026-05-22" },
  { start: "2026-05-25", end: "2026-05-25" },
  { start: "2026-06-25", end: "2026-06-28" },
  { start: "2026-07-02", end: "2026-07-06" },
  { start: "2026-09-03", end: "2026-09-04" },
  { start: "2026-09-07", end: "2026-09-07" },
  { start: "2026-10-08", end: "2026-10-09" },
  { start: "2026-10-11", end: "2026-10-12" },
  { start: "2026-11-24", end: "2026-11-25" },
  { start: "2026-11-28", end: "2026-11-30" },
  { start: "2026-12-19", end: "2026-12-24" },
  { start: "2026-12-26", end: "2026-12-31" },
  // 2027
  { start: "2027-01-01", end: "2027-01-03" },
  { start: "2027-01-14", end: "2027-01-15" },
  { start: "2027-01-18", end: "2027-01-18" },
  { start: "2027-02-11", end: "2027-02-12" },
  { start: "2027-02-15", end: "2027-02-15" },
  { start: "2027-03-12", end: "2027-03-14" },
  { start: "2027-03-19", end: "2027-03-21" },
  { start: "2027-03-26", end: "2027-03-29" },
  { start: "2027-04-02", end: "2027-04-04" },
];

const isBlackoutDate = (date) => {
  const checkDate = startOfDay(date);
  return BLACKOUT_RANGES.some(({ start, end }) =>
    isWithinInterval(checkDate, {
      start: parseISO(start),
      end: parseISO(end)
    })
  );
};

// --- Custom Calendar Input for Plan View ---
const PlacesCustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
  <div className="places-input-wrap" onClick={onClick} ref={ref} style={{ cursor: 'pointer' }}>
    <Calendar size={18} className="places-input-icon" />
    <span className={`places-date-text ${!value ? 'placeholder' : ''}`}>
      {value || placeholder}
    </span>
  </div>
));

// --- Calendar Legend ---
const CalendarLegend = () => (
  <div className="calendar-legend">
    <span className="legend-chip">
      <span className="legend-dot"></span>
      <span className="legend-text">Blackout Date</span>
    </span>
  </div>
);

// Smart Image Component
const EventImage = ({ link, alt, className, style, mode = "background" }) => {
  const [src, setSrc] = useState("/artifacts/defaultevent.png");
  const [isVisible, setIsVisible] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || !link) return;

    let isMounted = true;

    const fetchImage = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/edmtrain/event-image?link=${encodeURIComponent(link)}`
        );
        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data.image) setSrc(data.image);
      } catch (err) {
        console.error("Failed to load event image", err);
      }
    };

    fetchImage();
    return () => { isMounted = false; };
  }, [isVisible, link]);

  const baseStyles =
    mode === "thumbnail"
      ? {
          width: 84,
          height: 84,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
        }
      : {
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
        };

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      className={className}
      style={{
        objectFit: "cover",
        display: "block",
        flexShrink: 0,
        transition: "opacity 0.3s ease-in-out",
        ...baseStyles,
        ...style
      }}
    />
  );
};

// --- Itinerary View ---
const ItineraryView = () => {
  const [viewMode, setViewMode] = useState('calendar'); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [itineraryData, setItineraryData] = useState({ events: [], flights: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchItinerary = async () => {
      const email = localStorage.getItem('current_email');
      if (!email) return;
      
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/user_itinerary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        if (res.ok) {
           const data = await res.json();
           setItineraryData({
            events: data.events || [],
            flights: data.flights || []
          });
        }
      } catch (err) {
        console.error("Failed to load itinerary", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItinerary();
  }, []);

  const getDataForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = itineraryData.events.filter(e => e.date === dateStr);
    const dayFlights = itineraryData.flights.filter(f => f.date === dateStr);
    const isBlackout = isBlackoutDate(date);
    return { dayEvents, dayFlights, isBlackout };
  };

  const normalizeSnapshot = (snap) => {
    if (!snap) return null;
    if (typeof snap === 'string') {
      try { return JSON.parse(snap); } catch { return null; }
    }
    return snap;
  };

  const getEventDisplayTitle = (evt) => {
    const snap = normalizeSnapshot(evt?.snapshot_json ?? evt?.snapshotJson ?? evt?.snapshot ?? null);

    const artistName =
      snap?.artist?.name ||
      snap?.artistName ||
      (Array.isArray(snap?.artistList) ? snap.artistList?.[0]?.name : null) ||
      (Array.isArray(snap?.artists) ? snap.artists?.[0]?.name : null) ||
      null;

    const eventName =
      snap?.name ||
      snap?.event?.name ||
      snap?.eventName ||
      evt?.title ||
      null;

    if (artistName && eventName) return `${artistName} • ${eventName}`;
    return artistName || eventName || evt?.title || 'Event';
  };

  const renderDayContents = (day, date) => {
    const { dayEvents, dayFlights, isBlackout } = getDataForDate(date);
    const hasEvent = dayEvents.length > 0;
    const hasFlight = dayFlights.length > 0;

    return (
      <div className="custom-calendar-day">
        <span>{day}</span>
        <div className="day-dots">
          {isBlackout && <span className="dot blackout" title="Blackout Date" />}
          {hasFlight && <span className="dot flight" title="Flight" />}
          {hasEvent && <span className="dot event" title="Event" />}
        </div>
      </div>
    );
  };

  const renderTimelineDays = () => {
    const days = [];
    for (let i = -14; i <= 14; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    return (
      <div className="timeline-days-scroll">
        {days.map((d, i) => {
          const isSelected = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const { dayEvents, dayFlights, isBlackout } = getDataForDate(d);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;
          
          return (
            <button 
              key={i} 
              className={`timeline-day-item ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(d)}
            >
              <span className="timeline-day-name" style={isWeekend ? { color: "#ef4444" } : undefined}>{format(d, 'EEE')}</span>
              <span className="timeline-day-num">{format(d, 'd')}</span>
              <div className="timeline-dots">
                 {isBlackout && <span className="dot blackout" title="Blackout Date" />}
                 {dayFlights.length > 0 && <span className="dot flight" title="Flight" />}
                 {dayEvents.length > 0 && <span className="dot event" title="Event" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  const renderTimelineDetails = () => {
    const { dayEvents, dayFlights, isBlackout } = getDataForDate(selectedDate);
    const nothingScheduled = dayEvents.length === 0 && dayFlights.length === 0 && !isBlackout;

    return (
      <div className="timeline-details-list fade-in">
        <h3 className="timeline-date-header">
          {format(selectedDate, 'EEEE, MMMM do')}
        </h3>

        {isBlackout && (
           <div className="timeline-card blackout">
             <div className="timeline-time">ALL DAY</div>
             <div className="timeline-line"></div>
             <div className="timeline-card-content">
               <div className="timeline-card-title">Blackout Date</div>
               <div className="timeline-card-sub">GoWild Pass not eligible today</div>
             </div>
           </div>
        )}

        {dayFlights.map((flight, i) => (
          <div key={`f-${i}`} className="timeline-card flight">
            <div className="timeline-time">{flight.time}</div>
            <div className="timeline-line"></div>
            <div className="timeline-card-content">
              <div className="timeline-card-tag">Flight</div>
              <div className="timeline-card-title">{flight.title}</div>
              <div className="timeline-card-sub">{flight.subtitle}</div>
            </div>
          </div>
        ))}

        {dayEvents.map((evt, i) => (
          <div key={`e-${i}`} className="timeline-card event">
            <div className="timeline-time">{evt.time}</div>
            <div className="timeline-line"></div>
            <div className="timeline-card-content">
              <div className="timeline-card-tag">Event</div>
              <div className="timeline-card-title">{getEventDisplayTitle(evt)}</div>
              <div className="timeline-card-sub">Artist Event</div>
            </div>
          </div>
        ))}

        {nothingScheduled && (
          <div className="empty-state">
            <p>No plans for this day.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="dashboard-panel fade-in">
      <div className="itinerary-header">
        <h2 className="section-title" style={{ margin: 0 }}>ITINERARY</h2>
        
        <div className="view-toggle">
          <button 
            className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
          <button 
            className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <LayoutList size={16} /> Timeline
          </button>
        </div>
      </div>

      {loading && <div className="loading-message">Loading itinerary...</div>}

      {!loading && viewMode === 'calendar' && (
        <div className="itinerary-calendar-wrapper fade-in">
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            inline
            calendarClassName="large-itinerary-calendar"
            renderCustomHeader={({
              date,
              decreaseMonth,
              increaseMonth
            }) => (
              <div className="itinerary-calendar-header">
                <div 
                  className="itinerary-calendar-header-top" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <button className="calendar-nav-btn" onClick={decreaseMonth} aria-label="Previous Month">
                    <ChevronLeft size={18} />
                  </button>

                  <div className="itinerary-month-text">
                    {format(date, 'MMMM yyyy')}
                  </div>

                  <button className="calendar-nav-btn" onClick={increaseMonth} aria-label="Next Month">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="calendar-legend-row" style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', gap: '16px' }}>
                  <div className="legend-item"><span className="dot blackout"/> Blackout</div>
                  <div className="legend-item"><span className="dot flight"/> Flight</div>
                  <div className="legend-item"><span className="dot event"/> Event</div>
                </div>
              </div>
            )}
            renderDayContents={renderDayContents}
          />

          <div style={{ marginTop: '24px' }}>
            {renderTimelineDetails()}
          </div>
        </div>
      )}

      {!loading && viewMode === 'timeline' && (
        <div className="itinerary-timeline-wrapper fade-in">
          <div className="timeline-month-label">
             {format(selectedDate, 'MMMM yyyy')}
          </div>
          
          {renderTimelineDays()}
          {renderTimelineDetails()}
        </div>
      )}
    </div>
  );
};

// --- Artist Details View ---
const ArtistDetailsView = ({ artist, onBack, isFavorite, onToggleFavorite, eventsCacheByArtistId, setEventsCacheByArtistId, onEventClick }) => {
  const [activeTab, setActiveTab] = useState('Upcoming Sets');
  const [artistEvents, setArtistEvents] = useState([]);
  
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  const formatEventDate = (dateStr) => {
    if (!dateStr) return "TBA";
    const d = new Date(String(dateStr) + "T00:00:00");
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatEventDateParts = (dateStr) => {
    if (!dateStr) return { day: "--", month: "TBA" };
    const d = new Date(String(dateStr) + "T00:00:00");
    if (Number.isNaN(d.getTime())) return { day: "--", month: "TBA" };
    const day = String(d.getDate());
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return { day, month };
  };

  const sortedArtistEvents = (() => {
    const base = Array.isArray(artistEvents) ? [...artistEvents] : [];
    const getTime = (e) => {
      const ds = e?.date;
      const msFromDate = ds ? Date.parse(String(ds) + "T00:00:00") : NaN;
      if (Number.isFinite(msFromDate)) return msFromDate;
      const t = e?.startTime;
      const msFromStart = t ? Date.parse(t) : NaN;
      if (Number.isFinite(msFromStart)) return msFromStart;
      return Number.POSITIVE_INFINITY;
    };
    base.sort((a, b) => getTime(a) - getTime(b));
    return base;
  })();

  useEffect(() => {
    if (activeTab !== 'Upcoming Sets') return;
    const edmtrainId = artist?.edmtrain_id;
    if (!edmtrainId) {
      setArtistEvents([]);
      setEventsError('No EDMTrain artist ID found for this artist.');
      return;
    }

    const cacheKey = String(edmtrainId);
    const cached = eventsCacheByArtistId?.[cacheKey];
    const TTL_MS = 10 * 60 * 1000; 

    if (cached && Array.isArray(cached.data)) {
      const isFresh = !cached.fetchedAt || (Date.now() - cached.fetchedAt) < TTL_MS;
      if (isFresh) {
        setArtistEvents(cached.data);
        setEventsError(null);
        setEventsLoading(false);
        return;
      }
    }

    let cancelled = false;
    const fetchEvents = async () => {
      try {
        setEventsLoading(true);
        setEventsError(null);
        const url = `${API_BASE_URL}/api/edmtrain/events/artist?artistIds=${encodeURIComponent(edmtrainId)}`;
        const res = await fetch(url);
        const json = await res.json();
        const events = Array.isArray(json?.data) ? json.data : [];
        if (!cancelled) {
          setArtistEvents(events);
          setEventsCacheByArtistId?.((prev) => ({
            ...prev,
            [cacheKey]: { data: events, fetchedAt: Date.now() }
          }));
        }
      } catch (err) {
        console.error('Failed to fetch EDMTrain events:', err);
        if (!cancelled) {
          setArtistEvents([]);
          setEventsError('Unable to load upcoming events.');
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };
    fetchEvents();
    return () => { cancelled = true; };
  }, [artist?.edmtrain_id, activeTab]);

  const tabs = [
    { name: 'Upcoming Sets', icon: CalendarIcon },
    { name: 'Set Map', icon: Map },
    { name: 'Discover', icon: Sparkles },
    { name: 'Bio', icon: User },
    { name: 'Alerts', icon: Bell },
    { name: 'Tracks', icon: MicVocal }
  ];

  const bgImage = artist.image || "/artifacts/defaultprofileillenium.png";

  return (
    <div className="dashboard-panel fade-in full">
      <div className="hero" style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover', 
        backgroundPosition: 'center',
        flexShrink: 0,
      }}>
        <div className="hero-overlay"></div>

        <div className="hero-topbar">
          <div className="hero-topbar-left">
            <button onClick={onBack} className="hero-back-btn" aria-label="Back">
              <ArrowLeft size={24} />
            </button>
          </div>
          <div className="hero-topbar-right">
            <button
              onClick={() => onToggleFavorite(artist)}
              className="hero-icon-btn"
              style={{ color: isFavorite ? "#22c55e" : "white" }}
              aria-label={isFavorite ? "Unfavorite" : "Favorite"}
            >
              <Heart size={24} fill={isFavorite ? "#22c55e" : "none"} />
            </button>
          </div>
        </div>

        <div className="hero-bottom">
          <h1 className="hero-title">{artist.name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {artist.genres && Array.isArray(artist.genres) ? (
               artist.genres.slice(0, 3).map((g, i) => (
                 <span key={i} style={{
                   background: 'rgba(255,255,255,0.15)',
                   color: '#e2e8f0',
                   padding: '4px 10px',
                   borderRadius: '4px',
                   fontSize: '0.75rem',
                   fontWeight: 600,
                   backdropFilter: 'blur(4px)'
                 }}>{g}</span>
               ))
            ) : (
               <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>Electronic / Dance</span>
            )}
          </div>
        </div>
      </div>

      <div className="artist-tabs-container">
        <div className="artist-tabs-scroll">
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`artist-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="artist-tab-icon" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="artist-details-content">
        {activeTab !== 'Upcoming Sets' && (
          <h3 style={{ marginTop: 0, color: '#1e293b' }}>{activeTab}</h3>
        )}

        {activeTab === 'Upcoming Sets' ? (
          <div style={{ marginTop: 16 }}>
            {eventsLoading ? (
              <div style={{ color: '#64748b' }}>Loading events...</div>
            ) : eventsError ? (
              <div style={{ color: '#ef4444' }}>{eventsError}</div>
            ) : artistEvents.length === 0 ? (
              <div style={{ color: '#64748b' }}>No upcoming events found.</div>
            ) : (
              <div className="artist-events-grid">
                {sortedArtistEvents.map((evt, idx) => {
                  const name = evt?.name || evt?.venue?.name || artist?.name || "Event";
                  const eventDate = evt?.date;
                  const venueLocation = evt?.venue?.location || "";
                  const key = evt?.id || evt?.eventId || `${artist?.edmtrain_id || 'artist'}-${idx}`;

                  return (
                    <div key={key} className="artist-event-card" onClick={() => onEventClick && onEventClick(evt)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onEventClick && onEventClick(evt); } }}>
                      <EventImage link={evt?.link} alt={name} className="artist-event-bg" />
                      <div className="artist-event-overlay" />
                      {(() => {
                        const { day, month } = formatEventDateParts(eventDate);
                        return (
                          <div className="artist-event-date-badge" aria-label={formatEventDate(eventDate)}>
                            <div className="artist-event-date-day">{day}</div>
                            <div className="artist-event-date-month">{month}</div>
                          </div>
                        );
                      })()}
                      <div className="artist-event-content">
                        <div className="artist-event-name">{name}</div>
                        {(() => {
                          const list = Array.isArray(evt?.artistList) ? evt.artistList : [];
                          const names = list.map(a => a?.name).filter(Boolean);
                          if (names.length <= 1) return null;
                          const second = names[1];
                          const remaining = Math.max(0, names.length - 2);
                          return (
                            <div className="artist-event-artists">
                              + {second}{remaining > 0 ? ` and ${remaining} others` : ""}
                            </div>
                          );
                        })()}
                        <div className="artist-event-location">
                          <MapPin size={14} className="artist-event-location-icon" />
                          {venueLocation}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="artist-tab-scroll">
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>
              Content for {activeTab} will appear here. This section will connect to backend endpoints to show information for {artist.name}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


// --- Destination Details View ---
const DestinationDetailsView = ({ destination, onBack }) => {
  const [activeTab, setActiveTab] = useState('Upcoming Sets');

  const rawName = destination?.name || destination?.city || 'Unknown';
  const cityName = rawName.split(',')[0].trim();
  const safeName = cityName.toLowerCase().replace(/\s+/g, '');
  const bgImage = `/artifacts/cities/${safeName}.png`;

  const tabs = [
    { name: 'Upcoming Sets', icon: CalendarIcon },
    { name: 'Calendar', icon: CalendarDays },
    { name: 'Flights', icon: Plane }
  ];

  return (
    <div className="dashboard-panel fade-in full">
      <div className="hero" style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        flexShrink: 0,
        backgroundColor: '#0f172a' 
      }}>
        <div className="hero-overlay"></div>

        <div className="hero-topbar">
          <button onClick={onBack} className="hero-back-btn">
            <ArrowLeft size={24} />
          </button>
        </div>

        <div className="hero-bottom">
          <h1 className="hero-title">
            {cityName}
          </h1>
        </div>
      </div>

      <div className="artist-tabs-container">
        <div className="artist-tabs-scroll">
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`artist-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="artist-tab-icon" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="artist-details-content">
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>{activeTab}</h3>

        <div className="artist-tab-scroll">
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>
               {activeTab === 'Upcoming Sets' && `Events in ${cityName} will appear here.`}
               {activeTab === 'Calendar' && `A calendar of events for ${cityName} will live here.`}
               {activeTab === 'Flights' && `Flight deals to ${cityName} will appear here.`}
            </p>
        </div>
      </div>

    </div>
  );
};


// --- Event Details View ---
const EventDetailsView = ({ event, onBack }) => {
  const [activeTab, setActiveTab] = useState('Details');
  const [isAttending, setIsAttending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchAttendanceStatus = async () => {
      const email = localStorage.getItem('current_email');
      if (!email || !event?.id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/get_user_info`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
      } catch (err) {
        console.error("Failed to check attendance status", err);
      }
    };

    fetchAttendanceStatus();
  }, [event?.id]);

const handleToggleAttendance = async () => {
  const email = localStorage.getItem('current_email');
  const eventId = event?.id;

  const eventDate =
    event?.date ||
    (typeof event?.startTime === 'string' ? event.startTime.slice(0, 10) : null);

  if (!email || !eventId || !eventDate || isUpdating) return;

  setIsUpdating(true);
  try {
    const res = await fetch(`${API_BASE_URL}/api/toggle_event_attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        event_id: eventId,
        event_date: eventDate,
        action: isAttending ? 'remove' : 'add', 
        event_snapshot: event 
      })
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      setIsAttending(!!data.is_attending);
    } else {
      console.error("Failed to update attendance", data);
    }
  } catch (err) {
    console.error("Error toggling attendance:", err);
  } finally {
    setIsUpdating(false);
  }
};

  const formatEventDate = (dateStr) => {
    if (!dateStr) return "TBA";
    const d = new Date(String(dateStr) + "T00:00:00");
    if (Number.isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const eventName = event?.name || "Event";
  const isFestival = !!event?.festivalInd;
  const tagLabel = isFestival ? "Festival" : "Set";

  const tabs = [
    { name: 'Details', icon: Type },
    { name: 'Lineup', icon: Users },
    { name: 'Plan It', icon: MapPin },
    { name: 'More', icon: Sparkles },
  ];

  return (
    <div className="dashboard-panel fade-in full">
      <div className="event-hero">
        <EventImage
          link={event?.link}
          alt={eventName}
          className="event-hero-bg"
        />

        <div className="event-hero-overlay"></div>

        <div className="event-hero-topbar">
          <div className="event-hero-topbar-left">
            <button onClick={onBack} className="event-hero-icon-btn" aria-label="Back">
              <ArrowLeft size={24} />
            </button>
          </div>

          <div className="event-hero-topbar-right">
            <button
              className={`event-hero-icon-btn ${isUpdating ? 'loading' : ''}`}
              onClick={handleToggleAttendance}
              style={{ color: isAttending ? '#22c55e' : 'white' }}
              aria-label={isAttending ? "Not attending" : "Attending"}
              title={isAttending ? "Attending" : "Mark attending"}
            >
              <CalendarCheck size={22} stroke={isAttending ? "#22c55e" : "#94a3b8"} fill="none" />
            </button>
          </div>
        </div>

        <div className="event-hero-bottom">
          <h1 className="event-hero-title">{eventName}</h1>

          <div className="event-hero-tags">
            <span className="event-hero-tag">{tagLabel}</span>
          </div>
        </div>
      </div>

      <div className="artist-tabs-container">
        <div className="artist-tabs-scroll">
          {tabs.map(tab => {
            const isActive = activeTab === tab.name;
            const Icon = tab.icon;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`artist-tab-btn ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} className="artist-tab-icon" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="artist-details-content">
        {activeTab === 'Details' ? (
          <div className="event-details-body">
            <div className="event-details-row">
              <div className="event-details-label">Date</div>
              <div className="event-details-value">{formatEventDate(event?.date || event?.startTime)}</div>
            </div>

            {(event?.venue?.name || event?.venue?.location) && (
              <div className="event-details-row">
                <div className="event-details-label">Venue</div>
                <div className="event-details-value">
                  {event.venue.name}{event.venue.name && event.venue.location ? " • " : ""}{event.venue.location}
                </div>
              </div>
            )}

            {typeof event?.ages !== 'undefined' && event?.ages !== null && (
              <div className="event-details-row">
                <div className="event-details-label">Ages</div>
                <div className="event-details-value">{String(event.ages)}</div>
              </div>
            )}

            <div className="event-details-row">
              <div className="event-details-label">Type</div>
              <div className="event-details-value">{tagLabel}</div>
            </div>

            <div className="event-details-note">
              More event details (tickets, lineup, schedule) can plug in here later.
            </div>
          </div>
        ) : activeTab === 'Lineup' ? (
          <div className="event-lineup-body">
            {Array.isArray(event?.artistList) && event.artistList.length > 0 ? (
              <div className="event-lineup-list">
                {event.artistList.map((a, i) => {
                  const name = a?.name || `Artist ${i + 1}`;
                  const genresArr = Array.isArray(a?.genres) ? a.genres : (typeof a?.genre === 'string' ? [a.genre] : []);
                  const genres = genresArr.filter(Boolean).slice(0, 3).join(" • ");
                  return (
                    <div key={`${name}-${i}`} className="event-lineup-item">
                      <div
                        className="event-lineup-avatar"
                        style={{
                          backgroundImage: `url(${a?.image_url || "/artifacts/defaultprofileillenium.png"})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat"
                        }}
                        aria-label={name}
                      >
                        <div className="event-lineup-avatar-overlay" />
                      </div>

                      <div className="event-lineup-meta">
                        <div className="event-lineup-name">{name}</div>
                        {genres ? (
                          <div className="event-lineup-genres">{genres}</div>
                        ) : (
                          <div className="event-lineup-genres muted">Electronic / Dance</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-muted">No lineup found for this event.</div>
            )}
          </div>
        ) : (
          <div className="artist-tab-scroll">
            <p style={{ color: '#64748b', lineHeight: 1.6, marginTop: 0 }}>
              {activeTab === 'Plan It'
                ? 'Plan It will live here (flights, lodging, itinerary).'
                : 'More will live here (links, artists, share, extras).'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


// --- Dashboard Sub-Views ---
const HomeView = ({ favoriteArtists, favoriteDestinations, onArtistClick, onDestinationClick, tourCounts, toursLoading, onNavigate }) => {
  const demoDestinations = [
    { id: 'chicago', city: 'Chicago', name: 'Chicago' },
  ];

  // 1. Initialize selection to today's date
  const [homeSelectedDate, setHomeSelectedDate] = useState(new Date());
  const [homeItinerary, setHomeItinerary] = useState({ events: [], flights: [] });
  const [homeDatesLoading, setHomeDatesLoading] = useState(false);
  
  // 2. Ref to track the "today" element for centering
  const todayRef = useRef(null);

  const destinations =
    Array.isArray(favoriteDestinations) && favoriteDestinations.length > 0
      ? favoriteDestinations
      : demoDestinations;

  useEffect(() => {
    const fetchItinerary = async () => {
      const email = localStorage.getItem('current_email');
      if (!email) return;

      setHomeDatesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/user_itinerary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (res.ok) {
          const data = await res.json();
          setHomeItinerary({
            events: data?.events || [],
            flights: data?.flights || []
          });
        }
      } catch (err) {
        console.error("Failed to load itinerary (home scroller)", err);
      } finally {
        setHomeDatesLoading(false);
      }
    };

    fetchItinerary();
  }, []);

  // 3. Effect to center the "today" element once rendered
  useEffect(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        inline: 'center', // This puts the element in the middle of the scroll area
        block: 'nearest'
      });
    }
  }, [homeDatesLoading]); // Runs after data is loaded and DOM is updated

  const getHomeDataForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = (homeItinerary?.events || []).filter(e => e?.date === dateStr);
    const dayFlights = (homeItinerary?.flights || []).filter(f => f?.date === dateStr);
    const isBlackout = typeof isBlackoutDate === 'function' ? isBlackoutDate(date) : false;
    return { dayEvents, dayFlights, isBlackout };
  };

  const renderHomeTimelineDays = () => {
    const days = [];
    // Generating a window of days around today
    for (let i = -14; i <= 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    return (
      <div className="timeline-days-scroll home-timeline-days-scroll">
        {days.map((d, i) => {
          const isSelected = format(d, 'yyyy-MM-dd') === format(homeSelectedDate, 'yyyy-MM-dd');
          const isToday = format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const { dayEvents, dayFlights, isBlackout } = getHomeDataForDate(d);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          return (
            <button
              key={i}
              // 4. Attach the ref only to the "today" button
              ref={isToday ? todayRef : null}
              className={`timeline-day-item ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
              onClick={() => setHomeSelectedDate(d)}
              type="button"
            >
              <span className="timeline-day-name" style={isWeekend ? { color: "#ef4444" } : undefined}>
                {format(d, 'EEE')}
              </span>
              <span className="timeline-day-num">{format(d, 'd')}</span>
              <div className="timeline-dots">
                {isBlackout && <span className="dot blackout" title="Blackout Date" />}
                {dayFlights.length > 0 && <span className="dot flight" title="Flight" />}
                {dayEvents.length > 0 && <span className="dot event" title="Event" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // NEW: Render the daily agenda list within the shell
  const renderDailyAgenda = () => {
    const { dayEvents, dayFlights } = getHomeDataForDate(homeSelectedDate);
    const setsCount = dayEvents.length;
    const flightsCount = dayFlights.length;
    const hasItems = setsCount > 0 || flightsCount > 0;

    // Merge and sort for chronological order
    const agendaItems = [
      ...dayFlights.map(f => ({ ...f, type: 'flight' })),
      ...dayEvents.map(e => ({ ...e, type: 'event' }))
    ].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

    return (
      <div className="daily-agenda-container fade-in">
        {hasItems && (
          <div className="agenda-summary-header">
            <h2 className="agenda-date-title">{format(homeSelectedDate, 'EEEE, MMM do')}</h2>
            <div className="agenda-counts-row">
              <span>Sets: {setsCount}</span>
              <span className="count-divider">•</span>
              <span>Flights: {flightsCount}</span>
            </div>
          </div>
        )}

        <div className="timeline-details-list">
          {agendaItems.length > 0 ? (
            agendaItems.map((item, idx) => (
              <div key={idx} className={`timeline-card ${item.type}`}>
                <div className="timeline-time">{item.time || "TBA"}</div>
                <div className="timeline-line"></div>
                <div className="timeline-card-content">
                  <div className="timeline-card-tag">
                    {item.type === 'flight' ? <Plane size={12} style={{marginRight: 4}}/> : <Ticket size={12} style={{marginRight: 4}}/>}
                    {item.type.toUpperCase()}
                  </div>
                  <div className="timeline-card-title">{item.title || (item.name ? `${item.name}` : "Scheduled Item")}</div>
                  <div className="timeline-card-sub">{item.subtitle || item.venue?.location || item.venue?.name || ""}</div>
                </div>
              </div>
            ))
          ) : (
            // Updated Actionable Empty State
            <div className="empty-state actionable" onClick={() => onNavigate && onNavigate('events')}>
              <div className="empty-state-icon">
                <Search size={18} />
              </div>
              <div className="empty-state-text">
                <p>Nothing scheduled.</p>
                <span className="empty-state-link">Find events for this date</span>
              </div>
              <ChevronRight size={16} className="empty-state-arrow" />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-panel fade-in">
      {/* SECTION: HEADLINERS */}
      <div className="dashboard-section">
        <h3 className="section-title">
          <span>YOUR </span>
          <span className="accent">HEADLINERS</span>
        </h3>

        <div className="home-headliners-card">
          <div className="headliners-card-shell">
            <div className="headliners-scroll">
              {favoriteArtists && favoriteArtists.length > 0 ? (
                favoriteArtists.map((artist, index) => {
                  const count = artist?.edmtrain_id && tourCounts ? (tourCounts[artist.edmtrain_id] || 0) : 0;
                  return (
                    <div
                      key={index}
                      className="headliner-card"
                      onClick={() => onArtistClick(artist)}
                      role="button"
                      tabIndex={0}
                    >
                      <div
                        className="headliner-image-wrapper"
                        style={{
                          backgroundImage: `url(${artist.image || "/artifacts/defaultprofileillenium.png"})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        {count > 0 && (
                          <div className="headliner-event-count">
                            <Ticket size={10} strokeWidth={3} style={{ marginRight: '3px' }} />
                            {count}
                          </div>
                        )}
                      </div>
                      <div className="headliner-label">{artist.name}</div>
                    </div>
                  );
                })
              ) : (
                <p className="no-data-msg">No favorite artists added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: DATES & AGENDA (Nested) */}
      <div className="dashboard-section">
        <div className="home-dates-title-outside">
          <h3 className="section-title">
            <span>UP </span>
            <span className="accent">NEXT</span>
          </h3>
          {homeDatesLoading && <div className="home-dates-sub">Loading…</div>}
        </div>
        
        <div className="home-dates-card">
          <div className="home-dates-shell">
            {renderHomeTimelineDays()}
            <div className="home-agenda-divider" style={{ 
              margin: '20px 0', 
              borderTop: '1px solid #f1f5f9' 
            }} />
            {renderDailyAgenda()}
          </div>
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

const FlightsView = ({ onBack, onSearchFlights, flightState, isSearchCollapsed, setIsSearchCollapsed }) => {
  const {
    searchParams,
    flights,
    loading,
    error,
    fromCache,
    routesSearched,
    totalRoutes,
    tripPlannerInfo,
    buildYourOwnStep,
    selectedOutboundFlight,
    onSelectOutbound,
    onSelectReturn,
    onResetBuildYourOwn,
  } = flightState || {};

  return (
    <div className="dashboard-panel fade-in">
      <button
        onClick={() => {
          if (isSearchCollapsed) {
            setIsSearchCollapsed(false);
          } else {
            onBack();
          }
        }}
        className="modify-search-btn"
      >
        <ArrowLeft size={20} /> {isSearchCollapsed ? "Modify Search" : "Back"}
      </button>

      <div className={`search-form-shell ${isSearchCollapsed ? 'collapsed' : ''}`}>
        <SearchForm onSearch={onSearchFlights} loading={!!loading} />
      </div>

      <div className="flights-results-shell">
        {error && (
          <div className="error-message"><p>⚠️ {error}</p></div>
        )}

        {loading && (
          <div className="loading-message">
            <div className="spinner"></div>
            <p>Searching for flights... {routesSearched || 0}/{totalRoutes || 0} routes searched</p>
            {Array.isArray(flights) && flights.length > 0 && (
              <p className="flights-found">{flights.length} flights found so far</p>
            )}
          </div>
        )}

        {searchParams && Array.isArray(flights) && flights.length > 0 && (
          <FlightResults
            flights={flights}
            searchParams={searchParams}
            fromCache={!!fromCache}
            isLoading={!!loading}
            tripPlannerInfo={tripPlannerInfo}
            buildYourOwnMode={searchParams.searchMode === 'build-your-own' || searchParams.searchMode === 'build-your-own-return'}
            buildYourOwnStep={buildYourOwnStep}
            selectedOutboundFlight={selectedOutboundFlight}
            onSelectOutbound={onSelectOutbound}
            onSelectReturn={onSelectReturn}
            onResetBuildYourOwn={onResetBuildYourOwn}
          />
        )}
      </div>
    </div>
  );
};

const PlacesView = () => {
  return (
    <div className="dashboard-panel fade-in">
        <h3 className="section-title">EXPLORE PLACES</h3>
        <p>This feature is currently unavailable.</p>
    </div>
  );
};

const PlanView = () => {
  const [startDate, setStartDate] = useState(null);

  return (
    <div className="dashboard-panel fade-in">
      <div className="headliners-section">
        <h3 className="section-title">PLAN YOUR TRIP</h3>
        
        <div style={{ marginTop: '24px', marginBottom: '24px' }}>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              inline 
              calendarClassName="plan-view-calendar" 
              dateFormat="EEE, MMM do, yyyy"
              minDate={new Date()}
              fixedHeight
              dayClassName={(date) => isBlackoutDate(date) ? "blackout-date" : undefined}
            >
              <CalendarLegend />
            </DatePicker>
        </div>
      </div>
    </div>
  );
};

const FriendsView = () => (
  <div className="dashboard-panel fade-in">
    <h2>Friends</h2>
    <p>See where your friends are traveling.</p>
  </div>
);

const ProfileView = ({ userFirstName, userProfilePic, onEditProfile }) => (
  <div className="dashboard-panel fade-in profile-container">
    <div className="profile-header-card">
      <div className="profile-avatar-large">
        <img
          src={`${API_BASE_URL}/static/profile_pics/${userProfilePic || 'default.jpg'}`}
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

const EditProfileView = ({ userInfo, onBack, onSaved }) => {
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    dob: '' 
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

      const res = await fetch(`${API_BASE_URL}/api/update_profile`, {
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
    : `${API_BASE_URL}/static/profile_pics/${userInfo?.image_file || 'default.jpg'}`;

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

function UserHome({ userFirstName, userProfilePic, favoriteArtists, favoriteDestinations, onSearchFlights, flightState, onClearFlightSearch, onClearCache }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [userDestinations, setUserDestinations] = useState(favoriteDestinations || []);
  const [userFavoriteArtists, setUserFavoriteArtists] = useState(favoriteArtists || []);
  
  // NEW: State for search form collapse
  const [isSearchCollapsed, setIsSearchCollapsed] = useState(false);

  useEffect(() => {
    setUserDestinations(Array.isArray(favoriteDestinations) ? favoriteDestinations : []);
  }, [favoriteDestinations]);

  useEffect(() => {
    setUserFavoriteArtists(Array.isArray(favoriteArtists) ? favoriteArtists : []);
  }, [favoriteArtists]);

  const [selectedArtist, setSelectedArtist] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [viewStack, setViewStack] = useState([]);

  const [eventsCacheByArtistId, setEventsCacheByArtistId] = useState({});
  const [tourCounts, setTourCounts] = useState(null);
  const [toursLoading, setToursLoading] = useState(false);

  const [globalQuery, setGlobalQuery] = useState('');
  const [globalFocused, setGlobalFocused] = useState(false);
  const [globalOpen, setGlobalOpen] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalResults, setGlobalResults] = useState({ artists: [], locations: [], airports: [] });

  const globalSearchWrapRef = useRef(null);

  useEffect(() => {
    if (favoriteArtists) {
      setUserFavoriteArtists(favoriteArtists);
    }
  }, [favoriteArtists]);

  const closeGlobalSearch = () => {
    setGlobalOpen(false);
    setGlobalLoading(false);
  };

  const selectGlobalArtist = (artist) => {
    const normalized = {
      ...artist,
      name: artist?.name || artist?.display_name || artist?.title || artist?.artist_name,
      image: artist?.image || artist?.image_url || artist?.photo || artist?.photo_url
    };
    setGlobalQuery('');
    closeGlobalSearch();
    handleArtistClick(normalized);
  };

  const selectGlobalLocation = (loc) => {
    setGlobalQuery('');
    closeGlobalSearch();
    handleDestinationClick(loc);
  };

  const selectGlobalAirport = (ap) => {
    setGlobalQuery(ap?.iata_code ? `${ap.iata_code} - ${ap.name || ''}` : (ap?.name || ''));
    closeGlobalSearch();
  };

  useEffect(() => {
    const q = (globalQuery || '').trim();
    if (q.length < 2) {
      setGlobalResults({ artists: [], locations: [], airports: [] });
      setGlobalLoading(false);
      setGlobalOpen(false);
      return;
    }

    setGlobalLoading(true);
    setGlobalOpen(true);

    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search_global?keyword=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        if (!res.ok) {
          console.error('Global search failed:', data);
          setGlobalResults({ artists: [], locations: [], airports: [] });
          setGlobalLoading(false);
          return;
        }
        setGlobalResults({
          artists: Array.isArray(data?.artists) ? data.artists : [],
          locations: Array.isArray(data?.locations) ? data.locations : [],
          airports: Array.isArray(data?.airports) ? data.airports : []
        });
      } catch (err) {
        console.error('Global search error:', err);
        setGlobalResults({ artists: [], locations: [], airports: [] });
      } finally {
        setGlobalLoading(false);
      }
    }, 220);

    return () => clearTimeout(t);
  }, [globalQuery]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!globalSearchWrapRef.current) return;
      if (!globalSearchWrapRef.current.contains(e.target)) {
        closeGlobalSearch();
        setGlobalFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);


  const MOBILE_BP = 768; 
  const isMobile = () => window.innerWidth <= MOBILE_BP;
  useEffect(() => {
    if (isMobile()) setCollapsed(true);

    const onResize = () => {
      if (isMobile()) setCollapsed(true);
    };

      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
  }, []);
  
  useEffect(() => {
    let cancelled = false;

    const fetchTours = async () => {
      if (tourCounts && typeof tourCounts === 'object') return;

      try {
        setToursLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/edmtrain/tours?includeElectronic=true&includeOther=false`);
        if (!res.ok) return;

        const json = await res.json();
        const map = json?.data?.artistIdEventCountMap || null;

        if (!cancelled && map) {
          setTourCounts(map);
        }
      } catch (err) {
        console.error('Failed to fetch tour counts:', err);
      } finally {
        if (!cancelled) setToursLoading(false);
      }
    };

    fetchTours();
    return () => {
      cancelled = true;
    };
  }, [tourCounts]);

  useEffect(() => {
    let cancelled = false;
  }, [userFavoriteArtists]);


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
      const res = await fetch(`${API_BASE_URL}/api/get_user_info`, {
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

      if (data.favorite_destinations && Array.isArray(data.favorite_destinations)) {
        setUserDestinations(data.favorite_destinations);
      }

      if (data.favorite_artists && Array.isArray(data.favorite_artists)) {
        setUserFavoriteArtists(data.favorite_artists);
      }

    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  useEffect(() => {
    refreshUserInfo();
  }, []);

  useEffect(() => {
    setUserInfo((prev) => ({
      ...prev,
      first_name: userFirstName || prev.first_name,
      image_file: userProfilePic || prev.image_file
    }));
  }, [userFirstName, userProfilePic]);

  const handleArtistClick = (artist) => {
    setSelectedArtist(artist);
    setActiveView('artist-details');
  };

  const handleDestinationClick = (destination) => {
    setSelectedDestination(destination);
    setActiveView('destination-details');
  };

  const pushView = (nextView) => {
    setViewStack((prev) => [...prev, activeView]);
    setActiveView(nextView);
  };

  const goBack = () => {
    setViewStack((prev) => {
      const next = [...prev];
      const back = next.pop();
      setActiveView(back || 'home');
      return next;
    });
  };

  const handleEventClick = (evt) => {
    setSelectedEvent(evt);
    pushView('event-details');
  };

  const isFavorite = (artist) => {
    if (!userFavoriteArtists) return false;
    return userFavoriteArtists.some(fav => fav.id === artist.id || fav.name === artist.name);
  };

  const handleToggleFavorite = async (artist) => {
    const email = localStorage.getItem('current_email');
    if (!email) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/toggle_favorite_artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          artist_name: artist.name,
          artist_id: artist.id,
          artist_image: artist.image
        })
      });

      if (res.ok) {
         await refreshUserInfo();
      } else {
        console.error("Failed to toggle favorite");
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Wrapper for flight search to handle state
  const handleFlightSearch = (params) => {
    setIsSearchCollapsed(true);
    onSearchFlights(params);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'events': return <EventsView />;
      case 'flights':
        return (
          <FlightsView
            onBack={() => { 
                if (isSearchCollapsed) {
                    setIsSearchCollapsed(false);
                } else {
                    onClearFlightSearch && onClearFlightSearch(); 
                    setActiveView('home'); 
                }
            }}
            onSearchFlights={handleFlightSearch}
            flightState={flightState}
            isSearchCollapsed={isSearchCollapsed}
            setIsSearchCollapsed={setIsSearchCollapsed}
          />
        );
      case 'artists': return <ArtistsView favoriteArtists={userFavoriteArtists} />;
      case 'plan': return <PlanView />;
      case 'itinerary': return <ItineraryView />;
      case 'friends': return <FriendsView />;
      
      case 'artist-details': 
        return (
          <ArtistDetailsView 
            artist={selectedArtist} 
            onBack={goBack} 
            isFavorite={isFavorite(selectedArtist)}
            onToggleFavorite={handleToggleFavorite}
            eventsCacheByArtistId={eventsCacheByArtistId}
            setEventsCacheByArtistId={setEventsCacheByArtistId}
            onEventClick={handleEventClick}
          />
        );

      case 'destination-details':
        return (
            <DestinationDetailsView
                destination={selectedDestination}
                onBack={goBack}
            />
        );

      case 'event-details':
        return (
          <EventDetailsView
            event={selectedEvent}
            onBack={goBack}
          />
        );

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
        return (
          <HomeView 
            favoriteArtists={userFavoriteArtists} 
            favoriteDestinations={userDestinations} 
            onArtistClick={handleArtistClick} 
            onDestinationClick={handleDestinationClick} 
            tourCounts={tourCounts || {}}
            toursLoading={toursLoading}
            onNavigate={(view) => setActiveView(view)} // Pass navigation handler
          />
        );
    }
  };

  const isDetailsView = ['artist-details', 'event-details', 'destination-details'].includes(activeView);

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

          <button onClick={() => handleNav(() => setActiveView('flights'))} className={activeView === 'flights' ? 'active' : ''}>
            <PlaneTakeoff size={20} />
            <span>Flights</span>
          </button>

          <button onClick={() => handleNav(() => setActiveView('events'))} className={activeView === 'events' ? 'active' : ''}>
            <Calendar size={20} />
            <span>Events</span>
          </button>

          <button onClick={() => handleNav(() => setActiveView('artists'))} className={activeView === 'artists' ? 'active' : ''}>
            <MicVocal size={20} />
            <span>Artists</span>
          </button>
        </div>

        <div className="sidebar-section">
          <h4>Tools</h4>
          
          <button onClick={() => handleNav(() => setActiveView('itinerary'))} className={activeView === 'itinerary' ? 'active' : ''}>
            <BookOpen size={20} />
            <span>Itinerary</span>
          </button>

          <button onClick={() => handleNav(() => setActiveView('friends'))} className={activeView === 'friends' ? 'active' : ''}>
            <Users size={20} />
            <span>Friends</span>
          </button>

          <button onClick={() => onClearCache && onClearCache()}>
            <Trash size={20} />
            <span>Clear Cache</span>
          </button>

        </div>
      </aside>

{!collapsed && isMobile() && (
  <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />
)}

      <div className={`main-wrapper ${collapsed ? 'collapsed' : ''} ${isDetailsView ? 'details-view-mode' : ''}`}>
        <header className="main-header">
          <div className="header-left">
            <button className="header-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <PanelLeftOpen size={24} /> : <PanelLeftClose size={24} />}
            </button>
          </div>

          <div className="header-center">
            <div
              className={`places-input-wrap header-airport-search ${globalFocused ? 'focused' : ''}`}
              style={{ position: 'relative', zIndex: 120, overflow: 'visible' }} 
              ref={globalSearchWrapRef}
            >
              <Search size={18} className="places-input-icon" />
              <input
                type="text"
                placeholder="Artists, venues..."
                className="places-airport-input"
                autoComplete="off"
                value={globalQuery}
                onChange={(e) => setGlobalQuery(e.target.value)}
                onFocus={() => { setGlobalFocused(true); if ((globalQuery || '').trim().length >= 2) setGlobalOpen(true); }}
                onBlur={() => { setTimeout(() => setGlobalOpen(false), 180); }}
              />

              {globalOpen && (
                <div className="artist-dropdown" role="listbox">
                  {globalLoading && (
                    <div className="artist-dropdown-item" style={{ cursor: 'default' }}>
                      <div className="artist-text-group">
                        <div className="artist-main">Searching…</div>
                      </div>
                    </div>
                  )}

                  {!globalLoading && (
                    <>
                      {globalResults.artists && globalResults.artists.length > 0 && (
                        <>
                          <div className="global-dropdown-group-label">Artists</div>
                          {globalResults.artists.map((item) => (
                            <div
                              key={`artist-${item.id}`}
                              className="artist-dropdown-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectGlobalArtist(item)}
                            >
                              <CircleUserRound size={16} className="dropdown-icon" />
                              <div className="artist-main">{item.label || item.display_name}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {globalResults.locations && globalResults.locations.length > 0 && (
                        <>
                          <div className="global-dropdown-group-label">Locations</div>
                          {globalResults.locations.map((item) => (
                            <div
                              key={`loc-${item.id}`}
                              className="artist-dropdown-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectGlobalLocation(item)}
                            >
                              <MapPin size={16} className="dropdown-icon" />
                              <div className="artist-main">{item.label || item.name}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {globalResults.airports && globalResults.airports.length > 0 && (
                        <>
                          <div className="global-dropdown-group-label">Airports</div>
                          {globalResults.airports.map((item) => (
                            <div
                              key={`ap-${item.id}`}
                              className="artist-dropdown-item"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => selectGlobalAirport(item)}
                            >
                              <TowerControl size={16} className="dropdown-icon" />
                              <div className="artist-main">{item.label || item.iata_code}</div>
                            </div>
                          ))}
                        </>
                      )}

                      {(!globalResults.artists?.length && !globalResults.locations?.length && !globalResults.airports?.length) && (
                        <div className="artist-dropdown-item" style={{ cursor: 'default' }}>
                          <div className="artist-text-group">
                            <div className="artist-main">No results</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="header-right">
            <img
              src={`${API_BASE_URL}/static/profile_pics/${userInfo.image_file || 'default.jpg'}`}
              alt="Profile"
              className={`header-profile-pic ${activeView === 'profile' || activeView === 'edit-profile' ? 'active' : ''}`}
              onClick={() => setActiveView('profile')}
              onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
            />
          </div>
        </header>

        <main className={`user-home-content ${(activeView === 'artist-details' || activeView === 'event-details' || activeView === 'destination-details') ? 'artist-view-active' : ''}`}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default UserHome;