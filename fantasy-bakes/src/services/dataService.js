import config from '../config/config.json';
import blobStorage from './blobStorage.js';

class DataService {
  constructor() {
    this.configKey = 'fantasy-bakes-config';
    this.initializeData();
  }

  initializeData() {
    const existingConfig = localStorage.getItem(this.configKey);
    
    if (!existingConfig) {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    }
  }

  /**
   * Get data - always fetch fresh from blob storage
   */
  async getData() {
    // In development, use local data file to avoid CORS issues
    if (import.meta.env.DEV) {
      try {
        console.log('🔄 Loading local data (development mode)...');
        const response = await fetch('/src/data/data.json');
        if (response.ok) {
          const localData = await response.json();
          console.log('✅ Local data loaded successfully');
          return localData;
        }
      } catch (error) {
        console.error('❌ Failed to load local data:', error);
      }
    }

    // In production, try blob storage first
    try {
      console.log('🔄 Fetching fresh data from blob storage...');
      const data = await blobStorage.fetchData();
      console.log('✅ Fresh data loaded from blob storage');
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch from blob storage:', error);
      
      // Try to fall back to local JSON file
      try {
        console.log('🔄 Attempting fallback to local JSON file...');
        const response = await fetch('/src/data/data.json');
        if (response.ok) {
          const localData = await response.json();
          console.log('✅ Using local fallback data');
          return localData;
        }
      } catch (fallbackError) {
        console.log('❌ Local fallback data not available');
      }
      
      throw new Error(`Unable to load data: ${error.message}`);
    }
  }

  /**
   * Get data synchronously - throws error since we don't cache
   */
  getDataSync() {
    throw new Error('Synchronous data access not available. Use async getData() instead.');
  }

  async saveData(data) {
    // In development mode, we can't save to blob storage due to CORS
    if (import.meta.env.DEV) {
      console.log('💾 Simulating save in development mode...');
      console.log('📊 Data that would be saved:', data);
      console.log('✅ Save simulated successfully (development mode)');
      return { success: true };
    }

    try {
      console.log('💾 Saving data to blob storage...');
      await blobStorage.saveData(data);
      console.log('✅ Data saved successfully to blob storage');
      return { success: true };
    } catch (error) {
      console.error('❌ Error saving data to blob storage:', error);
      throw new Error(`Failed to save data to blob storage: ${error.message}`);
    }
  }

  getConfig() {
    const configData = localStorage.getItem(this.configKey);
    return configData ? JSON.parse(configData) : config;
  }

  saveConfig(configData) {
    localStorage.setItem(this.configKey, JSON.stringify(configData));
  }

  async getCurrentWeek() {
    const data = await this.getData();
    return data.season.currentWeek;
  }

  async getTeams() {
    const data = await this.getData();
    return data.season.teams;
  }

  async getBakers() {
    const data = await this.getData();
    return data.season.bakers;
  }

  async getWeeks() {
    const data = await this.getData();
    return data.season.weeks;
  }

  async getTeamScores(upToWeek = null) {
    const data = await this.getData();
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

  async getTeamWeekScore(teamId, weekNumber) {
    const data = await this.getData();
    const team = data.season.teams.find(t => t.id === teamId);
    const week = data.season.weeks.find(w => w.weekNumber === weekNumber);
    
    if (!team || !week) return 0;
    
    return team.bakers.reduce((total, bakerId) => {
      const bakerScore = week.scores[bakerId];
      return total + (bakerScore ? bakerScore.total : 0);
    }, 0);
  }

  async updateWeekScores(weekNumber, scores) {
    const data = await this.getData();
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
    
    await this.saveData(data);
  }

  async setWeekActive(weekNumber, isActive) {
    const data = await this.getData();
    const week = data.season.weeks.find(w => w.weekNumber === weekNumber);
    if (week) {
      week.active = isActive;
      await this.saveData(data);
      return true;
    }
    return false;
  }

  async getActiveWeeks() {
    const data = await this.getData();
    return data.season.weeks.filter(w => w.active);
  }

  async eliminateBaker(bakerId, weekNumber) {
    const data = await this.getData();
    const baker = data.season.bakers.find(b => b.id === bakerId);
    if (baker) {
      baker.eliminated = true;
      baker.eliminatedWeek = weekNumber;
      await this.saveData(data);
    }
  }

  async setCurrentWeek(weekNumber) {
    const data = await this.getData();
    const weeks = data.season.weeks;
    const maxWeek = Math.max(...weeks.map(w => w.weekNumber));
    
    if (weekNumber >= 1 && weekNumber <= maxWeek) {
      data.season.currentWeek = weekNumber;
      await this.saveData(data);
      return true;
    }
    return false;
  }

  async getTotalWeeks() {
    const data = await this.getData();
    return data.season.weeks.length;
  }

  async getWeekByNumber(weekNumber) {
    const data = await this.getData();
    return data.season.weeks.find(w => w.weekNumber === weekNumber);
  }

  async updateWeekData(weekNumber, weekData) {
    const data = await this.getData();
    const weekIndex = data.season.weeks.findIndex(w => w.weekNumber === weekNumber);
    
    if (weekIndex >= 0) {
      data.season.weeks[weekIndex] = { ...data.season.weeks[weekIndex], ...weekData };
      await this.saveData(data);
      return true;
    }
    return false;
  }
}

export default new DataService();