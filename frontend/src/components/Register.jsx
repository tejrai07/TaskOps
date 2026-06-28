import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../config';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        alert("Account created! Please login.");
        navigate('/login');
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="glass-panel auth-panel">
      <span className="auth-icon">✨</span>
      <h2 className="auth-title">Create Account</h2>
      <form onSubmit={handleRegister}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary">Register</button>
      </form>
      <p className="auth-footer">
        Already have an account? <button className="btn-secondary" onClick={() => navigate('/login')}>Login</button>
      </p>
    </div>
  );
};

export default Register;
