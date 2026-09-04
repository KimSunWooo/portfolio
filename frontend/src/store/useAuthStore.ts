import { create } from "zustand";

interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
  setIsLoggedIn: (status: boolean) => void;
  setIsAdmin: (status: boolean) => void;
  setAuthState: (isLoggedIn: boolean, isAdmin: boolean) => void;
  clearAuthState: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  isAdmin: false,

  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  setIsAdmin: (status) => set({ isAdmin: status }),

  setAuthState: (isLoggedIn, isAdmin) =>
    set({
      isLoggedIn,
      isAdmin,
    }),

  clearAuthState: () =>
    set({
      isLoggedIn: false,
      isAdmin: false,
    }),
}));
