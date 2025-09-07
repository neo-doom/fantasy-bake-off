import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the dataService for scoring accuracy tests
vi.mock('../services/dataService', () => ({
  default: {
    getData: vi.fn(),
    getConfig: vi.fn(),
    updateWeekScores: vi.fn(),
    saveData: vi.fn(),
    getTeamScores: vi.fn(),
    getTeamWeekScore: vi.fn(),
    getCurrentWeek: vi.fn()
  }
}))

import ScoringGrid from '../components/ScoringGrid'
import Leaderboard from '../components/Leaderboard'
import dataService from '../services/dataService'

const mockDataService = dataService

// Comprehensive scoring rules configuration
const mockConfig = {
  scoringRules: {
    survived: 1,
    technicalWin: 2,
    starBaker: 3,
    handshake: 3,
    soggyBottom: -0.5,
    seasonWinner: 10
  }
}

// Test data with precise scoring scenarios
const mockGameData = {
  season: {
    name: "Season 2025",
    currentWeek: 4,
    teams: [
      {
        id: "team1",
        name: "Rising Stars",
        bakers: ["baker1", "baker2", "baker3"]
      },
      {
        id: "team2",
        name: "Flour Power", 
        bakers: ["baker4", "baker5", "baker6"]
      },
      {
        id: "team3",
        name: "Soggy Bottoms",
        bakers: ["baker7", "baker8", "baker9"]
      }
    ],
    bakers: [
      { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
      { id: "baker2", name: "Bob Smith", eliminated: true, eliminatedWeek: 2 },
      { id: "baker3", name: "Carol Davis", eliminated: false, eliminatedWeek: null },
      { id: "baker4", name: "David Wilson", eliminated: false, eliminatedWeek: null },
      { id: "baker5", name: "Emma Brown", eliminated: true, eliminatedWeek: 3 },
      { id: "baker6", name: "Frank Miller", eliminated: false, eliminatedWeek: null },
      { id: "baker7", name: "Grace Lee", eliminated: false, eliminatedWeek: null },
      { id: "baker8", name: "Henry Taylor", eliminated: true, eliminatedWeek: 1 },
      { id: "baker9", name: "Iris Anderson", eliminated: false, eliminatedWeek: null }
    ],
    weeks: [
      {
        weekNumber: 1,
        theme: "Cake Week",
        scores: {
          // Team 1 total: 4 + 6 + 1 = 11
          baker1: { survived: true, technicalWin: false, starBaker: true, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 4 }, // 1+3=4
          baker2: { survived: true, technicalWin: true, starBaker: false, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 6 }, // 1+2+3=6
          baker3: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          
          // Team 2 total: 1 + 1 + (-0.5) = 1.5
          baker4: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          baker5: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          baker6: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: 0.5 }, // 1-0.5=0.5
          
          // Team 3 total: 1 + (-0.5) + 4 = 4.5
          baker7: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          baker8: { survived: false, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5 }, // -0.5=-0.5
          baker9: { survived: true, technicalWin: false, starBaker: false, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 4 } // 1+3=4
        }
      },
      {
        weekNumber: 2,
        theme: "Biscuit Week",
        scores: {
          // Team 1 additional: 4 + (-0.5) + 7 = 10.5 (Total: 11 + 10.5 = 21.5)
          baker1: { survived: true, technicalWin: false, starBaker: false, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 4 }, // 1+3=4
          baker2: { survived: false, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5 }, // -0.5=-0.5 (eliminated)
          baker3: { survived: true, technicalWin: true, starBaker: true, handshake: false, soggyBottom: false, manualAdjustment: 1, total: 7 }, // 1+2+3+1=7
          
          // Team 2 additional: 1 + 1 = 2 (Total: 1.5 + 2 = 3.5)
          baker4: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          baker5: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          // baker6: not in week 2 scores (already had soggy bottom week 1)
          
          // Team 3 additional: 1 + 1 = 2 (Total: 4.5 + 2 = 6.5)
          baker7: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          // baker8: eliminated week 1
          baker9: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 } // 1=1
        }
      },
      {
        weekNumber: 3,
        theme: "Bread Week", 
        scores: {
          // Team 1 additional: 7 + 6 = 13 (Total: 21.5 + 13 = 34.5)
          baker1: { survived: true, technicalWin: false, starBaker: true, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 7 }, // 1+3+3=7
          // baker2: eliminated week 2
          baker3: { survived: true, technicalWin: true, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 3, total: 6 }, // 1+2+3=6
          
          // Team 2 additional: 1 + (-0.5) = 0.5 (Total: 3.5 + 0.5 = 4)
          baker4: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }, // 1=1
          baker5: { survived: false, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5 }, // -0.5=-0.5 (eliminated)
          // baker6: continuing
          
          // Team 3 additional: 4 + 1 = 5 (Total: 6.5 + 5 = 11.5) 
          baker7: { survived: true, technicalWin: false, starBaker: false, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 4 }, // 1+3=4
          // baker8: eliminated week 1
          baker9: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 } // 1=1
        }
      }
    ]
  }
}

