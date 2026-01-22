import { StateCreator } from 'zustand';

export interface AuthSlice {
  isAuthenticated: boolean;
  user: { name: string; avatar: string } | null;
  login: () => void;
  logout: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  isAuthenticated: false,
  user: null,
  login: () => set({ 
    isAuthenticated: true, 
    user: { name: "Developer Dan", avatar: "https://github.com/shadcn.png" } 
  }),
  logout: () => set({ isAuthenticated: false, user: null }),
});
