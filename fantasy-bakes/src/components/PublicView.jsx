import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import Leaderboard from './Leaderboard';
import './PublicView.css';

function PublicView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);

  useEffect(() => {
    const loadData = () => {
      try {
        const gameData = dataService.getData();
        setData(gameData);
        
        // Set default selected week to the current week or first active week
        const activeWeeks = gameData.season.weeks.filter(w => w.active);
        if (activeWeeks.length > 0) {
          const currentWeek = activeWeeks.find(w => w.weekNumber === gameData.season.currentWeek);
          const defaultWeek = currentWeek || activeWeeks.sort((a, b) => a.weekNumber - b.weekNumber)[0];
          setSelectedWeek(defaultWeek.weekNumber);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="loading">Loading Fantasy Bakes...</div>;
  }

  if (!data) {
    return <div className="error">Error loading data</div>;
  }

  return (
    <div className="public-view">
      <header className="header">
        <h1>Fantasy Bakes Leaderboard</h1>
        <p className="subtitle">Great British Bake Off Fantasy League</p>
        <nav className="week-navigation">
          {data.season.weeks
            .filter(week => week.active)
            .sort((a, b) => a.weekNumber - b.weekNumber)
            .map(week => {
              const weekNumber = week.weekNumber;
              const isCurrent = weekNumber === data.season.currentWeek;
              const isSelected = weekNumber === selectedWeek;
              
              return (
                <button 
                  key={weekNumber}
                  onClick={() => setSelectedWeek(weekNumber)}
                  className={`week-link ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  Week {weekNumber}
                </button>
              );
            })}
        </nav>
      </header>

      <main className="main-content">
        <Leaderboard selectedWeek={selectedWeek} />
        
        <div className="last-updated">
          Last updated: {new Date().toLocaleString()}
        </div>
      </main>

      <footer className="footer">
        <p>May the best bakers rise to the top! 🥧</p>
      </footer>
    </div>
  );
}

export default PublicView;