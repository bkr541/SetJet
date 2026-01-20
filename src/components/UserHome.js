import React, { useState } from 'react';
import {
  Search,
  Plane,
  Calendar,
  Menu,
  Map,
  Users,
  Home
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
  // Desktop State: false = Open (Default), true = Collapsed
  // Using "collapsed" to mean hidden/mini depending on your preference
  const [collapsed, setCollapsed] = useState(false); 
  const [activeView, setActiveView] = useState('home'); 

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
      
      {/* SIDEBAR (Dark Theme Restored) */}
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
          <input
            type="text"
            placeholder="Search"
          />
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
            <Plane size={20} />
            <span>Flights</span>
          </button>

          <button 
            onClick={() => setActiveView('events')}
            className={activeView === 'events' ? 'active' : ''}
          >
            <Calendar size={20} />
            <span>Events</span>
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

      {/* MAIN LAYOUT WRAPPER */}
      <div className={`main-wrapper ${collapsed ? 'collapsed' : ''}`}>
        
        {/* FULL WIDTH HEADER */}
        <header className="main-header">
          <button 
            className="header-toggle-btn"
            onClick={() => setCollapsed(!collapsed)}
          >
            <Menu size={24} />
          </button>
        </header>

        {/* CONTENT AREA */}
        <main className="user-home-content">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}

export default UserHome;