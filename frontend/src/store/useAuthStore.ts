import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

// 💡 괄호 () 하나 더 붙인 것에 주의! (타입 에러 방지)
export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
}));