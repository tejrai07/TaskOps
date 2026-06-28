import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import API_BASE from './config';
import TaskForm from './components/TaskForm';
import ActionDashboard from './components/ActionDashboard';
import Login from './components/Login';
import Register from './components/Register';
import HabitTracker from './components/HabitTracker';

const NavBar = ({ handleLogout }) => {
  const location = useLocation();
  return (
    <div className="nav-bar">
      <div className="nav-links">
        <Link to="/">
          <button className={location.pathname === '/' ? 'active' : ''}>Planner</button>
        </Link>
        <Link to="/habits">
          <button className={location.pathname === '/habits' ? 'active' : ''}>Habits</button>
        </Link>
      </div>
      <button className="btn-secondary" onClick={handleLogout}>Logout</button>
    </div>
  );
};

const Dashboard = ({ token, handleLogout }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch(`${API_BASE}/api/tasks/evaluate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const resultData = await response.json();
      if (!response.ok && (resultData.error === 'Invalid token' || resultData.error === 'Access denied')) {
        handleLogout();
        return;
      }
      setResult(resultData);
    } catch (error) {
      setResult({ error: 'Failed to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TaskForm onSubmit={handleSubmit} loading={loading} />
      <ActionDashboard result={result} />
    </>
  );
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleSetToken = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <BrowserRouter>
      <div className="app-container">
        <header>
          <h1 className="hero-title">TaskOps</h1>
          <p className="hero-subtitle">Deadlines met. Sanity kept.</p>
        </header>

        {token && <NavBar handleLogout={handleLogout} />}

        <Routes>
          <Route path="/login" element={!token ? <Login setToken={handleSetToken} /> : <Navigate to="/" />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={token ? <Dashboard token={token} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/habits" element={token ? <HabitTracker token={token} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
