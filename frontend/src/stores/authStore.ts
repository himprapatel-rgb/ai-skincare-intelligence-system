import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../context/AuthContext';

// Define the shape of your store state
interface AuthState {
  user: User | null;
  token: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

// Corrected syntax: create()(persist(...))
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (userData, token) => set({ user: userData, token: token }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage', // Unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // correct storage config
    }
  )
);
