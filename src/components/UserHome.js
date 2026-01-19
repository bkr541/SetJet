import React, { useState } from 'react';
import {
  Search,
  Plane,
  Calendar,
  Menu,
  Map,
  Users,
  Home // ✅ Added Home Icon
} from 'lucide-react';
import './UserHome.css';

// --- Dashboard Sub-Views ---
const HomeView = ({ userFirstName }) => (
  <div className="dashboard-panel fade-in">
    <h2>
      {userFirstName ? `${userFirstName}'s Home` : 'Your Home'}
    </h2>
    <p>
      Welcome back to SetJet ✈️
    </p>
    {/* Add home dashboard widgets here later */}
  </div>
);

const EventsView = () => (
  <div className="dashboard-panel fade-in">
    <h2>Events</h2>
    <p>Discover upcoming events and festivals.</p>
  </div>
);

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

function UserHome({ onNavigate, userFirstName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeView, setActiveView] = useState('home'); // Default view

  // Helper to render the correct component based on state
  const renderContent = () => {
    switch (activeView) {
      case 'events': return <EventsView />;
      case 'plan': return <PlanView />;
      case 'friends': return <FriendsView />;
      default: return <HomeView userFirstName={userFirstName} />;
    }
  };

  return (
    <div className="user-home-root">
      {/* SIDEBAR */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-top">
          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={20} />
          </button>

          <img
            src="/logos/Logo5.png"
            alt="SetJet"
            className="sidebar-logo"
            onClick={() => setActiveView('home')} // Logo also goes home
            style={{ cursor: 'pointer' }}
          />
        </div>

        <div className="sidebar-search">
          <Search size={18} />
          {!collapsed && (
            <input
              type="text"
              placeholder="Search"
            />
          )}
        </div>

        {/* ✅ NEW: Home Option (Above Explore) */}
        <div className="sidebar-section">
          <button 
            onClick={() => setActiveView('home')}
            className={activeView === 'home' ? 'active' : ''}
          >
            <Home size={20} />
            {!collapsed && <span>Home</span>}
          </button>
        </div>

        {/* Explore Section */}
        <div className="sidebar-section">
          {!collapsed && <h4>Explore</h4>}

          <button onClick={() => onNavigate('search')}>
            <Plane size={20} />
            {!collapsed && <span>Flights</span>}
          </button>

          <button 
            onClick={() => setActiveView('events')}
            className={activeView === 'events' ? 'active' : ''}
          >
            <Calendar size={20} />
            {!collapsed && <span>Events</span>}
          </button>
        </div>

        {/* Tools Section */}
        <div className="sidebar-section">
          {!collapsed && <h4>Tools</h4>}

          <button 
            onClick={() => setActiveView('plan')}
            className={activeView === 'plan' ? 'active' : ''}
          >
            <Map size={20} />
            {!collapsed && <span>Plan</span>}
          </button>

          <button 
            onClick={() => setActiveView('friends')}
            className={activeView === 'friends' ? 'active' : ''}
          >
            <Users size={20} />
            {!collapsed && <span>Friends</span>}
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className={`user-home-content ${collapsed ? 'collapsed' : ''}`}>
        {renderContent()}
      </main>
    </div>
  );
}

export default UserHome;