import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'

// Mock the dataService with comprehensive functionality
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
        { id: "baker5", name: "Emma Brown", eliminated: false, eliminatedWeek: null },
        { id: "baker6", name: "Frank Miller", eliminated: true, eliminatedWeek: 1 },
        { id: "baker7", name: "Grace Lee", eliminated: false, eliminatedWeek: null },
        { id: "baker8", name: "Henry Taylor", eliminated: false, eliminatedWeek: null },
        { id: "baker9", name: "Iris Anderson", eliminated: false, eliminatedWeek: null }
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
            baker6: { survived: false, technicalWin: false, starBaker: false, handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5 },
            baker7: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker8: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker9: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }
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
            baker5: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker7: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker8: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 },
            baker9: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }
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
    getCurrentWeek: vi.fn(() => mockData.season.currentWeek),
    getTeamScores: vi.fn((upToWeek = null) => {
      const teams = mockData.season.teams
      const bakers = mockData.season.bakers
      const weeks = mockData.season.weeks
      
      const weeksToInclude = upToWeek ? weeks.filter(w => w.weekNumber <= upToWeek) : weeks
      
      return teams.map(team => {
        const teamBakers = team.bakers.map(bakerId => 
          bakers.find(baker => baker.id === bakerId)
        ).filter(Boolean)
        
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

const mockServiceImplementation = createMockDataService()

vi.mock('../services/dataService', () => ({
  default: mockServiceImplementation
}))

import App from '../App'
import dataService from '../services/dataService'

const mockDataService = dataService

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

// Mock window.confirm
global.confirm = vi.fn()

const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
)

const renderApp = (initialPath = '/') => {
  window.history.pushState({}, 'Test page', initialPath)
  return render(
    <RouterWrapper>
      <App />
    </RouterWrapper>
  )
}

describe('End-to-End User Journey Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue(null)
    global.confirm.mockReturnValue(true)
  })

  describe('Public User Complete Journey', () => {
    it('should support casual fan checking current standings', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // User lands on homepage and sees current week by default
      expect(screen.getByText('Week 3')).toHaveClass('current')
      expect(screen.getByText('Week 3')).toHaveClass('selected')
      
      // User can see team standings for current week
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      })
      
      // User sees teams ranked by total score
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(3)
    })

    it('should support competitive user analyzing weekly performance trends', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // User starts by checking current week
      expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      
      // User navigates back to see Week 1 performance
      await user.click(screen.getByText('Week 1'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 1')).toBeInTheDocument()
        expect(screen.getByText('Week 1')).toHaveClass('selected')
      })
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(1)
      
      // User checks Week 2 to see trend
      await user.click(screen.getByText('Week 2'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 2')).toBeInTheDocument()
        expect(screen.getByText('Week 2')).toHaveClass('selected')
      })
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2)
      
      // User compares with current week again
      await user.click(screen.getByText('Week 3'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      })
      
      // User should see team performance trends across weeks
      expect(mockDataService.getTeamScores).toHaveBeenCalledTimes(4) // Initial + 3 navigation calls
    })

    it('should prevent user from accessing future weeks', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Weeks 4+ should be disabled (current week is 3)
      const week4Button = screen.getByText('Week 4')
      const week5Button = screen.getByText('Week 5')
      
      expect(week4Button).toBeDisabled()
      expect(week5Button).toBeDisabled()
      expect(week4Button).toHaveClass('unplayed')
      
      // User tries to click disabled week
      await user.click(week4Button)
      
      // Should remain on current selection
      expect(screen.getByText('Week 3')).toHaveClass('selected')
      expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
    })

    it('should support user sharing specific week results', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // User navigates to specific week they want to share
      await user.click(screen.getByText('Week 1'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 1')).toBeInTheDocument()
      })
      
      // User can see the URL would reflect Week 1 (if URL routing was implemented)
      // For now, they see Week 1 standings that they could screenshot/share
      expect(screen.getByText('Week 1')).toHaveClass('selected')
    })

    it('should handle user browsing during live episode (current week)', async () => {
      const user = userEvent.setup()
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // User is on current week during live episode
      expect(screen.getByText('Week 3')).toHaveClass('current')
      
      // Standings show current state
      expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      
      // Last updated timestamp shows recent update
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })
  })

  describe('Admin Complete Season Management Journey', () => {
    it('should support admin complete episode scoring workflow', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue(null) // Start unauthenticated
      
      renderApp('/admin')
      
      // Step 1: Admin logs in
      await waitFor(() => {
        expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
      })
      
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      await user.click(screen.getByRole('button', { name: 'Login' }))
      
      // Step 2: Admin accesses scoring interface
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Step 3: Admin enters scores for all active bakers
      const activeBakerNames = [
        'Alice Johnson', 'Carol Davis', 'David Wilson', 
        'Emma Brown', 'Grace Lee', 'Henry Taylor', 'Iris Anderson'
      ]
      
      // Everyone survived this week
      for (const bakerName of activeBakerNames) {
        const bakerRow = screen.getByText(bakerName).closest('.table-row')
        const survivedCheckbox = bakerRow.querySelector('input[type="checkbox"]')
        await user.click(survivedCheckbox)
      }
      
      // Alice gets Star Baker and handshake
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceCheckboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      await user.click(aliceCheckboxes[2]) // star baker
      await user.click(aliceCheckboxes[3]) // handshake
      
      // Grace gets Technical Win
      const graceRow = screen.getByText('Grace Lee').closest('.table-row')
      const graceCheckboxes = graceRow.querySelectorAll('input[type="checkbox"]')
      await user.click(graceCheckboxes[1]) // technical win
      
      // Henry gets soggy bottom (but survives)
      const henryRow = screen.getByText('Henry Taylor').closest('.table-row')
      const henryCheckboxes = henryRow.querySelectorAll('input[type="checkbox"]')
      await user.click(henryCheckboxes[4]) // soggy bottom
      
      // Step 4: Admin adds episode notes
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'Alice dominated this week with perfect technique. Grace showed great improvement. Henry struggled with timing but his flavors saved him.')
      
      // Step 5: Admin saves all scores
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Verify data was saved correctly
      expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(3, expect.objectContaining({
        baker1: expect.objectContaining({ 
          survived: true, 
          starBaker: true, 
          handshake: true, 
          total: 7 // 1 + 3 + 3 = 7
        }),
        baker7: expect.objectContaining({ 
          survived: true, 
          technicalWin: true, 
          total: 3 // 1 + 2 = 3
        }),
        baker8: expect.objectContaining({ 
          survived: true, 
          soggyBottom: true, 
          total: 0.5 // 1 - 0.5 = 0.5
        })
      }))
    })

    it('should support admin correcting mistakes in previous episode', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true') // Already authenticated
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Admin realizes they need to correct Week 2 scores
      // They would need to modify current week to 2, or have week navigation
      // For this test, we'll simulate correcting current week scores
      
      // Admin loads existing scores (Week 3 should be empty initially)
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceTotalCell = aliceRow.querySelector('.total-score')
      expect(aliceTotalCell).toHaveTextContent('0') // No scores entered yet
      
      // Admin realizes Alice should have gotten handshake in addition to survival
      const aliceCheckboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      await user.click(aliceCheckboxes[0]) // survived
      await user.click(aliceCheckboxes[3]) // handshake (correction)
      
      await waitFor(() => {
        expect(aliceTotalCell).toHaveTextContent('4') // 1 + 3 = 4
      })
      
      // Admin saves correction
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
    })

    it('should support admin managing team compositions', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Admin switches to Team Management
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByText('👥 Team & Baker Management')).toBeInTheDocument()
      })
      
      // Admin updates team name
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      await user.clear(teamNameInput)
      await user.type(teamNameInput, 'Championship Stars')
      
      // Admin corrects baker name
      const bakerNameInput = screen.getAllByDisplayValue('Alice Johnson')[0]
      await user.clear(bakerNameInput)
      await user.type(bakerNameInput, 'Alice Johnson-Smith')
      
      // Admin eliminates a baker who was incorrectly marked as active
      const bobRow = screen.getByDisplayValue('Bob Smith').closest('.table-row')
      // Bob is already eliminated, so admin can restore if needed
      const restoreButton = bobRow.querySelector('.restore-btn')
      if (restoreButton) {
        await user.click(restoreButton) // First restore
        
        await waitFor(() => {
          expect(bobRow.querySelector('.eliminate-btn')).toBeInTheDocument()
        })
        
        // Then eliminate again with current week
        await user.click(bobRow.querySelector('.eliminate-btn'))
        
        expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to eliminate this baker?')
      }
      
      // Admin saves all changes
      await user.click(screen.getByRole('button', { name: 'Save All Changes' }))
      
      await waitFor(() => {
        expect(screen.getByText('Changes saved successfully!')).toBeInTheDocument()
      })
      
      expect(mockDataService.saveData).toHaveBeenCalledWith(
        expect.objectContaining({
          season: expect.objectContaining({
            teams: expect.arrayContaining([
              expect.objectContaining({
                id: "team1",
                name: "Championship Stars"
              })
            ]),
            bakers: expect.arrayContaining([
              expect.objectContaining({
                id: "baker1",
                name: "Alice Johnson-Smith"
              })
            ])
          })
        })
      )
    })

    it('should support admin advancing season after episode airs', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Admin enters complete scores for the week
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Admin saves scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Admin advances to next week
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

    it('should support admin complete season finale workflow', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      // Mock finale week scenario
      const finaleWeek = 10
      mockDataService.getData.mockReturnValue({
        season: {
          name: "Season 2025",
          currentWeek: finaleWeek,
          isActive: true,
          teams: [
            { id: "team1", name: "Rising Stars", bakers: ["baker1"] },
            { id: "team2", name: "Flour Power", bakers: ["baker3"] },
            { id: "team3", name: "Soggy Bottoms", bakers: ["baker7"] }
          ],
          bakers: [
            { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
            { id: "baker3", name: "Carol Davis", eliminated: false, eliminatedWeek: null },
            { id: "baker7", name: "Grace Lee", eliminated: false, eliminatedWeek: null }
          ],
          weeks: [] // Previous weeks would be here
        }
      })
      mockDataService.getCurrentWeek.mockReturnValue(finaleWeek)
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText(`📊 Week ${finaleWeek} Scoring`)).toBeInTheDocument()
      })
      
      // Final 3 bakers compete
      const finalists = ['Alice Johnson', 'Carol Davis', 'Grace Lee']
      
      // Everyone survives to finale
      for (const bakerName of finalists) {
        const bakerRow = screen.getByText(bakerName).closest('.table-row')
        const survivedCheckbox = bakerRow.querySelector('input[type="checkbox"]')
        await user.click(survivedCheckbox)
      }
      
      // Alice wins the season (Star Baker for finale)
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceCheckboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      await user.click(aliceCheckboxes[2]) // star baker
      
      // Alice gets season winner bonus
      const aliceManualAdj = aliceRow.querySelector('input[type="number"]')
      await user.clear(aliceManualAdj)
      await user.type(aliceManualAdj, '10')
      
      // Carol gets technical win
      const carolRow = screen.getByText('Carol Davis').closest('.table-row')
      const carolCheckboxes = carolRow.querySelectorAll('input[type="checkbox"]')
      await user.click(carolCheckboxes[1]) // technical win
      
      // Grace gets handshake
      const graceRow = screen.getByText('Grace Lee').closest('.table-row')
      const graceCheckboxes = graceRow.querySelectorAll('input[type="checkbox"]')
      await user.click(graceCheckboxes[3]) // handshake
      
      // Admin adds finale notes
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'An incredible finale! Alice takes the crown with a stunning showstopper. All three finalists should be proud of their journey.')
      
      // Save finale scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Verify finale scoring
      expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(finaleWeek, expect.objectContaining({
        baker1: expect.objectContaining({ 
          survived: true, 
          starBaker: true, 
          manualAdjustment: 10,
          total: 14 // 1 + 3 + 10 = 14
        }),
        baker3: expect.objectContaining({ 
          survived: true, 
          technicalWin: true, 
          total: 3 // 1 + 2 = 3
        }),
        baker7: expect.objectContaining({ 
          survived: true, 
          handshake: true, 
          total: 4 // 1 + 3 = 4
        })
      }))
    })
  })

  describe('Cross-System Integration Journeys', () => {
    it('should support admin scoring that immediately reflects in public view', async () => {
      const user = userEvent.setup()
      
      // Admin session: Enter scores
      mockSessionStorage.getItem.mockReturnValue('true')
      const adminRender = renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Admin enters scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalled()
      })
      
      adminRender.unmount()
      
      // Public view: See updated scores
      mockSessionStorage.getItem.mockReturnValue(null) // Not authenticated
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      // Public view should reflect the admin's score updates
      expect(mockDataService.getTeamScores).toHaveBeenCalled()
    })

    it('should support complete team management to scoring workflow', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Step 1: Manage teams first
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByText('👥 Team & Baker Management')).toBeInTheDocument()
      })
      
      // Update team name
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      await user.clear(teamNameInput)
      await user.type(teamNameInput, 'Victory Stars')
      
      // Save team changes
      await user.click(screen.getByRole('button', { name: 'Save All Changes' }))
      
      await waitFor(() => {
        expect(screen.getByText('Changes saved successfully!')).toBeInTheDocument()
      })
      
      // Step 2: Switch to scoring
      await user.click(screen.getByText('Weekly Scoring'))
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Enter scores for Alice (now on "Victory Stars" team)
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Save scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Both team data and scoring data should be updated
      expect(mockDataService.saveData).toHaveBeenCalled() // Team changes
      expect(mockDataService.updateWeekScores).toHaveBeenCalled() // Score changes
    })

    it('should support admin logout and re-login during session', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true') // Start authenticated
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Admin makes some changes
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Admin logs out
      await user.click(screen.getByText('Logout'))
      
      await waitFor(() => {
        expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
      })
      
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
      
      // Admin logs back in
      mockSessionStorage.getItem.mockReturnValue(null) // Simulate logged out state
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      await user.click(screen.getByRole('button', { name: 'Login' }))
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Previous unsaved changes should be lost (form resets)
      const newAliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const newSurvivedCheckbox = newAliceRow.querySelector('input[type="checkbox"]')
      expect(newSurvivedCheckbox).not.toBeChecked()
    })
  })

  describe('Error Recovery and Resilience Journeys', () => {
    it('should support user continuing after network interruption', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      // Admin enters scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Simulate network error
      mockDataService.updateWeekScores.mockRejectedValueOnce(new Error('Network error'))
      
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Error saving scores')).toBeInTheDocument()
      })
      
      // Admin can retry after network recovers
      mockDataService.updateWeekScores.mockResolvedValueOnce()
      
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
    })

    it('should support admin recovering from browser crash', async () => {
      mockSessionStorage.getItem.mockReturnValue('true')
      
      // Simulate browser/tab crash and recovery
      const { unmount } = renderApp('/admin')
      
      // "Crash" - component unmounts
      unmount()
      
      // "Recovery" - user reopens tab, component remounts
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      })
      
      // Authentication should persist via sessionStorage
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
      
      // Fresh data should load
      expect(mockDataService.getData).toHaveBeenCalled()
    })

    it('should support graceful degradation when data is unavailable', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Simulate data service failure
      mockDataService.getData.mockImplementation(() => {
        throw new Error('Data service unavailable')
      })
      
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument()
      })
      
      // App should not crash, shows error message
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Multi-User Concurrent Usage Scenarios', () => {
    it('should support multiple public users viewing different weeks simultaneously', async () => {
      const user1 = userEvent.setup()
      const user2 = userEvent.setup()
      
      // User 1 views current week
      const { unmount: unmountUser1 } = renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      })
      
      await user1.click(screen.getByText('Week 1'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 1')).toBeInTheDocument()
      })
      
      unmountUser1()
      
      // User 2 views different week (simulate different browser/session)
      renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument() // Default current week
      })
      
      await user2.click(screen.getByText('Week 2'))
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 2')).toBeInTheDocument()
      })
      
      // Both users can navigate independently
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(1) // User 1's call
      expect(mockDataService.getTeamScores).toHaveBeenCalledWith(2) // User 2's call
    })

    it('should support admin updating while public users are viewing', async () => {
      const adminUser = userEvent.setup()
      const publicUser = userEvent.setup()
      
      // Public user browses
      const { unmount: unmountPublic } = renderApp('/')
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
      })
      
      unmountPublic()
      
      // Admin updates scores
      mockSessionStorage.getItem.mockReturnValue('true')
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      })
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await adminUser.click(survivedCheckbox)
      
      await adminUser.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalled()
      })
      
      // Public users would see updated data on next page load/refresh
      // (Real-time updates would require websockets or polling)
    })
  })

  describe('Season Lifecycle Complete Journey', () => {
    it('should support complete season from start to finish', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      // Season starts at Week 1
      mockDataService.getData.mockReturnValue({
        season: {
          name: "Season 2025",
          currentWeek: 1,
          isActive: true,
          teams: [
            { id: "team1", name: "Rising Stars", bakers: ["baker1", "baker2", "baker3"] }
          ],
          bakers: [
            { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
            { id: "baker2", name: "Bob Smith", eliminated: false, eliminatedWeek: null },
            { id: "baker3", name: "Carol Davis", eliminated: false, eliminatedWeek: null }
          ],
          weeks: []
        }
      })
      mockDataService.getCurrentWeek.mockReturnValue(1)
      
      renderApp('/admin')
      
      await waitFor(() => {
        expect(screen.getByText('📊 Week 1 Scoring')).toBeInTheDocument()
      })
      
      // Week 1: Enter initial scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Advance to Week 2
      await user.click(screen.getByText('Advance to Week 2'))
      
      await waitFor(() => {
        expect(screen.getByText('Advanced to next week!')).toBeInTheDocument()
      })
      
      expect(mockDataService.advanceWeek).toHaveBeenCalled()
      
      // Continue through season...
      // (In a real scenario, this would continue through all weeks)
      
      // Verify season progression
      expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(1, expect.any(Object))
    })
  })
})