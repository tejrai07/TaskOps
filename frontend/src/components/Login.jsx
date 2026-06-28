import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';

const Login = ({ setToken }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        navigate('/');
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="glass-panel auth-panel">
      <span className="auth-icon">🔐</span>
      <h2 className="auth-title">Welcome Back</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">Login</button>
      </form>
      <p className="auth-footer">
        New here? <button className="btn-secondary" onClick={() => navigate('/register')}>Create Account</button>
      </p>
    </div>
  );
};

export default Login;
