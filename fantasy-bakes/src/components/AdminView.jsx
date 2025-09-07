import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import AdminLogin from './AdminLogin';
import ScoringGrid from './ScoringGrid';
import TeamManagement from './TeamManagement';
import './AdminView.css';

function AdminView() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('scoring');
  const [data, setData] = useState(null);

  useEffect(() => {
    const authStatus = sessionStorage.getItem('fantasy-bakes-admin-auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    const gameData = dataService.getData();
    setData(gameData);
  }, []);

  const handleLogin = (success) => {
    if (success) {
      setIsAuthenticated(true);
      sessionStorage.setItem('fantasy-bakes-admin-auth', 'true');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('fantasy-bakes-admin-auth');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (!data) {
    return <div className="loading">Loading admin panel...</div>;
  }

  return (
    <div className="admin-view">
      <header className="admin-header">
        <h1>🔧 Fantasy Bakes Admin</h1>
        <div className="admin-info">
          <span className="season-info">{data.season.name} - Week {data.season.currentWeek}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="admin-nav">
        <button 
          className={`nav-tab ${activeTab === 'scoring' ? 'active' : ''}`}
          onClick={() => setActiveTab('scoring')}
        >
          Weekly Scoring
        </button>
        <button 
          className={`nav-tab ${activeTab === 'teams' ? 'active' : ''}`}
          onClick={() => setActiveTab('teams')}
        >
          Team Management
        </button>
      </nav>

      <main className="admin-content">
        {activeTab === 'scoring' && <ScoringGrid />}
        {activeTab === 'teams' && <TeamManagement />}
      </main>
    </div>
  );
}

export default AdminView;