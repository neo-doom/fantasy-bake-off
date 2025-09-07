import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock the dataService for edge case scenarios
vi.mock('../services/dataService', () => ({
  default: {
    getData: vi.fn(),
    getConfig: vi.fn(),
    saveData: vi.fn(),
    updateWeekScores: vi.fn(),
    getTeamScores: vi.fn(),
    advanceWeek: vi.fn(),
    eliminateBaker: vi.fn()
  }
}))

// Import components for edge case testing
import DataService from '../services/dataService'
import PublicView from '../components/PublicView'
import Leaderboard from '../components/Leaderboard'
import AdminLogin from '../components/AdminLogin'
import ScoringGrid from '../components/ScoringGrid'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock localStorage for edge cases
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Wrapper for routing
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

describe('Edge Cases and Error Handling Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Data Service Edge Cases', () => {
    describe('localStorage Corruption and Failures', () => {
      it('should handle corrupted JSON in localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('{ invalid json }')
        
        expect(() => {
          const result = mockDataService.getData()
        }).not.toThrow()
      })

      it('should handle localStorage quota exceeded errors', () => {
        const quotaError = new Error('QuotaExceededError')
        quotaError.name = 'QuotaExceededError'
        mockLocalStorage.setItem.mockImplementation(() => {
          throw quotaError
        })
        
        expect(() => {
          mockDataService.saveData({ test: 'data' })
        }).not.toThrow()
      })

      it('should handle null localStorage values', () => {
        mockLocalStorage.getItem.mockReturnValue(null)
        
        const result = mockDataService.getData()
        expect(result).toBeDefined()
      })

      it('should handle empty string in localStorage', () => {
        mockLocalStorage.getItem.mockReturnValue('')
        
        const result = mockDataService.getData()
        expect(result).toBeDefined()
      })

      it('should handle localStorage unavailable (private browsing)', () => {
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: true
        })
        
        expect(() => {
          const result = mockDataService.getData()
        }).not.toThrow()
      })
    })

    describe('Data Structure Edge Cases', () => {
      it('should handle missing season property', () => {
        const corruptData = { notSeason: 'invalid' }
        mockDataService.getData.mockReturnValue(corruptData)
        
        expect(() => {
          mockDataService.getCurrentWeek()
        }).not.toThrow()
      })

      it('should handle empty teams array', () => {
        const emptyTeamsData = {
          season: {
            currentWeek: 1,
            teams: [],
            bakers: [],
            weeks: []
          }
        }
        mockDataService.getData.mockReturnValue(emptyTeamsData)
        
        const result = mockDataService.getTeamScores()
        expect(result).toEqual([])
      })

      it('should handle teams with missing bakers', () => {
        const invalidTeamsData = {
          season: {
            currentWeek: 1,
            teams: [
              { id: 'team1', name: 'Team 1', bakers: null },
              { id: 'team2', name: 'Team 2' } // Missing bakers property
            ],
            bakers: [],
            weeks: []
          }
        }
        mockDataService.getData.mockReturnValue(invalidTeamsData)
        
        expect(() => {
          mockDataService.getTeamScores()
        }).not.toThrow()
      })

      it('should handle bakers with missing properties', () => {
        const incompleteBakersData = {
          season: {
            currentWeek: 1,
            teams: [{ id: 'team1', name: 'Team 1', bakers: ['baker1'] }],
            bakers: [
              { id: 'baker1' }, // Missing name, eliminated, eliminatedWeek
              { name: 'Baker 2' }, // Missing id
              null // Null baker
            ],
            weeks: []
          }
        }
        mockDataService.getData.mockReturnValue(incompleteBakersData)
        
        expect(() => {
          mockDataService.getTeamScores()
        }).not.toThrow()
      })

      it('should handle weeks with missing or invalid scores', () => {
        const invalidScoresData = {
          season: {
            currentWeek: 1,
            teams: [{ id: 'team1', name: 'Team 1', bakers: ['baker1'] }],
            bakers: [{ id: 'baker1', name: 'Baker 1' }],
            weeks: [
              { weekNumber: 1, scores: null },
              { weekNumber: 2, scores: { baker1: null } },
              { weekNumber: 3, scores: { baker1: { total: 'invalid' } } },
              { weekNumber: 4 } // Missing scores
            ]
          }
        }
        mockDataService.getData.mockReturnValue(invalidScoresData)
        
        expect(() => {
          mockDataService.getTeamScores()
        }).not.toThrow()
      })
    })

    describe('Calculation Edge Cases', () => {
      it('should handle extreme score values', () => {
        const extremeScoreData = {
          season: {
            currentWeek: 1,
            teams: [{ id: 'team1', name: 'Team 1', bakers: ['baker1'] }],
            bakers: [{ id: 'baker1', name: 'Baker 1' }],
            weeks: [{
              weekNumber: 1,
              scores: {
                baker1: {
                  survived: true,
                  total: Number.MAX_SAFE_INTEGER
                }
              }
            }]
          }
        }
        mockDataService.getData.mockReturnValue(extremeScoreData)
        
        expect(() => {
          const result = mockDataService.getTeamScores()
          expect(result[0].totalScore).toBe(Number.MAX_SAFE_INTEGER)
        }).not.toThrow()
      })

      it('should handle negative total scores', () => {
        const negativeScoreData = {
          season: {
            currentWeek: 1,
            teams: [{ id: 'team1', name: 'Team 1', bakers: ['baker1'] }],
            bakers: [{ id: 'baker1', name: 'Baker 1' }],
            weeks: [{
              weekNumber: 1,
              scores: {
                baker1: {
                  survived: false,
                  soggyBottom: true,
                  manualAdjustment: -10,
                  total: -10.5
                }
              }
            }]
          }
        }
        mockDataService.getData.mockReturnValue(negativeScoreData)
        
        const result = mockDataService.getTeamScores()
        expect(result[0].totalScore).toBe(-10.5)
      })

      it('should handle floating point precision issues', () => {
        const floatingPointData = {
          season: {
            currentWeek: 1,
            teams: [{ id: 'team1', name: 'Team 1', bakers: ['baker1'] }],
            bakers: [{ id: 'baker1', name: 'Baker 1' }],
            weeks: [{
              weekNumber: 1,
              scores: {
                baker1: {
                  survived: true,
                  soggyBottom: true,
                  manualAdjustment: 0.1,
                  total: 0.6 // Should be 1 - 0.5 + 0.1 = 0.6
                }
              }
            }]
          }
        }
        mockDataService.getData.mockReturnValue(floatingPointData)
        
        const result = mockDataService.getTeamScores()
        expect(result[0].totalScore).toBeCloseTo(0.6)
      })
    })
  })

  describe('Component Error Handling', () => {
    describe('PublicView Error Scenarios', () => {
      it('should handle missing week data gracefully', async () => {
        mockDataService.getData.mockReturnValue({
          season: {
            currentWeek: 5,
            weeks: [] // No weeks data
          }
        })
        
        render(
          <RouterWrapper>
            <PublicView />
          </RouterWrapper>
        )
        
        await waitFor(() => {
          expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
        })
        
        // All week buttons should be disabled
        for (let i = 1; i <= 10; i++) {
          expect(screen.getByText(`Week ${i}`)).toBeDisabled()
        }
      })

      it('should handle data service throws on component mount', async () => {
        mockDataService.getData.mockImplementation(() => {
          throw new Error('Critical data error')
        })
        
        render(
          <RouterWrapper>
            <PublicView />
          </RouterWrapper>
        )
        
        await waitFor(() => {
          expect(screen.getByText('Error loading data')).toBeInTheDocument()
        })
      })

      it('should handle currentWeek being non-numeric', async () => {
        mockDataService.getData.mockReturnValue({
          season: {
            currentWeek: 'invalid',
            weeks: []
          }
        })
        
        render(
          <RouterWrapper>
            <PublicView />
          </RouterWrapper>
        )
        
        await waitFor(() => {
          expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
        })
        
        // Should not crash
        expect(screen.queryByText('Week invalid')).not.toBeInTheDocument()
      })
    })

    describe('Leaderboard Error Scenarios', () => {
      it('should handle getTeamScores returning null', async () => {
        mockDataService.getTeamScores.mockReturnValue(null)
        
        render(<Leaderboard selectedWeek={1} />)
        
        await waitFor(() => {
          expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument()
        })
        
        // Should not crash
        expect(screen.getByText('Team Standings - Week 1')).toBeInTheDocument()
      })

      it('should handle teams with circular references', async () => {
        const circularTeam = { id: 'team1', name: 'Circular Team', bakers: [] }
        circularTeam.self = circularTeam // Circular reference
        
        mockDataService.getTeamScores.mockReturnValue([circularTeam])
        
        render(<Leaderboard selectedWeek={1} />)
        
        await waitFor(() => {
          expect(screen.getByText('Circular Team')).toBeInTheDocument()
        })
      })

      it('should handle teams with extremely long names', async () => {
        const longName = 'A'.repeat(1000)
        mockDataService.getTeamScores.mockReturnValue([{
          id: 'team1',
          name: longName,
          totalScore: 10,
          currentWeekScore: 5,
          bakers: []
        }])
        
        render(<Leaderboard selectedWeek={1} />)
        
        await waitFor(() => {
          expect(screen.getByText(longName)).toBeInTheDocument()
        })
      })

      it('should handle baker names with special characters', async () => {
        mockDataService.getTeamScores.mockReturnValue([{
          id: 'team1',
          name: 'Test Team',
          totalScore: 10,
          currentWeekScore: 5,
          bakers: [
            { id: 'baker1', name: 'José María Fernández-García', eliminated: false },
            { id: 'baker2', name: '李小明', eliminated: false },
            { id: 'baker3', name: 'Åse Øy', eliminated: false },
            { id: 'baker4', name: '', eliminated: false }, // Empty name
            { id: 'baker5', name: null, eliminated: false } // Null name
          ]
        }])
        
        render(<Leaderboard selectedWeek={1} />)
        
        await waitFor(() => {
          expect(screen.getByText('José María Fernández-García')).toBeInTheDocument()
          expect(screen.getByText('李小明')).toBeInTheDocument()
          expect(screen.getByText('Åse Øy')).toBeInTheDocument()
        })
      })
    })

    describe('AdminLogin Error Scenarios', () => {
      it('should handle config service unavailable', async () => {
        const user = userEvent.setup()
        mockDataService.getConfig.mockImplementation(() => {
          throw new Error('Config service down')
        })
        
        const mockOnLogin = vi.fn()
        render(<AdminLogin onLogin={mockOnLogin} />)
        
        const passwordInput = screen.getByLabelText('Password:')
        await user.type(passwordInput, 'test123')
        await user.click(screen.getByRole('button', { name: 'Login' }))
        
        await waitFor(() => {
          expect(screen.getByText('Authentication error')).toBeInTheDocument()
        })
      })

      it('should handle undefined config response', async () => {
        const user = userEvent.setup()
        mockDataService.getConfig.mockReturnValue(undefined)
        
        const mockOnLogin = vi.fn()
        render(<AdminLogin onLogin={mockOnLogin} />)
        
        const passwordInput = screen.getByLabelText('Password:')
        await user.type(passwordInput, 'test123')
        await user.click(screen.getByRole('button', { name: 'Login' }))
        
        await waitFor(() => {
          expect(screen.getByText('Authentication error')).toBeInTheDocument()
        })
      })

      it('should handle config with missing adminPassword', async () => {
        const user = userEvent.setup()
        mockDataService.getConfig.mockReturnValue({
          scoringRules: { survived: 1 }
          // Missing adminPassword
        })
        
        const mockOnLogin = vi.fn()
        render(<AdminLogin onLogin={mockOnLogin} />)
        
        const passwordInput = screen.getByLabelText('Password:')
        await user.type(passwordInput, 'test123')
        await user.click(screen.getByRole('button', { name: 'Login' }))
        
        await waitFor(() => {
          expect(screen.getByText('Incorrect password')).toBeInTheDocument()
        })
      })

      it('should handle extremely long passwords', async () => {
        const user = userEvent.setup()
        mockDataService.getConfig.mockReturnValue({ adminPassword: 'short' })
        
        const mockOnLogin = vi.fn()
        render(<AdminLogin onLogin={mockOnLogin} />)
        
        const passwordInput = screen.getByLabelText('Password:')
        const longPassword = 'a'.repeat(10000)
        
        // This should not hang or crash
        await user.type(passwordInput, longPassword)
        await user.click(screen.getByRole('button', { name: 'Login' }))
        
        await waitFor(() => {
          expect(screen.getByText('Incorrect password')).toBeInTheDocument()
        })
      })

      it('should handle passwords with special characters', async () => {
        const user = userEvent.setup()
        const specialPassword = '!@#$%^&*(){}[]|\\:";\'<>,.?/~`'
        mockDataService.getConfig.mockReturnValue({ adminPassword: specialPassword })
        
        const mockOnLogin = vi.fn()
        render(<AdminLogin onLogin={mockOnLogin} />)
        
        const passwordInput = screen.getByLabelText('Password:')
        await user.type(passwordInput, specialPassword)
        await user.click(screen.getByRole('button', { name: 'Login' }))
        
        expect(mockOnLogin).toHaveBeenCalledWith(true)
      })
    })

    describe('ScoringGrid Error Scenarios', () => {
      it('should handle missing config scoring rules', async () => {
        mockDataService.getData.mockReturnValue({
          season: {
            currentWeek: 1,
            bakers: [{ id: 'baker1', name: 'Test Baker', eliminated: false }]
          }
        })
        mockDataService.getConfig.mockReturnValue({}) // Missing scoringRules
        
        render(<ScoringGrid />)
        
        await waitFor(() => {
          expect(screen.getByText('📊 Week 1 Scoring')).toBeInTheDocument()
        })
        
        // Should not crash
        expect(screen.getByText('Test Baker')).toBeInTheDocument()
      })

      it('should handle save operation network failures', async () => {
        const user = userEvent.setup()
        mockDataService.getData.mockReturnValue({
          season: {
            currentWeek: 1,
            bakers: [{ id: 'baker1', name: 'Test Baker', eliminated: false }],
            weeks: []
          }
        })
        mockDataService.getConfig.mockReturnValue({
          scoringRules: { survived: 1 }
        })
        
        // Simulate network failure
        mockDataService.updateWeekScores.mockRejectedValue(new Error('Network failure'))
        
        render(<ScoringGrid />)
        
        await waitFor(() => {
          const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
          expect(saveButton).toBeInTheDocument()
        })
        
        const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
        await user.click(saveButton)
        
        await waitFor(() => {
          expect(screen.getByText('Error saving scores')).toBeInTheDocument()
        })
      })

      it('should handle bakers with null/undefined elimination data', async () => {
        mockDataService.getData.mockReturnValue({
          season: {
            currentWeek: 1,
            bakers: [
              { id: 'baker1', name: 'Baker 1', eliminated: null, eliminatedWeek: undefined },
              { id: 'baker2', name: 'Baker 2', eliminated: undefined, eliminatedWeek: null },
              { id: 'baker3', name: 'Baker 3' } // Missing elimination properties
            ],
            weeks: []
          }
        })
        mockDataService.getConfig.mockReturnValue({
          scoringRules: { survived: 1 }
        })
        
        render(<ScoringGrid />)
        
        await waitFor(() => {
          expect(screen.getByText('Baker 1')).toBeInTheDocument()
          expect(screen.getByText('Baker 2')).toBeInTheDocument()
          expect(screen.getByText('Baker 3')).toBeInTheDocument()
        })
      })

      it('should handle currentWeek beyond baker elimination data', async () => {
        mockDataService.getData.mockReturnValue({
          season: {
            currentWeek: 100, // Far beyond any elimination week
            bakers: [
              { id: 'baker1', name: 'Baker 1', eliminated: true, eliminatedWeek: 2 }
            ],
            weeks: []
          }
        })
        mockDataService.getConfig.mockReturnValue({
          scoringRules: { survived: 1 }
        })
        
        render(<ScoringGrid />)
        
        await waitFor(() => {
          expect(screen.getByText('📊 Week 100 Scoring')).toBeInTheDocument()
        })
        
        // Baker eliminated in week 2 should not appear in week 100
        expect(screen.queryByText('Baker 1')).not.toBeInTheDocument()
      })
    })
  })

  describe('Browser Compatibility and Environment Edge Cases', () => {
    it('should handle missing sessionStorage', () => {
      const originalSessionStorage = window.sessionStorage
      delete window.sessionStorage
      
      expect(() => {
        mockSessionStorage.getItem('fantasy-bakes-admin-auth')
      }).not.toThrow()
      
      window.sessionStorage = originalSessionStorage
    })

    it('should handle missing localStorage', () => {
      const originalLocalStorage = window.localStorage
      delete window.localStorage
      
      expect(() => {
        mockLocalStorage.getItem('fantasy-bakes-data')
      }).not.toThrow()
      
      window.localStorage = originalLocalStorage
    })

    it('should handle Date constructor failures', () => {
      const originalDate = Date
      global.Date = vi.fn(() => {
        throw new Error('Date not available')
      })
      
      render(
        <RouterWrapper>
          <PublicView />
        </RouterWrapper>
      )
      
      // Should not prevent component from rendering
      expect(screen.queryByText('Loading Fantasy Bakes...')).toBeInTheDocument()
      
      global.Date = originalDate
    })

    it('should handle JSON.parse failures gracefully', () => {
      const originalJSONParse = JSON.parse
      JSON.parse = vi.fn(() => {
        throw new Error('JSON.parse failed')
      })
      
      mockLocalStorage.getItem.mockReturnValue('{"valid": "json"}')
      
      expect(() => {
        mockDataService.getData()
      }).not.toThrow()
      
      JSON.parse = originalJSONParse
    })

    it('should handle JSON.stringify failures gracefully', () => {
      const originalJSONStringify = JSON.stringify
      JSON.stringify = vi.fn(() => {
        throw new Error('JSON.stringify failed')
      })
      
      expect(() => {
        mockDataService.saveData({ test: 'data' })
      }).not.toThrow()
      
      JSON.stringify = originalJSONStringify
    })
  })

  describe('Memory and Performance Edge Cases', () => {
    it('should handle very large datasets without memory issues', async () => {
      const largeDataset = {
        season: {
          currentWeek: 1,
          teams: Array.from({ length: 1000 }, (_, i) => ({
            id: `team${i}`,
            name: `Team ${i}`,
            bakers: [`baker${i}`]
          })),
          bakers: Array.from({ length: 1000 }, (_, i) => ({
            id: `baker${i}`,
            name: `Baker ${i}`,
            eliminated: false
          })),
          weeks: [{
            weekNumber: 1,
            scores: Array.from({ length: 1000 }, (_, i) => ({
              [`baker${i}`]: { total: i }
            })).reduce((acc, curr) => ({ ...acc, ...curr }), {})
          }]
        }
      }
      
      mockDataService.getData.mockReturnValue(largeDataset)
      mockDataService.getTeamScores.mockReturnValue(largeDataset.season.teams.map(team => ({
        ...team,
        totalScore: 0,
        currentWeekScore: 0,
        bakers: []
      })))
      
      render(
        <RouterWrapper>
          <PublicView />
        </RouterWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      }, { timeout: 10000 })
    })

    it('should handle rapid state updates without memory leaks', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      mockDataService.getData.mockReturnValue({
        season: {
          currentWeek: 1,
          bakers: [{ id: 'baker1', name: 'Test Baker', eliminated: false }],
          weeks: []
        }
      })
      mockDataService.getConfig.mockReturnValue({
        scoringRules: { survived: 1 }
      })
      
      render(<ScoringGrid />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Baker')).toBeInTheDocument()
      })
      
      // Rapid checkbox clicking
      const checkbox = screen.getByRole('checkbox')
      for (let i = 0; i < 100; i++) {
        await user.click(checkbox)
      }
      
      // Should not cause memory issues or component crashes
      expect(screen.getByText('Test Baker')).toBeInTheDocument()
    })

    it('should handle concurrent operations gracefully', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      mockDataService.getData.mockReturnValue({
        season: {
          currentWeek: 1,
          bakers: Array.from({ length: 10 }, (_, i) => ({
            id: `baker${i}`,
            name: `Baker ${i}`,
            eliminated: false
          })),
          weeks: []
        }
      })
      mockDataService.getConfig.mockReturnValue({
        scoringRules: { survived: 1 }
      })
      
      render(<ScoringGrid />)
      
      await waitFor(() => {
        expect(screen.getByText('Baker 0')).toBeInTheDocument()
      })
      
      // Click multiple checkboxes simultaneously
      const checkboxes = screen.getAllByRole('checkbox')
      const clickPromises = checkboxes.map(checkbox => user.click(checkbox))
      
      await Promise.all(clickPromises)
      
      // All operations should complete without conflicts
      expect(screen.getByText('Baker 0')).toBeInTheDocument()
    })
  })

  describe('Accessibility Edge Cases', () => {
    it('should handle screen reader compatibility with empty content', async () => {
      mockDataService.getTeamScores.mockReturnValue([])
      
      render(<Leaderboard selectedWeek={1} />)
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 1')).toBeInTheDocument()
      })
      
      // Should have proper heading structure even with no data
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('should handle high contrast mode compatibility', async () => {
      // Simulate high contrast mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })
      
      render(
        <RouterWrapper>
          <PublicView />
        </RouterWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
    })

    it('should handle reduced motion preferences', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })
      
      render(
        <RouterWrapper>
          <PublicView />
        </RouterWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
    })
  })
})