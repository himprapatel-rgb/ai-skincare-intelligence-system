// Development Auto-Login Utility
// Automatically logs in as test user "Himanshu" for development

const DEV_TEST_USER = {
  email: 'himanshu@test.com',
  password: 'Test1234!',
  name: 'Himanshu Patel'
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Auto-login as test user during development
 * Only runs if no existing auth token is found
 */
export async function devAutoLogin(): Promise<boolean> {
  // Only run in development mode
  if (import.meta.env.PROD) {
    return false;
  }

  // Check if already logged in
  const existingToken = localStorage.getItem('access_token');
  if (existingToken) {
    console.log('✅ Already logged in');
    return true;
  }

  try {
    console.log('🔄 Auto-logging in as test user:', DEV_TEST_USER.email);
    
    // Create form data for OAuth2 password flow
    const formData = new URLSearchParams();
    formData.append('username', DEV_TEST_USER.email);
    formData.append('password', DEV_TEST_USER.password);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.warn('⚠️ Auto-login failed:', response.statusText);
      return false;
    }

    const data = await response.json();
    
    // Store auth token
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('token_type', data.token_type || 'bearer');
    
    // Store user info
    const userInfo = {
      id: data.user?.id,
      email: DEV_TEST_USER.email,
      name: DEV_TEST_USER.name,
      isVerified: true,
    };
    localStorage.setItem('user', JSON.stringify(userInfo));

    console.log('✅ Auto-login successful! Logged in as:', DEV_TEST_USER.name);
    return true;
  } catch (error) {
    console.error('❌ Auto-login error:', error);
    return false;
  }
}

/**
 * Get current dev user info
 */
export function getDevUser() {
  return DEV_TEST_USER;
}

/**
 * Check if auto-login is enabled
 */
export function isAutoLoginEnabled(): boolean {
  return !import.meta.env.PROD;
}
