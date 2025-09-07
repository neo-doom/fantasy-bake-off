import sampleData from '../data/sampleData.json';
import config from '../config/config.json';

class DataService {
  constructor() {
    this.storageKey = 'fantasy-bakes-data';
    this.configKey = 'fantasy-bakes-config';
    this.initializeData();
  }

  initializeData() {
    const existingData = localStorage.getItem(this.storageKey);
    const existingConfig = localStorage.getItem(this.configKey);
    
    // Force update to latest sample data for development
    // Remove this in production
    localStorage.setItem(this.storageKey, JSON.stringify(sampleData));
    
    if (!existingConfig) {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    }
  }

  getData() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : sampleData;
  }

  saveData(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getConfig() {
    const configData = localStorage.getItem(this.configKey);
    return configData ? JSON.parse(configData) : config;
  }

  saveConfig(configData) {
    localStorage.setItem(this.configKey, JSON.stringify(configData));
  }

  getCurrentWeek() {
    const data = this.getData();
    return data.season.currentWeek;
  }

  getTeams() {
    const data = this.getData();
    return data.season.teams;
  }

  getBakers() {
    const data = this.getData();
    return data.season.bakers;
  }

  getWeeks() {
    const data = this.getData();
    return data.season.weeks;
  }

  getTeamScores(upToWeek = null) {
    const data = this.getData();
    const teams = data.season.teams;
    const bakers = data.season.bakers;
    const weeks = data.season.weeks;
    
    // Filter weeks up to the specified week
    const weeksToInclude = upToWeek ? weeks.filter(w => w.weekNumber <= upToWeek) : weeks;

    return teams.map(team => {
      const teamBakers = team.bakers.map(bakerId => 
        bakers.find(baker => baker.id === bakerId)
      );
      
      const totalScore = weeksToInclude.reduce((weekTotal, week) => {
        const weekScore = team.bakers.reduce((bakerTotal, bakerId) => {
          const bakerScore = week.scores[bakerId];
          return bakerTotal + (bakerScore ? bakerScore.total : 0);
        }, 0);
        return weekTotal + weekScore;
      }, 0);

      const currentWeekScore = upToWeek ? 
        this.getTeamWeekScore(team.id, upToWeek) : 
        this.getTeamWeekScore(team.id, data.season.currentWeek);

      return {
        ...team,
        bakers: teamBakers,
        totalScore,
        currentWeekScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }

  getTeamWeekScore(teamId, weekNumber) {
    const data = this.getData();
    const team = data.season.teams.find(t => t.id === teamId);
    const week = data.season.weeks.find(w => w.weekNumber === weekNumber);
    
    if (!team || !week) return 0;
    
    return team.bakers.reduce((total, bakerId) => {
      const bakerScore = week.scores[bakerId];
      return total + (bakerScore ? bakerScore.total : 0);
    }, 0);
  }

  updateWeekScores(weekNumber, scores) {
    const data = this.getData();
    const weekIndex = data.season.weeks.findIndex(w => w.weekNumber === weekNumber);
    
    if (weekIndex >= 0) {
      data.season.weeks[weekIndex].scores = scores;
    } else {
      data.season.weeks.push({
        weekNumber,
        scores,
        notes: ''
      });
    }
    
    this.saveData(data);
  }

  setWeekActive(weekNumber, isActive) {
    const data = this.getData();
    const week = data.season.weeks.find(w => w.weekNumber === weekNumber);
    if (week) {
      week.active = isActive;
      this.saveData(data);
      return true;
    }
    return false;
  }

  getActiveWeeks() {
    const data = this.getData();
    return data.season.weeks.filter(w => w.active);
  }

  eliminateBaker(bakerId, weekNumber) {
    const data = this.getData();
    const baker = data.season.bakers.find(b => b.id === bakerId);
    if (baker) {
      baker.eliminated = true;
      baker.eliminatedWeek = weekNumber;
      this.saveData(data);
    }
  }

  setCurrentWeek(weekNumber) {
    const data = this.getData();
    const weeks = data.season.weeks;
    const maxWeek = Math.max(...weeks.map(w => w.weekNumber));
    
    if (weekNumber >= 1 && weekNumber <= maxWeek) {
      data.season.currentWeek = weekNumber;
      this.saveData(data);
      return true;
    }
    return false;
  }

  getTotalWeeks() {
    const data = this.getData();
    return data.season.weeks.length;
  }

  getWeekByNumber(weekNumber) {
    const data = this.getData();
    return data.season.weeks.find(w => w.weekNumber === weekNumber);
  }

  updateWeekData(weekNumber, weekData) {
    const data = this.getData();
    const weekIndex = data.season.weeks.findIndex(w => w.weekNumber === weekNumber);
    
    if (weekIndex >= 0) {
      data.season.weeks[weekIndex] = { ...data.season.weeks[weekIndex], ...weekData };
      this.saveData(data);
      return true;
    }
    return false;
  }
}

export default new DataService();