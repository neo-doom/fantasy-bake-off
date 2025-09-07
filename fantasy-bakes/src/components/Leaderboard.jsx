import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import './Leaderboard.css';

function Leaderboard({ selectedWeek }) {
  const [teamScores, setTeamScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScores = () => {
      try {
        const scores = dataService.getTeamScores(selectedWeek);
        setTeamScores(scores);
      } catch (error) {
        console.error('Error loading scores:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScores();
  }, [selectedWeek]);

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard">
      <h2>Team Standings {selectedWeek && `- Week ${selectedWeek}`}</h2>
      <div className="standings-list">
        {teamScores.map((team, index) => (
          <div key={team.id} className={`team-card ${index === 0 ? 'leader' : ''}`}>
            <div className="team-header">
              <div className="position-info">
                <span className="position-number">{index + 1}</span>
                {index === 0 && <span className="crown">👑</span>}
              </div>
              <div className="team-info">
                <h3 className="team-name">{team.name}</h3>
              </div>
              <div className="scores">
                <div className="week-score">+{team.currentWeekScore}</div>
                <div className="total-score">{team.totalScore}</div>
              </div>
            </div>
            
            <div className="bakers-list">
              {team.bakers.map(baker => (
                <span 
                  key={baker.id} 
                  className={`baker-name ${baker.eliminated ? 'eliminated' : ''}`}
                >
                  {baker.name}
                  {baker.eliminated && ' ❌'}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;