import { create } from 'zustand';
import { fetchCartCount } from '../lib/api';

interface CartState {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCartCount: () => Promise<void>; 
}

export const useCartStore = create<CartState>()((set) => ({
  cartCount: 0,
  
  setCartCount: (count) => set({ cartCount: count }),
  
  // 로그인/비로그인 분기가 내장된 api.ts의 fetchCartCount를 호출
  refreshCartCount: async () => {
    try {
      const count = await fetchCartCount();
      set({ cartCount: count });
    } catch (error) {
      set({ cartCount: 0 });
    }
  }
}));