import React, { useState } from 'react';
import {
  Search,
  Plane,
  Calendar,
  Menu
} from 'lucide-react';
import './UserHome.css';

function UserHome({ onNavigate, userFirstName }) {
  const [collapsed, setCollapsed] = useState(false);

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

        <div className="sidebar-section">
          {!collapsed && <h4>Explore</h4>}

          <button onClick={() => onNavigate('search')}>
            <Plane size={20} />
            {!collapsed && <span>Flights</span>}
          </button>

          <button>
            <Calendar size={20} />
            {!collapsed && <span>Events</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`user-home-content ${collapsed ? 'collapsed' : ''}`}>
        <h2>
          {userFirstName ? `${userFirstName}'s Home` : 'Your Home'}
        </h2>

        <p>
          Welcome back to SetJet ✈️
        </p>
      </main>
    </div>
  );
}

export default UserHome;
