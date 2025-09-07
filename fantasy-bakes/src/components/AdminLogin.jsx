import { useState } from 'react';
import dataService from '../services/dataService';
import './AdminLogin.css';

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const config = dataService.getConfig();
      
      if (password === config.adminPassword) {
        onLogin(true);
      } else {
        setError('Incorrect password');
      }
    } catch {
      setError('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>🔐 Admin Access</h1>
          <p>Enter the admin password to access the Fantasy Bakes management panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading || !password.trim()}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <a href="/">← Back to Public View</a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;