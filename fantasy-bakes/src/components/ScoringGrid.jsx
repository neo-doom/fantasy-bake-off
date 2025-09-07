import { useState, useEffect, useCallback } from 'react';
import dataService from '../services/dataService';
import './ScoringGrid.css';

function ScoringGrid({ selectedWeek }) {
  const [bakers, setBakers] = useState([]);
  const [scores, setScores] = useState({});
  const [weekNotes, setWeekNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadWeekData = useCallback(async () => {
    if (!selectedWeek) return;
    
    try {
      const data = await dataService.getData();
      const activeBakers = data.season.bakers.filter(baker => 
        !baker.eliminated || (baker.eliminatedWeek && baker.eliminatedWeek >= selectedWeek)
      );
    
    setBakers(activeBakers);
    
    const existingWeek = data.season.weeks.find(w => w.weekNumber === selectedWeek);
    if (existingWeek) {
      setScores(existingWeek.scores || {});
      setWeekNotes(existingWeek.notes || '');
    } else {
      const initialScores = {};
      activeBakers.forEach(baker => {
        initialScores[baker.id] = {
          survived: false,
          technicalWin: false,
          starBaker: false,
          handshake: false,
          soggyBottom: false,
          manualAdjustment: 0,
          total: 0
        };
      });
      setScores(initialScores);
      setWeekNotes('');
    }
    } catch (error) {
      console.error('Error loading week data:', error);
    }
  }, [selectedWeek]);

  useEffect(() => {
    loadWeekData();
  }, [loadWeekData]);

  const calculateTotal = (bakerScore) => {
    const config = dataService.getConfig();
    let total = 0;
    
    if (bakerScore.survived) total += config.scoringRules.survived;
    if (bakerScore.technicalWin) total += config.scoringRules.technicalWin;
    if (bakerScore.starBaker) total += config.scoringRules.starBaker;
    if (bakerScore.handshake) total += config.scoringRules.handshake;
    if (bakerScore.soggyBottom) total += config.scoringRules.soggyBottom;
    
    total += parseFloat(bakerScore.manualAdjustment || 0);
    
    return total;
  };

  const updateBakerScore = (bakerId, field, value) => {
    setScores(prev => {
      const newScores = { ...prev };
      if (!newScores[bakerId]) {
        newScores[bakerId] = {
          survived: false,
          technicalWin: false,
          starBaker: false,
          handshake: false,
          soggyBottom: false,
          manualAdjustment: 0,
          total: 0
        };
      }
      
      newScores[bakerId] = {
        ...newScores[bakerId],
        [field]: value
      };
      
      newScores[bakerId].total = calculateTotal(newScores[bakerId]);
      
      return newScores;
    });
  };

  const saveWeekScores = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      await dataService.updateWeekScores(selectedWeek, scores);
      
      const data = await dataService.getData();
      const weekIndex = data.season.weeks.findIndex(w => w.weekNumber === selectedWeek);
      if (weekIndex >= 0) {
        data.season.weeks[weekIndex].notes = weekNotes;
      }
      await dataService.saveData(data);
      
      setMessage('Week scores saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving scores');
      console.error('Save error:', error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="scoring-grid">
      <div className="scoring-header">
        <h2>📊 Week {selectedWeek} Scoring</h2>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="scoring-table">
        <div className="table-header">
          <div className="baker-name">Baker</div>
          <div className="score-option">Survived (+1)</div>
          <div className="score-option">Technical Win (+2)</div>
          <div className="score-option">Star Baker (+3)</div>
          <div className="score-option">Handshake (+3)</div>
          <div className="score-option">Soggy Bottom (-0.5)</div>
          <div className="manual-adj">Manual Adj.</div>
          <div className="total-score">Total</div>
        </div>

        {bakers.map(baker => {
          const bakerScore = scores[baker.id] || {
            survived: false,
            technicalWin: false,
            starBaker: false,
            handshake: false,
            soggyBottom: false,
            manualAdjustment: 0,
            total: 0
          };

          return (
            <div key={baker.id} className="table-row">
              <div className="baker-name">
                <strong>{baker.name}</strong>
                {baker.eliminated && <span className="eliminated-badge">Eliminated Week {baker.eliminatedWeek}</span>}
              </div>
              
              <div className="score-option">
                <input
                  type="checkbox"
                  checked={bakerScore.survived}
                  onChange={(e) => updateBakerScore(baker.id, 'survived', e.target.checked)}
                />
              </div>
              
              <div className="score-option">
                <input
                  type="checkbox"
                  checked={bakerScore.technicalWin}
                  onChange={(e) => updateBakerScore(baker.id, 'technicalWin', e.target.checked)}
                />
              </div>
              
              <div className="score-option">
                <input
                  type="checkbox"
                  checked={bakerScore.starBaker}
                  onChange={(e) => updateBakerScore(baker.id, 'starBaker', e.target.checked)}
                />
              </div>
              
              <div className="score-option">
                <input
                  type="checkbox"
                  checked={bakerScore.handshake}
                  onChange={(e) => updateBakerScore(baker.id, 'handshake', e.target.checked)}
                />
              </div>
              
              <div className="score-option">
                <input
                  type="checkbox"
                  checked={bakerScore.soggyBottom}
                  onChange={(e) => updateBakerScore(baker.id, 'soggyBottom', e.target.checked)}
                />
              </div>
              
              <div className="manual-adj">
                <input
                  type="number"
                  step="0.5"
                  value={bakerScore.manualAdjustment}
                  onChange={(e) => updateBakerScore(baker.id, 'manualAdjustment', parseFloat(e.target.value) || 0)}
                />
              </div>
              
              <div className="total-score">
                <strong>{bakerScore.total}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="week-notes">
        <label htmlFor="weekNotes">Week Notes:</label>
        <textarea
          id="weekNotes"
          value={weekNotes}
          onChange={(e) => setWeekNotes(e.target.value)}
          placeholder="Add notes about this week's episode..."
          rows={3}
        />
      </div>

      <div className="scoring-actions">
        <button 
          className="save-btn"
          onClick={saveWeekScores}
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Week Scores'}
        </button>
      </div>
    </div>
  );
}

export default ScoringGrid;