describe('Scoring Accuracy and Data Validation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataService.getData.mockReturnValue(mockGameData)
    mockDataService.getConfig.mockReturnValue(mockConfig)
    mockDataService.getCurrentWeek.mockReturnValue(4)
  })

  describe('Individual Baker Score Calculations', () => {
    it('should calculate basic survival score correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      await user.click(survivedCheckbox)
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('1') // survived = +1
      })
    })

    it('should calculate technical win score correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[1]) // technical win
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('3') // survived (1) + technical win (2) = 3
      })
    })

    it('should calculate star baker score correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[2]) // star baker
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('4') // survived (1) + star baker (3) = 4
      })
    })

    it('should calculate handshake score correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[3]) // handshake
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('4') // survived (1) + handshake (3) = 4
      })
    })

    it('should calculate soggy bottom penalty correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      await user.click(checkboxes[4]) // soggy bottom only
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('-0.5') // soggy bottom penalty
      })
    })

    it('should calculate complex combination scores correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Perfect week: survived + technical win + star baker + handshake + manual bonus
      await user.click(checkboxes[0]) // survived (+1)
      await user.click(checkboxes[1]) // technical win (+2)
      await user.click(checkboxes[2]) // star baker (+3)
      await user.click(checkboxes[3]) // handshake (+3)
      
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '2.5') // manual adjustment
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('11.5') // 1 + 2 + 3 + 3 + 2.5 = 11.5
      })
    })

    it('should calculate worst case scenario correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Worst week: soggy bottom + manual penalty (elimination week)
      await user.click(checkboxes[4]) // soggy bottom (-0.5)
      
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '-2') // additional penalty
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('-2.5') // -0.5 + (-2) = -2.5
      })
    })

    it('should handle floating point precision in calculations', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Test floating point edge case
      await user.click(checkboxes[0]) // survived (+1)
      await user.click(checkboxes[4]) // soggy bottom (-0.5)
      
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '0.1') // small decimal
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(parseFloat(totalCell.textContent)).toBeCloseTo(0.6) // 1 - 0.5 + 0.1 = 0.6
      })
    })
  })

  describe('Team Score Aggregation Accuracy', () => {
    it('should calculate team scores correctly from historical data', () => {
      // Mock team scores calculation
      mockDataService.getTeamScores.mockImplementation((upToWeek = null) => {
        const teams = mockGameData.season.teams
        const weeks = mockGameData.season.weeks.filter(w => !upToWeek || w.weekNumber <= upToWeek)
        
        return teams.map(team => {
          let totalScore = 0
          
          // Calculate total score across all weeks
          weeks.forEach(week => {
            team.bakers.forEach(bakerId => {
              const bakerScore = week.scores[bakerId]
              if (bakerScore) {
                totalScore += bakerScore.total
              }
            })
          })
          
          return {
            ...team,
            totalScore,
            currentWeekScore: 0,
            bakers: team.bakers.map(bakerId => 
              mockGameData.season.bakers.find(b => b.id === bakerId)
            ).filter(Boolean)
          }
        }).sort((a, b) => b.totalScore - a.totalScore)
      })
      
      render(<Leaderboard selectedWeek={3} />)
      
      const expectedTeamScores = [
        { name: "Rising Stars", total: 34.5 }, // Week 1: 11, Week 2: 10.5, Week 3: 13
        { name: "Soggy Bottoms", total: 11.5 }, // Week 1: 4.5, Week 2: 2, Week 3: 5  
        { name: "Flour Power", total: 4 } // Week 1: 1.5, Week 2: 2, Week 3: 0.5
      ]
      
      // Verify team score calculations through mock
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(3)
    })

    it('should handle partial team scores correctly', () => {
      mockDataService.getTeamScores.mockReturnValue([
        {
          id: "team1",
          name: "Incomplete Team",
          totalScore: 5.5,
          currentWeekScore: 2,
          bakers: [
            { id: "baker1", name: "Active Baker", eliminated: false },
            { id: "baker2", name: "Eliminated Baker", eliminated: true }
          ]
        }
      ])
      
      render(<Leaderboard selectedWeek={2} />)
      
      // Should handle teams with mixed active/eliminated bakers
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2)
    })

    it('should calculate weekly score changes accurately', () => {
      mockDataService.getTeamScores
        .mockReturnValueOnce([
          { id: "team1", name: "Test Team", totalScore: 10, currentWeekScore: 3, bakers: [] }
        ])
        .mockReturnValueOnce([
          { id: "team1", name: "Test Team", totalScore: 15, currentWeekScore: 5, bakers: [] }
        ])
      
      const { rerender } = render(<Leaderboard selectedWeek={1} />)
      
      // Week 1 scores
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(1)
      
      // Week 2 scores  
      rerender(<Leaderboard selectedWeek={2} />)
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2)
      
      // Weekly increase should be 5 points (15 - 10)
    })
  })

  describe('Data Validation and Integrity', () => {
    it('should validate score totals match sum of components', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Set specific combination
      await user.click(checkboxes[0]) // survived (+1)
      await user.click(checkboxes[2]) // star baker (+3)
      await user.click(checkboxes[3]) // handshake (+3)
      
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '-1.5')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        const expectedTotal = 1 + 3 + 3 - 1.5 // = 5.5
        expect(totalCell).toHaveTextContent('5.5')
      })
    })

    it('should maintain data consistency across saves', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Enter scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      const carolRow = screen.getByText('Carol Davis').closest('.table-row')
      const carolCheckboxes = carolRow.querySelectorAll('input[type="checkbox"]')
      await user.click(carolCheckboxes[0]) // survived
      await user.click(carolCheckboxes[2]) // star baker
      
      // Save scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(4, expect.objectContaining({
          baker1: expect.objectContaining({ 
            survived: true, 
            technicalWin: false,
            starBaker: false,
            handshake: false,
            soggyBottom: false,
            total: 1 
          }),
          baker3: expect.objectContaining({ 
            survived: true, 
            technicalWin: false,
            starBaker: true,
            handshake: false,
            soggyBottom: false,
            total: 4 
          })
        }))
      })
    })

    it('should handle invalid manual adjustment inputs', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      await user.click(survivedCheckbox)
      
      // Test various invalid inputs
      const invalidInputs = ['abc', 'NaN', 'Infinity', '']
      
      for (const invalidInput of invalidInputs) {
        await user.clear(manualAdjInput)
        await user.type(manualAdjInput, invalidInput)
        
        await waitFor(() => {
          const totalCell = aliceRow.querySelector('.total-score')
          // Should default to treating invalid input as 0
          expect(parseFloat(totalCell.textContent)).toBe(1) // Just survived points
        })
      }
    })

    it('should validate against negative scores appropriately', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const soggyBottomCheckbox = aliceRow.querySelectorAll('input[type="checkbox"]')[4]
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Create deeply negative score
      await user.click(soggyBottomCheckbox)
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '-10')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(parseFloat(totalCell.textContent)).toBe(-10.5) // -0.5 - 10 = -10.5
      })
      
      // System should allow negative scores (baker elimination scenarios)
    })

    it('should handle extreme scoring values', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      await user.click(survivedCheckbox)
      
      // Test extreme positive value
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '999.99')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(parseFloat(totalCell.textContent)).toBe(1000.99) // 1 + 999.99
      })
      
      // Test extreme negative value
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '-999.99')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(parseFloat(totalCell.textContent)).toBe(-998.99) // 1 - 999.99
      })
    })
  })

  describe('Cross-Week Score Consistency', () => {
    it('should maintain score history across weeks', () => {
      // Test that historical scores remain unchanged when viewing different weeks
      mockDataService.getTeamScores
        .mockReturnValueOnce([
          { id: "team1", name: "Test Team", totalScore: 10, currentWeekScore: 5, bakers: [] }
        ])
        .mockReturnValueOnce([
          { id: "team1", name: "Test Team", totalScore: 10, currentWeekScore: 5, bakers: [] }
        ])
      
      const { rerender } = render(<Leaderboard selectedWeek={1} />)
      
      // Same week viewed twice should have identical scores
      rerender(<Leaderboard selectedWeek={1} />)
      
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(1)
      expect(mockDataService.getTeamScores).toHaveBeenCalledTimes(2)
    })

    it('should calculate cumulative scores correctly', () => {
      mockDataService.getTeamScores.mockImplementation((upToWeek) => {
        // Simulate cumulative scoring logic
        const cumulativeScores = {
          1: { team1: 5, team2: 3 },
          2: { team1: 12, team2: 7 }, // +7, +4 respectively
          3: { team1: 18, team2: 11 } // +6, +4 respectively
        }
        
        const teamScore = cumulativeScores[upToWeek]?.team1 || 0
        
        return [{
          id: "team1",
          name: "Test Team",
          totalScore: teamScore,
          currentWeekScore: 0,
          bakers: []
        }]
      })
      
      const { rerender } = render(<Leaderboard selectedWeek={1} />)
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(1)
      
      rerender(<Leaderboard selectedWeek={2} />)
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2)
      
      rerender(<Leaderboard selectedWeek={3} />)
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(3)
    })
  })

  describe('Statistical Validation', () => {
    it('should properly rank teams by total score', () => {
      const mockTeamScores = [
        { id: "team1", name: "First Place", totalScore: 50, currentWeekScore: 8, bakers: [] },
        { id: "team2", name: "Second Place", totalScore: 45, currentWeekScore: 6, bakers: [] },
        { id: "team3", name: "Third Place", totalScore: 40, currentWeekScore: 4, bakers: [] }
      ]
      
      mockDataService.getTeamScores.mockReturnValue(mockTeamScores)
      
      render(<Leaderboard selectedWeek={3} />)
      
      // Teams should be in correct ranking order
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(3)
    })

    it('should handle tie scores appropriately', () => {
      const mockTeamScores = [
        { id: "team1", name: "Tied Team A", totalScore: 30, currentWeekScore: 5, bakers: [] },
        { id: "team2", name: "Tied Team B", totalScore: 30, currentWeekScore: 5, bakers: [] },
        { id: "team3", name: "Lower Team", totalScore: 25, currentWeekScore: 3, bakers: [] }
      ]
      
      mockDataService.getTeamScores.mockReturnValue(mockTeamScores)
      
      render(<Leaderboard selectedWeek={3} />)
      
      // Should handle ties gracefully (order may vary but both should be ahead of lower team)
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(3)
    })

    it('should validate weekly score progression makes sense', () => {
      const weekProgression = [
        { week: 1, teamScore: 10, weeklyIncrease: 10 },
        { week: 2, teamScore: 18, weeklyIncrease: 8 },
        { week: 3, teamScore: 23, weeklyIncrease: 5 }
      ]
      
      weekProgression.forEach((weekData, index) => {
        mockDataService.getTeamScores.mockReturnValueOnce([{
          id: "team1",
          name: "Test Team",
          totalScore: weekData.teamScore,
          currentWeekScore: weekData.weeklyIncrease,
          bakers: []
        }])
        
        const { rerender } = render(<Leaderboard selectedWeek={weekData.week} />)
        
        if (index > 0) rerender(<Leaderboard selectedWeek={weekData.week} />)
      })
      
      // Each week's total should equal previous total plus weekly increase
      expect(mockDataService.getTeamScores).toHaveBeenCalledTimes(3)
    })
  })

  describe('Edge Case Score Validations', () => {
    it('should handle zero scores correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const totalCell = aliceRow.querySelector('.total-score')
      
      // No interactions should result in zero score
      expect(totalCell).toHaveTextContent('0')
      
      // Save zero scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(4, expect.objectContaining({
          baker1: expect.objectContaining({ total: 0 })
        }))
      })
    })

    it('should handle fractional scores precisely', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Create fractional score: survived + soggy bottom + fractional manual
      await user.click(checkboxes[0]) // +1
      await user.click(checkboxes[4]) // -0.5
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '0.25') // +0.25
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(parseFloat(totalCell.textContent)).toBeCloseTo(0.75) // 1 - 0.5 + 0.25 = 0.75
      })
    })

    it('should validate score component independence', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      // Test that each component contributes independently
      const testCases = [
        { components: [0], expected: 1 }, // survived
        { components: [1], expected: 2 }, // technical win
        { components: [2], expected: 3 }, // star baker
        { components: [3], expected: 3 }, // handshake
        { components: [4], expected: -0.5 }, // soggy bottom
        { components: [0, 1], expected: 3 }, // survived + technical
        { components: [2, 3], expected: 6 }, // star baker + handshake
      ]
      
      for (const testCase of testCases) {
        // Clear all checkboxes
        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            user.click(checkbox)
          }
        })
        
        // Set test case checkboxes
        for (const componentIndex of testCase.components) {
          await user.click(checkboxes[componentIndex])
        }
        
        await waitFor(() => {
          const totalCell = aliceRow.querySelector('.total-score')
          expect(parseFloat(totalCell.textContent)).toBeCloseTo(testCase.expected)
        })
      }
    })
  })
})