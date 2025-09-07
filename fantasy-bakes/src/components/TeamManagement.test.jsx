import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  default: {
    getData: vi.fn(),
    saveData: vi.fn(),
    getCurrentWeek: vi.fn()
  }
}))

import TeamManagement from './TeamManagement'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock window.confirm
global.confirm = vi.fn()

// Mock data with comprehensive test scenarios
const mockGameData = {
  season: {
    name: "Season 2025",
    currentWeek: 6,
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
      { id: "baker5", name: "Emma Brown", eliminated: true, eliminatedWeek: 4 },
      { id: "baker6", name: "Frank Miller", eliminated: false, eliminatedWeek: null },
      { id: "baker7", name: "Grace Lee", eliminated: false, eliminatedWeek: null },
      { id: "baker8", name: "Henry Taylor", eliminated: true, eliminatedWeek: 1 },
      { id: "baker9", name: "Iris Anderson", eliminated: false, eliminatedWeek: null }
    ]
  }
}

describe('TeamManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataService.getData.mockReturnValue(mockGameData)
    mockDataService.getCurrentWeek.mockReturnValue(6)
    global.confirm.mockReturnValue(true)
  })

  describe('Basic Rendering and Data Loading', () => {
    it('should render the main header and sections', () => {
      render(<TeamManagement />)
      
      expect(screen.getByText('👥 Team & Baker Management')).toBeInTheDocument()
      expect(screen.getByText('Teams')).toBeInTheDocument()
      expect(screen.getByText('All Bakers Overview')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Save All Changes' })).toBeInTheDocument()
    })

    it('should load and display all teams', () => {
      render(<TeamManagement />)
      
      expect(screen.getByDisplayValue('Rising Stars')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Flour Power')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Soggy Bottoms')).toBeInTheDocument()
    })

    it('should load and display all bakers', () => {
      render(<TeamManagement />)
      
      // Check that all bakers are displayed in the overview table
      expect(screen.getByDisplayValue('Alice Johnson')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bob Smith')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Carol Davis')).toBeInTheDocument()
      expect(screen.getByDisplayValue('David Wilson')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Emma Brown')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Frank Miller')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Grace Lee')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Henry Taylor')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Iris Anderson')).toBeInTheDocument()
    })

    it('should display bakers within their respective teams', () => {
      render(<TeamManagement />)
      
      // Check team structure - Alice, Bob, Carol should be under Rising Stars
      const risingStarsCard = screen.getByDisplayValue('Rising Stars').closest('.team-card')
      expect(risingStarsCard).toContainElement(screen.getAllByDisplayValue('Alice Johnson')[0])
      expect(risingStarsCard).toContainElement(screen.getAllByDisplayValue('Bob Smith')[0])
      expect(risingStarsCard).toContainElement(screen.getAllByDisplayValue('Carol Davis')[0])
    })

    it('should show correct elimination status for bakers', () => {
      render(<TeamManagement />)
      
      // Active bakers should show "Active" status
      expect(screen.getByText('Active')).toBeInTheDocument()
      
      // Eliminated bakers should show elimination week
      expect(screen.getByText('Eliminated Week 2')).toBeInTheDocument()
      expect(screen.getByText('Eliminated Week 4')).toBeInTheDocument()
      expect(screen.getByText('Eliminated Week 1')).toBeInTheDocument()
    })

    it('should call dataService.getData on component mount', () => {
      render(<TeamManagement />)
      
      expect(mockDataService.getData).toHaveBeenCalled()
      expect(mockDataService.getCurrentWeek).toHaveBeenCalled()
    })
  })

  describe('Team Name Editing', () => {
    it('should allow editing team names', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      
      await user.clear(teamNameInput)
      await user.type(teamNameInput, 'Super Bakers')
      
      expect(teamNameInput.value).toBe('Super Bakers')
    })

    it('should handle empty team names', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      
      await user.clear(teamNameInput)
      
      expect(teamNameInput.value).toBe('')
    })

    it('should handle very long team names', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const longName = 'A'.repeat(100)
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      
      await user.clear(teamNameInput)
      await user.type(teamNameInput, longName)
      
      expect(teamNameInput.value).toBe(longName)
    })

    it('should maintain team name changes during session', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      
      await user.clear(teamNameInput)
      await user.type(teamNameInput, 'Updated Team Name')
      
      // Team name should persist in the input
      expect(screen.getByDisplayValue('Updated Team Name')).toBeInTheDocument()
      expect(screen.queryByDisplayValue('Rising Stars')).not.toBeInTheDocument()
    })
  })

  describe('Baker Name Editing', () => {
    it('should allow editing baker names in team view', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Find Alice Johnson in team card
      const teamCard = screen.getByDisplayValue('Rising Stars').closest('.team-card')
      const bakerInput = teamCard.querySelector('input[value="Alice Johnson"]')
      
      await user.clear(bakerInput)
      await user.type(bakerInput, 'Alice Smith')
      
      expect(bakerInput.value).toBe('Alice Smith')
    })

    it('should allow editing baker names in overview table', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Find Alice Johnson in the overview table
      const overviewTable = screen.getByText('All Bakers Overview').closest('.management-section')
      const bakerInput = overviewTable.querySelector('input[value="Alice Johnson"]')
      
      await user.clear(bakerInput)
      await user.type(bakerInput, 'Alice Updated')
      
      expect(bakerInput.value).toBe('Alice Updated')
    })

    it('should sync baker name changes between team view and overview', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Edit in team card
      const teamCard = screen.getByDisplayValue('Rising Stars').closest('.team-card')
      const teamBakerInput = teamCard.querySelector('input[value="Alice Johnson"]')
      
      await user.clear(teamBakerInput)
      await user.type(teamBakerInput, 'Alice Modified')
      
      // Check that overview table is also updated
      const overviewTable = screen.getByText('All Bakers Overview').closest('.management-section')
      expect(overviewTable.querySelector('input[value="Alice Modified"]')).toBeInTheDocument()
    })

    it('should handle special characters in baker names', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const bakerInput = screen.getAllByDisplayValue('Alice Johnson')[0]
      const specialName = 'José María Fernández-García'
      
      await user.clear(bakerInput)
      await user.type(bakerInput, specialName)
      
      expect(bakerInput.value).toBe(specialName)
    })

    it('should handle empty baker names', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const bakerInput = screen.getAllByDisplayValue('Alice Johnson')[0]
      
      await user.clear(bakerInput)
      
      expect(bakerInput.value).toBe('')
    })
  })

  describe('Baker Elimination and Restoration', () => {
    it('should allow eliminating an active baker', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      
      render(<TeamManagement />)
      
      // Find Alice Johnson's eliminate button
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      const eliminateButton = aliceRow.querySelector('.eliminate-btn')
      
      await user.click(eliminateButton)
      
      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to eliminate this baker?')
      
      await waitFor(() => {
        expect(screen.getByText('Eliminated Week 6')).toBeInTheDocument()
        expect(aliceRow).toHaveClass('eliminated')
      })
    })

    it('should not eliminate baker if user cancels confirmation', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(false)
      
      render(<TeamManagement />)
      
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      const eliminateButton = aliceRow.querySelector('.eliminate-btn')
      
      await user.click(eliminateButton)
      
      expect(global.confirm).toHaveBeenCalled()
      
      // Alice should remain active
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(aliceRow).not.toHaveClass('eliminated')
    })

    it('should allow restoring an eliminated baker', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Find Bob Smith (eliminated baker)
      const bobRow = screen.getByDisplayValue('Bob Smith').closest('.table-row')
      const restoreButton = bobRow.querySelector('.restore-btn')
      
      await user.click(restoreButton)
      
      await waitFor(() => {
        expect(bobRow).not.toHaveClass('eliminated')
        expect(bobRow.querySelector('.status')).toHaveTextContent('Active')
      })
    })

    it('should show correct buttons for active vs eliminated bakers', () => {
      render(<TeamManagement />)
      
      // Active baker (Alice) should have eliminate button
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      expect(aliceRow.querySelector('.eliminate-btn')).toBeInTheDocument()
      expect(aliceRow.querySelector('.restore-btn')).not.toBeInTheDocument()
      
      // Eliminated baker (Bob) should have restore button
      const bobRow = screen.getByDisplayValue('Bob Smith').closest('.table-row')
      expect(bobRow.querySelector('.restore-btn')).toBeInTheDocument()
      expect(bobRow.querySelector('.eliminate-btn')).not.toBeInTheDocument()
    })

    it('should eliminate baker with current week number', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      mockDataService.getCurrentWeek.mockReturnValue(7)
      
      render(<TeamManagement />)
      
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      const eliminateButton = aliceRow.querySelector('.eliminate-btn')
      
      await user.click(eliminateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Eliminated Week 7')).toBeInTheDocument()
      })
    })

    it('should apply elimination styling to eliminated bakers in team cards', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      
      render(<TeamManagement />)
      
      // Find Alice in team card
      const teamCard = screen.getByDisplayValue('Rising Stars').closest('.team-card')
      const aliceItem = Array.from(teamCard.querySelectorAll('.baker-item')).find(
        item => item.querySelector('input[value="Alice Johnson"]')
      )
      
      // Eliminate Alice
      const eliminateButton = aliceItem.querySelector('.eliminate-btn')
      await user.click(eliminateButton)
      
      await waitFor(() => {
        expect(aliceItem).toHaveClass('eliminated')
        expect(aliceItem.querySelector('.elimination-info')).toBeInTheDocument()
        expect(aliceItem.querySelector('.restore-btn')).toBeInTheDocument()
      })
    })
  })

  describe('Team and Baker Association', () => {
    it('should show correct team for each baker in overview', () => {
      render(<TeamManagement />)
      
      // Check that bakers show their correct teams
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      expect(aliceRow.querySelector('.baker-team')).toHaveTextContent('Rising Stars')
      
      const davidRow = screen.getByDisplayValue('David Wilson').closest('.table-row')
      expect(davidRow.querySelector('.baker-team')).toHaveTextContent('Flour Power')
      
      const graceRow = screen.getByDisplayValue('Grace Lee').closest('.table-row')
      expect(graceRow.querySelector('.baker-team')).toHaveTextContent('Soggy Bottoms')
    })

    it('should handle bakers not assigned to any team', () => {
      const dataWithUnassignedBaker = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          bakers: [
            ...mockGameData.season.bakers,
            { id: "baker10", name: "John Doe", eliminated: false, eliminatedWeek: null }
          ]
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithUnassignedBaker)
      
      render(<TeamManagement />)
      
      const johnRow = screen.getByDisplayValue('John Doe').closest('.table-row')
      expect(johnRow.querySelector('.baker-team')).toHaveTextContent('No Team')
    })

    it('should handle missing baker data gracefully', () => {
      const dataWithMissingBaker = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          teams: [
            {
              id: "team1",
              name: "Test Team",
              bakers: ["baker1", "missing_baker"] // missing_baker doesn't exist in bakers array
            }
          ]
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithMissingBaker)
      
      render(<TeamManagement />)
      
      // Should not crash with missing baker data
      expect(screen.getByText('👥 Team & Baker Management')).toBeInTheDocument()
    })
  })

  describe('Data Persistence and Save Operations', () => {
    it('should save all changes when save button is clicked', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Make some changes
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      await user.clear(teamNameInput)
      await user.type(teamNameInput, 'Updated Team')
      
      const bakerNameInput = screen.getAllByDisplayValue('Alice Johnson')[0]
      await user.clear(bakerNameInput)
      await user.type(bakerNameInput, 'Alice Updated')
      
      // Save changes
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockDataService.saveData).toHaveBeenCalledWith(
          expect.objectContaining({
            season: expect.objectContaining({
              teams: expect.arrayContaining([
                expect.objectContaining({
                  id: "team1",
                  name: "Updated Team"
                })
              ]),
              bakers: expect.arrayContaining([
                expect.objectContaining({
                  id: "baker1",
                  name: "Alice Updated"
                })
              ])
            })
          })
        )
        expect(screen.getByText('Changes saved successfully!')).toBeInTheDocument()
      })
    })

    it('should show loading state during save operation', async () => {
      const user = userEvent.setup()
      
      let resolvePromise
      mockDataService.saveData.mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve
        })
      })
      
      render(<TeamManagement />)
      
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(saveButton).toBeDisabled()
      
      resolvePromise()
    })

    it('should handle save errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const user = userEvent.setup()
      
      mockDataService.saveData.mockImplementation(() => {
        throw new Error('Save failed')
      })
      
      render(<TeamManagement />)
      
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Error saving changes')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Save error:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should clear success message after timeout', async () => {
      vi.useFakeTimers()
      const user = userEvent.setup()
      
      render(<TeamManagement />)
      
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText('Changes saved successfully!')).toBeInTheDocument()
      })
      
      // Fast forward 3 seconds
      vi.advanceTimersByTime(3000)
      
      await waitFor(() => {
        expect(screen.queryByText('Changes saved successfully!')).not.toBeInTheDocument()
      })
      
      vi.useRealTimers()
    })

    it('should save elimination changes', async () => {
      const user = userEvent.setup()
      global.confirm.mockReturnValue(true)
      
      render(<TeamManagement />)
      
      // Eliminate a baker
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      const eliminateButton = aliceRow.querySelector('.eliminate-btn')
      await user.click(eliminateButton)
      
      // Save changes
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockDataService.saveData).toHaveBeenCalledWith(
          expect.objectContaining({
            season: expect.objectContaining({
              bakers: expect.arrayContaining([
                expect.objectContaining({
                  id: "baker1",
                  name: "Alice Johnson",
                  eliminated: true,
                  eliminatedWeek: 6
                })
              ])
            })
          })
        )
      })
    })
  })

  describe('Admin User Experience Scenarios', () => {
    it('should support admin reviewing all team compositions', () => {
      render(<TeamManagement />)
      
      // Admin can see all teams with their bakers
      const teams = screen.getAllByText('Bakers:')
      expect(teams).toHaveLength(3) // 3 teams
      
      // Each team should show its bakers
      expect(screen.getByText('Rising Stars')).toBeInTheDocument()
      expect(screen.getByText('Flour Power')).toBeInTheDocument()
      expect(screen.getByText('Soggy Bottoms')).toBeInTheDocument()
    })

    it('should support bulk team name updates', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Admin updates multiple team names
      const teamInputs = screen.getAllByRole('textbox').filter(input => 
        ['Rising Stars', 'Flour Power', 'Soggy Bottoms'].includes(input.value)
      )
      
      await user.clear(teamInputs[0])
      await user.type(teamInputs[0], 'Super Stars')
      
      await user.clear(teamInputs[1])
      await user.type(teamInputs[1], 'Power Rangers')
      
      await user.clear(teamInputs[2])
      await user.type(teamInputs[2], 'Dream Team')
      
      // Save all changes
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockDataService.saveData).toHaveBeenCalledWith(
          expect.objectContaining({
            season: expect.objectContaining({
              teams: expect.arrayContaining([
                expect.objectContaining({ name: "Super Stars" }),
                expect.objectContaining({ name: "Power Rangers" }),
                expect.objectContaining({ name: "Dream Team" })
              ])
            })
          })
        )
      })
    })

    it('should provide clear visual distinction for eliminated bakers', () => {
      render(<TeamManagement />)
      
      // Eliminated bakers should be visually distinct
      const bobRow = screen.getByDisplayValue('Bob Smith').closest('.table-row')
      expect(bobRow).toHaveClass('eliminated')
      
      const emmaRow = screen.getByDisplayValue('Emma Brown').closest('.table-row')
      expect(emmaRow).toHaveClass('eliminated')
      
      // Active bakers should not have elimination styling
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      expect(aliceRow).not.toHaveClass('eliminated')
    })

    it('should show elimination information for eliminated bakers', () => {
      render(<TeamManagement />)
      
      // Should show elimination weeks
      expect(screen.getByText('Eliminated Week 2')).toBeInTheDocument()
      expect(screen.getByText('Eliminated Week 4')).toBeInTheDocument()
      expect(screen.getByText('Eliminated Week 1')).toBeInTheDocument()
    })

    it('should allow admin to quickly restore eliminated bakers', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      // Find all restore buttons
      const restoreButtons = screen.getAllByText('Restore')
      expect(restoreButtons.length).toBeGreaterThan(0)
      
      // Restore a baker
      await user.click(restoreButtons[0])
      
      // Should change status immediately
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('should provide overview table for easy baker management', () => {
      render(<TeamManagement />)
      
      // Overview table should have headers
      expect(screen.getByText('Baker Name')).toBeInTheDocument()
      expect(screen.getByText('Team')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Actions')).toBeInTheDocument()
      
      // Should show all bakers
      const tableRows = screen.getByText('All Bakers Overview').closest('.management-section')
        .querySelectorAll('.table-row')
      expect(tableRows).toHaveLength(9) // 9 bakers
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty teams array', () => {
      const emptyTeamsData = {
        season: {
          currentWeek: 6,
          teams: [],
          bakers: [{ id: "baker1", name: "Lonely Baker", eliminated: false }]
        }
      }
      
      mockDataService.getData.mockReturnValue(emptyTeamsData)
      
      render(<TeamManagement />)
      
      expect(screen.getByText('👥 Team & Baker Management')).toBeInTheDocument()
      expect(screen.queryByText('Teams')).toBeInTheDocument()
    })

    it('should handle empty bakers array', () => {
      const emptyBakersData = {
        season: {
          currentWeek: 6,
          teams: [{ id: "team1", name: "Empty Team", bakers: [] }],
          bakers: []
        }
      }
      
      mockDataService.getData.mockReturnValue(emptyBakersData)
      
      render(<TeamManagement />)
      
      expect(screen.getByText('👥 Team & Baker Management')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Empty Team')).toBeInTheDocument()
    })

    it('should handle data loading errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDataService.getData.mockImplementation(() => {
        throw new Error('Data load failed')
      })
      
      expect(() => {
        render(<TeamManagement />)
      }).not.toThrow()
      
      consoleSpy.mockRestore()
    })

    it('should handle getCurrentWeek errors', () => {
      mockDataService.getCurrentWeek.mockImplementation(() => {
        throw new Error('Current week unavailable')
      })
      
      expect(() => {
        render(<TeamManagement />)
      }).not.toThrow()
    })

    it('should handle confirm dialog errors', async () => {
      const user = userEvent.setup()
      global.confirm.mockImplementation(() => {
        throw new Error('Confirm failed')
      })
      
      render(<TeamManagement />)
      
      const eliminateButton = screen.getByDisplayValue('Alice Johnson')
        .closest('.table-row').querySelector('.eliminate-btn')
      
      // Should not crash when confirm fails
      await user.click(eliminateButton)
      
      expect(screen.getByDisplayValue('Alice Johnson')).toBeInTheDocument()
    })

    it('should handle very long input values gracefully', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const longText = 'A'.repeat(10000)
      const teamNameInput = screen.getByDisplayValue('Rising Stars')
      
      await user.clear(teamNameInput)
      await user.type(teamNameInput, longText)
      
      expect(teamNameInput.value).toBe(longText)
    })

    it('should handle rapid elimination and restoration', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const aliceRow = screen.getByDisplayValue('Alice Johnson').closest('.table-row')
      const eliminateButton = aliceRow.querySelector('.eliminate-btn')
      
      // Rapid eliminate
      await user.click(eliminateButton)
      
      await waitFor(() => {
        const restoreButton = aliceRow.querySelector('.restore-btn')
        expect(restoreButton).toBeInTheDocument()
      })
      
      // Rapid restore
      const restoreButton = aliceRow.querySelector('.restore-btn')
      await user.click(restoreButton)
      
      await waitFor(() => {
        expect(aliceRow.querySelector('.eliminate-btn')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and Form Behavior', () => {
    it('should use proper input elements for editable fields', () => {
      render(<TeamManagement />)
      
      const textInputs = screen.getAllByRole('textbox')
      expect(textInputs.length).toBeGreaterThan(0)
      
      textInputs.forEach(input => {
        expect(input.tagName).toBe('INPUT')
        expect(input.type).toBe('text')
      })
    })

    it('should use proper button elements for actions', () => {
      render(<TeamManagement />)
      
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
      
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON')
      })
    })

    it('should disable save button during loading', async () => {
      const user = userEvent.setup()
      
      let resolvePromise
      mockDataService.saveData.mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve
        })
      })
      
      render(<TeamManagement />)
      
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      await user.click(saveButton)
      
      expect(saveButton).toBeDisabled()
      
      resolvePromise()
    })

    it('should provide clear button text for different states', async () => {
      const user = userEvent.setup()
      render(<TeamManagement />)
      
      const saveButton = screen.getByRole('button', { name: 'Save All Changes' })
      expect(saveButton).toHaveTextContent('Save All Changes')
      
      // During loading
      let resolvePromise
      mockDataService.saveData.mockImplementation(() => {
        return new Promise(resolve => {
          resolvePromise = resolve
        })
      })
      
      await user.click(saveButton)
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      
      resolvePromise()
    })
  })
})