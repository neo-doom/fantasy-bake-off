import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  default: {
    getData: vi.fn(),
    getConfig: vi.fn(),
    updateWeekScores: vi.fn(),
    saveData: vi.fn(),
    advanceWeek: vi.fn()
  }
}))

import ScoringGrid from './ScoringGrid'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock window.confirm
global.confirm = vi.fn()

// Mock data
const mockConfig = {
  scoringRules: {
    survived: 1,
    technicalWin: 2,
    starBaker: 3,
    handshake: 3,
    soggyBottom: -0.5
  }
}

const mockGameData = {
  season: {
    name: "Season 2025",
    currentWeek: 3,
    teams: [
      { id: "team1", name: "Rising Stars", bakers: ["baker1", "baker2"] },
      { id: "team2", name: "Flour Power", bakers: ["baker3", "baker4"] }
    ],
    bakers: [
      { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
      { id: "baker2", name: "Bob Smith", eliminated: true, eliminatedWeek: 2 },
      { id: "baker3", name: "Carol Davis", eliminated: false, eliminatedWeek: null },
      { id: "baker4", name: "David Wilson", eliminated: false, eliminatedWeek: null }
    ],
    weeks: [
      {
        weekNumber: 1,
        theme: "Cake Week",
        scores: {
          baker1: {
            survived: true, technicalWin: false, starBaker: true,
            handshake: false, soggyBottom: false, manualAdjustment: 0, total: 4
          }
        },
        notes: "Great first week!"
      },
      {
        weekNumber: 2,
        theme: "Biscuit Week",
        scores: {
          baker1: {
            survived: true, technicalWin: true, starBaker: false,
            handshake: true, soggyBottom: false, manualAdjustment: 0, total: 6
          }
        },
        notes: "Tough eliminations"
      }
    ]
  }
}

describe('ScoringGrid Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataService.getData.mockReturnValue(mockGameData)
    mockDataService.getConfig.mockReturnValue(mockConfig)
    global.confirm.mockReturnValue(true)
  })

  describe('Basic Rendering and Data Loading', () => {
    it('should render scoring grid with current week header', () => {
      render(<ScoringGrid />)
      
      expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      expect(screen.getByText('Advance to Week 4')).toBeInTheDocument()
    })

    it('should render table headers with scoring rules', () => {
      render(<ScoringGrid />)
      
      expect(screen.getByText('Baker')).toBeInTheDocument()
      expect(screen.getByText('Survived (+1)')).toBeInTheDocument()
      expect(screen.getByText('Technical Win (+2)')).toBeInTheDocument()
      expect(screen.getByText('Star Baker (+3)')).toBeInTheDocument()
      expect(screen.getByText('Handshake (+3)')).toBeInTheDocument()
      expect(screen.getByText('Soggy Bottom (-0.5)')).toBeInTheDocument()
      expect(screen.getByText('Manual Adj.')).toBeInTheDocument()
      expect(screen.getByText('Total')).toBeInTheDocument()
    })

    it('should show active bakers for current week', () => {
      render(<ScoringGrid />)
      
      // Should show active bakers (not eliminated or eliminated after current week)
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Carol Davis')).toBeInTheDocument()
      expect(screen.getByText('David Wilson')).toBeInTheDocument()
      
      // Bob Smith eliminated in week 2, so should not appear in week 3
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
    })

    it('should render save button and week notes section', () => {
      render(<ScoringGrid />)
      
      expect(screen.getByRole('button', { name: 'Save Week Scores' })).toBeInTheDocument()
      expect(screen.getByLabelText('Week Notes:')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Add notes about this week\'s episode...')).toBeInTheDocument()
    })
  })

  describe('Score Entry and Calculation', () => {
    it('should initialize with empty scores for new week', () => {
      render(<ScoringGrid />)
      
      const survivedCheckboxes = screen.getAllByRole('checkbox')
      survivedCheckboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked()
      })
      
      const manualAdjustments = screen.getAllByRole('spinbutton')
      manualAdjustments.forEach(input => {
        expect(input.value).toBe('0')
      })
      
      const totalScores = screen.getAllByText('0')
      expect(totalScores.length).toBeGreaterThan(0)
    })

    it('should calculate total score correctly when checkboxes are selected', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Find Alice Johnson's row and check some options
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      await user.click(survivedCheckbox)
      
      // Should show total of 1 (survived = +1)
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('1')
      })
    })

    it('should calculate complex score combinations correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      // Check: survived (+1), technical win (+2), star baker (+3), handshake (+3)
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[1]) // technical win
      await user.click(checkboxes[2]) // star baker
      await user.click(checkboxes[3]) // handshake
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('9') // 1 + 2 + 3 + 3 = 9
      })
    })

    it('should handle soggy bottom penalty correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      // Check: survived (+1), soggy bottom (-0.5)
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[4]) // soggy bottom
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('0.5') // 1 - 0.5 = 0.5
      })
    })

    it('should handle manual adjustments correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      // Set base score (survived) and manual adjustment
      await user.click(survivedCheckbox)
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '2.5')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('3.5') // 1 + 2.5 = 3.5
      })
    })

    it('should handle negative manual adjustments', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      await user.click(survivedCheckbox)
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '-0.5')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('0.5') // 1 - 0.5 = 0.5
      })
    })
  })

  describe('Data Persistence and Save Operations', () => {
    it('should save week scores when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Set some scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Add week notes
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'Great episode this week!')
      
      // Save scores
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(3, expect.any(Object))
        expect(mockDataService.saveData).toHaveBeenCalled()
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
    })

    it('should show loading state during save operation', async () => {
      const user = userEvent.setup()
      let resolvePromise
      mockDataService.updateWeekScores.mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve
        })
      })
      
      render(<ScoringGrid />)
      
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
      
      resolvePromise()
    })

    it('should handle save errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      
      mockDataService.updateWeekScores.mockRejectedValue(new Error('Save failed'))
      
      render(<ScoringGrid />)
      
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Error saving scores')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Save error:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should clear success message after timeout', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup()
      
      render(<ScoringGrid />)
      
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Fast forward 3 seconds
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(screen.queryByText('Week scores saved successfully!')).not.toBeInTheDocument()
      })
      
      vi.useRealTimers()
    })
  })

  describe('Week Management and Navigation', () => {
    it('should advance to next week when confirmed', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      
      render(<ScoringGrid />)
      
      const advanceButton = screen.getByText('Advance to Week 4')
      await user.click(advanceButton)
      
      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to advance to the next week? This will increment the current week number.'
      )
      expect(mockDataService.advanceWeek).toHaveBeenCalled()
    })

    it('should not advance week when cancelled', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(false)
      
      render(<ScoringGrid />)
      
      const advanceButton = screen.getByText('Advance to Week 4')
      await user.click(advanceButton)
      
      expect(global.confirm).toHaveBeenCalled()
      expect(mockDataService.advanceWeek).not.toHaveBeenCalled()
    })

    it('should show success message when week is advanced', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      
      render(<ScoringGrid />)
      
      const advanceButton = screen.getByText('Advance to Week 4')
      await user.click(advanceButton)
      
      await waitFor(() => {
        expect(screen.getByText('Advanced to next week!')).toBeInTheDocument()
      })
    })
  })

  describe('Existing Week Data Loading', () => {
    it('should load existing scores when week has data', () => {
      const dataWithExistingScores = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          currentWeek: 2, // Week 2 has existing data
          weeks: [
            ...mockGameData.season.weeks,
            {
              weekNumber: 2,
              scores: {
                baker1: {
                  survived: true, technicalWin: true, starBaker: false,
                  handshake: true, soggyBottom: false, manualAdjustment: 1, total: 7
                }
              },
              notes: "Existing week notes"
            }
          ]
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithExistingScores)
      
      render(<ScoringGrid />)
      
      // Should load existing notes
      expect(screen.getByDisplayValue('Existing week notes')).toBeInTheDocument()
      
      // Should show existing scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes[0]).toBeChecked() // survived
      expect(checkboxes[1]).toBeChecked() // technical win
      expect(checkboxes[3]).toBeChecked() // handshake
      
      const manualAdj = aliceRow.querySelector('input[type="number"]')
      expect(manualAdj.value).toBe('1')
      
      const totalCell = aliceRow.querySelector('.total-score')
      expect(totalCell).toHaveTextContent('7')
    })

    it('should show eliminated baker badge when applicable', () => {
      const dataWithEliminatedBaker = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          currentWeek: 1, // Week 1, so Bob Smith (eliminated week 2) should show
          bakers: mockGameData.season.bakers.map(baker => 
            baker.id === 'baker2' 
              ? { ...baker, eliminated: true, eliminatedWeek: 2 }
              : baker
          )
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithEliminatedBaker)
      
      render(<ScoringGrid />)
      
      expect(screen.getByText('Bob Smith')).toBeInTheDocument()
      expect(screen.getByText('Eliminated Week 2')).toBeInTheDocument()
    })
  })

  describe('Admin Workflow Scenarios', () => {
    it('should support complete score entry workflow', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Admin enters scores for all bakers
      const bakers = ['Alice Johnson', 'Carol Davis', 'David Wilson']
      
      for (const bakerName of bakers) {
        const bakerRow = screen.getByText(bakerName).closest('.table-row')
        const survivedCheckbox = bakerRow.querySelector('input[type="checkbox"]')
        await user.click(survivedCheckbox)
      }
      
      // Add star baker to Alice
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const starBakerCheckbox = aliceRow.querySelectorAll('input[type="checkbox"]')[2]
      await user.click(starBakerCheckbox)
      
      // Add episode notes
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'Exciting episode with great bakes!')
      
      // Save everything
      const saveButton = screen.getByRole('button', { name: 'Save Week Scores' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(3, expect.objectContaining({
          baker1: expect.objectContaining({ survived: true, starBaker: true, total: 4 }),
          baker3: expect.objectContaining({ survived: true, total: 1 }),
          baker4: expect.objectContaining({ survived: true, total: 1 })
        }))
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
    })

    it('should handle elimination scenario', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Set up scores where someone gets soggy bottom (elimination indicator)
      const davidRow = screen.getByText('David Wilson').closest('.table-row')
      const soggyBottomCheckbox = davidRow.querySelectorAll('input[type="checkbox"]')[4]
      await user.click(soggyBottomCheckbox)
      
      await waitFor(() => {
        const totalCell = davidRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('-0.5')
      })
      
      // Save scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(3, expect.objectContaining({
          baker4: expect.objectContaining({ soggyBottom: true, total: -0.5 })
        }))
      })
    })

    it('should support reviewing and editing existing scores', async () => {
      const user = userEvent.setup()
      
      // Mock existing scores for current week
      const dataWithCurrentWeekScores = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          weeks: [
            ...mockGameData.season.weeks,
            {
              weekNumber: 3,
              scores: {
                baker1: { survived: true, technicalWin: false, starBaker: false, handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1 }
              },
              notes: "Initial notes"
            }
          ]
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithCurrentWeekScores)
      
      render(<ScoringGrid />)
      
      // Should load existing scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      expect(survivedCheckbox).toBeChecked()
      
      // Admin can modify scores
      const technicalWinCheckbox = aliceRow.querySelectorAll('input[type="checkbox"]')[1]
      await user.click(technicalWinCheckbox)
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('3') // 1 + 2 = 3
      })
      
      // Save updated scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(3, expect.objectContaining({
          baker1: expect.objectContaining({ survived: true, technicalWin: true, total: 3 })
        }))
      })
    })
  })

  describe('Input Validation and Error Prevention', () => {
    it('should handle invalid manual adjustment inputs', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Try to enter non-numeric value
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, 'abc')
      
      // Should default to 0
      expect(manualAdjInput.value).toBe('0')
    })

    it('should support decimal manual adjustments', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '1.5')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('1.5')
      })
    })

    it('should maintain score consistency during rapid input changes', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      // Rapid clicking of multiple checkboxes
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[1]) // technical win
      await user.click(checkboxes[0]) // uncheck survived
      await user.click(checkboxes[2]) // star baker
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('5') // technical win (2) + star baker (3) = 5
      })
    })
  })

  describe('Baker Management and Display', () => {
    it('should filter bakers correctly for current week', () => {
      render(<ScoringGrid />)
      
      // Current week is 3, Bob eliminated in week 2, should not appear
      expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
      
      // Active bakers should appear
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByText('Carol Davis')).toBeInTheDocument()
      expect(screen.getByText('David Wilson')).toBeInTheDocument()
    })

    it('should include bakers eliminated in current week', () => {
      const dataWithCurrentWeekElimination = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          bakers: mockGameData.season.bakers.map(baker => 
            baker.id === 'baker3' 
              ? { ...baker, eliminated: true, eliminatedWeek: 3 } // Eliminated in current week
              : baker
          )
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithCurrentWeekElimination)
      
      render(<ScoringGrid />)
      
      // Carol should still appear since she's eliminated in the current week
      expect(screen.getByText('Carol Davis')).toBeInTheDocument()
    })

    it('should handle empty baker lists gracefully', () => {
      const dataWithNoBakers = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          bakers: []
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithNoBakers)
      
      render(<ScoringGrid />)
      
      // Should not crash with no bakers
      expect(screen.getByText('📊 Week 3 Scoring')).toBeInTheDocument()
      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility and UX', () => {
    it('should have proper form labels and structure', () => {
      render(<ScoringGrid />)
      
      const notesLabel = screen.getByLabelText('Week Notes:')
      expect(notesLabel).toBeInTheDocument()
      
      const notesTextarea = screen.getByLabelText('Week Notes:')
      expect(notesTextarea.tagName).toBe('TEXTAREA')
    })

    it('should provide clear visual feedback for different score types', () => {
      render(<ScoringGrid />)
      
      const headers = [
        'Survived (+1)', 'Technical Win (+2)', 'Star Baker (+3)', 
        'Handshake (+3)', 'Soggy Bottom (-0.5)'
      ]
      
      headers.forEach(header => {
        expect(screen.getByText(header)).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation through form elements', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Tab through elements
      await user.tab() // First checkbox
      expect(document.activeElement).toHaveAttribute('type', 'checkbox')
      
      await user.tab() // Next element
      expect(document.activeElement).toBeDefined()
    })
  })
})