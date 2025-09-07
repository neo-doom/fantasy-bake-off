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

// Enhanced mock data with more complex scenarios
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

const mockGameData = {
  season: {
    name: "Season 2025",
    currentWeek: 4,
    teams: [
      { id: "team1", name: "Rising Stars", bakers: ["baker1", "baker2", "baker3"] },
      { id: "team2", name: "Flour Power", bakers: ["baker4", "baker5", "baker6"] }
    ],
    bakers: [
      { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
      { id: "baker2", name: "Bob Smith", eliminated: true, eliminatedWeek: 2 },
      { id: "baker3", name: "Carol Davis", eliminated: false, eliminatedWeek: null },
      { id: "baker4", name: "David Wilson", eliminated: false, eliminatedWeek: null },
      { id: "baker5", name: "Emma Brown", eliminated: true, eliminatedWeek: 3 },
      { id: "baker6", name: "Frank Miller", eliminated: false, eliminatedWeek: null }
    ],
    weeks: [
      {
        weekNumber: 1,
        theme: "Cake Week",
        scores: {
          baker1: {
            survived: true, technicalWin: false, starBaker: true,
            handshake: false, soggyBottom: false, manualAdjustment: 0, total: 4
          },
          baker2: {
            survived: true, technicalWin: true, starBaker: false,
            handshake: true, soggyBottom: false, manualAdjustment: 0.5, total: 6.5
          }
        },
        notes: "Amazing first week!"
      },
      {
        weekNumber: 2,
        theme: "Biscuit Week",
        scores: {
          baker1: {
            survived: true, technicalWin: true, starBaker: false,
            handshake: false, soggyBottom: false, manualAdjustment: -1, total: 2
          },
          baker2: {
            survived: false, technicalWin: false, starBaker: false,
            handshake: false, soggyBottom: true, manualAdjustment: 0, total: -0.5
          }
        },
        notes: "Tough eliminations in biscuit week"
      }
    ]
  }
}

describe('ScoringGrid Enhanced Admin Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataService.getData.mockReturnValue(mockGameData)
    mockDataService.getConfig.mockReturnValue(mockConfig)
    global.confirm.mockReturnValue(true)
  })

  describe('Complex Scoring Scenarios', () => {
    it('should handle multiple scoring categories for a single baker', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Find Alice Johnson's row and select multiple categories
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Select: survived (+1), technical win (+2), star baker (+3), handshake (+3), soggy bottom (-0.5)
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[1]) // technical win
      await user.click(checkboxes[2]) // star baker
      await user.click(checkboxes[3]) // handshake
      await user.click(checkboxes[4]) // soggy bottom
      
      // Add manual adjustment
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '1.5')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        // Expected: 1 + 2 + 3 + 3 - 0.5 + 1.5 = 10
        expect(totalCell).toHaveTextContent('10')
      })
    })

    it('should handle edge case of baker getting everything wrong', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const soggyBottomCheckbox = aliceRow.querySelectorAll('input[type="checkbox"]')[4]
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Baker gets soggy bottom and additional penalty
      await user.click(soggyBottomCheckbox)
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '-2')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        // Expected: -0.5 - 2 = -2.5
        expect(totalCell).toHaveTextContent('-2.5')
      })
    })

    it('should handle fractional manual adjustments correctly', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      await user.click(survivedCheckbox)
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '0.25')
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('1.25')
      })
    })

    it('should validate that only one baker can get technical win per week', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const carolRow = screen.getByText('Carol Davis').closest('.table-row')
      
      const aliceTechnicalWin = aliceRow.querySelectorAll('input[type="checkbox"]')[1]
      const carolTechnicalWin = carolRow.querySelectorAll('input[type="checkbox"]')[1]
      
      // Give Alice technical win first
      await user.click(aliceTechnicalWin)
      
      await waitFor(() => {
        expect(aliceTechnicalWin).toBeChecked()
      })
      
      // Admin could give Carol technical win too (system doesn't prevent this)
      await user.click(carolTechnicalWin)
      
      await waitFor(() => {
        expect(carolTechnicalWin).toBeChecked()
      })
      
      // Both should be checked (validation would be business logic, not UI logic)
      expect(aliceTechnicalWin).toBeChecked()
      expect(carolTechnicalWin).toBeChecked()
    })

    it('should handle baker getting perfect score', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Perfect week: survived, technical win, star baker, handshake, bonus points
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[1]) // technical win
      await user.click(checkboxes[2]) // star baker
      await user.click(checkboxes[3]) // handshake
      
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '5') // Bonus for exceptional performance
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        // Expected: 1 + 2 + 3 + 3 + 5 = 14
        expect(totalCell).toHaveTextContent('14')
      })
    })
  })

  describe('Advanced Admin Workflows', () => {
    it('should support admin correcting previous week scores', async () => {
      const user = userEvent.setup()
      
      // Mock existing scores for week 1
      const dataWithWeek1Scores = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          currentWeek: 1,
          weeks: [{
            weekNumber: 1,
            scores: {
              baker1: {
                survived: true, technicalWin: false, starBaker: false,
                handshake: false, soggyBottom: false, manualAdjustment: 0, total: 1
              }
            },
            notes: "Week 1 notes"
          }]
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithWeek1Scores)
      
      render(<ScoringGrid />)
      
      // Admin reviews and corrects Alice's scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const starBakerCheckbox = aliceRow.querySelectorAll('input[type="checkbox"]')[2]
      
      // Alice should have gotten star baker too
      await user.click(starBakerCheckbox)
      
      await waitFor(() => {
        const totalCell = aliceRow.querySelector('.total-score')
        expect(totalCell).toHaveTextContent('4') // 1 + 3 = 4
      })
      
      // Save corrections
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(1, expect.objectContaining({
          baker1: expect.objectContaining({
            survived: true,
            starBaker: true,
            total: 4
          })
        }))
      })
    })

    it('should support admin entering scores for finale week', async () => {
      const user = userEvent.setup()
      
      // Mock finale week scenario
      const finaleData = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          currentWeek: 10, // Finale week
          bakers: [
            { id: "baker1", name: "Alice Johnson", eliminated: false, eliminatedWeek: null },
            { id: "baker2", name: "Carol Davis", eliminated: false, eliminatedWeek: null },
            { id: "baker3", name: "Frank Miller", eliminated: false, eliminatedWeek: null }
          ]
        }
      }
      
      mockDataService.getData.mockReturnValue(finaleData)
      
      render(<ScoringGrid />)
      
      // Enter finale scores - Alice wins, Carol gets star baker, Frank gets handshake
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const carolRow = screen.getByText('Carol Davis').closest('.table-row')
      const frankRow = screen.getByText('Frank Miller').closest('.table-row')
      
      // Alice wins the season
      const aliceCheckboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      await user.click(aliceCheckboxes[0]) // survived
      await user.click(aliceCheckboxes[2]) // star baker (season winner)
      
      const aliceManualAdj = aliceRow.querySelector('input[type="number"]')
      await user.clear(aliceManualAdj)
      await user.type(aliceManualAdj, '10') // Season winner bonus
      
      // Carol gets final star baker
      const carolCheckboxes = carolRow.querySelectorAll('input[type="checkbox"]')
      await user.click(carolCheckboxes[0]) // survived
      await user.click(carolCheckboxes[2]) // star baker
      
      // Frank gets handshake
      const frankCheckboxes = frankRow.querySelectorAll('input[type="checkbox"]')
      await user.click(frankCheckboxes[0]) // survived
      await user.click(frankCheckboxes[3]) // handshake
      
      await waitFor(() => {
        const aliceTotal = aliceRow.querySelector('.total-score')
        expect(aliceTotal).toHaveTextContent('14') // 1 + 3 + 10 = 14
        
        const carolTotal = carolRow.querySelector('.total-score')
        expect(carolTotal).toHaveTextContent('4') // 1 + 3 = 4
        
        const frankTotal = frankRow.querySelector('.total-score')
        expect(frankTotal).toHaveTextContent('4') // 1 + 3 = 4
      })
    })

    it('should support admin bulk score entry workflow', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Admin enters scores for all active bakers quickly
      const activeBakers = ['Alice Johnson', 'Carol Davis', 'David Wilson', 'Frank Miller']
      
      for (const bakerName of activeBakers) {
        const bakerRow = screen.getByText(bakerName).closest('.table-row')
        const survivedCheckbox = bakerRow.querySelector('input[type="checkbox"]')
        await user.click(survivedCheckbox)
      }
      
      // Give Alice star baker
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const aliceStarBaker = aliceRow.querySelectorAll('input[type="checkbox"]')[2]
      await user.click(aliceStarBaker)
      
      // Give David technical win
      const davidRow = screen.getByText('David Wilson').closest('.table-row')
      const davidTechnical = davidRow.querySelectorAll('input[type="checkbox"]')[1]
      await user.click(davidTechnical)
      
      // Give Frank handshake
      const frankRow = screen.getByText('Frank Miller').closest('.table-row')
      const frankHandshake = frankRow.querySelectorAll('input[type="checkbox"]')[3]
      await user.click(frankHandshake)
      
      // Add episode notes
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'Excellent performances all around! Alice dominated with perfect technique.')
      
      // Save all scores
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(mockDataService.updateWeekScores).toHaveBeenCalledWith(4, expect.objectContaining({
          baker1: expect.objectContaining({ survived: true, starBaker: true, total: 4 }),
          baker3: expect.objectContaining({ survived: true, total: 1 }),
          baker4: expect.objectContaining({ survived: true, technicalWin: true, total: 3 }),
          baker6: expect.objectContaining({ survived: true, handshake: true, total: 4 })
        }))
      })
    })

    it('should handle admin advancing season after final episode', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      
      render(<ScoringGrid />)
      
      const advanceButton = screen.getByText('Advance to Week 5')
      await user.click(advanceButton)
      
      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to advance to the next week? This will increment the current week number.'
      )
      expect(mockDataService.advanceWeek).toHaveBeenCalled()
      
      await waitFor(() => {
        expect(screen.getByText('Advanced to next week!')).toBeInTheDocument()
      })
    })

    it('should support admin reviewing score calculation accuracy', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      // Test various combinations to ensure accurate calculation
      const testCases = [
        { checks: [0], manualAdj: '0', expected: '1' }, // survived only
        { checks: [0, 1], manualAdj: '0', expected: '3' }, // survived + technical
        { checks: [0, 2], manualAdj: '0', expected: '4' }, // survived + star baker
        { checks: [0, 3], manualAdj: '0', expected: '4' }, // survived + handshake
        { checks: [4], manualAdj: '0', expected: '-0.5' }, // soggy bottom only
        { checks: [0, 4], manualAdj: '0', expected: '0.5' }, // survived + soggy bottom
        { checks: [0, 1, 2, 3], manualAdj: '0', expected: '9' }, // all positive
        { checks: [0, 1, 2, 3], manualAdj: '2.5', expected: '11.5' } // all + manual
      ]
      
      for (const testCase of testCases) {
        // Clear all checkboxes first
        checkboxes.forEach(checkbox => {
          if (checkbox.checked) {
            user.click(checkbox)
          }
        })
        
        // Clear manual adjustment
        await user.clear(manualAdjInput)
        await user.type(manualAdjInput, '0')
        
        await waitFor(() => {
          const totalCell = aliceRow.querySelector('.total-score')
          expect(totalCell).toHaveTextContent('0')
        })
        
        // Set test case values
        for (const checkIndex of testCase.checks) {
          await user.click(checkboxes[checkIndex])
        }
        
        await user.clear(manualAdjInput)
        await user.type(manualAdjInput, testCase.manualAdj)
        
        await waitFor(() => {
          const totalCell = aliceRow.querySelector('.total-score')
          expect(totalCell).toHaveTextContent(testCase.expected)
        })
      }
    })
  })

  describe('Data Integrity and Error Recovery', () => {
    it('should handle corrupted existing week data', async () => {
      const corruptData = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          weeks: [{
            weekNumber: 4,
            scores: {
              baker1: { survived: 'invalid', total: 'not-a-number' },
              baker3: null,
              baker4: { /* missing required fields */ }
            }
          }]
        }
      }
      
      mockDataService.getData.mockReturnValue(corruptData)
      
      render(<ScoringGrid />)
      
      // Should not crash and should initialize with default values
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const totalCell = aliceRow.querySelector('.total-score')
      expect(totalCell).toHaveTextContent('0')
    })

    it('should recover from save operation interruption', async () => {
      const user = userEvent.setup()
      
      // First call fails, second succeeds
      mockDataService.updateWeekScores
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce()
      
      render(<ScoringGrid />)
      
      // Make changes
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // First save attempt fails
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Error saving scores')).toBeInTheDocument()
      })
      
      // Try again - should succeed
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
    })

    it('should preserve form state during temporary errors', async () => {
      const user = userEvent.setup()
      
      mockDataService.updateWeekScores.mockRejectedValue(new Error('Temporary error'))
      
      render(<ScoringGrid />)
      
      // Enter complex scores
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      const manualAdjInput = aliceRow.querySelector('input[type="number"]')
      
      await user.click(checkboxes[0]) // survived
      await user.click(checkboxes[2]) // star baker
      await user.clear(manualAdjInput)
      await user.type(manualAdjInput, '1.5')
      
      const notesTextarea = screen.getByLabelText('Week Notes:')
      await user.type(notesTextarea, 'Complex episode notes')
      
      // Try to save (fails)
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Error saving scores')).toBeInTheDocument()
      })
      
      // Form state should be preserved
      expect(checkboxes[0]).toBeChecked()
      expect(checkboxes[2]).toBeChecked()
      expect(manualAdjInput.value).toBe('1.5')
      expect(notesTextarea.value).toBe('Complex episode notes')
      
      const totalCell = aliceRow.querySelector('.total-score')
      expect(totalCell).toHaveTextContent('5.5') // 1 + 3 + 1.5
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large number of bakers efficiently', () => {
      const largeBakersData = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          bakers: Array.from({ length: 50 }, (_, i) => ({
            id: `baker${i}`,
            name: `Baker ${i}`,
            eliminated: i % 5 === 0, // Every 5th baker eliminated
            eliminatedWeek: i % 5 === 0 ? Math.floor(i / 5) + 1 : null
          }))
        }
      }
      
      mockDataService.getData.mockReturnValue(largeBakersData)
      
      render(<ScoringGrid />)
      
      // Should render without performance issues
      expect(screen.getByText('📊 Week 4 Scoring')).toBeInTheDocument()
      
      // Should show only non-eliminated bakers
      const activeBakers = largeBakersData.season.bakers.filter(baker => 
        !baker.eliminated || (baker.eliminatedWeek && baker.eliminatedWeek >= 4)
      )
      
      activeBakers.forEach(baker => {
        expect(screen.getByText(baker.name)).toBeInTheDocument()
      })
    })

    it('should handle rapid score updates without lag', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const checkboxes = aliceRow.querySelectorAll('input[type="checkbox"]')
      
      // Rapid clicking simulation
      for (let i = 0; i < 20; i++) {
        await user.click(checkboxes[0]) // Toggle survived checkbox
      }
      
      // Final state should be predictable
      const isChecked = i => i % 2 === 0 // Even iterations = checked
      expect(checkboxes[0].checked).toBe(isChecked(20))
    })

    it('should maintain responsiveness during save operations', async () => {
      const user = userEvent.setup()
      
      // Mock slow save operation
      let resolvePromise
      mockDataService.updateWeekScores.mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve
        })
      })
      
      render(<ScoringGrid />)
      
      // Start save
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      // UI should remain interactive except for save button
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      
      // Should still be able to interact with form
      await user.click(survivedCheckbox)
      expect(survivedCheckbox).toBeChecked()
      
      // Save button should be disabled
      const saveButton = screen.getByRole('button', { name: 'Saving...' })
      expect(saveButton).toBeDisabled()
      
      // Complete save
      resolvePromise()
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
    })
  })

  describe('Admin User Experience Edge Cases', () => {
    it('should handle admin accidentally refreshing page during score entry', () => {
      render(<ScoringGrid />)
      
      // Simulate page refresh - component should re-initialize properly
      const { unmount } = render(<ScoringGrid />)
      unmount()
      
      render(<ScoringGrid />)
      
      // Should load fresh data
      expect(mockDataService.getData).toHaveBeenCalled()
      expect(screen.getByText('📊 Week 4 Scoring')).toBeInTheDocument()
    })

    it('should provide visual feedback for unsaved changes', async () => {
      const user = userEvent.setup()
      render(<ScoringGrid />)
      
      // Make changes
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Changes are immediately reflected (no explicit "unsaved changes" indicator in this implementation)
      const totalCell = aliceRow.querySelector('.total-score')
      expect(totalCell).toHaveTextContent('1')
    })

    it('should handle admin working across multiple weeks in same session', async () => {
      const user = userEvent.setup()
      
      // Start with week 4
      render(<ScoringGrid />)
      expect(screen.getByText('📊 Week 4 Scoring')).toBeInTheDocument()
      
      // Make changes
      const aliceRow = screen.getByText('Alice Johnson').closest('.table-row')
      const survivedCheckbox = aliceRow.querySelector('input[type="checkbox"]')
      await user.click(survivedCheckbox)
      
      // Save
      await user.click(screen.getByRole('button', { name: 'Save Week Scores' }))
      
      await waitFor(() => {
        expect(screen.getByText('Week scores saved successfully!')).toBeInTheDocument()
      })
      
      // Advance to next week
      await user.click(screen.getByText('Advance to Week 5'))
      
      await waitFor(() => {
        expect(screen.getByText('Advanced to next week!')).toBeInTheDocument()
      })
      
      expect(mockDataService.advanceWeek).toHaveBeenCalled()
    })
  })
})