import { create } from 'zustand';
import { fetchCartCount } from '../lib/api';

interface CartState {
  cartCount: number;
  setCartCount: (count: number) => void;
  // 💡 백엔드에서 개수를 다시 갱신해오는 편의성 함수도 같이 넣어둡니다.
  refreshCartCount: () => Promise<void>; 
}

export const useCartStore = create<CartState>()((set) => ({
  cartCount: 0,
  setCartCount: (count) => set({ cartCount: count }),
  refreshCartCount: async () => {
    try {
      const count = await fetchCartCount();
      set({ cartCount: count || 0 });
    } catch (error) {
      set({ cartCount: 0 });
    }
  }
}));