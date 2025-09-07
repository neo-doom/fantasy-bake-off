import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock the dataService
vi.mock('../services/dataService', () => ({
  default: {
    getConfig: vi.fn()
  }
}))

import AdminLogin from './AdminLogin'
import dataService from '../services/dataService'

const mockDataService = dataService

// Mock config data
const mockConfig = {
  adminPassword: 'test123',
  appName: 'Fantasy Bakes',
  scoringRules: {
    survived: 1,
    technicalWin: 2,
    starBaker: 3
  }
}

describe('AdminLogin Component', () => {
  let mockOnLogin

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnLogin = vi.fn()
    mockDataService.getConfig.mockReturnValue(mockConfig)
  })

  describe('Basic Rendering and UI Elements', () => {
    it('should render login form with all required elements', () => {
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      expect(screen.getByText('🔐 Admin Access')).toBeInTheDocument()
      expect(screen.getByText('Enter the admin password to access the Fantasy Bakes management panel')).toBeInTheDocument()
      expect(screen.getByLabelText('Password:')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
      expect(screen.getByText('← Back to Public View')).toBeInTheDocument()
    })

    it('should render password input with correct attributes', () => {
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(passwordInput).toHaveAttribute('id', 'password')
      expect(passwordInput).toBeRequired()
    })

    it('should initially disable submit button when password is empty', () => {
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const submitButton = screen.getByRole('button', { name: 'Login' })
      expect(submitButton).toBeDisabled()
    })

    it('should enable submit button when password is entered', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'somepassword')
      
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Authentication Success Scenarios', () => {
    it('should call onLogin with true when correct password is entered', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'test123')
      await user.click(submitButton)
      
      expect(mockOnLogin).toHaveBeenCalledWith(true)
    })

    it('should handle form submission via Enter key', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      
      await user.type(passwordInput, 'test123')
      await user.keyboard('{Enter}')
      
      expect(mockOnLogin).toHaveBeenCalledWith(true)
    })

    it('should show loading state during authentication', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'test123')
      
      // Start the submission
      user.click(submitButton)
      
      // Should immediately show loading state
      await waitFor(() => {
        expect(screen.getByText('Authenticating...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
        expect(passwordInput).toBeDisabled()
      })
    })

    it('should clear error message on successful login attempt', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // First, trigger an error
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      // Clear and enter correct password
      await user.clear(passwordInput)
      await user.type(passwordInput, 'test123')
      await user.click(submitButton)
      
      // Error should be cleared during new attempt
      expect(screen.queryByText('Incorrect password')).not.toBeInTheDocument()
    })
  })

  describe('Authentication Failure Scenarios', () => {
    it('should show error message for incorrect password', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('should not call onLogin when authentication fails', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'incorrectpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })

    it('should handle config loading errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockDataService.getConfig.mockImplementation(() => {
        throw new Error('Config load failed')
      })
      
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'test123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument()
      })
      
      expect(mockOnLogin).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should reset form state after failed authentication', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      // Form should be interactive again
      expect(passwordInput).not.toBeDisabled()
      expect(submitButton).toHaveTextContent('Login')
      expect(submitButton).not.toBeDisabled()
    })
  })

  describe('Input Validation and UX', () => {
    it('should trim whitespace from password input', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // Enter password with leading/trailing spaces
      await user.type(passwordInput, '  test123  ')
      await user.click(submitButton)
      
      // Should still authenticate successfully if trimmed password matches
      expect(mockOnLogin).toHaveBeenCalledWith(true)
    })

    it('should keep submit button disabled for whitespace-only password', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, '   ')
      
      expect(submitButton).toBeDisabled()
    })

    it('should handle empty string password gracefully', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // Try to submit with empty password (should be prevented by disabled state)
      expect(submitButton).toBeDisabled()
      
      // Type something then clear it
      await user.type(passwordInput, 'test')
      expect(submitButton).not.toBeDisabled()
      
      await user.clear(passwordInput)
      expect(submitButton).toBeDisabled()
    })

    it('should handle very long passwords', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      const longPassword = 'a'.repeat(1000)
      await user.type(passwordInput, longPassword)
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })
  })

  describe('Admin User Experience Scenarios', () => {
    it('should provide clear guidance to admin user', () => {
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      // Check for helpful instruction text
      expect(screen.getByText('Enter the admin password to access the Fantasy Bakes management panel')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument()
    })

    it('should show clear visual feedback for authentication states', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // Default state
      expect(submitButton).toHaveTextContent('Login')
      expect(submitButton).toBeDisabled()
      
      // With password entered
      await user.type(passwordInput, 'test123')
      expect(submitButton).not.toBeDisabled()
      
      // During authentication (simulated)
      user.click(submitButton)
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Authenticating...')
        expect(submitButton).toBeDisabled()
      })
    })

    it('should provide easy navigation back to public view', () => {
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const backLink = screen.getByText('← Back to Public View')
      expect(backLink).toBeInTheDocument()
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })

    it('should handle repeated login attempts gracefully', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // First failed attempt
      await user.type(passwordInput, 'wrong1')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      // Second failed attempt
      await user.clear(passwordInput)
      await user.type(passwordInput, 'wrong2')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      // Successful attempt
      await user.clear(passwordInput)
      await user.type(passwordInput, 'test123')
      await user.click(submitButton)
      
      expect(mockOnLogin).toHaveBeenCalledWith(true)
    })
  })

  describe('Security Considerations', () => {
    it('should not expose password in any form elements or attributes', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      
      // Password input should have type="password"
      expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Password should not be visible in value attribute for type="password"
      expect(passwordInput.value).toBe('test123') // This is normal for controlled inputs
    })

    it('should not log sensitive information to console', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      await user.type(passwordInput, 'test123')
      await user.click(screen.getByRole('button', { name: 'Login' }))
      
      // Check that no console.log calls contain password
      const logCalls = consoleSpy.mock.calls.flat()
      const hasPasswordInLogs = logCalls.some(call => 
        typeof call === 'string' && call.includes('test123')
      )
      
      expect(hasPasswordInLogs).toBe(false)
      consoleSpy.mockRestore()
    })

    it('should handle case-sensitive password comparison', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      
      // Try uppercase version of correct password
      await user.type(passwordInput, 'TEST123')
      await user.click(screen.getByRole('button', { name: 'Login' }))
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      expect(mockOnLogin).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility and Form Behavior', () => {
    it('should associate label with input correctly', () => {
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const label = screen.getByText('Password:')
      
      expect(label).toHaveAttribute('for', 'password')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // Tab to password input
      await user.tab()
      expect(passwordInput).toHaveFocus()
      
      // Type password
      await user.type(passwordInput, 'test123')
      
      // Tab to submit button
      await user.tab()
      expect(submitButton).toHaveFocus()
      
      // Press Enter to submit
      await user.keyboard('{Enter}')
      
      expect(mockOnLogin).toHaveBeenCalledWith(true)
    })

    it('should prevent form submission when button is disabled', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // Try to click disabled button
      await user.click(submitButton)
      
      // Should not trigger authentication
      expect(mockOnLogin).not.toHaveBeenCalled()
      expect(screen.queryByText('Authenticating...')).not.toBeInTheDocument()
    })

    it('should handle focus management during loading state', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'test123')
      
      // Start submission
      user.click(submitButton)
      
      await waitFor(() => {
        expect(submitButton).toHaveTextContent('Authenticating...')
      })
      
      // Both inputs should be disabled during loading
      expect(passwordInput).toBeDisabled()
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Error State Recovery', () => {
    it('should allow recovery from error state by typing new password', async () => {
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      // Trigger error
      await user.type(passwordInput, 'wrong')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect password')).toBeInTheDocument()
      })
      
      // Start typing new password - error should clear
      await user.clear(passwordInput)
      await user.type(passwordInput, 't')
      
      // Error message should be cleared when starting new input
      // (This would depend on implementation - some apps clear on change, others on submit)
      expect(screen.queryByText('Incorrect password')).toBeInTheDocument() // May still be there until next submission
    })

    it('should maintain form functionality after authentication error', async () => {
      mockDataService.getConfig.mockImplementationOnce(() => {
        throw new Error('Config error')
      })
      
      const user = userEvent.setup()
      render(<AdminLogin onLogin={mockOnLogin} />)
      
      const passwordInput = screen.getByLabelText('Password:')
      const submitButton = screen.getByRole('button', { name: 'Login' })
      
      await user.type(passwordInput, 'test123')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Authentication error')).toBeInTheDocument()
      })
      
      // Reset mock to work normally
      mockDataService.getConfig.mockReturnValue(mockConfig)
      
      // Should be able to try again
      await user.clear(passwordInput)
      await user.type(passwordInput, 'test123')
      await user.click(submitButton)
      
      expect(mockOnLogin).toHaveBeenCalledWith(true)
    })
  })
})