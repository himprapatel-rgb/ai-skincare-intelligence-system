/**
 * Tests for AuthPageMobileV2
 * Verifies all functionality and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthPageMobileV2 } from './AuthPageMobileV2';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock modules
vi.mock('../utils/mobileOptimizations', () => ({
  triggerHaptic: vi.fn(),
}));

vi.mock('axios');

const renderAuthPage = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AuthPageMobileV2 />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('AuthPageMobileV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Visual Elements', () => {
    it('should render the hero section with logo and title', () => {
      renderAuthPage();
      
      expect(screen.getByText('Pellicura')).toBeInTheDocument();
      expect(screen.getByText('AI-powered skincare intelligence')).toBeInTheDocument();
    });

    it('should render tab switcher with Sign In and Sign Up', () => {
      renderAuthPage();
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should show Sign In mode by default', () => {
      renderAuthPage();
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    });
  });

  describe('Tab Switching', () => {
    it('should switch to Sign Up mode when clicking Sign Up tab', async () => {
      renderAuthPage();
      
      const signUpTab = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpTab);

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });
    });

    it('should show password strength indicator in Sign Up mode', async () => {
      renderAuthPage();
      
      const signUpTab = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpTab);

      const passwordInput = screen.getByLabelText(/password/i);
      fireEvent.change(passwordInput, { target: { value: 'Test123!' } });

      await waitFor(() => {
        expect(screen.getByText(/password:/i)).toBeInTheDocument();
      });
    });

    it('should hide features when switching back to Sign In', async () => {
      renderAuthPage();
      
      // Go to Sign Up
      const signUpTab = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpTab);
      
      await waitFor(() => {
        expect(screen.getByText(/AI Skin Analysis/i)).toBeInTheDocument();
      });

      // Go back to Sign In
      const signInTab = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(signInTab);

      await waitFor(() => {
        expect(screen.queryByText(/AI Skin Analysis/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting empty form', async () => {
      renderAuthPage();
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderAuthPage();
      
      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
      fireEvent.click(submitButton);

      // Form should not submit with invalid email
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Password Features', () => {
    it('should toggle password visibility', async () => {
      renderAuthPage();
      
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find and click the eye icon button
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe('text');
      });
    });

    it('should calculate password strength correctly', async () => {
      renderAuthPage();
      
      // Switch to Sign Up mode
      const signUpTab = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpTab);

      const passwordInput = screen.getByLabelText(/password/i);

      // Weak password
      fireEvent.change(passwordInput, { target: { value: 'abc' } });
      await waitFor(() => {
        expect(screen.getByText(/weak/i)).toBeInTheDocument();
      });

      // Medium password
      fireEvent.change(passwordInput, { target: { value: 'Abc123' } });
      await waitFor(() => {
        expect(screen.getByText(/medium/i)).toBeInTheDocument();
      });

      // Strong password
      fireEvent.change(passwordInput, { target: { value: 'Abc123!@#XYZ' } });
      await waitFor(() => {
        expect(screen.getByText(/strong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Remember Me', () => {
    it('should render Remember Me checkbox in Sign In mode', () => {
      renderAuthPage();
      
      expect(screen.getByText(/remember me/i)).toBeInTheDocument();
    });

    it('should not show Remember Me in Sign Up mode', async () => {
      renderAuthPage();
      
      const signUpTab = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpTab);

      await waitFor(() => {
        expect(screen.queryByText(/remember me/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Social Sign-In', () => {
    it('should render Google sign-in button', () => {
      renderAuthPage();
      
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    it('should show features only in Sign Up mode', async () => {
      renderAuthPage();
      
      // Not visible in Sign In mode
      expect(screen.queryByText(/AI Skin Analysis/i)).not.toBeInTheDocument();

      // Switch to Sign Up
      const signUpTab = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signUpTab);

      // Now visible
      await waitFor(() => {
        expect(screen.getByText(/AI Skin Analysis/i)).toBeInTheDocument();
        expect(screen.getByText(/Personalized Routines/i)).toBeInTheDocument();
        expect(screen.getByText(/Track Progress/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderAuthPage();
      
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should show error with role="alert"', async () => {
      renderAuthPage();
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should apply mobile classes', () => {
      const { container } = renderAuthPage();
      
      expect(container.querySelector('.auth-page-mobile-v2')).toBeInTheDocument();
    });
  });
});
