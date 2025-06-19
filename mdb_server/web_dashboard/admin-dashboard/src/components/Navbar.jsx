import React from 'react';

const Navbar = ({ onNavigate, onLogout, currentView }) => {
  return (
    <nav className="navbar">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="navbar-title">TranslationHub Admin</span>
          <div className="nav-links ml-10">
            <button
              className={`nav-link ${currentView === 'reports' ? 'text-primary' : ''}`}
              onClick={() => onNavigate('reports')}
            >
              Reports
            </button>
            <button
              className={`nav-link ${currentView === 'statistics' ? 'text-primary' : ''}`}
              onClick={() => onNavigate('statistics')}
            >
              Statistics
            </button>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;