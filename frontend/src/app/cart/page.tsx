"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { 
  fetchCartItems, 
  updateCartItemQuantity, 
  removeCartItem, 
  resolveAssetUrl,
  getAccessToken,    
  silentRefresh,     
  type CartItemResponse 
} from "../../lib/api";

export default function CartPage() {
  const { refreshCartCount } = useCartStore();
  const { isLoggedIn, setIsLoggedIn } = useAuthStore();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCart = async () => {
    try {
      setLoading(true);
      
      if (isLoggedIn) {
        let token = getAccessToken();
        if (!token) {
          token = await silentRefresh();
        }
        const items = await fetchCartItems();
        setCartItems(items);
      } else {
        const localCartData = localStorage.getItem("cart");
        if (localCartData) {
          setCartItems(JSON.parse(localCartData));
        } else {
          setCartItems([]);
        }
      }
    } catch (error: any) {
      console.error("장바구니 조회 실패", error);
      
      if (isLoggedIn) {
        if (error.response?.status === 401 || error.response?.status === 403) {
           setIsLoggedIn(false);
           alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
           router.replace("/login");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isLoggedIn]);

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    const token = getAccessToken();

    try {
      if (isLoggedIn && token) {
        await updateCartItemQuantity(cartItemId, newQuantity);
      } 
      
      const updatedItems = cartItems.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      
      if (!isLoggedIn || !token) {
        localStorage.setItem("cart", JSON.stringify(updatedItems));
      }
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return;
    
    const token = getAccessToken();

    try {
      if (isLoggedIn && token) {
        await removeCartItem(cartItemId);
      }
      
      const updatedItems = cartItems.filter(item => item.cartItemId !== cartItemId);
      setCartItems(updatedItems);
      
      if (!isLoggedIn || !token) {
        localStorage.setItem("cart", JSON.stringify(updatedItems));
      }
      
      await refreshCartCount(); 

    } catch (error: any) {
      alert("삭제 중 오류가 발생했습니다: " + error.message);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-74px)] bg-[#f9f9f9] px-5 py-20">
        <div className="mx-auto max-w-[900px] bg-white p-10 shadow-sm border border-black/10 max-sm:p-5">
          <h1 className="mb-10 text-center text-[24px] font-normal tracking-[-0.025em]">CART</h1>

          {loading ? (
            <div className="py-20 text-center text-[11px] tracking-[0.1em] text-[#999]">LOADING...</div>
          ) : cartItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-6 text-[12px] tracking-[0.05em] text-[#777]">장바구니에 담긴 상품이 없습니다.</p>
              <Link href="/shop" className="inline-block border border-black px-6 py-3 text-[10px] tracking-[0.1em] transition hover:bg-black hover:text-white">
                SHOPPING ↗
              </Link>
            </div>
          ) : (
            <>
              <div className="border-t border-black">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex items-center gap-5 border-b border-black/10 py-6 max-sm:flex-col max-sm:items-start">
                    
                    <Link href={`/product/${item.productId}`} prefetch={false} className="h-[100px] w-[80px] shrink-0 overflow-hidden bg-[#f5f4ef]">
                      {item.thumbnailUrl ? (
                        <img src={resolveAssetUrl(item.thumbnailUrl) || ""} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-[#aaa]">NO IMAGE</div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link href={`/product/${item.productId}`} prefetch={false} className="text-[13px] hover:underline">
                        {item.productName}
                      </Link>
                      <p className="mt-2 text-[11px] text-[#777]">₩{item.price.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center gap-6 max-sm:w-full max-sm:justify-between">
                      <div className="flex h-9 items-center border border-black/20">
                        <button onClick={() => handleQuantityChange(item.cartItemId, item.quantity - 1)} className="w-8 text-[#777] hover:text-black">-</button>
                        <span className="w-8 text-center text-[11px]">{item.quantity}</span>
                        <button onClick={() => handleQuantityChange(item.cartItemId, item.quantity + 1)} className="w-8 text-[#777] hover:text-black">+</button>
                      </div>
                      <div className="w-[100px] text-right text-[12px] font-bold max-sm:w-auto">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </div>
                      <button onClick={() => handleRemove(item.cartItemId)} className="text-[18px] text-[#aaa] hover:text-black">
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 bg-[#f5f4f2] p-8">
                <div className="flex justify-between border-b border-black/10 pb-4 text-[12px] tracking-[0.1em] text-[#555]">
                  <span>SUBTOTAL</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
                <div className="mt-4 flex justify-between text-[16px] font-bold tracking-[0.05em]">
                  <span>TOTAL</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
                
                <button 
                  onClick={() => router.push("/checkout")}
                  className="mt-8 h-12 w-full bg-black text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}