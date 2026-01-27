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
  BookOpen,      // Icon for Itinerary
  LayoutList,    // Icon for Timeline View
  Calendar as CalendarIcon // Alias for Calendar View Icon
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
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'timeline'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [itineraryData, setItineraryData] = useState({ events: [], flights: [] });
  const [loading, setLoading] = useState(false);

  // Fetch Data on Mount
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

  // Helper to check what's on a specific date
  const getDataForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = itineraryData.events.filter(e => e.date === dateStr);
    const dayFlights = itineraryData.flights.filter(f => f.date === dateStr);
    const isBlackout = isBlackoutDate(date);
    return { dayEvents, dayFlights, isBlackout };
  };


  // Normalize snapshot_json that may arrive as an object or a JSON string
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

  // --- Render Calendar Cell (Custom Dots) ---
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

  // --- Render Timeline Horizontal Scroll ---
  const renderTimelineDays = () => {
    // Generate +/- 14 days around selected date
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

  // --- Render Timeline Details List ---
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
                {/* Navigation Row */}
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

                {/* Legend Row (Moved inside header, below month) */}
                <div className="calendar-legend-row" style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', gap: '16px' }}>
                  <div className="legend-item"><span className="dot blackout"/> Blackout</div>
                  <div className="legend-item"><span className="dot flight"/> Flight</div>
                  <div className="legend-item"><span className="dot event"/> Event</div>
                </div>
              </div>
            )}
            renderDayContents={renderDayContents}
          />

          {/* Show details for selected date below calendar */}
          <div style={{ marginTop: '24px' }}>
            {renderTimelineDetails()}
          </div>
        </div>
      )}

      {!loading && viewMode === 'timeline' && (
        <div className="itinerary-timeline-wrapper fade-in">
          {/* Month/Year selector could go here, simplified to current view context */}
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

    // EDMTrain sends date like "YYYY-MM-DD" (no time). Force local midnight.
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
      // Prefer EDMTrain "date" (YYYY-MM-DD)
      const ds = e?.date;
      const msFromDate = ds ? Date.parse(String(ds) + "T00:00:00") : NaN;
      if (Number.isFinite(msFromDate)) return msFromDate;

      // Fallback to startTime if it exists
      const t = e?.startTime;
      const msFromStart = t ? Date.parse(t) : NaN;
      if (Number.isFinite(msFromStart)) return msFromStart;

      // Unknown date goes to the end
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

    return () => {
      cancelled = true;
    };
  }, [artist?.edmtrain_id, activeTab]);

  
  const tabs = [
    { name: 'Upcoming Sets', icon: Calendar },
    { name: 'Set Map', icon: Map },
    { name: 'Discover', icon: Sparkles },
    { name: 'Bio', icon: User },
    { name: 'Alerts', icon: Bell },
    { name: 'Tracks', icon: MicVocal }
  ];

  const bgImage = artist.image || "/artifacts/defaultprofileillenium.png";

  return (
    <div className="dashboard-panel fade-in full">
      
      {/* 1. HERO SECTION */}
      <div className="hero" style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        flexShrink: 0,
         
      }}>
        <div className="hero-overlay"></div>

        <div className="hero-topbar">
          <button onClick={onBack} className="hero-back-btn">
            <ArrowLeft size={24} />
          </button>

          <button onClick={() => onToggleFavorite(artist)} className="hero-icon-btn" style={{ color: isFavorite ? "#22c55e" : "white" }}>
            <Heart size={24} fill={isFavorite ? "#22c55e" : "none"} />
          </button>
        </div>

        <div className="hero-bottom">
          <h1 className="hero-title">
            {artist.name}
          </h1>
          
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {artist.genres && Array.isArray(artist.genres) ? (
               artist.genres.slice(0, 3).map((g, i) => (
                 <span key={i} style={{
                   background: 'rgba(255,255,255,0.15)',
                   color: '#e2e8f0',
                   padding: '4px 10px',
                   borderRadius: 'px',
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

      {/* 2. TAB NAVIGATION */}
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

      {/* 3. CONTENT AREA */}
      <div className="artist-details-content">
        {activeTab === 'Upcoming Sets' ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
         
        </div>
      ) : (
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
                  const eventDate = evt?.date; // use EDMTrain "date"
                  const venueName = evt?.venue?.name || "";
                  const venueLocation = evt?.venue?.location || "";
                  const key = evt?.id || evt?.eventId || `${artist?.edmtrain_id || 'artist'}-${idx}`;

                  return (
                    <div key={key} className="artist-event-card" onClick={() => onEventClick && onEventClick(evt)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onEventClick && onEventClick(evt); } }}>
                      {/* Full Background Image */}
                      <EventImage 
                        link={evt?.link} 
                        alt={name}
                        className="artist-event-bg"
                      />

                      {/* Gradient Overlay */}
                      <div className="artist-event-overlay" />

                      {/* Date Badge */}
                      {(() => {
                        const { day, month } = formatEventDateParts(eventDate);
                        return (
                          <div className="artist-event-date-badge" aria-label={formatEventDate(eventDate)}>
                            <div className="artist-event-date-day">{day}</div>
                            <div className="artist-event-date-month">{month}</div>
                          </div>
                        );
                      })()}


                      {/* Text Content Layer */}
                      <div className="artist-event-content">
                        <div className="artist-event-name">
                          {name}
                        </div>

                        {(() => {
                          const list = Array.isArray(evt?.artistList) ? evt.artistList : [];
                          const names = list.map(a => a?.name).filter(Boolean);

                          // Only hide if there is exactly ONE artist total
                          if (names.length === 1) return null;

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
            Content for {activeTab} will appear here. This section will connect to backend endpoints to show tour dates, tracks, or bio information for {artist.name}.
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

  // Derive Image (reuse logic from HomeView)
  const rawName = destination?.name || destination?.city || 'Unknown';
  const cityName = rawName.split(',')[0].trim();
  const safeName = cityName.toLowerCase().replace(/\s+/g, '');
  const bgImage = `/artifacts/cities/${safeName}.png`;

  const tabs = [
    { name: 'Upcoming Sets', icon: Calendar },
    { name: 'Calendar', icon: CalendarDays },
    { name: 'Flights', icon: Plane }
  ];

  return (
    <div className="dashboard-panel fade-in full">
      
      {/* 1. HERO SECTION */}
      <div className="hero" style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        flexShrink: 0,
        backgroundColor: '#0f172a' // Fallback
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

      {/* 2. TAB NAVIGATION */}
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

      {/* 3. CONTENT AREA */}
      <div className="artist-details-content">
        <h3 style={{ marginTop: 0, color: '#1e293b' }}>{activeTab}</h3>

        <div className="artist-tab-scroll">
            <p style={{ color: '#64748b', lineHeight: 1.6 }}>
               {/* Placeholder content for now */}
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
  // State for tracking attendance toggle
  const [isAttending, setIsAttending] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch initial attendance status
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
        // Placeholder: Check if event is in user's list.
        // Ideally a specific endpoint like /api/is_attending would be better.
      } catch (err) {
        console.error("Failed to check attendance status", err);
      }
    };

    fetchAttendanceStatus();
  }, [event?.id]);

  // ✅ UPDATED: Handler to toggle attendance with SNAPSHOT + explicit action
const handleToggleAttendance = async () => {
  const email = localStorage.getItem('current_email');
  const eventId = event?.id;

  // EDMTrain events sometimes have `date` (YYYY-MM-DD) and sometimes `startTime`/`endTime`
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
        action: isAttending ? 'remove' : 'add', // ✅ NEW: explicit action so backend can upsert snapshot
        event_snapshot: event // ✅ Pass full event object as snapshot
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
      {/* 1. HERO SECTION */}
      <div className="event-hero">
        <EventImage
          link={event?.link}
          alt={eventName}
          className="event-hero-bg"
        />

        <div className="event-hero-overlay"></div>

        <div className="event-hero-topbar">
          <button onClick={onBack} className="event-hero-icon-btn" aria-label="Back">
            <ArrowLeft size={24} />
          </button>

          {/* Dynamic Attending toggle */}
          <button 
            className={`event-hero-icon-btn ${isUpdating ? 'loading' : ''}`} 
            onClick={handleToggleAttendance}
            style={{ color: isAttending ? '#22c55e' : 'white' }}
            aria-label="Toggle Attending"
          >
            <CalendarCheck size={22} stroke={isAttending ? "#22c55e" : "#94a3b8"} fill="none" />
          </button>
        </div>

        <div className="event-hero-bottom">
          <h1 className="event-hero-title">{eventName}</h1>

          <div className="event-hero-tags">
            <span className="event-hero-tag">{tagLabel}</span>
          </div>
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
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

      {/* 3. CONTENT AREA */}
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
const HomeView = ({ favoriteArtists, favoriteDestinations, onArtistClick, onDestinationClick, tourCounts, toursLoading, destinationStatsByKey, destinationStatsLoading }) => {
  const demoDestinations = [
    { id: 'chicago', city: 'Chicago', name: 'Chicago' },
  ];

  const destinations =
    Array.isArray(favoriteDestinations) && favoriteDestinations.length > 0
      ? favoriteDestinations
      : demoDestinations;

  return (
    <div className="dashboard-panel fade-in">
      <div className="headliners-section">
        <h3 className="section-title">YOUR HEADLINERS</h3>
        <div className="headliners-scroll">
          {favoriteArtists && favoriteArtists.length > 0 ? (
            favoriteArtists.map((artist, index) => {
              
              const count = artist.edmtrain_id ? tourCounts[artist.edmtrain_id] : 0;
              
              return (
                <div 
                  key={index} 
                  className="headliner-card"
                  onClick={() => onArtistClick(artist)} 
                >
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
                    <div className="headliner-event-count">
                      {count} 
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

            const cityName = (raw || 'Unknown').split(',')[0].trim() || 'Unknown';
            const safeName = cityName.toLowerCase().replace(/\s+/g, '');
            const imgPath = `/artifacts/cities/${safeName}.png`;

            const key = d?.id || d?.location_id || d?.iata_code || `${cityName}-${idx}`;

            const stats = (destinationStatsByKey && destinationStatsByKey[key]) ? destinationStatsByKey[key] : null;

            return (
              <button
                key={key}
                type="button"
                className="destination-card destination-poster"
                style={{
                  backgroundImage: `url(${imgPath})`
                }}
                aria-label={cityName}
                onClick={() => onDestinationClick(d)}
              >
                <div className="destination-poster-overlay" />
                <div className="destination-poster-content">
                  <div className="destination-poster-title">{cityName}</div>

                  <div className="destination-poster-metrics">
                    <div className="destination-metric">
                      <div className="destination-metric-num">
                        {destinationStatsLoading ? '…' : (stats ? stats.totalSets : 0)}
                      </div>
                      <div className="destination-metric-label">Total Sets</div>
                    </div>

                    <div className="destination-metric">
                      <div className="destination-metric-num">
                        {destinationStatsLoading ? '…' : (stats ? stats.totalFestivals : 0)}
                      </div>
                      <div className="destination-metric-label">Total Festivals</div>
                    </div>

                    <div className="destination-metric">
                      <div className="destination-metric-num">
                        {destinationStatsLoading ? '…' : (stats ? stats.headliners : 0)}
                      </div>
                      <div className="destination-metric-label">Headliners</div>
                    </div>
                  </div>
                </div>
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

// --- Flights View (embedded SearchForm + results) ---
const FlightsView = ({ onBack, onSearchFlights, flightState }) => {
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
        onClick={onBack}
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#64748b',
          fontSize: '1rem',
          fontWeight: 600
        }}
      >
        <ArrowLeft size={20} /> Back
      </button>

      <SearchForm onSearch={onSearchFlights} loading={!!loading} />

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
  );
};

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
        const url = `${API_BASE_URL}/api/db_airports?keyword=${encodeURIComponent(q)}&limit=25`;
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
        const url = `${API_BASE_URL}/api/db_airports?keyword=${encodeURIComponent(q)}&limit=25`;
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

// --- Plan View ---
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

// ✅ Profile Main View
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

// ✅ Edit Profile View
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

function UserHome({ userFirstName, userProfilePic, favoriteArtists, favoriteDestinations, onSearchFlights, flightState, onClearFlightSearch }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('home');
  const [userDestinations, setUserDestinations] = useState(favoriteDestinations || []);
  const [userFavoriteArtists, setUserFavoriteArtists] = useState(favoriteArtists || []);

  // Keep local state in sync when props arrive/refresh (e.g., after user_info fetch)
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

  // Destination stats (Sets / Festivals / Headliners) keyed by destination key
  const [destinationStatsByKey, setDestinationStatsByKey] = useState({});
  const [destinationStatsLoading, setDestinationStatsLoading] = useState(false);

  // --- Global Header Search (Artists / Locations / Airports) ---
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
    setActiveView('places');
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

  // Fetch destination-level EDMTrain stats on load (batched by locationIds)
  useEffect(() => {
    let cancelled = false;

    const fetchDestinationStats = async () => {
      const destinations = Array.isArray(userDestinations) ? userDestinations : [];
      if (destinations.length === 0) {
        if (!cancelled) setDestinationStatsByKey({});
        return;
      }

      // Map favorite artist EDMTrain IDs (used to detect "Headliners" per destination)
      const favIds = new Set(
        (Array.isArray(userFavoriteArtists) ? userFavoriteArtists : [])
          .map((a) => a?.edmtrain_id)
          .filter(Boolean)
          .map((v) => String(v))
      );

      const buildDestinationKey = (d, idx) => {
        const raw =
          d?.city || d?.location || d?.name || d?.title || d?.location_label || d?.label || '';
        const cityName = (raw || 'Unknown').split(',')[0].trim() || 'Unknown';
        return d?.id || d?.location_id || d?.iata_code || `${cityName}-${idx}`;
      };

      // Build per-destination rows
      const rows = destinations.map((d, idx) => {
        const key = buildDestinationKey(d, idx);
        const locId =
          d?.edmtrain_locationid ??
          d?.edmtrain_location_id ??
          d?.edmtrainLocationId ??
          d?.edmtrainLocationID ??
          null;
        return { key, locId: locId ? String(locId) : null };
      });

      // Unique list of locationIds to batch query
      const uniqueLocIds = Array.from(new Set(rows.map((r) => r.locId).filter(Boolean)));

      // If none of the destinations have a location id, just mark them missing
      if (uniqueLocIds.length === 0) {
         console.warn(
        "[UserHome] Skipping destination stats fetch – no edmtrain_locationid found on userDestinations",
          {
            userDestinations: destinations,
            derivedRows: rows
          }
        );
        const next = {};
        rows.forEach((r, idx) => {
          next[r.key] = { totalSets: 0, totalFestivals: 0, headliners: 0, missingLocationId: true };
        });
        if (!cancelled) setDestinationStatsByKey(next);
        return;
      }

      try {
        setDestinationStatsLoading(true);

        const qs = new URLSearchParams();
        qs.set('locationIds', uniqueLocIds.join(','));

        const res = await fetch(
          `${API_BASE_URL}/api/edmtrain/destination_stats?${qs.toString()}`
        );

        const json = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error('Failed to fetch destination stats:', json);
        }

        const data = (json && typeof json === 'object') ? json.data : null;

        // We support two shapes from the backend:
        // 1) { data: { "<locId>": { totalSets, totalFestivals, headliners } } }  (already aggregated)
        // 2) { data: [ ...events ] }                                            (raw EDMTrain events)
        const statsByLocId = {};

        // Build helpers for matching events -> destination locationId (if the backend returns raw events)
        const normalizeLabel = (s) =>
          String(s || '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .replace(/\s*,\s*/g, ', ')
            .trim();

        const destLabelForRow = (dest, idx) => {
          const raw =
            dest?.city || dest?.location || dest?.name || dest?.title || dest?.location_label || dest?.label || '';
          return String(raw || 'Unknown').trim() || `Unknown-${idx}`;
        };

        const locMetaById = {};
        rows.forEach((r, idx) => {
          if (!r.locId) return;
          const label = destLabelForRow(destinations[idx], idx);
          const cityOnly = label.split(',')[0].trim();
          locMetaById[r.locId] = {
            labelNorm: normalizeLabel(label),
            cityNorm: normalizeLabel(cityOnly),
          };
        });

        const ensureStat = (locId) => {
          if (!statsByLocId[locId]) statsByLocId[locId] = { totalSets: 0, totalFestivals: 0, headliners: 0 };
          return statsByLocId[locId];
        };

        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Aggregated shape
          Object.keys(data).forEach((locId) => {
            const s = data[locId];
            if (!s || typeof s !== 'object') return;
            statsByLocId[String(locId)] = {
              totalSets: Number(s.totalSets || 0),
              totalFestivals: Number(s.totalFestivals || 0),
              headliners: Number(s.headliners || 0),
            };
          });
        } else if (Array.isArray(data)) {
          // Raw events shape: compute counts client-side
          data.forEach((evt) => {
            // Some payloads might include a direct location id, but most EDMTrain events don't.
            const directLocId =
              evt?.locationId ??
              evt?.location_id ??
              evt?.edmtrain_locationid ??
              evt?.edmtrain_location_id ??
              null;

            let locId = directLocId ? String(directLocId) : null;

            if (!locId) {
              const evtLocLabel = normalizeLabel(evt?.venue?.location || evt?.location || '');
              if (evtLocLabel) {
                // Try exact label match first, then city-only startsWith.
                const match = Object.keys(locMetaById).find((lid) => {
                  const meta = locMetaById[lid];
                  return evtLocLabel === meta.labelNorm || evtLocLabel.startsWith(meta.cityNorm);
                });
                if (match) locId = String(match);
              }
            }

            if (!locId) return; // couldn't match the event to one of the requested destinations

            const s = ensureStat(locId);
            s.totalSets += 1;
            if (evt?.festivalInd) s.totalFestivals += 1;

            if (favIds.size > 0 && Array.isArray(evt?.artistList)) {
              const hasFav = evt.artistList.some((a) => a?.id != null && favIds.has(String(a.id)));
              if (hasFav) s.headliners += 1;
            }
          });
        }

        const next = {};
        rows.forEach((r) => {
          if (!r.locId) {
            next[r.key] = { totalSets: 0, totalFestivals: 0, headliners: 0, missingLocationId: true };
            return;
          }

          const s = statsByLocId[r.locId];
          if (s && typeof s === 'object') {
            next[r.key] = {
              totalSets: Number(s.totalSets || 0),
              totalFestivals: Number(s.totalFestivals || 0),
              headliners: Number(s.headliners || 0)
            };
          } else {
            // If the locationId wasn't returned (or the call errored), treat as 0s with error flag
            next[r.key] = { totalSets: 0, totalFestivals: 0, headliners: 0, error: true };
          }
        });

        if (!cancelled) setDestinationStatsByKey(next);
      } catch (err) {
        console.error('Failed to fetch destination stats:', err);
        const next = {};
        rows.forEach((r) => {
          next[r.key] = r.locId
            ? { totalSets: 0, totalFestivals: 0, headliners: 0, error: true }
            : { totalSets: 0, totalFestivals: 0, headliners: 0, missingLocationId: true };
        });
        if (!cancelled) setDestinationStatsByKey(next);
      } finally {
        if (!cancelled) setDestinationStatsLoading(false);
      }
    };

    fetchDestinationStats();
    return () => {
      cancelled = true;
    };
  }, [userDestinations, userFavoriteArtists]);


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

  const renderContent = () => {
    switch (activeView) {
      case 'events': return <EventsView />;
      case 'places': return <PlacesView />;
      case 'flights':
        return (
          <FlightsView
            onBack={() => { onClearFlightSearch && onClearFlightSearch(); setActiveView('home'); }}
            onSearchFlights={onSearchFlights}
            flightState={flightState}
          />
        );
      case 'artists': return <ArtistsView favoriteArtists={userFavoriteArtists} />;
      case 'plan': return <PlanView />;
      // Itinerary View Case
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
            destinationStatsByKey={destinationStatsByKey}
            destinationStatsLoading={destinationStatsLoading}
          />
        );
    }
  };

  // Calculate if we are in a details view to toggle header visibility
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

          <button onClick={() => handleNav(() => setActiveView('places'))} className={activeView === 'places' ? 'active' : ''}>
            <MapPin size={20} />
            <span>Places</span>
          </button>

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
          
          {/* ITINERARY MENU OPTION */}
          <button onClick={() => handleNav(() => setActiveView('itinerary'))} className={activeView === 'itinerary' ? 'active' : ''}>
            <BookOpen size={20} />
            <span>Itinerary</span>
          </button>

          <button onClick={() => handleNav(() => setActiveView('friends'))} className={activeView === 'friends' ? 'active' : ''}>
            <Users size={20} />
            <span>Friends</span>
          </button>
        </div>
      </aside>

{!collapsed && isMobile() && (
  <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />
)}

      {/* details-view-mode based on the check above */}
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
              src={`${API_BASE_URL}/static/profile_pics/${userProfilePic || 'default.jpg'}`}
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