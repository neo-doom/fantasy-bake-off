import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock the real dataService with a more comprehensive implementation
const createMockDataService = () => {
  let mockData = {
    season: {
      name: "Season 2025",
      currentWeek: 3,
      isActive: true,
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
        }
      ],
      bakers: [
        { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
        { id: "baker2", name: "Bob Smith", eliminated: true, eliminatedWeek: 2 },
        { id: "baker3", name: "Carol Davis", eliminated: false, eliminatedWeek: null },
        { id: "baker4", name: "David Wilson", eliminated: false, eliminatedWeek: null },
        { id: "baker5", name: "Emma Brown", eliminated: false, eliminatedWeek: null },
        { id: "baker6", name: "Frank Miller", eliminated: true, eliminatedWeek: 1 }
      ],
      weeks: [
        {
          weekNumber: 1,
          theme: "Cake Week",
          scores: {
            baker1: { survived: true, technicalWin: false, starBaker: true, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 4 },
            baker2: { survived: true, technicalWin: true, starBaker: false, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 6 },
            baker3: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker4: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker5: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker6: { survived: false, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5 }
          },
          notes: "Great first week!"
        },
        {
          weekNumber: 2,
          theme: "Biscuit Week",
          scores: {
            baker1: { survived: true, technicalWin: false, starBaker: false, handshake: true, soggyBottom: false, manualAdjustment: 0, total: 4 },
            baker2: { survived: false, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5 },
            baker3: { survived: true, technicalWin: true, starBaker: true, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 6 },
            baker4: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker5: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }
          },
          notes: "Tough eliminations"
        }
      ]
    }
  }

  let mockConfig = {
    adminPassword: "test123",
    scoringRules: {
      survived: 1,
      technicalWin: 2,
      starBaker: 3,
      handshake: 3,
      soggyBottom: -0.5
    }
  }

  return {
    getData: vi.fn(() => mockData),
    getConfig: vi.fn(() => mockConfig),
    saveData: vi.fn((data) => { mockData = data }),
    updateWeekScores: vi.fn((weekNumber, scores) => {
      const weekIndex = mockData.season.weeks.findIndex(w => w.weekNumber === weekNumber)
      if (weekIndex >= 0) {
        mockData.season.weeks[weekIndex].scores = scores
      } else {
        mockData.season.weeks.push({ weekNumber, scores, notes: '' })
      }
    }),
    advanceWeek: vi.fn(() => {
      mockData.season.currentWeek += 1
    }),
    getTeamScores: vi.fn((upToWeek = null) => {
      const teams = mockData.season.teams
      const bakers = mockData.season.bakers
      const weeks = mockData.season.weeks
      
      const weeksToInclude = upToWeek ? weeks.filter(w => w.weekNumber <= upToWeek) : weeks
      
      return teams.map(team => {
        const teamBakers = team.bakers.map(bakerId => 
          bakers.find(baker => baker.id === bakerId)
        )
        
        const totalScore = weeksToInclude.reduce((weekTotal, week) => {
          const weekScore = team.bakers.reduce((bakerTotal, bakerId) => {
            const bakerScore = week.scores[bakerId]
            return bakerTotal + (bakerScore ? bakerScore.total : 0)
          }, 0)
          return weekTotal + weekScore
        }, 0)

        const currentWeekScore = upToWeek ? 
          this.getTeamWeekScore(team.id, upToWeek) : 
          this.getTeamWeekScore(team.id, mockData.season.currentWeek)

        return {
          ...team,
          bakers: teamBakers,
          totalScore,
          currentWeekScore: currentWeekScore || 0
        }
      }).sort((a, b) => b.totalScore - a.totalScore)
    }),
    getTeamWeekScore: vi.fn((teamId, weekNumber) => {
      const team = mockData.season.teams.find(t => t.id === teamId)
      const week = mockData.season.weeks.find(w => w.weekNumber === weekNumber)
      
      if (!team || !week) return 0
      
      return team.bakers.reduce((total, bakerId) => {
        const bakerScore = week.scores[bakerId]
        return total + (bakerScore ? bakerScore.total : 0)
      }, 0)
    })
  }
}

// Create the mock first
const mockServiceImplementation = createMockDataService()

vi.mock('../services/dataService', () => ({
  default: mockServiceImplementation
}))

import App from '../App'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock sessionStorage for admin tests
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
})

