import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Login from '../components/Login';
import Reports from '../components/Reports';
import Statistics from '../components/Statistics';

const Home = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState(token ? 'reports' : 'login');

  const handleLogin = (newToken) => {
    setToken(newToken);
    setView('reports');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setView('login');
  };

  const handleNavigate = (newView) => {
    if (!token) {
      setView('login');
    } else {
      setView(newView);
    }
  };

  return (
    <>
      {view !== 'login' && (
        <Navbar onNavigate={handleNavigate} onLogout={handleLogout} currentView={view} />
      )}
      <div className="content-container">
        {view === 'login' && <Login onLogin={handleLogin} />}
        {view === 'reports' && token && <Reports token={token} />}
        {view === 'statistics' && token && <Statistics token={token} />}
      </div>
    </>
  );
};

export default Home;