import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import Leaderboard from './Leaderboard';
import './PublicView.css';

function PublicView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(6); // Default to current week

  useEffect(() => {
    const loadData = () => {
      try {
        const gameData = dataService.getData();
        setData(gameData);
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
        <h1>🧁 Fantasy Bakes</h1>
        <p className="subtitle">Great British Bake Off Fantasy League</p>
        <nav className="week-navigation">
          {Array.from({ length: 10 }, (_, i) => {
            const weekNumber = i + 1;
            const isPlayed = data.season.weeks.some(week => week.weekNumber === weekNumber);
            const isCurrent = weekNumber === data.season.currentWeek;
            const isSelected = weekNumber === selectedWeek;
            
            return (
              <button 
                key={weekNumber}
                onClick={() => isPlayed && setSelectedWeek(weekNumber)}
                className={`week-link ${!isPlayed ? 'unplayed' : ''} ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''}`}
                disabled={!isPlayed}
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