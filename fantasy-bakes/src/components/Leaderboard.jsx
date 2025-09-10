import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import './Leaderboard.css';

function Leaderboard({ selectedWeek }) {
  const [teamScores, setTeamScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekData, setCurrentWeekData] = useState(null);

  useEffect(() => {
    const loadScores = async () => {
      try {
        setLoading(true);
        const scores = await dataService.getTeamScores(selectedWeek);
        setTeamScores(scores);
        
        // Get week data for score breakdown
        const weekData = await dataService.getWeekByNumber(selectedWeek);
        setCurrentWeekData(weekData);
      } catch (error) {
        console.error('Error loading scores:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadScores();

    // Listen for data updates from dataService
    const handleDataUpdate = () => {
      console.log('📡 Leaderboard received data update event');
      // Reload scores with fresh data
      loadScores();
    };

    window.addEventListener('fantasy-bakes-data-updated', handleDataUpdate);

    return () => {
      window.removeEventListener('fantasy-bakes-data-updated', handleDataUpdate);
    };
  }, [selectedWeek]);

  const getBakerWeekScore = (bakerId) => {
    if (!currentWeekData?.scores?.[bakerId]) return null;
    return currentWeekData.scores[bakerId];
  };

  const getBakerPhoto = (bakerId) => {
    // Use generic baker photo names like baker1.jpg, baker2.jpg, etc.
    return `/images/bakers/${baker.name}.jpg`;
  };

  if (loading) {
    return <div className="loading">Loading leaderboard...</div>;
  }

  return (
    <div className="leaderboard-new">
      {/* Week Info as Simple Text */}
      {currentWeekData && (
        <div className="week-info-text">
          <div className="week-theme-text">
            Week {selectedWeek}: {currentWeekData.theme}
          </div>
          {currentWeekData.notes && (
            <div className="week-notes-text">
              {currentWeekData.notes}
            </div>
          )}
        </div>
      )}
      
      <div className="team-cards-grid">
        {teamScores.map((team, index) => (
          <div key={team.id} className={`team-card-new ${index === 0 ? 'leader' : ''}`}>
            {/* Team Header - Single Line */}
            <div className="team-card-header">
              <div className="team-rank">
                <span className="rank-number">#{index + 1}</span>
              </div>
              <div className="team-info-section">
                <div className="team-name">{team.name}</div>
                <div className="team-members">{team.members}</div>
              </div>
              <div className="team-scores-inline">
                <div className="score-item week-score-item">
                  <span className="score-label">Week</span>
                  <span className="score-value">+{team.currentWeekScore}</span>
                </div>
                <div className="score-item total-score-item">
                  <span className="score-label">Total</span>
                  <span className="score-value">{team.totalScore}</span>
                </div>
              </div>
            </div>

            {/* Baker Breakdown Table */}
            <div className="bakers-table">
              <table className="scores-table">
                <thead>
                  <tr>
                    <th className="th-baker">Baker</th>
                    <th className="th-survived">Survived</th>
                    <th className="th-technical">Technical</th>
                    <th className="th-star">Star</th>
                    <th className="th-handshake">Handshake</th>
                    <th className="th-soggy">Soggy</th>
                    <th className="th-total">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {team.bakers.map(baker => {
                    const weekScore = getBakerWeekScore(baker.id);
                    return (
                      <tr key={baker.id} className={`baker-row ${baker.eliminated ? 'eliminated' : ''}`}>
                        <td className="td-baker">
                          <div className="baker-cell">
                            <img 
                              src={getBakerPhoto(baker.id)} 
                              alt={baker.name}
                              className="baker-photo"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/50x50/ccc/666?text=?';
                              }}
                            />
                            <div className="baker-info">
                              <span className="baker-name">{baker.name}</span>
                              {baker.eliminated && <span className="eliminated-badge">Eliminated Week {baker.eliminatedWeek}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="td-center">
                          <span className="score-indicator survived">{weekScore?.survived ? '✓' : '✗'}</span>
                        </td>
                        <td className="td-center">
                          <span className="score-indicator">{weekScore?.technicalWin ? '🏆' : '-'}</span>
                        </td>
                        <td className="td-center">
                          <span className="score-indicator">{weekScore?.starBaker ? '⭐' : '-'}</span>
                        </td>
                        <td className="td-center">
                          <span className="score-indicator">{weekScore?.handshake ? '🤝' : '-'}</span>
                        </td>
                        <td className="td-center">
                          <span className="score-indicator soggy">{weekScore?.soggyBottom ? '🥧' : '-'}</span>
                        </td>
                        <td className="td-center td-total">
                          <strong className="total-score">{weekScore?.total || 0}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Leaderboard;