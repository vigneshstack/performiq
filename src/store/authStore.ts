'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Profile, AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) =>
        set({ user, isAuthenticated: user !== null }, false, 'setUser'),

      setProfile: (profile) =>
        set({ profile }, false, 'setProfile'),

      setLoading: (isLoading) =>
        set({ isLoading }, false, 'setLoading'),

      updateProfile: (updates) =>
        set(
          (state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
          }),
          false,
          'updateProfile'
        ),

      logout: () =>
        set(
          { user: null, profile: null, isAuthenticated: false },
          false,
          'logout'
        ),
    }),
    { name: 'auth-store' }
  )
);
