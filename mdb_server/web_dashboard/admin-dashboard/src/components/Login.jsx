import React, { useState } from 'react';
import { loginAdmin } from '../apiClient';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Login request payload:', { email, password }); // Debug log
    const response = await loginAdmin(email, password);
    console.log('Login response:', response); // Debug log
    if (response.success) {
      localStorage.setItem('token', response.token);
      onLogin(response.token);
    } else {
      setError(response.message || 'Login failed');
    }
  };

  return (
    <div className="form">
      <h2 className="form-title">Admin Login</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />
        </div>
        <button type="submit" className="form-button">Login</button>
      </form>
    </div>
  );
};

export default Login;