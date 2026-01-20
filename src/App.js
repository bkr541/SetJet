import React, { useState, useEffect } from 'react';
import './App.css';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import LoginSignup from './components/LoginSignup';
import Onboarding_1 from './components/Onboarding_1';
import UserHome from './components/UserHome'; 
import { searchFlightsStreaming, clearLocalCache, planTrip } from './services/api';
import { ArrowLeft } from 'lucide-react'; 

function App() {
  // ✅ Auth & Onboarding State
  const [showAuth, setShowAuth] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthCollapsing, setIsAuthCollapsing] = useState(false);

  // ✅ New View State ('home' or 'search')
  const [currentView, setCurrentView] = useState('home');
  const [userFirstName, setUserFirstName] = useState('');
  const [userProfilePic, setUserProfilePic] = useState('default.jpg');
  
  // ✅ Artists state
  const [favoriteArtists, setFavoriteArtists] = useState([]); 

  // Search State
  const [searchParams, setSearchParams] = useState(null);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [routesSearched, setRoutesSearched] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [tripPlannerInfo, setTripPlannerInfo] = useState(null);

  // Build-your-own mode state
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [returnFlights, setReturnFlights] = useState([]);
  const [buildYourOwnStep, setBuildYourOwnStep] = useState('outbound');

  // ✅ Fetch User Info
  useEffect(() => {
    if (!showAuth && !showOnboarding) {
        const email = localStorage.getItem('current_email');
        if (email) {
            fetch('http://127.0.0.1:5001/api/get_user_info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })
            .then(res => res.json())
            .then(data => {
                setUserFirstName(data.first_name || '');
                if (data.image_file) setUserProfilePic(data.image_file);

                // ✅ UPDATED: Always set; backend now returns favorite_artists
                setFavoriteArtists(Array.isArray(data.favorite_artists) ? data.favorite_artists : []);
            })
            .catch(err => console.error("Failed to fetch user info:", err));
        }
    }
  }, [showAuth, showOnboarding]);

  // 1. Handle Standard Login
  const handleLoginSuccess = () => {
    setIsAuthCollapsing(true);
    setTimeout(() => {
      setShowAuth(false);
      setShowOnboarding(false);
      setCurrentView('home'); 
      setIsAuthCollapsing(false);
    }, 250);
  };

  // 2. Handle Signup Success
  const handleSignupSuccess = () => {
    setIsAuthCollapsing(true);
    setTimeout(() => {
      setShowAuth(false);
      setShowOnboarding(true); 
      setIsAuthCollapsing(false);
    }, 250);
  };

  // 3. Handle Onboarding Completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setCurrentView('home'); 
  };

  const handleNavigate = (view) => {
    if (view === 'search' || view === 'planner') {
        setCurrentView('search');
    } else {
        console.log("Navigating to:", view);
    }
  };

  const handleBackToHome = () => {
    setFlights([]); 
    setSearchParams(null);
    setCurrentView('home');
  };

  /* ... Flight Handlers ... */

  const handleSelectOutboundFlight = (flight) => {
    setSelectedOutboundFlight(flight);
    setBuildYourOwnStep('return');
    setReturnFlights([]);
    const returnDepartureDate = searchParams.desiredReturnDate || (flight.arrival_date || flight.arrivalDate);
    const returnSearchParams = {
      searchMode: 'build-your-own-return',
      tripType: 'one-way',
      origins: [flight.destination],
      destinations: [flight.origin],
      departureDate: returnDepartureDate,
      returnDate: null
    };
    handleSearch(returnSearchParams);
  };

  const handleSelectReturnFlight = (flight) => {
    const completedTrip = {
      ...selectedOutboundFlight,
      is_round_trip: true,
      return_flight: flight,
      total_price: (selectedOutboundFlight.price || 0) + (flight.price || 0)
    };
    setFlights([completedTrip]);
    setBuildYourOwnStep('complete');
  };

  const handleResetBuildYourOwn = () => {
    setSelectedOutboundFlight(null);
    setReturnFlights([]);
    setBuildYourOwnStep('outbound');
    setFlights([]);
  };

  const handleSearch = async (params) => {
    setSearchParams(params);
    setLoading(true);
    setError(null);
    setFlights([]);

    if (params.searchMode === 'build-your-own') {
      setSelectedOutboundFlight(null);
      setBuildYourOwnStep('outbound');
      setReturnFlights([]);
    }

    setFromCache(false);
    setRoutesSearched(0);
    setTripPlannerInfo(null);

    if (params.tripType === 'trip-planner') {
      try {
        const result = await planTrip(params);
        setFlights(result.flights || []);
        setTripPlannerInfo({
          days_searched: result.days_searched,
          earliest_departure: result.earliest_departure,
          total_options: result.total_options
        });
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to plan trip. Please try again.');
        setLoading(false);
      }
      return;
    }

    const origins = params.origins || [];
    const destinations = params.destinations || [];
    setTotalRoutes(origins.length * destinations.length);

    searchFlightsStreaming(
      params,
      (newFlights) => {
        setFlights(prevFlights => [...prevFlights, ...newFlights]);
        setRoutesSearched(prev => prev + 1);
      },
      (result) => {
        setLoading(false);
        setFromCache(result.fromCache || false);
      },
      (err) => {
        setError(err.message || 'Failed to fetch flights. Please try again.');
        setLoading(false);
      }
    );
  };

  // SCREEN 1: AUTH
  if (showAuth) {
    return (
      <div className="App">
        <main className="main">
          <div className="container">
            <div className={`auth-screen ${isAuthCollapsing ? 'collapse' : ''}`}>
              <LoginSignup 
                onLogin={handleLoginSuccess} 
                onDemoLogin={handleLoginSuccess}
                onSignupSuccess={handleSignupSuccess} 
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // SCREEN 2: ONBOARDING
  if (showOnboarding) {
    return (
      <div className="App">
        <main className="main">
          <div className="container">
            <Onboarding_1 onComplete={handleOnboardingComplete} />
          </div>
        </main>
      </div>
    );
  }

  // ✅ SCREEN 3: MAIN APP (USER HOME OR SEARCH)
  return (
    <div className="App">
      <main className="main">
        <div className="container">
          
          {/* VIEW 1: USER HOME DASHBOARD */}
          {currentView === 'home' && (
            <UserHome 
                onNavigate={handleNavigate} 
                userFirstName={userFirstName}
                userProfilePic={userProfilePic}
                favoriteArtists={favoriteArtists}
            />
          )}

          {/* VIEW 2: SEARCH FLOW */}
          {currentView === 'search' && (
            <div className="fade-in">
              {/* Back Button */}
              <button 
                onClick={handleBackToHome} 
                style={{
                  marginBottom: '20px', 
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
                 <ArrowLeft size={20} /> Back to Home
              </button>

              <SearchForm onSearch={handleSearch} loading={loading} />

              {error && (
                <div className="error-message"><p>⚠️ {error}</p></div>
              )}

              {loading && (
                <div className="loading-message">
                  <div className="spinner"></div>
                  <p>Searching for flights... {routesSearched}/{totalRoutes} routes searched</p>
                  {flights.length > 0 && <p className="flights-found">{flights.length} flights found so far</p>}
                </div>
              )}

              {searchParams && flights.length > 0 && (
                <FlightResults
                  flights={flights}
                  searchParams={searchParams}
                  fromCache={fromCache}
                  isLoading={loading}
                  tripPlannerInfo={tripPlannerInfo}
                  buildYourOwnMode={searchParams.searchMode === 'build-your-own' || searchParams.searchMode === 'build-your-own-return'}
                  buildYourOwnStep={buildYourOwnStep}
                  selectedOutboundFlight={selectedOutboundFlight}
                  onSelectOutbound={handleSelectOutboundFlight}
                  onSelectReturn={handleSelectReturnFlight}
                  onResetBuildYourOwn={handleResetBuildYourOwn}
                />
              )}
            </div>
          )}

        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 WildPass. Flight data will be scraped from Frontier Airlines.</p>
          <button className="clear-cache-btn" onClick={() => { clearLocalCache(); alert('Cache cleared!'); setFlights([]); setSearchParams(null); }}>
            Clear Cache
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;
