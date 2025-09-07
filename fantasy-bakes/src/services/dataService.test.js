import { describe, it, expect, beforeEach, vi } from 'vitest'
import DataService from './dataService'

// Mock data for testing
const mockSampleData = {
  season: {
    name: "Season 2025",
    currentWeek: 2,
    isActive: true,
    teams: [
      {
        id: "team1",
        name: "Test Team 1",
        bakers: ["baker1", "baker2"]
      },
      {
        id: "team2", 
        name: "Test Team 2",
        bakers: ["baker3", "baker4"]
      }
    ],
    bakers: [
      {
        id: "baker1",
        name: "Test Baker 1",
        eliminated: false,
        eliminatedWeek: null
      },
      {
        id: "baker2",
        name: "Test Baker 2", 
        eliminated: true,
        eliminatedWeek: 1
      },
      {
        id: "baker3",
        name: "Test Baker 3",
        eliminated: false,
        eliminatedWeek: null
      },
      {
        id: "baker4",
        name: "Test Baker 4",
        eliminated: false,
        eliminatedWeek: null
      }
    ],
    weeks: [
      {
        weekNumber: 1,
        theme: "Test Week 1",
        scores: {
          baker1: {
            survived: true,
            technicalWin: false,
            starBaker: true,
            handshake: false,
            soggyBottom: false,
            manualAdjustment: 0,
            total: 4
          },
          baker2: {
            survived: false,
            technicalWin: false,
            starBaker: false,
            handshake: false,
            soggyBottom: true,
            manualAdjustment: 0,
            total: -0.5
          },
          baker3: {
            survived: true,
            technicalWin: true,
            starBaker: false,
            handshake: true,
            soggyBottom: false,
            manualAdjustment: 0,
            total: 6
          },
          baker4: {
            survived: true,
            technicalWin: false,
            starBaker: false,
            handshake: false,
            soggyBottom: false,
            manualAdjustment: 0,
            total: 1
          }
        },
        notes: "Test week 1"
      }
    ]
  }
}

const mockConfig = {
  adminPassword: "test123",
  scoringRules: {
    survived: 1,
    technicalWin: 2,
    starBaker: 3,
    handshake: 3,
    soggyBottom: -0.5
  }
}

// Mock the imported modules
vi.mock('../data/sampleData.json', () => ({
  default: {
    season: {
      name: "Season 2025",
      currentWeek: 2,
      isActive: true,
      teams: [
        {
          id: "team1",
          name: "Test Team 1",
          bakers: ["baker1", "baker2"]
        },
        {
          id: "team2", 
          name: "Test Team 2",
          bakers: ["baker3", "baker4"]
        }
      ],
      bakers: [
        {
          id: "baker1",
          name: "Test Baker 1",
          eliminated: false,
          eliminatedWeek: null
        },
        {
          id: "baker2",
          name: "Test Baker 2", 
          eliminated: true,
          eliminatedWeek: 1
        },
        {
          id: "baker3",
          name: "Test Baker 3",
          eliminated: false,
          eliminatedWeek: null
        },
        {
          id: "baker4",
          name: "Test Baker 4",
          eliminated: false,
          eliminatedWeek: null
        }
      ],
      weeks: [
        {
          weekNumber: 1,
          theme: "Test Week 1",
          scores: {
            baker1: {
              survived: true,
              technicalWin: false,
              starBaker: true,
              handshake: false,
              soggyBottom: false,
              manualAdjustment: 0,
              total: 4
            },
            baker2: {
              survived: false,
              technicalWin: false,
              starBaker: false,
              handshake: false,
              soggyBottom: true,
              manualAdjustment: 0,
              total: -0.5
            },
            baker3: {
              survived: true,
              technicalWin: true,
              starBaker: false,
              handshake: true,
              soggyBottom: false,
              manualAdjustment: 0,
              total: 6
            },
            baker4: {
              survived: true,
              technicalWin: false,
              starBaker: false,
              handshake: false,
              soggyBottom: false,
              manualAdjustment: 0,
              total: 1
            }
          },
          notes: "Test week 1"
        }
      ]
    }
  }
}))

vi.mock('../config/config.json', () => ({
  default: {
    adminPassword: "test123",
    scoringRules: {
      survived: 1,
      technicalWin: 2,
      starBaker: 3,
      handshake: 3,
      soggyBottom: -0.5
    }
  }
}))

