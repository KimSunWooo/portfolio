"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore"; // 💡 로그인 상태를 가져오기 위한 스토어 추가
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
  const { isLoggedIn } = useAuthStore(); // 💡 현재 로그인 여부 가져오기
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCart = async () => {
    try {
      setLoading(true);
      
      // 1. 회원인 경우: 백엔드 API에서 장바구니 데이터 로드
      if (isLoggedIn) {
        let token = getAccessToken();
        if (!token) {
          token = await silentRefresh();
        }
        const items = await fetchCartItems();
        setCartItems(items);
      } 
      // 2. 비회원인 경우: 로컬 스토리지에서 데이터 로드
      else {
        const localCartData = localStorage.getItem("cart");
        if (localCartData) {
          setCartItems(JSON.parse(localCartData));
        } else {
          setCartItems([]);
        }
      }
    } catch (error) {
      console.error("장바구니 조회 실패", error);
      // 회원인데 에러가 났을 때만 로그인 페이지로 리다이렉트
      if (isLoggedIn) {
        alert("로그인이 만료되었거나 권한이 없습니다.");
        router.replace("/login"); 
      }
    } finally {
      setLoading(false);
    }
  };

  // 로그인 상태가 바뀔 때마다 장바구니 데이터를 다시 불러옴
  useEffect(() => {
    loadCart();
  }, [isLoggedIn]);

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    try {
      // 회원인 경우에만 백엔드 API 호출
      if (isLoggedIn) {
        await updateCartItemQuantity(cartItemId, newQuantity);
      } 
      
      // 화면 상태 즉각 업데이트 (회원/비회원 공통)
      const updatedItems = cartItems.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      );
      setCartItems(updatedItems);
      
      // 비회원인 경우 로컬 스토리지에 업데이트 내용 저장
      if (!isLoggedIn) {
        localStorage.setItem("cart", JSON.stringify(updatedItems));
      }
      
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return;
    
    try {
      // 회원인 경우에만 백엔드 API 호출하여 삭제
      if (isLoggedIn) {
        await removeCartItem(cartItemId);
      }
      
      // 1. 장바구니 목록 화면 즉각 반영 (회원/비회원 공통)
      const updatedItems = cartItems.filter(item => item.cartItemId !== cartItemId);
      setCartItems(updatedItems);
      
      // 2. 비회원인 경우 로컬 스토리지에도 삭제 반영
      if (!isLoggedIn) {
        localStorage.setItem("cart", JSON.stringify(updatedItems));
      }
      
      // 3. 삭제 완료 후 Zustand에 최신 개수 갱신 요청 (헤더 카운트 동기화)
      await refreshCartCount(); 

    } catch (error: any) {
      alert(error.message);
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
              <p className="text-[12px] tracking-[0.05em] text-[#777] mb-6">장바구니에 담긴 상품이 없습니다.</p>
              <Link href="/shop" className="inline-block border border-black px-6 py-3 text-[10px] tracking-[0.1em] transition hover:bg-black hover:text-white">
                SHOPPING ↗
              </Link>
            </div>
          ) : (
            <>
              {/* 장바구니 리스트 */}
              <div className="border-t border-black">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex items-center gap-5 border-b border-black/10 py-6 max-sm:flex-col max-sm:items-start">
                    
                    <Link href={`/product/${item.productId}`} prefetch={false} className="h-[100px] w-[80px] shrink-0 bg-[#f5f4ef] overflow-hidden">
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

              {/* 총 결제 금액 및 버튼 */}
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