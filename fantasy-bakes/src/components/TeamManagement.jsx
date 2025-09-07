import { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import './TeamManagement.css';

function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [bakers, setBakers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = dataService.getData();
    setTeams(data.season.teams);
    setBakers(data.season.bakers);
  };

  const updateTeamName = (teamId, newName) => {
    setTeams(prev => prev.map(team => 
      team.id === teamId ? { ...team, name: newName } : team
    ));
  };

  const updateTeamMembers = (teamId, newMembers) => {
    setTeams(prev => prev.map(team => 
      team.id === teamId ? { ...team, members: newMembers } : team
    ));
  };

  const updateBakerName = (bakerId, newName) => {
    setBakers(prev => prev.map(baker => 
      baker.id === bakerId ? { ...baker, name: newName } : baker
    ));
  };

  const eliminateBaker = (bakerId, weekNumber) => {
    if (window.confirm('Are you sure you want to eliminate this baker?')) {
      setBakers(prev => prev.map(baker => 
        baker.id === bakerId 
          ? { ...baker, eliminated: true, eliminatedWeek: weekNumber }
          : baker
      ));
    }
  };

  const restoreBaker = (bakerId) => {
    setBakers(prev => prev.map(baker => 
      baker.id === bakerId 
        ? { ...baker, eliminated: false, eliminatedWeek: null }
        : baker
    ));
  };

  const saveChanges = () => {
    setLoading(true);
    setMessage('');

    try {
      const data = dataService.getData();
      data.season.teams = teams;
      data.season.bakers = bakers;
      dataService.saveData(data);
      
      setMessage('Changes saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving changes');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBakerTeam = (bakerId) => {
    return teams.find(team => team.bakers.includes(bakerId));
  };

  const currentWeek = dataService.getCurrentWeek();

  return (
    <div className="team-management">
      <div className="management-header">
        <h2>👥 Team & Baker Management</h2>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="management-section">
        <h3>Teams</h3>
        <div className="teams-grid">
          {teams.map(team => (
            <div key={team.id} className="team-card">
              <div className="team-header">
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                  className="team-name-input"
                  placeholder="Team Name"
                />
                <input
                  type="text"
                  value={team.members || ''}
                  onChange={(e) => updateTeamMembers(team.id, e.target.value)}
                  className="team-members-input"
                  placeholder="Team Members (e.g., Bob & Julie)"
                />
              </div>
              
              <div className="team-bakers">
                <h4>Bakers:</h4>
                {team.bakers.map(bakerId => {
                  const baker = bakers.find(b => b.id === bakerId);
                  if (!baker) return null;
                  
                  return (
                    <div key={bakerId} className={`baker-item ${baker.eliminated ? 'eliminated' : ''}`}>
                      <input
                        type="text"
                        value={baker.name}
                        onChange={(e) => updateBakerName(bakerId, e.target.value)}
                        className="baker-name-input"
                      />
                      {baker.eliminated ? (
                        <div className="baker-controls">
                          <span className="elimination-info">
                            Eliminated Week {baker.eliminatedWeek}
                          </span>
                          <button 
                            className="restore-btn"
                            onClick={() => restoreBaker(bakerId)}
                          >
                            Restore
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="eliminate-btn"
                          onClick={() => eliminateBaker(bakerId, currentWeek)}
                        >
                          Eliminate
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="management-section">
        <h3>All Bakers Overview</h3>
        <div className="bakers-table">
          <div className="table-header">
            <div className="baker-name">Baker Name</div>
            <div className="baker-team">Team</div>
            <div className="baker-status">Status</div>
            <div className="baker-actions">Actions</div>
          </div>
          
          {bakers.map(baker => {
            const team = getBakerTeam(baker.id);
            
            return (
              <div key={baker.id} className={`table-row ${baker.eliminated ? 'eliminated' : ''}`}>
                <div className="baker-name">
                  <input
                    type="text"
                    value={baker.name}
                    onChange={(e) => updateBakerName(baker.id, e.target.value)}
                    className="baker-name-input"
                  />
                </div>
                
                <div className="baker-team">
                  {team ? team.name : 'No Team'}
                </div>
                
                <div className="baker-status">
                  {baker.eliminated ? (
                    <span className="status eliminated">
                      Eliminated Week {baker.eliminatedWeek}
                    </span>
                  ) : (
                    <span className="status active">Active</span>
                  )}
                </div>
                
                <div className="baker-actions">
                  {baker.eliminated ? (
                    <button 
                      className="restore-btn"
                      onClick={() => restoreBaker(baker.id)}
                    >
                      Restore
                    </button>
                  ) : (
                    <button 
                      className="eliminate-btn"
                      onClick={() => eliminateBaker(baker.id, currentWeek)}
                    >
                      Eliminate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="management-actions">
        <button 
          className="save-btn"
          onClick={saveChanges}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}

export default TeamManagement;