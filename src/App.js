import React, { useState } from 'react';
import './App.css';
import SearchForm from './components/SearchForm';
import FlightResults from './components/FlightResults';
import LoginSignup from './components/LoginSignup';
import OnboardingPicAndSocial from './components/OnboardingPicAndSocial'; // ✅ Updated Import
import { searchFlightsStreaming, clearLocalCache, planTrip } from './services/api';

function App() {
  // ✅ Auth & Onboarding State
  const [showAuth, setShowAuth] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthCollapsing, setIsAuthCollapsing] = useState(false);

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

  // 1. Handle Standard Login (Skip Onboarding)
  const handleLoginSuccess = () => {
    setIsAuthCollapsing(true);
    setTimeout(() => {
      setShowAuth(false);
      setShowOnboarding(false); // Go straight to app
      setIsAuthCollapsing(false);
    }, 250);
  };

  // 2. Handle Signup Success (Go to Onboarding)
  const handleSignupSuccess = () => {
    setIsAuthCollapsing(true);
    setTimeout(() => {
      setShowAuth(false);
      setShowOnboarding(true); // ✅ Go to Pic/Social setup
      setIsAuthCollapsing(false);
    }, 250);
  };

  // 3. Handle Onboarding Completion (Go to App)
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

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

    console.log('🔄 Searching for return flights:', returnSearchParams);
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

  // ✅ SCREEN 1: AUTH
  if (showAuth) {
    return (
      <div className="App">
        <main className="main">
          <div className="container">
            <div className={`auth-screen ${isAuthCollapsing ? 'collapse' : ''}`}>
              <LoginSignup 
                onLogin={handleLoginSuccess} 
                onDemoLogin={handleLoginSuccess}
                onSignupSuccess={handleSignupSuccess} // ✅ Triggers onboarding
              />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ✅ SCREEN 2: ONBOARDING (Now OnboardingPicAndSocial)
  if (showOnboarding) {
    return (
      <div className="App">
        <main className="main">
          <div className="container">
            {/* Pass handler to finish onboarding */}
            <OnboardingPicAndSocial onComplete={handleOnboardingComplete} />
          </div>
        </main>
      </div>
    );
  }

  // ✅ SCREEN 3: MAIN APP
  return (
    <div className="App">
      <main className="main">
        <div className="container">
          <SearchForm onSearch={handleSearch} loading={loading} />

          {error && (
            <div className="error-message">
              <p>⚠️ {error}</p>
            </div>
          )}

          {loading && (
            <div className="loading-message">
              <div className="spinner"></div>
              <p>
                Searching for flights... {routesSearched}/{totalRoutes} routes searched
              </p>
              {flights.length > 0 && (
                <p className="flights-found">{flights.length} flights found so far</p>
              )}
            </div>
          )}

          {searchParams && flights.length > 0 && (
            <FlightResults
              flights={flights}
              searchParams={searchParams}
              fromCache={fromCache}
              isLoading={loading}
              tripPlannerInfo={tripPlannerInfo}
              buildYourOwnMode={
                searchParams.searchMode === 'build-your-own' ||
                searchParams.searchMode === 'build-your-own-return'
              }
              buildYourOwnStep={buildYourOwnStep}
              selectedOutboundFlight={selectedOutboundFlight}
              onSelectOutbound={handleSelectOutboundFlight}
              onSelectReturn={handleSelectReturnFlight}
              onResetBuildYourOwn={handleResetBuildYourOwn}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 WildPass. Flight data will be scraped from Frontier Airlines.</p>
          <button
            className="clear-cache-btn"
            onClick={() => {
              clearLocalCache();
              alert('Cache cleared! Please search again.');
              setFlights([]);
              setSearchParams(null);
            }}
            title="Clear cached flight data"
          >
            Clear Cache
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;