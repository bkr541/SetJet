import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format, addMonths, subMonths } from 'date-fns';
import {
  ChevronRight,
  ChevronLeft,
  Calendar as CalendarIcon,
  LayoutList
} from 'lucide-react';
import './UserTimeline.css';

const UserTimeline = ({ apiBaseUrl, isBlackoutDate }) => {
  const [viewMode, setViewMode] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [itineraryData, setItineraryData] = useState({ events: [], flights: [] });
  const [loading, setLoading] = useState(false);

  // Daily itinerary expand/collapse
  const [dayExpanded, setDayExpanded] = useState(true);

  // Timeline centering (mirrors UserHome "Next Up" behavior)
  const todayRef = useRef(null);
  const shouldCenterTodayRef = useRef(false);

  useEffect(() => {
    const fetchItinerary = async () => {
      const email = localStorage.getItem('current_email');
      if (!email) return;

      setLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/api/user_itinerary`, {
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
        console.error('Failed to load itinerary', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItinerary();
  }, [apiBaseUrl]);

  const getDataForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayEvents = (itineraryData.events || []).filter((e) => e.date === dateStr);
    const dayFlights = (itineraryData.flights || []).filter((f) => f.date === dateStr);
    const blackout = isBlackoutDate(date);
    return { dayEvents, dayFlights, isBlackout: blackout };
  };

  // Timeline month navigation (restored)
  const handlePrevMonth = () => setSelectedDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedDate((prev) => addMonths(prev, 1));

  // Expand/collapse default logic per selected date
  useEffect(() => {
    const { dayEvents, dayFlights, isBlackout } = getDataForDate(selectedDate);
    const hasAny =
      (dayEvents?.length || 0) > 0 ||
      (dayFlights?.length || 0) > 0 ||
      !!isBlackout;

    // If there's stuff, start collapsed; if empty, stay expanded to show empty state.
    setDayExpanded(!hasAny);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, itineraryData]);

  // When entering Timeline view, select TODAY and center it in the scroll row
  const handleViewModeChange = (mode) => {
    if (mode === 'timeline') {
      shouldCenterTodayRef.current = true;
      setSelectedDate(new Date()); // ensures today is selected
    }
    setViewMode(mode);
  };

  useEffect(() => {
    if (viewMode !== 'timeline') return;
    if (loading) return;

    const isTodaySelected =
      format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    if (!shouldCenterTodayRef.current) return;
    if (!isTodaySelected) return;

    const t = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
      shouldCenterTodayRef.current = false;
    }, 0);

    return () => clearTimeout(t);
  }, [viewMode, loading, selectedDate]);

  const normalizeSnapshot = (snap) => {
    if (!snap) return null;
    if (typeof snap === 'string') {
      try {
        return JSON.parse(snap);
      } catch {
        return null;
      }
    }
    return snap;
  };

  const getEventDisplayTitle = (evt) => {
    const snap = normalizeSnapshot(
      evt?.snapshot_json ??
        evt?.snapshotJson ??
        evt?.snapshot ??
        evt?.user_event?.snapshot_json ??
        evt?.user_event?.snapshotJson ??
        evt?.user_events?.snapshot_json ??
        evt?.user_events?.snapshotJson ??
        null
    );

    const pick = (...vals) => {
      for (const v of vals) {
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return null;
    };

    const artistName = pick(
      snap?.artist?.name,
      snap?.artistName,
      snap?.artist_name,
      Array.isArray(snap?.artistList) ? snap.artistList?.[0]?.name : null,
      Array.isArray(snap?.artists) ? snap.artists?.[0]?.name : null
    );

    const venueName = pick(
      snap?.venue?.name,
      snap?.venueName,
      snap?.venue_name,
      snap?.location?.name,
      snap?.locationName,
      snap?.place?.name
    );

    const eventName = pick(
      snap?.event?.name,
      snap?.eventName,
      snap?.event_name,
      snap?.event?.eventName,
      snap?.name
    );

    if (eventName) return eventName;

    if (artistName || venueName) {
      if (artistName && venueName) return `${artistName} @ ${venueName}`;
      return artistName || venueName;
    }

    return evt?.title || evt?.name || 'Event';
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
          const isSelected =
            format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          const isToday =
            format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          const { dayEvents, dayFlights, isBlackout } = getDataForDate(d);
          const isWeekend = d.getDay() === 0 || d.getDay() === 6;

          return (
            <button
              key={i}
              type="button"
              ref={isToday ? todayRef : null}
              className={`timeline-day-item ${isSelected ? 'selected' : ''} ${
                isToday ? 'today' : ''
              }`}
              onClick={() => setSelectedDate(d)}
            >
              <span
                className="timeline-day-name"
                style={{
                  color: isSelected ? 'white' : isWeekend ? '#ef4444' : '#1e293b'
                }}
              >
                {format(d, 'EEE')}
              </span>

              <span
                className="timeline-day-num"
                style={{ color: isSelected ? 'white' : '#1e293b' }}
              >
                {format(d, 'd')}
              </span>

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
    const nothingScheduled =
      dayEvents.length === 0 && dayFlights.length === 0 && !isBlackout;

    const setsCount = dayEvents.length;
    const flightsCount = dayFlights.length;
    const hasAny = setsCount > 0 || flightsCount > 0 || !!isBlackout;

    const handleToggleDay = () => {
      if (hasAny) setDayExpanded((prev) => !prev);
    };

    return (
      <div className="timeline-details-list fade-in">
        <button
          type="button"
          onClick={handleToggleDay}
          aria-expanded={hasAny ? dayExpanded : true}
          className="timeline-day-group"
          style={{
            width: '100%',
            textAlign: 'left',
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: hasAny ? 'pointer' : 'default'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <h3 className="timeline-date-header" style={{ margin: 0 }}>
                {format(selectedDate, 'EEEE, MMMM do')}
              </h3>
              <div style={{ marginTop: 6, color: '#7A8799', fontSize: 16 }}>
                Sets: {setsCount} &nbsp;•&nbsp; Flights: {flightsCount}
              </div>
            </div>

            {hasAny && (
              <ChevronRight
                size={20}
                style={{
                  flex: '0 0 auto',
                  transform: dayExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 150ms ease'
                }}
              />
            )}
          </div>
        </button>

        {hasAny && !dayExpanded && (
          <div style={{ marginTop: 10, color: '#7A8799', fontSize: 14 }}>
            Click the day header to expand.
          </div>
        )}

        {(!hasAny || dayExpanded) && (
          <>
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
          </>
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
            type="button"
            className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('calendar')}
          >
            <span className="view-toggle-icon">
              <CalendarIcon size={14} />
            </span>
            <span className="view-toggle-label">Calendar</span>
          </button>

          <button
            type="button"
            className={`view-toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => handleViewModeChange('timeline')}
          >
            <span className="view-toggle-icon">
              <LayoutList size={14} />
            </span>
            <span className="view-toggle-label">Timeline</span>
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
            renderCustomHeader={({ date, decreaseMonth, increaseMonth }) => (
              <div className="itinerary-calendar-header">
                <div
                  className="itinerary-calendar-header-top"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <button
                    type="button"
                    className="calendar-nav-btn"
                    onClick={decreaseMonth}
                    aria-label="Previous Month"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className="itinerary-month-text">{format(date, 'MMMM yyyy')}</div>

                  <button
                    type="button"
                    className="calendar-nav-btn"
                    onClick={increaseMonth}
                    aria-label="Next Month"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="calendar-legend-row" style={{ display: 'flex', justifyContent: 'center', marginTop: 12, gap: 16 }}>
                  <div className="legend-item"><span className="dot blackout" /> Blackout</div>
                  <div className="legend-item"><span className="dot flight" /> Flight</div>
                  <div className="legend-item"><span className="dot event" /> Event</div>
                </div>
              </div>
            )}
            renderDayContents={renderDayContents}
          />

          <div style={{ marginTop: 24 }}>
            {renderTimelineDetails()}
          </div>
        </div>
      )}

      {!loading && viewMode === 'timeline' && (
        <div className="itinerary-timeline-wrapper fade-in">
          <div className="timeline-month-nav">
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="timeline-month-text">
              {format(selectedDate, 'MMMM yyyy')}
            </div>

            <button
              type="button"
              className="calendar-nav-btn"
              onClick={handleNextMonth}
              aria-label="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {renderTimelineDays()}
          {renderTimelineDetails()}
        </div>
      )}
    </div>
  );
};

export default UserTimeline;