describe('DataService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Data Management', () => {
    it('should retrieve data from localStorage', () => {
      const testData = { test: 'data' }
      localStorage.getItem.mockReturnValue(JSON.stringify(testData))
      
      const result = DataService.getData()
      
      expect(localStorage.getItem).toHaveBeenCalledWith('fantasy-bakes-data')
      expect(result).toEqual(testData)
    })

    it('should save data to localStorage', () => {
      const testData = { test: 'save' }
      
      DataService.saveData(testData)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fantasy-bakes-data',
        JSON.stringify(testData)
      )
    })
  })

  describe('Configuration Management', () => {
    it('should retrieve config from localStorage', () => {
      const testConfig = { test: 'config' }
      localStorage.getItem.mockReturnValue(JSON.stringify(testConfig))
      
      const result = DataService.getConfig()
      
      expect(localStorage.getItem).toHaveBeenCalledWith('fantasy-bakes-config')
      expect(result).toEqual(testConfig)
    })

    it('should return default config when localStorage config is invalid', () => {
      localStorage.getItem.mockReturnValue(null)
      
      const result = DataService.getConfig()
      
      expect(result).toEqual(mockConfig)
    })

    it('should save config to localStorage', () => {
      const testConfig = { test: 'saveConfig' }
      
      DataService.saveConfig(testConfig)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fantasy-bakes-config',
        JSON.stringify(testConfig)
      )
    })
  })

  describe('Data Retrieval Methods', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSampleData))
    })

    it('should get current week', () => {
      const result = DataService.getCurrentWeek()
      expect(result).toBe(2)
    })

    it('should get teams list', () => {
      const result = DataService.getTeams()
      expect(result).toEqual(mockSampleData.season.teams)
      expect(result).toHaveLength(2)
    })

    it('should get bakers list', () => {
      const result = DataService.getBakers()
      expect(result).toEqual(mockSampleData.season.bakers)
      expect(result).toHaveLength(4)
    })

    it('should get weeks data', () => {
      const result = DataService.getWeeks()
      expect(result).toEqual(mockSampleData.season.weeks)
      expect(result).toHaveLength(1)
    })
  })

  describe('Team Score Calculations', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSampleData))
    })

    it('should calculate team scores correctly', () => {
      const result = DataService.getTeamScores()
      
      expect(result).toHaveLength(2)
      
      // Team 1: baker1 (4) + baker2 (-0.5) = 3.5
      const team1 = result.find(team => team.id === 'team1')
      expect(team1.totalScore).toBe(3.5)
      
      // Team 2: baker3 (6) + baker4 (1) = 7
      const team2 = result.find(team => team.id === 'team2')
      expect(team2.totalScore).toBe(7)
      
      // Teams should be sorted by score (descending)
      expect(result[0].id).toBe('team2') // Higher score
      expect(result[1].id).toBe('team1') // Lower score
    })

    it('should calculate team scores up to a specific week', () => {
      // Add a second week to test filtering
      const dataWithTwoWeeks = {
        ...mockSampleData,
        season: {
          ...mockSampleData.season,
          weeks: [
            ...mockSampleData.season.weeks,
            {
              weekNumber: 2,
              theme: "Test Week 2", 
              scores: {
                baker1: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
                baker3: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
                baker4: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }
              }
            }
          ]
        }
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(dataWithTwoWeeks))
      
      const resultWeek1 = DataService.getTeamScores(1)
      const resultWeek2 = DataService.getTeamScores(2)
      
      // Week 1 only
      expect(resultWeek1.find(team => team.id === 'team1').totalScore).toBe(3.5)
      expect(resultWeek1.find(team => team.id === 'team2').totalScore).toBe(7)
      
      // Week 1 + 2
      expect(resultWeek2.find(team => team.id === 'team1').totalScore).toBe(4.5) // 3.5 + 1
      expect(resultWeek2.find(team => team.id === 'team2').totalScore).toBe(9) // 7 + 1 + 1
    })

    it('should include baker details in team scores', () => {
      const result = DataService.getTeamScores()
      
      const team1 = result.find(team => team.id === 'team1')
      expect(team1.bakers).toHaveLength(2)
      expect(team1.bakers[0]).toEqual(expect.objectContaining({
        id: 'baker1',
        name: 'Test Baker 1',
        eliminated: false
      }))
      expect(team1.bakers[1]).toEqual(expect.objectContaining({
        id: 'baker2',
        name: 'Test Baker 2',
        eliminated: true,
        eliminatedWeek: 1
      }))
    })
  })

  describe('Individual Team Week Score Calculation', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSampleData))
    })

    it('should calculate correct team score for a specific week', () => {
      const team1Week1 = DataService.getTeamWeekScore('team1', 1)
      const team2Week1 = DataService.getTeamWeekScore('team2', 1)
      
      expect(team1Week1).toBe(3.5) // baker1 (4) + baker2 (-0.5)
      expect(team2Week1).toBe(7) // baker3 (6) + baker4 (1)
    })

    it('should return 0 for non-existent team', () => {
      const result = DataService.getTeamWeekScore('nonexistent', 1)
      expect(result).toBe(0)
    })

    it('should return 0 for non-existent week', () => {
      const result = DataService.getTeamWeekScore('team1', 99)
      expect(result).toBe(0)
    })

    it('should handle missing baker scores gracefully', () => {
      const dataWithMissingScores = {
        ...mockSampleData,
        season: {
          ...mockSampleData.season,
          weeks: [{
            weekNumber: 1,
            scores: {
              baker1: { total: 5 }
              // baker2 missing
            }
          }]
        }
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(dataWithMissingScores))
      
      const result = DataService.getTeamWeekScore('team1', 1)
      expect(result).toBe(5) // Only baker1's score
    })
  })

  describe('Score Updates', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSampleData))
    })

    it('should update existing week scores', () => {
      const newScores = {
        baker1: { survived: true, total: 10 },
        baker3: { survived: true, total: 15 }
      }
      
      DataService.updateWeekScores(1, newScores)
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fantasy-bakes-data',
        expect.stringContaining('"total":10')
      )
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'fantasy-bakes-data',
        expect.stringContaining('"total":15')
      )
    })

    it('should create new week when updating non-existent week', () => {
      const newScores = {
        baker1: { survived: true, total: 5 }
      }
      
      DataService.updateWeekScores(99, newScores)
      
      const savedData = JSON.parse(localStorage.setItem.mock.calls.find(call => 
        call[0] === 'fantasy-bakes-data'
      )[1])
      
      const newWeek = savedData.season.weeks.find(w => w.weekNumber === 99)
      expect(newWeek).toBeDefined()
      expect(newWeek.scores).toEqual(newScores)
      expect(newWeek.notes).toBe('')
    })
  })

  describe('Season Management', () => {
    beforeEach(() => {
      localStorage.getItem.mockReturnValue(JSON.stringify(mockSampleData))
    })

    it('should advance to next week', () => {
      DataService.advanceWeek()
      
      const savedData = JSON.parse(localStorage.setItem.mock.calls.find(call => 
        call[0] === 'fantasy-bakes-data'
      )[1])
      
      expect(savedData.season.currentWeek).toBe(3) // Was 2, now 3
    })

    it('should eliminate baker correctly', () => {
      DataService.eliminateBaker('baker1', 2)
      
      const savedData = JSON.parse(localStorage.setItem.mock.calls.find(call => 
        call[0] === 'fantasy-bakes-data'
      )[1])
      
      const eliminatedBaker = savedData.season.bakers.find(b => b.id === 'baker1')
      expect(eliminatedBaker.eliminated).toBe(true)
      expect(eliminatedBaker.eliminatedWeek).toBe(2)
    })

    it('should handle elimination of non-existent baker gracefully', () => {
      // This should not throw an error
      expect(() => {
        DataService.eliminateBaker('nonexistent', 2)
      }).not.toThrow()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle corrupted localStorage data', () => {
      localStorage.getItem.mockReturnValue('invalid-json')
      
      // Should not throw and should return sample data
      expect(() => {
        const result = DataService.getData()
        expect(result).toEqual(mockSampleData)
      }).not.toThrow()
    })

    it('should handle empty teams in score calculation', () => {
      const dataWithEmptyTeam = {
        ...mockSampleData,
        season: {
          ...mockSampleData.season,
          teams: [
            ...mockSampleData.season.teams,
            { id: 'team3', name: 'Empty Team', bakers: [] }
          ]
        }
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(dataWithEmptyTeam))
      
      const result = DataService.getTeamScores()
      const emptyTeam = result.find(team => team.id === 'team3')
      
      expect(emptyTeam.totalScore).toBe(0)
      expect(emptyTeam.bakers).toHaveLength(0)
    })

    it('should handle missing weeks array', () => {
      const dataWithoutWeeks = {
        ...mockSampleData,
        season: {
          ...mockSampleData.season,
          weeks: []
        }
      }
      
      localStorage.getItem.mockReturnValue(JSON.stringify(dataWithoutWeeks))
      
      const result = DataService.getTeamScores()
      result.forEach(team => {
        expect(team.totalScore).toBe(0)
      })
    })
  })
})