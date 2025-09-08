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
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [currentWeekData, setCurrentWeekData] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const authStatus = sessionStorage.getItem('fantasy-bakes-admin-auth');
      if (authStatus === 'true') {
        setIsAuthenticated(true);
      }
      
      try {
        const gameData = await dataService.getData();
        setData(gameData);
        setSelectedWeek(gameData.season.currentWeek);
        const totalWeeks = await dataService.getTotalWeeks();
        setTotalWeeks(totalWeeks);
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };
    
    loadData();
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

  const handleWeekChange = async (weekNumber) => {
    setSelectedWeek(weekNumber);
    try {
      const weekData = await dataService.getWeekByNumber(weekNumber);
      setCurrentWeekData(weekData);
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  };

  useEffect(() => {
    const loadCurrentWeekData = async () => {
      if (selectedWeek) {
        try {
          const weekData = await dataService.getWeekByNumber(selectedWeek);
          setCurrentWeekData(weekData);
        } catch (error) {
          console.error('Error loading current week data:', error);
        }
      }
    };
    
    loadCurrentWeekData();
  }, [selectedWeek]);

  const handleSetCurrentWeek = async () => {
    if (await dataService.setCurrentWeek(selectedWeek)) {
      const updatedData = await dataService.getData();
      setData(updatedData);
    }
  };

  const navigateWeek = (direction) => {
    const newWeek = selectedWeek + direction;
    if (newWeek >= 1 && newWeek <= totalWeeks) {
      setSelectedWeek(newWeek);
    }
  };

  const toggleWeekActive = async () => {
    if (currentWeekData) {
      const newActiveStatus = !currentWeekData.active;
      if (await dataService.setWeekActive(selectedWeek, newActiveStatus)) {
        const updatedData = await dataService.getData();
        setData(updatedData);
        const updatedWeekData = await dataService.getWeekByNumber(selectedWeek);
        setCurrentWeekData(updatedWeekData);
      }
    }
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
          <span className="season-info">{data.season.name} - Active Week {data.season.currentWeek}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="week-controls">
        <div className="week-navigation">
          <button 
            className="nav-btn" 
            onClick={() => navigateWeek(-1)} 
            disabled={selectedWeek <= 1}
          >
            ← Previous
          </button>
          <div className="week-info">
            <span className="current-week">Week {selectedWeek}</span>
            {currentWeekData && (
              <>
                <span className="week-theme">{currentWeekData.theme}</span>
                <span className={`week-status ${currentWeekData.active ? 'active' : 'inactive'}`}>
                  {currentWeekData.active ? '🟢 Active' : '⭕ Inactive'}
                </span>
              </>
            )}
          </div>
          <button 
            className="nav-btn" 
            onClick={() => navigateWeek(1)} 
            disabled={selectedWeek >= totalWeeks}
          >
            Next →
          </button>
        </div>
        
        <div className="week-actions">
          <select 
            className="week-selector" 
            value={selectedWeek} 
            onChange={(e) => handleWeekChange(parseInt(e.target.value))}
          >
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(weekNum => (
              <option key={weekNum} value={weekNum}>
                Week {weekNum}
              </option>
            ))}
          </select>
          
          <button 
            className={`set-current-btn ${selectedWeek === data.season.currentWeek ? 'current' : ''}`}
            onClick={handleSetCurrentWeek}
            disabled={selectedWeek === data.season.currentWeek}
          >
            {selectedWeek === data.season.currentWeek ? 'Current Week' : 'Set as Current'}
          </button>
          
          <button 
            className={`toggle-active-btn ${currentWeekData?.active ? 'active' : 'inactive'}`}
            onClick={toggleWeekActive}
          >
            {currentWeekData?.active ? 'Deactivate Week' : 'Activate Week'}
          </button>
        </div>
      </div>

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
        {activeTab === 'scoring' && <ScoringGrid selectedWeek={selectedWeek} />}
        {activeTab === 'teams' && <TeamManagement selectedWeek={selectedWeek} />}
      </main>
    </div>
  );
}

export default AdminView;