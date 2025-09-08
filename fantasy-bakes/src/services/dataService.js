import config from '../config/config.json';
import blobStorage from './blobStorage.js';

class DataService {
  constructor() {
    this.configKey = 'fantasy-bakes-config';
    this.dataKey = 'fantasy-bakes-data';
    this.timestampKey = 'fantasy-bakes-timestamp';
    this.sessionKey = 'fantasy-bakes-session';
    this.initializeData();
  }

  initializeData() {
    const existingConfig = localStorage.getItem(this.configKey);
    
    if (!existingConfig) {
      localStorage.setItem(this.configKey, JSON.stringify(config));
    }
  }

  /**
   * Check if this is a new browser session (page refresh)
   */
  isNewSession() {
    const currentSession = sessionStorage.getItem(this.sessionKey);
    if (!currentSession) {
      sessionStorage.setItem(this.sessionKey, Date.now().toString());
      return true;
    }
    return false;
  }

  /**
   * Get cached data from localStorage
   */
  getCachedData() {
    try {
      const cachedData = localStorage.getItem(this.dataKey);
      const timestamp = localStorage.getItem(this.timestampKey);
      
      if (cachedData && timestamp) {
        console.log('📱 Using cached data from localStorage');
        return JSON.parse(cachedData);
      }
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
    }
    return null;
  }

  /**
   * Cache data in localStorage with timestamp
   */
  setCachedData(data) {
    try {
      localStorage.setItem(this.dataKey, JSON.stringify(data));
      localStorage.setItem(this.timestampKey, Date.now().toString());
      console.log('💾 Data cached in localStorage');
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('fantasy-bakes-data-updated', {
        detail: { data }
      }));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Fetch fresh data from remote source
   */
  async fetchFreshData() {
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
      } catch {
        console.log('❌ Local fallback data not available');
      }
      
      throw new Error(`Unable to load data: ${error.message}`);
    }
  }

  /**
   * Smart data loading: cache-first with refresh detection
   */
  async getData() {
    const isNewSession = this.isNewSession();
    
    // On new session (page refresh), always fetch fresh data
    if (isNewSession) {
      console.log('🔄 New session detected, fetching fresh data...');
      try {
        const freshData = await this.fetchFreshData();
        this.setCachedData(freshData);
        return freshData;
      } catch (error) {
        // Fallback to cached data if fresh fetch fails
        const cachedData = this.getCachedData();
        if (cachedData) {
          console.log('⚠️  Using cached data as fallback');
          return cachedData;
        }
        throw error;
      }
    }
    
    // For navigation within same session, use cached data
    const cachedData = this.getCachedData();
    if (cachedData) {
      return cachedData;
    }
    
    // No cached data available, fetch fresh
    console.log('📭 No cached data found, fetching fresh...');
    const freshData = await this.fetchFreshData();
    this.setCachedData(freshData);
    return freshData;
  }

  /**
   * Get data synchronously from cache
   */
  getDataSync() {
    const cachedData = this.getCachedData();
    if (cachedData) {
      return cachedData;
    }
    throw new Error('No cached data available. Use async getData() to fetch fresh data.');
  }

  async saveData(data) {
    // In development mode, we can't save to blob storage due to CORS
    if (import.meta.env.DEV) {
      console.log('💾 Simulating save in development mode...');
      console.log('📊 Data that would be saved:', data);
      // Update cache even in development mode for consistency
      this.setCachedData(data);
      console.log('✅ Save simulated successfully (development mode)');
      return { success: true };
    }

    try {
      console.log('💾 Saving data to blob storage...');
      await blobStorage.saveData(data);
      console.log('✅ Data saved successfully to blob storage');
      
      // Update local cache with new data
      this.setCachedData(data);
      
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

      // Calculate current week score synchronously
      const currentWeekNumber = upToWeek || data.season.currentWeek;
      const currentWeek = weeks.find(w => w.weekNumber === currentWeekNumber);
      const currentWeekScore = currentWeek ? 
        team.bakers.reduce((total, bakerId) => {
          const bakerScore = currentWeek.scores[bakerId];
          return total + (bakerScore ? bakerScore.total : 0);
        }, 0) : 0;

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