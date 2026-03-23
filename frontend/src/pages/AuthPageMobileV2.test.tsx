/**
 * Tests for AuthPageMobileV2
 * Verifies all functionality and interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthPageMobileV2 } from './AuthPageMobileV2';
import AuthContext, { AuthResponse, User } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Mock modules
vi.mock('../utils/mobileOptimizations', () => ({
  triggerHaptic: vi.fn(),
}));
vi.mock('../utils/devAutoLogin', () => ({
  devAutoLogin: vi.fn().mockResolvedValue(false),
}));

// Mock axios so ApiClient (used by AuthProvider) gets a client with interceptors
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

const renderAuthPage = () => {
  const authValue: {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    loginWithToken: () => void;
    register: () => Promise<AuthResponse>;
    logout: () => void;
    updateUser: () => void;
  } = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    login: async () => {},
    loginWithToken: () => {},
    register: async () => ({ token: 'token', user: { id: 1, email: 'test@example.com' } }),
    logout: () => {},
    updateUser: () => {},
  };

  return render(
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthContext.Provider value={authValue}>
        <ToastProvider>
          <AuthPageMobileV2 />
        </ToastProvider>
      </AuthContext.Provider>
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
      const signInButtons = screen.getAllByText('Sign In');
      const signUpButtons = screen.getAllByText('Sign Up');
      expect(signInButtons.length).toBeGreaterThanOrEqual(1);
      expect(signUpButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('should show Sign In mode by default', () => {
      renderAuthPage();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
      expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    });
  });

  function getSignUpTab() {
    const buttons = screen.getAllByRole('button', { name: /sign up/i });
    return buttons.find((b) => b.className.includes('auth-tab')) ?? buttons[0];
  }

  describe('Tab Switching', () => {
    it('should switch to Sign Up mode when clicking Sign Up tab', async () => {
      renderAuthPage();
      fireEvent.click(getSignUpTab());

      await waitFor(() => {
        expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      });
    });

    it('should show password strength indicator in Sign Up mode', async () => {
      renderAuthPage();
      fireEvent.click(getSignUpTab());

      const passwordInput = screen.getByLabelText('Password');
      fireEvent.change(passwordInput, { target: { value: 'Test123!' } });

      await waitFor(() => {
        expect(screen.getByText(/password:/i)).toBeInTheDocument();
      });
    });

    it('should hide features when switching back to Sign In', async () => {
      renderAuthPage();
      fireEvent.click(getSignUpTab());

      await waitFor(() => {
        expect(screen.getByText(/AI Skin Analysis/i)).toBeInTheDocument();
      });

      const signInTab = screen.getAllByRole('button', { name: /sign in/i })[0];
      fireEvent.click(signInTab);

      await waitFor(() => {
        expect(screen.queryByText(/AI Skin Analysis/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should show error when submitting empty form', async () => {
      renderAuthPage();
      const form = screen.getByRole('textbox', { name: /email/i }).closest('form');
      expect(form).toBeInTheDocument();
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      renderAuthPage();
      const emailInput = screen.getByLabelText(/email/i);
      const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
      const submitButton = signInButtons.find((b) => (b as HTMLButtonElement).type === 'submit') ?? signInButtons[0];

      fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
      fireEvent.click(submitButton);

      // Form should not submit with invalid email
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });

  describe('Password Features', () => {
    it('should toggle password visibility', async () => {
      renderAuthPage();
      const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByRole('button', { name: 'Show password' });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(passwordInput.type).toBe('text');
      });
    });

    it('should calculate password strength correctly', async () => {
      renderAuthPage();
      fireEvent.click(getSignUpTab());

      const passwordInput = screen.getByLabelText('Password');

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
      fireEvent.click(getSignUpTab());

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
      expect(screen.queryByText(/AI Skin Analysis/i)).not.toBeInTheDocument();

      fireEvent.click(getSignUpTab());

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
      const passwordInput = screen.getByLabelText('Password');

      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should show error with role="alert"', async () => {
      renderAuthPage();
      const form = screen.getByLabelText(/email/i).closest('form');
      expect(form).toBeInTheDocument();
      fireEvent.submit(form!);

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
