import React, { useEffect, useMemo, useRef, useState } from "react";
import { 
  X, 
  PlaneTakeoff, 
  PlaneLanding, 
  TowerControl, 
  Building2, 
  ChevronLeft, 
  ChevronRight,
  Plane,
  Loader2 
} from "lucide-react";
import "./ExploreRoutes.css";

const API_BASE_URL = "";

const useDebouncedValue = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const LocationAutocomplete = ({
  label,
  placeholder,
  value,
  onChange,
  selected,
  onSelect,
  onClear,
  isArrival = false,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const wrapRef = useRef(null);

  const debounced = useDebouncedValue(value, 300);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const q = (debounced || "").trim();

      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setOpen(true);

      try {
        const res = await fetch(`${API_BASE_URL}/api/locations?keyword=${encodeURIComponent(q)}`);
        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) setResults([]);
          return;
        }
        if (!cancelled) setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching locations:", err);
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <div className="routes-field" ref={wrapRef}>
      <label className="routes-field-label">{label}</label>

      <div className={`routes-input-wrapper ${value || selected ? "has-value" : ""} ${open ? "focused" : ""}`}>
        {isArrival ? (
          <PlaneLanding className="routes-search-icon" size={24} />
        ) : (
          <PlaneTakeoff className="routes-search-icon" size={24} />
        )}

        <div className="routes-input-inner">
          <input
            className="routes-search-box-input"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (value.length >= 2) setOpen(true);
            }}
            placeholder={placeholder}
            autoComplete="off"
          />
        </div>

        {(value || selected) && (
          <X
            className="routes-clear-icon"
            size={24}
            onClick={() => {
              onClear();
              setResults([]);
              setOpen(false);
            }}
          />
        )}
      </div>

      {open && (loading || results.length > 0) && (
        <div className="routes-dropdown">
          {loading && (
            <div className="routes-dropdown-row muted">
              <div className="routes-dropdown-main">Searching…</div>
            </div>
          )}

          {!loading &&
            results.map((result, index) => (
              <div
                key={`${result.value}-${index}`}
                className={`routes-dropdown-row ${result.indent ? "indented" : ""} ${result.is_header ? "is-header" : ""}`}
                onClick={() => {
                  if (!result.is_header) {
                    onSelect(result);
                    setOpen(false);
                  }
                }}
              >
                <div className="routes-dropdown-icon-wrap">
                  {result.type === "Airport" ? <TowerControl size={16} /> : <Building2 size={16} />}
                </div>

                <div className="routes-dropdown-text">
                  {result.is_header ? (
                    <div className="routes-dropdown-main header-text">{result.label}</div>
                  ) : (
                    <>
                      <div className="routes-dropdown-main">
                        <span className="res-value">{result.value}</span>
                        <span className="res-label">{result.label.replace(/^\([^)]+\)\s*/, "")}</span>
                      </div>
                      {!result.indent && <div className="routes-dropdown-sub">{result.country}</div>}
                    </>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const buildMonthCells = (year, monthIndex) => {
  const firstDow = new Date(year, monthIndex, 1).getDay(); 
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const ExploreRoutes = ({ onBack }) => {
  const [departureQuery, setDepartureQuery] = useState("");
  const [arrivalQuery, setArrivalQuery] = useState("");
  const [departure, setDeparture] = useState(null);
  const [arrival, setArrival] = useState(null);

  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [monthIndex, setMonthIndex] = useState(now.getMonth()); 

  const [availableDays, setAvailableDays] = useState([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [availError, setAvailError] = useState("");
  
  const [hasSearched, setHasSearched] = useState(false);

  const sameCityWarning = useMemo(() => {
    if (!departure || !arrival) return "";
    if (departure.value === arrival.value) return "Departure and arrival are the same location.";
    return "";
  }, [departure, arrival]);

  const canSearch = useMemo(() => {
    return Boolean(departure?.value && arrival?.value && !sameCityWarning);
  }, [departure, arrival, sameCityWarning]);

  const monthLabel = useMemo(() => {
    return new Date(year, monthIndex, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [year, monthIndex]);

  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);

  const handleSelectDeparture = (loc) => {
    setDeparture(loc);
    setDepartureQuery(loc.value);
  };

  const handleSelectArrival = (loc) => {
    setArrival(loc);
    setArrivalQuery(loc.value);
  };

  const prevMonth = () => {
    setAvailError("");
    setAvailableDays([]);
    setMonthIndex((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };

  const nextMonth = () => {
    setAvailError("");
    setAvailableDays([]);
    setMonthIndex((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const runAvailabilitySearch = async () => {
    if (!canSearch) return;

    setLoadingAvail(true);
    setAvailError("");
    setAvailableDays([]);
    setHasSearched(false);

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/routes/availabilities?origin=${encodeURIComponent(departure.value)}&destination=${encodeURIComponent(arrival.value)}&year=${encodeURIComponent(year)}&month=${encodeURIComponent(monthIndex + 1)}`
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAvailError(data?.error || "Unable to fetch route availability.");
        return;
      }

      setAvailableDays(Array.isArray(data?.available_days) ? data.available_days : []);
      setHasSearched(true); 
    } catch (e) {
      console.error(e);
      setAvailError("Network error while searching routes.");
    } finally {
      setTimeout(() => {
         setLoadingAvail(false);
      }, 500);
    }
  };

  return (
    <div className="dashboard-panel fade-in no-container-styles full-height-container routes-full-page">
      {loadingAvail && (
        <div className="routes-loading-overlay fade-in">
          <div className="routes-loading-content">
            <Loader2 className="routes-spinner" size={48} />
            <p>Searching Flights...</p>
          </div>
        </div>
      )}

      <div className="artist-rail-header">
        <div className="artist-rail-title-row">
          <div className="artist-rail-text">
            <h3 className="artist-rail-title large-header">
              EXPLORE <span className="accent">ROUTES</span>
            </h3>
            <p className="routes-header-subtitle">Provides all flight schedules from two airport endpoints</p>
          </div>
        </div>
      </div>

      <div className="routes-form-stack">
        
        {/* ✅ Collapsible Form Section */}
        {!hasSearched && (
          <>
            <div className="routes-form-row">
              <LocationAutocomplete
                label="Departure City"
                placeholder="Search any City or Airport"
                value={departureQuery}
                onChange={(v) => {
                  setDepartureQuery(v);
                  setDeparture(null);
                }}
                selected={departure}
                onSelect={handleSelectDeparture}
                onClear={() => {
                  setDeparture(null);
                  setDepartureQuery("");
                }}
              />

              <LocationAutocomplete
                label="Arrival City"
                placeholder="Search any City or Airport"
                value={arrivalQuery}
                onChange={(v) => {
                  setArrivalQuery(v);
                  setArrival(null);
                }}
                selected={arrival}
                onSelect={handleSelectArrival}
                onClear={() => {
                  setArrival(null);
                  setArrivalQuery("");
                }}
                isArrival={true}
              />
            </div>

            {sameCityWarning && <div className="routes-warning">{sameCityWarning}</div>}

            <button 
              className="routes-search-btn" 
              disabled={!canSearch || loadingAvail} 
              onClick={runAvailabilitySearch} 
              type="button"
            >
              <Plane size={20} fill="currentColor" />
              <span>Search Flights</span>
            </button>

            {availError && <div className="routes-warning">{availError}</div>}
          </>
        )}

        {/* ✅ Back Button (Visible in both modes, placed above calendar) */}
        {typeof onBack === "function" && (
          <button className="routes-back-btn" type="button" onClick={onBack}>
            Back
          </button>
        )}

        {/* ✅ Calendar (Only shows after search) */}
        {hasSearched && !loadingAvail && (
          <div className="routes-calendar-wrap fade-in">
            <div className="routes-calendar">
              <div className="routes-calendar-header">
                <button className="routes-cal-nav" type="button" onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft size={18} />
                </button>

                <div className="routes-cal-title-wrap">
                  <div className="routes-cal-title">{monthLabel}</div>
                  <div className="routes-cal-sub">Green days have at least one Frontier (F9) flight</div>
                </div>

                <button className="routes-cal-nav" type="button" onClick={nextMonth} aria-label="Next month">
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="routes-calendar-weekdays">
                <div className="routes-calendar-weekday weekend">SUN</div>
                <div className="routes-calendar-weekday">MON</div>
                <div className="routes-calendar-weekday">TUE</div>
                <div className="routes-calendar-weekday">WED</div>
                <div className="routes-calendar-weekday">THU</div>
                <div className="routes-calendar-weekday">FRI</div>
                <div className="routes-calendar-weekday weekend">SAT</div>
              </div>

              <div className="routes-calendar-grid">
                {cells.map((d, idx) => {
                  const active = d != null && availableDays.includes(d);
                  return (
                    <div className="routes-calendar-cell" key={idx}>
                      {d == null ? <div className="routes-day-dot empty" /> : <div className={`routes-day-dot ${active ? "active" : ""}`}>{d}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ExploreRoutes;