import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  default: {
    getTeamScores: vi.fn()
  }
}))

import Leaderboard from './Leaderboard'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock team scores data
const mockTeamScores = [
  {
    id: 'team1',
    name: 'Rising Stars',
    totalScore: 25,
    currentWeekScore: 8,
    bakers: [
      { id: 'baker1', name: 'Alice Johnson', eliminated: false },
      { id: 'baker2', name: 'Bob Smith', eliminated: true, eliminatedWeek: 2 },
      { id: 'baker3', name: 'Carol Davis', eliminated: false }
    ]
  },
  {
    id: 'team2', 
    name: 'Flour Power',
    totalScore: 22,
    currentWeekScore: 5,
    bakers: [
      { id: 'baker4', name: 'David Wilson', eliminated: false },
      { id: 'baker5', name: 'Emma Brown', eliminated: false },
      { id: 'baker6', name: 'Frank Miller', eliminated: true, eliminatedWeek: 3 }
    ]
  },
  {
    id: 'team3',
    name: 'Soggy Bottoms', 
    totalScore: 18,
    currentWeekScore: 3,
    bakers: [
      { id: 'baker7', name: 'Grace Lee', eliminated: false },
      { id: 'baker8', name: 'Henry Taylor', eliminated: true, eliminatedWeek: 1 },
      { id: 'baker9', name: 'Iris Anderson', eliminated: false }
    ]
  }
]

