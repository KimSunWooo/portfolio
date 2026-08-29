"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { 
  fetchCartItems, 
  updateCartItemQuantity, 
  removeCartItem, 
  resolveAssetUrl,
  getAccessToken,    
  silentRefresh,     
  type CartItemResponse 
} from "../../lib/api";
import { loadTossPayments } from '@tosspayments/payment-sdk';

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadCart = async () => {
    try {
      setLoading(true);
      
      let token = getAccessToken();
      if (!token) {
        token = await silentRefresh();
      }

      const items = await fetchCartItems();
      setCartItems(items);

    } catch (error) {
      console.error("장바구니 조회 실패", error);
      alert("로그인이 만료되었거나 권한이 없습니다.");
      router.replace("/login"); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateCartItemQuantity(cartItemId, newQuantity);
      setCartItems(prev => prev.map(item => item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleRemove = async (cartItemId: number) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return;
    try {
      await removeCartItem(cartItemId);
      setCartItems(prev => prev.filter(item => item.cartItemId !== cartItemId));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const clientKey = "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

  const handlePayment = async () => {
    try {
      const tossPayments = await loadTossPayments(clientKey);

      // 💡 결제 상품명을 동적으로 생성 (예: "반팔티 외 1건")
      const orderName = cartItems.length > 1 
        ? `${cartItems[0].productName} 외 ${cartItems.length - 1}건` 
        : cartItems[0]?.productName || "포트폴리오 테스트 결제";

      await tossPayments.requestPayment("카드", {
        amount: 100, // 💡 현재 테스트를 위해 100원으로 고정 (나중에 totalPrice 로 변경)
        orderId: `ORDER_${new Date().getTime()}`,
        orderName: orderName,
        customerName: "김선우", 
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`, 
      });
    } catch (error) {
      console.error("결제창 호출 실패:", error);
    }
  };

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
                    
                    <Link href={`/shop/${item.productId}`} className="h-[100px] w-[80px] shrink-0 bg-[#f5f4ef] overflow-hidden">
                      {item.thumbnailUrl ? (
                        <img src={resolveAssetUrl(item.thumbnailUrl) || ""} alt={item.productName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-[#aaa]">NO IMAGE</div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link href={`/product/${item.productId}`} className="text-[13px] hover:underline">
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
                        ×
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
                
                {/* 💡 여기에 onClick 추가됨 */}
                <button 
                  onClick={handlePayment} 
                  className="mt-8 h-12 w-full bg-black text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
                >
                  CHECKOUT (100원 테스트 결제)
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