// Mock window.confirm for admin functions
global.confirm = vi.fn()

const renderApp = (initialPath = '/') => {
  window.history.pushState({}, 'Test page', initialPath)
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

describe('Integration Tests - Complete User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue(null)
    global.confirm.mockReturnValue(true)
  })

  describe('Public User Journey - Viewing Leaderboard', () => {
    it('should allow user to browse different weeks and see updated standings', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Should default to current week (3)
      expect(screen.getByText('Week 3')).toHaveClass('selected')
      
      // Should see team standings
      expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      
      // Navigate to Week 1
      await user.click(screen.getByText('Week 1'))
      
      await waitFor(() => {
        expect(screen.getByText('Week 1')).toHaveClass('selected')
        expect(screen.getByText('Team Standings - Week 1')).toBeInTheDocument()
      })
      
      // Navigate to Week 2
      await user.click(screen.getByText('Week 2'))
      
      await waitFor(() => {
        expect(screen.getByText('Week 2')).toHaveClass('selected')
        expect(screen.getByText('Team Standings - Week 2')).toBeInTheDocument()
      })
      
      // Verify leaderboard component receives correct week parameter
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2)
    })

    it('should prevent navigation to unplayed weeks', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Week 4 and beyond should be disabled
      const week4Button = screen.getByText('Week 4')
      expect(week4Button).toBeDisabled()
      
      // Try clicking disabled button
      await user.click(week4Button)
      
      // Should remain on current week
      expect(screen.getByText('Week 3')).toHaveClass('selected')
      expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
    })

    it('should display team rankings with proper scoring data', async () => {
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      })
      
      // Should show teams in score order
      const teamCards = screen.getAllByText(/Rising Stars|Flour Power/)
      expect(teamCards.length).toBeGreaterThanOrEqual(2)
      
      // Should show baker names and elimination status
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Carol Davis')).toBeInTheDocument()
      expect(screen.getByText('David Wilson')).toBeInTheDocument()
      
      // Eliminated bakers should be marked
      const eliminatedBakers = screen.getAllByText(/❌/)
      expect(eliminatedBakers.length).toBeGreaterThan(0)
    })
  })

  describe('Admin User Journey - Complete Score Entry Workflow', () => {
    it('should support admin login to score entry to data persistence flow', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue(null)
      
      renderApp('/admin')
      
      // Should start at login screen
      await waitFor(() => {
        expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
      })
      
      // Enter correct password
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      
      const loginButton = screen.getByRole('button', { name: 'Login' })
      await user.click(loginButton)
      
      // Should be redirected to admin interface
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
        expect(screen.getByText('Weekly Scoring')).toBeInTheDocument()
      })
      
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth', 'true')
    })

    it('should allow complete score entry and save workflow', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Enter scores for active bakers
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceSurvivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(aliceSurvivedCheckbox)
      
      const carolRow = screen.getByText('Carol Davis').closest('.table-row')
      const carolCheckboxes = carolRow.querySelectorAll('input[type="checkbox"]')
      await user.click(carolCheckboxes[0]) // survived
      await user.click(carolCheckboxes[2]) // star baker
      
      // Add week notes
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'Exciting week with great challenges!')
      
      // Save scores
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Verify data service calls
      expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(3, expect.objectContaining({
        baker1: expect.objectContaining({ survived: true, total: 1 }),
        baker3: expect.objectContaining({ survived: true, starBaker: true, total: 4 })
      }))
      expect(mockDataService.saveData).toHaveBeenCalled()
    })

    it('should support tab navigation between admin functions', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('Weekly Scoring')).toHaveClass('active')
      })
      
      // Switch to Team Management
      const teamManagementTab = screen.getByText('Team Management')
      await user.click(teamManagementTab)
      
      await waitFor(() => {
        expect(teamManagementTab).toHaveClass('active')
        expect(screen.getByText('Weekly Scoring')).not.toHaveClass('active')
      })
      
      // Switch back to Weekly Scoring
      const scoringTab = screen.getByText('Weekly Scoring')
      await user.click(scoringTab)
      
      await waitFor(() => {
        expect(scoringTab).toHaveClass('active')
        expect(teamManagementTab).not.toHaveClass('active')
      })
    })

    it('should support week advancement workflow', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      global.confirm.mockReturnValue(true)
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Click advance week button
      const advanceButton = screen.getByText('Advance to Week 4')
      await user.click(advanceButton)
      
      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to advance to the next week? This will increment the current week number.'
      )
      
      await waitFor(() => {
        expect(screen.getByText('Advanced to next week!')).toBeInTheDocument()
      })
      
      expect(mockDataService.advanceWeek).toHaveBeenCalled()
    })

    it('should support logout and return to login', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Logout
      const logoutButton = screen.getByText('Logout')
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
      })
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
    })
  })

  describe('Cross-Component Data Flow', () => {
    it('should reflect admin score changes in public leaderboard', async () => {
      const user = userEvent.setup()
      
      // Start with admin panel, enter scores
      mockSessionStorage.getItem.mockReturnValue('true')
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Enter some scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceSurvivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(aliceSurvivedCheckbox)
      
      // Save scores
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalled()
      })
      
      // Navigate to public view
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Public leaderboard should show updated data
      expect(mockDataService.getTeamScores).toHaveBeenCalled()
    })

    it('should maintain data consistency across navigation', async () => {
      const user = userEvent.setup()
      
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Navigate between weeks
      await user.click(screen.getByText('Week 1'))
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(1)
      
      await user.click(screen.getByText('Week 2'))
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2)
      
      // Data service should be called with correct parameters
      expect(mockDataService.getData).toHaveBeenCalledTimes(1) // Initial load
      expect(mockDataService.getTeamScores).toHaveBeenCalledTimes(3) // Default + 2 navigations
    })

    it('should handle authentication state across different routes', async () => {
      const user = userEvent.setup()
      
      // Start unauthenticated
      mockSessionStorage.getItem.mockReturnValue(null)
      renderApp('/admin')
      
      expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
      
      // Login
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      await user.click(screen.getByRole('button', { name: 'Login' }))
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Simulate session storage update
      mockSessionStorage.getItem.mockReturnValue('true')
      
      // Navigate away and back
      renderApp('/')
      expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      
      renderApp('/admin')
      
      // Should remain authenticated
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling Across Components', () => {
    it('should gracefully handle data service failures', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockDataService.getData.mockImplementation(() => {
        throw new Error('Data service failure')
      })
      
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle authentication failures gracefully', async () => {
      const user = userEvent.setup()
      
      mockDataService.getConfig.mockImplementation(() => {
        throw new Error('Config load failed')
      })
      
      renderApp('/admin')
      
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      await user.click(screen.getByRole('button', { name: 'Login' }))
      
      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument()
      })
      
      // Should remain on login screen
      expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
    })

    it('should handle save operation failures gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      
      mockSessionStorage.getItem.mockReturnValue('true')
      mockDataService.updateWeekScores.mockRejectedValue(new Error('Save failed'))
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Try to save scores
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Error saving scores')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Performance and State Management', () => {
    it('should not cause unnecessary re-renders during navigation', async () => {
      const user = userEvent.setup()
      
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      const initialDataCalls = mockDataService.getData.mock.calls.length
      
      // Navigate between weeks multiple times
      await user.click(screen.getByText('Week 1'))
      await user.click(screen.getByText('Week 2'))
      await user.click(screen.getByText('Week 1'))
      
      // getData should only be called once for initial load
      expect(mockDataService.getData).toHaveBeenCalledTimes(initialDataCalls)
    })

    it('should handle rapid user interactions gracefully', async () => {
      const user = userEvent.setup()
      
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Rapid navigation
      const weeks = ['Week 1', 'Week 2', 'Week 1', 'Week 2', 'Week 1']
      
      for (const week of weeks) {
        await user.click(screen.getByText(week))
      }
      
      // Should end up on Week 1
      await waitFor(() => {
        expect(screen.getByText('Week 1')).toHaveClass('selected')
      })
    })

    it('should maintain component state during complex workflows', async () => {
      const user = userEvent.setup()
      
      mockSessionStorage.getItem.mockReturnValue('true')
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Enter some scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceSurvivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(aliceSurvivedCheckbox)
      
      // Switch tabs
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Management')).toHaveClass('active')
      })
      
      // Switch back to scoring
      await user.click(screen.getByText('Weekly Scoring'))
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Score should still be set
      const aliceRowAfter = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceSurvivedCheckboxAfter = aliceRowAfter.querySelector('input[type="checkbox"]')
      expect(aliceSurvivedCheckboxAfter).toBeChecked()
    })
  })
})