describe('Leaderboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDataService.getTeamScores.mockResolvedValue(mockTeamScores)
  })

  describe('Basic Rendering and Data Display', () => {
    it('should render leaderboard with team standings', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      // Check loading state first
      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument()
      
      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 4')).toBeInTheDocument()
      })
      
      // Check that all teams are displayed
      expect(screen.getByText('Rising Stars')).toBeInTheDocument()
      expect(screen.getByText('Flour Power')).toBeInTheDocument()
      expect(screen.getByText('Soggy Bottoms')).toBeInTheDocument()
    })

    it('should display teams in correct ranking order', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const teamCards = screen.getAllByRole('generic', { name: /team-card/ })
        // Teams should be displayed in score order (highest first)
        expect(teamCards[0]).toHaveTextContent('Rising Stars')
        expect(teamCards[1]).toHaveTextContent('Flour Power') 
        expect(teamCards[2]).toHaveTextContent('Soggy Bottoms')
      })
    })

    it('should show position numbers correctly', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const positions = screen.getAllByText(/^[123]$/)
        expect(positions[0]).toHaveTextContent('1')
        expect(positions[1]).toHaveTextContent('2')
        expect(positions[2]).toHaveTextContent('3')
      })
    })

    it('should display crown for first place team', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const crownElements = screen.getAllByText('👑')
        expect(crownElements).toHaveLength(1)
        
        // Crown should be near "Rising Stars" (first place)
        const firstPlaceTeam = screen.getByText('Rising Stars').closest('.team-card')
        expect(firstPlaceTeam).toContainElement(crownElements[0])
      })
    })
  })

  describe('Score Display', () => {
    it('should display total scores correctly', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('25')).toBeInTheDocument() // Rising Stars total
        expect(screen.getByText('22')).toBeInTheDocument() // Flour Power total
        expect(screen.getByText('18')).toBeInTheDocument() // Soggy Bottoms total
      })
    })

    it('should display weekly scores with plus sign', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('+8')).toBeInTheDocument() // Rising Stars week
        expect(screen.getByText('+5')).toBeInTheDocument() // Flour Power week
        expect(screen.getByText('+3')).toBeInTheDocument() // Soggy Bottoms week
      })
    })
  })

  describe('Baker Information Display', () => {
    it('should display all baker names for each team', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        // Rising Stars bakers
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
        expect(screen.getByText('Bob Smith')).toBeInTheDocument()
        expect(screen.getByText('Carol Davis')).toBeInTheDocument()
        
        // Flour Power bakers
        expect(screen.getByText('David Wilson')).toBeInTheDocument()
        expect(screen.getByText('Emma Brown')).toBeInTheDocument()
        expect(screen.getByText('Frank Miller')).toBeInTheDocument()
        
        // Soggy Bottoms bakers
        expect(screen.getByText('Grace Lee')).toBeInTheDocument()
        expect(screen.getByText('Henry Taylor')).toBeInTheDocument()
        expect(screen.getByText('Iris Anderson')).toBeInTheDocument()
      })
    })

    it('should mark eliminated bakers with X emoji', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        // Check eliminated bakers have X emoji
        const bobSmith = screen.getByText(/Bob Smith/)
        expect(bobSmith).toHaveTextContent('Bob Smith ❌')
        
        const frankMiller = screen.getByText(/Frank Miller/)
        expect(frankMiller).toHaveTextContent('Frank Miller ❌')
        
        const henryTaylor = screen.getByText(/Henry Taylor/)
        expect(henryTaylor).toHaveTextContent('Henry Taylor ❌')
      })
    })

    it('should apply eliminated styling to eliminated bakers', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const eliminatedBakers = screen.getAllByText(/❌/)
        eliminatedBakers.forEach(baker => {
          expect(baker).toHaveClass('eliminated')
        })
      })
    })

    it('should not mark active bakers as eliminated', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const aliceJohnson = screen.getByText('Alice Johnson')
        expect(aliceJohnson).not.toHaveTextContent('❌')
        expect(aliceJohnson).not.toHaveClass('eliminated')
        
        const carolDavis = screen.getByText('Carol Davis')
        expect(carolDavis).not.toHaveTextContent('❌')
        expect(carolDavis).not.toHaveClass('eliminated')
      })
    })
  })

  describe('Week Selection Handling', () => {
    it('should display week number in header when selectedWeek provided', async () => {
      render(<Leaderboard selectedWeek={3} />)
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 3')).toBeInTheDocument()
      })
    })

    it('should not display week number when selectedWeek is null', async () => {
      render(<Leaderboard selectedWeek={null} />)
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings')).toBeInTheDocument()
        expect(screen.queryByText(/Week \d+/)).not.toBeInTheDocument()
      })
    })

    it('should call getTeamScores with correct week parameter', async () => {
      render(<Leaderboard selectedWeek={5} />)
      
      await waitFor(() => {
        expect(mockDataService.getTeamScores).toHaveBeenCalledWith(5)
      })
    })

    it('should update scores when selectedWeek changes', async () => {
      const { rerender } = render(<Leaderboard selectedWeek={3} />)
      
      await waitFor(() => {
        expect(mockDataService.getTeamScores).toHaveBeenCalledWith(3)
      })
      
      // Change week
      rerender(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(mockDataService.getTeamScores).toHaveBeenCalledWith(4)
      })
      
      expect(mockDataService.getTeamScores).toHaveBeenCalledTimes(2)
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state initially', () => {
      render(<Leaderboard selectedWeek={4} />)
      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument()
    })

    it('should handle data loading errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockDataService.getTeamScores.mockRejectedValue(new Error('API Error'))
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        // Component should not crash and loading should complete
        expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument()
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('Error loading scores:', expect.any(Error))
      consoleSpy.mockRestore()
    })

    it('should handle empty team scores array', async () => {
      mockDataService.getTeamScores.mockResolvedValue([])
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('Team Standings - Week 4')).toBeInTheDocument()
        // Should not crash with empty data
        expect(screen.queryByText('Rising Stars')).not.toBeInTheDocument()
      })
    })
  })

  describe('Visual Hierarchy and Styling', () => {
    it('should apply leader class to first place team', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const teamCards = screen.getAllByRole('generic').filter(el => 
          el.className.includes('team-card')
        )
        
        expect(teamCards[0]).toHaveClass('leader')
        expect(teamCards[1]).not.toHaveClass('leader')
        expect(teamCards[2]).not.toHaveClass('leader')
      })
    })

    it('should structure team information hierarchically', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const risingStarsCard = screen.getByText('Rising Stars').closest('.team-card')
        
        // Check structure elements exist
        expect(risingStarsCard.querySelector('.team-header')).toBeInTheDocument()
        expect(risingStarsCard.querySelector('.position-info')).toBeInTheDocument()
        expect(risingStarsCard.querySelector('.team-info')).toBeInTheDocument()
        expect(risingStarsCard.querySelector('.scores')).toBeInTheDocument()
        expect(risingStarsCard.querySelector('.bakers-list')).toBeInTheDocument()
      })
    })
  })

  describe('End-User Perspective Tests', () => {
    it('should allow user to quickly identify team rankings at a glance', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        // User should immediately see position numbers and crown
        const positions = screen.getAllByText(/^[123]$/)
        const crown = screen.getByText('👑')
        
        expect(positions).toHaveLength(3)
        expect(crown).toBeInTheDocument()
        
        // First position should have crown
        const firstPositionCard = positions[0].closest('.team-card')
        expect(firstPositionCard).toContainElement(crown)
      })
    })

    it('should help user understand team composition and eliminations', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        // User should see which bakers are still active vs eliminated
        const activeBakers = screen.getAllByText(/^[A-Za-z\s]+$/).filter(el => 
          el.className.includes('baker-name') && !el.textContent.includes('❌')
        )
        const eliminatedBakers = screen.getAllByText(/❌/)
        
        expect(activeBakers.length).toBeGreaterThan(0)
        expect(eliminatedBakers.length).toBeGreaterThan(0)
        expect(eliminatedBakers).toHaveLength(3) // Bob, Frank, Henry
      })
    })

    it('should display current performance metrics clearly', async () => {
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        // User should see both weekly gains and total scores
        const weeklyScores = screen.getAllByText(/^\+\d+$/)
        const totalScores = screen.getAllByText(/^\d+$/).filter(el => 
          !el.textContent.startsWith('+') && el.textContent.match(/^\d+$/)
        )
        
        expect(weeklyScores).toHaveLength(3) // +8, +5, +3
        expect(totalScores.length).toBeGreaterThanOrEqual(3) // Total scores
      })
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle team with zero score', async () => {
      const scoresWithZero = [
        ...mockTeamScores,
        {
          id: 'team4',
          name: 'Zero Heroes',
          totalScore: 0,
          currentWeekScore: 0,
          bakers: [{ id: 'baker10', name: 'Zero Baker', eliminated: false }]
        }
      ]
      
      mockDataService.getTeamScores.mockResolvedValue(scoresWithZero)
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('Zero Heroes')).toBeInTheDocument()
        expect(screen.getByText('Zero Baker')).toBeInTheDocument()
        expect(screen.getByText('+0')).toBeInTheDocument()
      })
    })

    it('should handle team with negative weekly score', async () => {
      const scoresWithNegative = [{
        ...mockTeamScores[0],
        currentWeekScore: -2
      }, ...mockTeamScores.slice(1)]
      
      mockDataService.getTeamScores.mockResolvedValue(scoresWithNegative)
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('+-2')).toBeInTheDocument() // Shows as +-2
      })
    })

    it('should handle team with very long name', async () => {
      const scoresWithLongName = [{
        ...mockTeamScores[0],
        name: 'The Extraordinarily Long Team Name That Might Cause Layout Issues'
      }, ...mockTeamScores.slice(1)]
      
      mockDataService.getTeamScores.mockResolvedValue(scoresWithLongName)
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('The Extraordinarily Long Team Name That Might Cause Layout Issues')).toBeInTheDocument()
      })
    })

    it('should handle baker with very long name', async () => {
      const scoresWithLongBakerName = [{
        ...mockTeamScores[0],
        bakers: [
          { id: 'baker1', name: 'Alice Elizabeth Victoria Margaret Thompson-Williams-Johnson', eliminated: false }
        ]
      }, ...mockTeamScores.slice(1)]
      
      mockDataService.getTeamScores.mockResolvedValue(scoresWithLongBakerName)
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        expect(screen.getByText('Alice Elizabeth Victoria Margaret Thompson-Williams-Johnson')).toBeInTheDocument()
      })
    })

    it('should handle team with all bakers eliminated', async () => {
      const allEliminatedTeam = [{
        ...mockTeamScores[0],
        bakers: [
          { id: 'baker1', name: 'Alice', eliminated: true, eliminatedWeek: 1 },
          { id: 'baker2', name: 'Bob', eliminated: true, eliminatedWeek: 2 },
          { id: 'baker3', name: 'Carol', eliminated: true, eliminatedWeek: 3 }
        ]
      }, ...mockTeamScores.slice(1)]
      
      mockDataService.getTeamScores.mockResolvedValue(allEliminatedTeam)
      
      render(<Leaderboard selectedWeek={4} />)
      
      await waitFor(() => {
        const risingStarsCard = screen.getByText('Rising Stars').closest('.team-card')
        const eliminatedCount = risingStarsCard.querySelectorAll('.eliminated').length
        expect(eliminatedCount).toBe(3)
      })
    })
  })
})