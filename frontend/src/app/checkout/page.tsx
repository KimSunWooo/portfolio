"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { fetchCartItems, resolveAssetUrl, type CartItemResponse, resolveAuthState, getGuestCart } from "../../lib/api";
import { loadTossPayments } from "@tosspayments/payment-sdk";

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"카드" | "가상계좌">("카드");
  const clientKey = "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq";

  useEffect(() => {
    const loadOrderItems = async () => {
      try {
        const auth = await resolveAuthState();
        if (auth.phase === "recovery_failed") {
          alert(auth.message);
          router.replace("/login?next=/checkout");
          return;
        }
        const loggedIn = auth.phase === "authenticated";
        setAuthenticated(loggedIn);
        const items = loggedIn ? await fetchCartItems() : getGuestCart();
        if (items.length === 0) {
          alert("결제할 상품이 없습니다.");
          router.replace("/cart");
          return;
        }
        setCartItems(items);
      } catch (error) {
        console.error("장바구니 로드 실패", error);
        router.replace("/cart");
      } finally {
        setLoading(false);
      }
    };
    void loadOrderItems();
  }, [router]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!authenticated) {
      router.push("/login?next=/checkout");
      return;
    }
    try {
      const tossPayments = await loadTossPayments(clientKey);
      const orderName = cartItems.length > 1
        ? `${cartItems[0].productName} 외 ${cartItems.length - 1}건`
        : cartItems[0]?.productName || "포트폴리오 테스트 결제";
      await tossPayments.requestPayment(paymentMethod, {
        amount: 100,
        orderId: `ORDER_${new Date().getTime()}`,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error("결제창 호출 실패:", error);
      alert("결제창을 띄우는 중 오류가 발생했습니다.");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-white text-sm text-[#555]">결제 정보를 불러오는 중입니다...</div>;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f9f9f9] px-5 py-20">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="mb-4 text-center text-2xl font-normal">100원 테스트 결제</h1>
          <p className="mb-10 text-center text-sm text-[#555]">배송이나 실제 상품 주문은 진행되지 않습니다.</p>
          <form onSubmit={handlePlaceOrder} className="flex items-start gap-10 max-lg:flex-col">
            <div className="w-full flex-1 space-y-10 border border-black/10 bg-white p-10 shadow-sm max-sm:p-6">
              <section>
                <h2 className="mb-5 border-b border-black/10 pb-4 text-sm">결제 요청 정보</h2>
                <p className="mb-4 text-sm text-[#555]">이름과 이메일은 테스트 결제 요청에 사용됩니다.</p>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <label className="text-sm">이름<input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="mt-2 w-full border border-black/20 px-4 py-3 text-sm" /></label>
                  <label className="text-sm">이메일<input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required className="mt-2 w-full border border-black/20 px-4 py-3 text-sm" /></label>
                </div>
              </section>
              <section>
                <h2 className="mb-5 border-b border-black/10 pb-4 text-sm">결제 수단</h2>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  {(["카드", "가상계좌"] as const).map((method) => (
                    <label key={method} className="flex cursor-pointer items-center gap-3 border border-black/20 p-4">
                      <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="accent-black" />
                      <span className="text-sm">{method}</span>
                    </label>
                  ))}
                </div>
              </section>
            </div>
            <div className="sticky top-[100px] w-[400px] shrink-0 border border-black/10 bg-white p-8 shadow-sm max-lg:static max-lg:w-full">
              <h2 className="mb-6 border-b border-black/10 pb-4 text-sm">장바구니 상품</h2>
              <div className="mb-8 max-h-[300px] space-y-4 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="h-[70px] w-[55px] shrink-0 bg-[#f5f4ef]">
                      {item.thumbnailUrl && <img src={resolveAssetUrl(item.thumbnailUrl) || ""} alt={item.productName} className="h-full w-full object-cover" />}
                    </div>
                    <div className="flex flex-1 flex-col justify-center text-sm"><p>{item.productName}</p><p className="text-[#666]">수량: {item.quantity}</p></div>
                    <div className="flex items-center text-sm">₩{(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-black/10 pt-5 text-sm text-[#555]"><span>상품 합계 (참고)</span><span>₩{subtotal.toLocaleString()}</span></div>
              <div className="mt-5 flex justify-between border-t border-black pt-5 text-lg font-bold"><span>테스트 요청 금액</span><span>₩100</span></div>
              <p className="mt-5 text-sm leading-6 text-[#555]">승인된 테스트 결제는 서버에서 자동 취소를 시도합니다. 장바구니는 주문 완료 처리되지 않습니다.</p>
              <button type="submit" className="mt-4 w-full bg-black py-4 text-sm text-white hover:bg-[#333]">
                {authenticated ? "테스트 결제 100원" : "로그인 후 테스트 결제"}
              </button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
