import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'student' | 'company' | 'admin';

export interface User {
  user_id: number;
  username: string;
  name?: string;
  role: UserRole;
  entity_id: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hasHydrated: boolean;
  setUser: (user: User | null) => void;
  setHydration: (state: { isHydrating: boolean; hasHydrated: boolean }) => void;
  logoutLocal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrating: false,
      hasHydrated: false,

      setUser: (user) => {
        set({ user, isAuthenticated: Boolean(user) });
      },

      setHydration: ({ isHydrating, hasHydrated }) => {
        set({ isHydrating, hasHydrated });
      },

      logoutLocal: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
