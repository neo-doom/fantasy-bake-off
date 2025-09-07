import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  default: {
    getData: vi.fn()
  }
}))

import AdminView from './AdminView'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock child components to focus on AdminView logic
vi.mock('./AdminLogin', () => ({
  default: ({ onLogin }) => (
    <div data-testid="admin-login">
      <button onClick={() => onLogin(true)}>Mock Login</button>
    </div>
  )
}))

vi.mock('./ScoringGrid', () => ({
  default: () => <div data-testid="scoring-grid">Scoring Grid Component</div>
}))

vi.mock('./TeamManagement', () => ({
  default: () => <div data-testid="team-management">Team Management Component</div>
}))

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

// Mock game data
const mockGameData = {
  season: {
    name: "Season 2025",
    currentWeek: 6,
    isActive: true,
    teams: [
      { id: "team1", name: "Rising Stars" },
      { id: "team2", name: "Flour Power" }
    ]
  }
}

describe('AdminView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSessionStorage.getItem.mockReturnValue(null)
    mockDataService.getData.mockReturnValue(mockGameData)
  })

  describe('Authentication State Management', () => {
    it('should show AdminLogin when not authenticated', () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      
      render(<AdminView />)
      
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
      expect(screen.queryByText('🔧 Fantasy Bakes Admin')).not.toBeInTheDocument()
    })

    it('should show admin interface when authenticated via sessionStorage', () => {
      mockSessionStorage.getItem.mockReturnValue('true')
      
      render(<AdminView />)
      
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      expect(screen.queryByTestId('admin-login')).not.toBeInTheDocument()
    })

    it('should authenticate user when login is successful', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      // Initially should show login
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
      
      // Simulate successful login
      const loginButton = screen.getByText('Mock Login')
      await user.click(loginButton)
      
      await waitFor(() => {
        expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth', 'true')
      })
    })

    it('should handle logout functionality', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      render(<AdminView />)
      
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      
      // Click logout button
      const logoutButton = screen.getByText('Logout')
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('admin-login')).toBeInTheDocument()
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
      })
    })

    it('should persist authentication state across component mounts', () => {
      mockSessionStorage.getItem.mockReturnValue('true')
      
      const { unmount } = render(<AdminView />)
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      
      unmount()
      
      // Re-render should still be authenticated
      render(<AdminView />)
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
    })
  })

  describe('Admin Interface Layout and Navigation', () => {
    beforeEach(() => {
      mockSessionStorage.getItem.mockReturnValue('true')
    })

    it('should render admin header with season information', () => {
      render(<AdminView />)
      
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      expect(screen.getByText('Season 2025 - Week 6')).toBeInTheDocument()
      expect(screen.getByText('Logout')).toBeInTheDocument()
    })

    it('should render navigation tabs', () => {
      render(<AdminView />)
      
      expect(screen.getByText('Weekly Scoring')).toBeInTheDocument()
      expect(screen.getByText('Team Management')).toBeInTheDocument()
    })

    it('should start with scoring tab as default active tab', () => {
      render(<AdminView />)
      
      const scoringTab = screen.getByText('Weekly Scoring')
      expect(scoringTab).toHaveClass('active')
      expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
    })

    it('should not show team management tab as active initially', () => {
      render(<AdminView />)
      
      const teamTab = screen.getByText('Team Management')
      expect(teamTab).not.toHaveClass('active')
      expect(screen.queryByTestId('team-management')).not.toBeInTheDocument()
    })
  })

  describe('Tab Navigation Functionality', () => {
    beforeEach(() => {
      mockSessionStorage.getItem.mockReturnValue('true')
    })

    it('should switch to team management tab when clicked', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      // Initially on scoring tab
      expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
      expect(screen.queryByTestId('team-management')).not.toBeInTheDocument()
      
      // Click team management tab
      const teamTab = screen.getByText('Team Management')
      await user.click(teamTab)
      
      await waitFor(() => {
        expect(teamTab).toHaveClass('active')
        expect(screen.getByTestId('team-management')).toBeInTheDocument()
        expect(screen.queryByTestId('scoring-grid')).not.toBeInTheDocument()
      })
    })

    it('should switch back to scoring tab from team management', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      // Switch to team management
      const teamTab = screen.getByText('Team Management')
      await user.click(teamTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('team-management')).toBeInTheDocument()
      })
      
      // Switch back to scoring
      const scoringTab = screen.getByText('Weekly Scoring')
      await user.click(scoringTab)
      
      await waitFor(() => {
        expect(scoringTab).toHaveClass('active')
        expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
        expect(screen.queryByTestId('team-management')).not.toBeInTheDocument()
      })
    })

    it('should maintain proper active state for tabs', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      const scoringTab = screen.getByText('Weekly Scoring')
      const teamTab = screen.getByText('Team Management')
      
      // Initially scoring should be active
      expect(scoringTab).toHaveClass('active')
      expect(teamTab).not.toHaveClass('active')
      
      // Switch to team management
      await user.click(teamTab)
      
      await waitFor(() => {
        expect(teamTab).toHaveClass('active')
        expect(scoringTab).not.toHaveClass('active')
      })
      
      // Switch back to scoring
      await user.click(scoringTab)
      
      await waitFor(() => {
        expect(scoringTab).toHaveClass('active')
        expect(teamTab).not.toHaveClass('active')
      })
    })

    it('should render only the active tab content', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      // Initially only scoring grid should be rendered
      expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
      expect(screen.queryByTestId('team-management')).not.toBeInTheDocument()
      
      // Switch to team management
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByTestId('team-management')).toBeInTheDocument()
        expect(screen.queryByTestId('scoring-grid')).not.toBeInTheDocument()
      })
    })
  })

  describe('Data Loading and Error Handling', () => {
    beforeEach(() => {
      mockSessionStorage.getItem.mockReturnValue('true')
    })

    it('should show loading state when data is not available', () => {
      mockDataService.getData.mockReturnValue(null)
      
      render(<AdminView />)
      
      expect(screen.getByText('Loading admin panel...')).toBeInTheDocument()
      expect(screen.queryByText('🔧 Fantasy Bakes Admin')).not.toBeInTheDocument()
    })

    it('should load data on component mount', () => {
      render(<AdminView />)
      
      expect(mockDataService.getData).toHaveBeenCalled()
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
    })

    it('should display season information from loaded data', () => {
      const customData = {
        season: {
          name: "Custom Season",
          currentWeek: 3
        }
      }
      
      mockDataService.getData.mockReturnValue(customData)
      
      render(<AdminView />)
      
      expect(screen.getByText('Custom Season - Week 3')).toBeInTheDocument()
    })

    it('should handle data loading errors gracefully', () => {
      mockDataService.getData.mockImplementation(() => {
        throw new Error('Data loading failed')
      })
      
      render(<AdminView />)
      
      // Should show loading state rather than crashing
      expect(screen.getByText('Loading admin panel...')).toBeInTheDocument()
    })
  })

  describe('Admin User Experience Scenarios', () => {
    beforeEach(() => {
      mockSessionStorage.getItem.mockReturnValue('true')
    })

    it('should provide clear visual hierarchy for admin tasks', () => {
      render(<AdminView />)
      
      // Header should be prominent
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
      
      // Navigation should be clearly separated
      const nav = screen.getByText('Weekly Scoring').closest('nav')
      expect(nav).toBeInTheDocument()
      
      // Main content area should be distinct
      const main = screen.getByTestId('scoring-grid').closest('main')
      expect(main).toBeInTheDocument()
    })

    it('should provide quick access to logout functionality', () => {
      render(<AdminView />)
      
      const logoutButton = screen.getByText('Logout')
      expect(logoutButton).toBeInTheDocument()
      expect(logoutButton.closest('.admin-info')).toBeInTheDocument()
    })

    it('should show current context information to admin', () => {
      render(<AdminView />)
      
      // Admin should see current season and week
      expect(screen.getByText('Season 2025 - Week 6')).toBeInTheDocument()
    })

    it('should maintain tab state during admin session', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      // Switch to team management
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByTestId('team-management')).toBeInTheDocument()
      })
      
      // State should persist (component doesn't reset tabs on re-render)
      const teamTab = screen.getByText('Team Management')
      expect(teamTab).toHaveClass('active')
    })
  })

  describe('Security and Session Management', () => {
    it('should check authentication status on every render', () => {
      render(<AdminView />)
      
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
    })

    it('should not show admin interface if session is invalid', () => {
      mockSessionStorage.getItem.mockReturnValue('false')
      
      render(<AdminView />)
      
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
      expect(screen.queryByText('🔧 Fantasy Bakes Admin')).not.toBeInTheDocument()
    })

    it('should handle null session storage values', () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      
      render(<AdminView />)
      
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
    })

    it('should handle undefined session storage values', () => {
      mockSessionStorage.getItem.mockReturnValue(undefined)
      
      render(<AdminView />)
      
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
    })

    it('should clear session on logout', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      render(<AdminView />)
      
      const logoutButton = screen.getByText('Logout')
      await user.click(logoutButton)
      
      await waitFor(() => {
        expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('fantasy-bakes-admin-auth')
      })
    })
  })

  describe('Component Integration', () => {
    beforeEach(() => {
      mockSessionStorage.getItem.mockReturnValue('true')
    })

    it('should pass authentication callback to AdminLogin', () => {
      mockSessionStorage.getItem.mockReturnValue(null)
      
      render(<AdminView />)
      
      // AdminLogin should render with onLogin prop
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
      expect(screen.getByText('Mock Login')).toBeInTheDocument()
    })

    it('should render ScoringGrid when scoring tab is active', () => {
      render(<AdminView />)
      
      expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
    })

    it('should render TeamManagement when team tab is active', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByTestId('team-management')).toBeInTheDocument()
      })
    })

    it('should not render both components simultaneously', async () => {
      const user = userEvent.setup()
      render(<AdminView />)
      
      // Initially only scoring grid
      expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
      expect(screen.queryByTestId('team-management')).not.toBeInTheDocument()
      
      // Switch to team management
      await user.click(screen.getByText('Team Management'))
      
      await waitFor(() => {
        expect(screen.getByTestId('team-management')).toBeInTheDocument()
        expect(screen.queryByTestId('scoring-grid')).not.toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle missing season data gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('true')
      mockDataService.getData.mockReturnValue({ season: {} })
      
      render(<AdminView />)
      
      // Should not crash with incomplete data
      expect(screen.getByText('🔧 Fantasy Bakes Admin')).toBeInTheDocument()
    })

    it('should handle rapid tab switching', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      render(<AdminView />)
      
      const scoringTab = screen.getByText('Weekly Scoring')
      const teamTab = screen.getByText('Team Management')
      
      // Rapid switching
      await user.click(teamTab)
      await user.click(scoringTab)
      await user.click(teamTab)
      await user.click(scoringTab)
      
      await waitFor(() => {
        expect(scoringTab).toHaveClass('active')
        expect(screen.getByTestId('scoring-grid')).toBeInTheDocument()
      })
    })

    it('should handle sessionStorage errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockSessionStorage.getItem.mockImplementation(() => {
        throw new Error('Session storage error')
      })
      
      render(<AdminView />)
      
      // Should default to unauthenticated state
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle component re-mounting after logout', async () => {
      const user = userEvent.setup()
      mockSessionStorage.getItem.mockReturnValue('true')
      
      const { unmount } = render(<AdminView />)
      
      // Simulate logout
      await user.click(screen.getByText('Logout'))
      
      unmount()
      
      // Mock session storage reflecting logged out state
      mockSessionStorage.getItem.mockReturnValue(null)
      
      // Re-mount
      render(<AdminView />)
      
      expect(screen.getByTestId('admin-login')).toBeInTheDocument()
    })
  })
})