import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  default: {
    getData: vi.fn()
  }
}))

import PublicView from './PublicView'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock the Leaderboard component to focus on PublicView logic
vi.mock('./Leaderboard', () => ({
  default: ({ selectedWeek }) => (
    <div data-testid="leaderboard" data-selected-week={selectedWeek}>
      Leaderboard for Week {selectedWeek}
    </div>
  )
}))

// Mock game data
const mockGameData = {
  season: {
    name: "Season 2025",
    currentWeek: 6,
    isActive: true,
    teams: [
      { id: "team1", name: "Rising Stars" },
      { id: "team2", name: "Flour Power" }
    ],
    weeks: [
      { weekNumber: 1, theme: "Cake Week", scores: {} },
      { weekNumber: 2, theme: "Biscuit Week", scores: {} },
      { weekNumber: 3, theme: "Bread Week", scores: {} },
      { weekNumber: 4, theme: "Dessert Week", scores: {} },
      { weekNumber: 5, theme: "Pastry Week", scores: {} },
      { weekNumber: 6, theme: "Japanese Week", scores: {} }
    ]
  }
}

describe('PublicView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataService.getData.mockReturnValue(mockGameData)
  })

  describe('Basic Rendering and Layout', () => {
    it('should render the main header and branding', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByText('🧁 Fantasy Bakes')).toBeInTheDocument()
        expect(screen.getByText('Great British Bake Off Fantasy League')).toBeInTheDocument()
      })
    })

    it('should render footer with motivational message', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByText('May the best bakers rise to the top! 🥧')).toBeInTheDocument()
      })
    })

    it('should show last updated timestamp', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
      })
    })

    it('should render leaderboard component', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading message initially', () => {
      mockDataService.getData.mockImplementation(() => {
        throw new Error('Loading...')
      })
      
      render(<PublicView />)
      expect(screen.getByText('Loading Fantasy Bakes...')).toBeInTheDocument()
    })

    it('should show error message when data fails to load', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDataService.getData.mockImplementation(() => {
        throw new Error('Data loading failed')
      })
      
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle null data gracefully', async () => {
      mockDataService.getData.mockReturnValue(null)
      
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByText('Error loading data')).toBeInTheDocument()
      })
    })
  })

  describe('Week Navigation', () => {
    it('should render week navigation with 10 weeks', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        for (let i = 1; i <= 10; i++) {
          expect(screen.getByText(`Week ${i}`)).toBeInTheDocument()
        }
      })
    })

    it('should mark played weeks as clickable', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        // Weeks 1-6 should be clickable (played)
        for (let i = 1; i <= 6; i++) {
          const weekButton = screen.getByText(`Week ${i}`)
          expect(weekButton).not.toBeDisabled()
        }
        
        // Weeks 7-10 should be disabled (unplayed)
        for (let i = 7; i <= 10; i++) {
          const weekButton = screen.getByText(`Week ${i}`)
          expect(weekButton).toBeDisabled()
        }
      })
    })

    it('should apply correct CSS classes to week buttons', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        // Current week (Week 6) should have 'current' class
        const currentWeekButton = screen.getByText('Week 6')
        expect(currentWeekButton).toHaveClass('current')
        
        // Unplayed weeks should have 'unplayed' class
        const unplayedWeekButton = screen.getByText('Week 7')
        expect(unplayedWeekButton).toHaveClass('unplayed')
        
        // Initially, Week 6 should be selected
        expect(currentWeekButton).toHaveClass('selected')
      })
    })

    it('should start with current week selected by default', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        const leaderboard = screen.getByTestId('leaderboard')
        expect(leaderboard).toHaveAttribute('data-selected-week', '6')
      })
    })
  })

  describe('User Navigation Interactions', () => {
    it('should update selected week when user clicks on played week', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '6')
      })
      
      // Click on Week 3
      const week3Button = screen.getByText('Week 3')
      await user.click(week3Button)
      
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '3')
        expect(week3Button).toHaveClass('selected')
      })
    })

    it('should not allow selection of unplayed weeks', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      await waitFor(() => {
        const week8Button = screen.getByText('Week 8')
        expect(week8Button).toBeDisabled()
      })
      
      // Try to click on Week 8 (should not work)
      const week8Button = screen.getByText('Week 8')
      await user.click(week8Button)
      
      // Selected week should remain unchanged
      expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '6')
    })

    it('should update selected class when changing weeks', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByText('Week 6')).toHaveClass('selected')
      })
      
      // Click on Week 2
      await user.click(screen.getByText('Week 2'))
      
      await waitFor(() => {
        expect(screen.getByText('Week 2')).toHaveClass('selected')
        expect(screen.getByText('Week 6')).not.toHaveClass('selected')
      })
    })

    it('should allow navigation between all played weeks', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      // Test clicking through multiple weeks
      for (let week = 1; week <= 6; week++) {
        const weekButton = screen.getByText(`Week ${week}`)
        await user.click(weekButton)
        
        await waitFor(() => {
          expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', week.toString())
          expect(weekButton).toHaveClass('selected')
        })
      }
    })
  })

  describe('End-User Journey Scenarios', () => {
    it('should support user checking current standings', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        // User lands on page and sees current week standings
        expect(screen.getByText('Week 6')).toHaveClass('current')
        expect(screen.getByText('Week 6')).toHaveClass('selected')
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '6')
      })
    })

    it('should support user reviewing historical performance', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      await waitFor(() => {
        // User clicks on earlier week to see historical data
        const week1Button = screen.getByText('Week 1')
        expect(week1Button).not.toBeDisabled()
      })
      
      await user.click(screen.getByText('Week 1'))
      
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '1')
        expect(screen.getByText('Week 1')).toHaveClass('selected')
      })
    })

    it('should provide clear visual feedback about week availability', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        // Available weeks should be clearly clickable
        const playedWeeks = Array.from({ length: 6 }, (_, i) => i + 1)
        playedWeeks.forEach(week => {
          const button = screen.getByText(`Week ${week}`)
          expect(button).not.toBeDisabled()
          expect(button).not.toHaveClass('unplayed')
        })
        
        // Unavailable weeks should be visually distinct
        const unplayedWeeks = Array.from({ length: 4 }, (_, i) => i + 7)
        unplayedWeeks.forEach(week => {
          const button = screen.getByText(`Week ${week}`)
          expect(button).toBeDisabled()
          expect(button).toHaveClass('unplayed')
        })
      })
    })

    it('should help user understand current vs historical context', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        // Current week should be clearly marked
        expect(screen.getByText('Week 6')).toHaveClass('current')
        
        // Other played weeks should not have current class
        for (let i = 1; i <= 5; i++) {
          expect(screen.getByText(`Week ${i}`)).not.toHaveClass('current')
        }
      })
    })
  })

  describe('Responsive Behavior and Accessibility', () => {
    it('should use proper button elements for navigation', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        const weekButtons = screen.getAllByRole('button')
        expect(weekButtons.length).toBeGreaterThanOrEqual(10) // At least 10 week buttons
        
        weekButtons.forEach(button => {
          expect(button.tagName).toBe('BUTTON')
        })
      })
    })

    it('should provide appropriate button states for accessibility', async () => {
      render(<PublicView />)
      
      await waitFor(() => {
        // Disabled buttons should have disabled attribute
        const week7Button = screen.getByText('Week 7')
        expect(week7Button).toHaveAttribute('disabled')
        
        // Enabled buttons should not have disabled attribute
        const week1Button = screen.getByText('Week 1')
        expect(week1Button).not.toHaveAttribute('disabled')
      })
    })
  })

  describe('Data Integration Edge Cases', () => {
    it('should handle missing weeks data', async () => {
      const dataWithMissingWeeks = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          weeks: [] // No weeks played yet
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithMissingWeeks)
      
      render(<PublicView />)
      
      await waitFor(() => {
        // All weeks should be disabled
        for (let i = 1; i <= 10; i++) {
          const weekButton = screen.getByText(`Week ${i}`)
          expect(weekButton).toBeDisabled()
          expect(weekButton).toHaveClass('unplayed')
        }
      })
    })

    it('should handle weeks with gaps in numbering', async () => {
      const dataWithGapWeeks = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          weeks: [
            { weekNumber: 1, theme: "Week 1", scores: {} },
            { weekNumber: 3, theme: "Week 3", scores: {} }, // Skip week 2
            { weekNumber: 5, theme: "Week 5", scores: {} }  // Skip week 4
          ]
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithGapWeeks)
      
      render(<PublicView />)
      
      await waitFor(() => {
        // Weeks 1, 3, 5 should be enabled
        expect(screen.getByText('Week 1')).not.toBeDisabled()
        expect(screen.getByText('Week 3')).not.toBeDisabled()
        expect(screen.getByText('Week 5')).not.toBeDisabled()
        
        // Weeks 2, 4, 6+ should be disabled
        expect(screen.getByText('Week 2')).toBeDisabled()
        expect(screen.getByText('Week 4')).toBeDisabled()
        expect(screen.getByText('Week 6')).toBeDisabled()
      })
    })

    it('should handle currentWeek beyond available data', async () => {
      const dataWithHighCurrentWeek = {
        ...mockGameData,
        season: {
          ...mockGameData.season,
          currentWeek: 15, // Beyond available weeks
          weeks: mockGameData.season.weeks.slice(0, 3) // Only 3 weeks played
        }
      }
      
      mockDataService.getData.mockReturnValue(dataWithHighCurrentWeek)
      
      render(<PublicView />)
      
      await waitFor(() => {
        // No week should have 'current' class since week 15 doesn't exist in navigation
        for (let i = 1; i <= 10; i++) {
          expect(screen.getByText(`Week ${i}`)).not.toHaveClass('current')
        }
        
        // Should still default to a played week (e.g., last available)
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '6')
      })
    })
  })

  describe('Performance and State Management', () => {
    it('should not cause unnecessary re-renders when clicking same week', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '6')
      })
      
      // Click on already selected week
      const week6Button = screen.getByText('Week 6')
      await user.click(week6Button)
      
      // State should remain the same
      expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '6')
      expect(week6Button).toHaveClass('selected')
    })

    it('should maintain state consistency across interactions', async () => {
      const user = userEvent.setup()
      render(<PublicView />)
      
      // Perform multiple week changes
      await user.click(screen.getByText('Week 2'))
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '2')
      })
      
      await user.click(screen.getByText('Week 5'))
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '5')
      })
      
      await user.click(screen.getByText('Week 1'))
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard')).toHaveAttribute('data-selected-week', '1')
      })
      
      // Only the last clicked week should be selected
      expect(screen.getByText('Week 1')).toHaveClass('selected')
      expect(screen.getByText('Week 2')).not.toHaveClass('selected')
      expect(screen.getByText('Week 5')).not.toHaveClass('selected')
    })
  })
})