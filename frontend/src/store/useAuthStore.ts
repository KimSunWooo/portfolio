import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean; // 💡 관리자 여부 추가
  setIsLoggedIn: (status: boolean) => void;
  setIsAdmin: (status: boolean) => void; 
}

export const useAuthStore = create<AuthState>()((set) => ({
  isLoggedIn: false,
  isAdmin: false, // 기본값은 일반 유저(false)
  setIsLoggedIn: (status) => set({ isLoggedIn: status }),
  setIsAdmin: (status) => set({ isAdmin: status }),
}));

