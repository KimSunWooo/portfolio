"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/header/Header";
import Footer from "../../components/layout/Footer";
import { fetchCartItems, resolveAssetUrl, removeCartItem, type CartItemResponse } from "../../lib/api";
import DaumPostcodeEmbed from "react-daum-postcode";
import { loadTossPayments } from '@tosspayments/payment-sdk'; // 💡 토스 결제 SDK 임포트

export default function CheckoutPage() {
  const Postcode = DaumPostcodeEmbed as any;
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // 💡 폼 데이터 상태 관리
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  
  const [zipCode, setZipCode] = useState("");
  const [address, setAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  
  const [paymentMethod, setPaymentMethod] = useState("카드"); // 💡 결제수단 상태
  const [isPostOpen, setIsPostOpen] = useState(false);

  const SHIPPING_FEE = 3000;
  const clientKey = "test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq"; // 테스트 클라이언트 키

  useEffect(() => {
    const loadOrderItems = async () => {
      try {
        const items = await fetchCartItems();
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
    loadOrderItems();
  }, [router]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + SHIPPING_FEE;

  // 💡 주문 제출 시 토스 결제창 호출
  const handlePlaceOrder = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!zipCode || !address) {
      alert("배송지 주소를 입력해 주세요.");
      return;
    }

    try {
      const tossPayments = await loadTossPayments(clientKey);

      // 결제 상품명을 동적으로 생성
      const orderName = cartItems.length > 1 
        ? `${cartItems[0].productName} 외 ${cartItems.length - 1}건` 
        : cartItems[0]?.productName || "포트폴리오 테스트 결제";

      await tossPayments.requestPayment(paymentMethod as "카드" | "가상계좌", {
        amount: 100, // 💡 현재 테스트를 위해 100원으로 고정. 실제 서비스 시 `total` 로 변경
        orderId: `ORDER_${new Date().getTime()}`,
        orderName: orderName,
        customerName: customerName,
        customerEmail: customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`, 
      });
      
    } catch (error) {
      console.error("결제창 호출 실패:", error);
      alert("결제창을 띄우는 중 오류가 발생했습니다.");
    }
  };

  const handleCompletePost = (data: any) => {
    let fullAddress = data.address;
    let extraAddress = "";

    if (data.addressType === "R") {
      if (data.bname !== "") extraAddress += data.bname;
      if (data.buildingName !== "")
        extraAddress += extraAddress !== "" ? `, ${data.buildingName}` : data.buildingName;
      fullAddress += extraAddress !== "" ? ` (${extraAddress})` : "";
    }

    setZipCode(data.zonecode);
    setAddress(fullAddress);
    setIsPostOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-[11px] tracking-[0.2em] text-[#999]">
        LOADING CHECKOUT...
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f9f9f9] px-5 py-20 relative">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="mb-12 text-center text-[24px] font-normal tracking-[-0.025em]">
            CHECKOUT
          </h1>

          <form onSubmit={handlePlaceOrder} className="flex items-start gap-10 max-lg:flex-col">
            
            <div className="flex-1 space-y-12 bg-white p-10 shadow-sm border border-black/10 max-sm:p-6 w-full">
              
              {/* 1. 주문자 정보 */}
              <section>
                <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                  CUSTOMER INFO
                </h2>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <input type="text" placeholder="Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" />
                  <input type="tel" placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" />
                  <input type="email" placeholder="Email Address" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required className="col-span-2 max-sm:col-span-1 w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" />
                </div>
              </section>

              {/* 2. 배송지 정보 */}
              <section>
                <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                  SHIPPING ADDRESS
                </h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input 
                      type="text" 
                      placeholder="Zip Code" 
                      value={zipCode} 
                      readOnly 
                      required 
                      className="w-[150px] border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black bg-gray-50 cursor-not-allowed" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setIsPostOpen(true)}
                      className="border border-black bg-black px-6 text-[10px] tracking-[0.1em] text-white transition hover:bg-[#333]"
                    >
                      SEARCH
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Address" 
                    value={address} 
                    readOnly 
                    required 
                    className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black bg-gray-50 cursor-not-allowed" 
                  />
                  <input 
                    type="text" 
                    placeholder="Detailed Address" 
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" 
                  />
                  <input 
                    type="text" 
                    placeholder="Delivery Memo (Optional)" 
                    className="w-full border border-black/10 px-4 py-3 text-[12px] outline-none transition focus:border-black" 
                  />
                </div>
              </section>

              {/* 3. 결제 수단 */}
              <section>
                <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                  PAYMENT METHOD
                </h2>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <label className="flex cursor-pointer items-center gap-3 border border-black/10 p-4 transition hover:border-black">
                    <input type="radio" name="payment" value="카드" checked={paymentMethod === "카드"} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-black" />
                    <span className="text-[12px] tracking-[0.05em]">Credit Card</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 border border-black/10 p-4 transition hover:border-black">
                    <input type="radio" name="payment" value="가상계좌" checked={paymentMethod === "가상계좌"} onChange={(e) => setPaymentMethod(e.target.value)} className="accent-black" />
                    <span className="text-[12px] tracking-[0.05em]">Virtual Account</span>
                  </label>
                </div>
              </section>

            </div>

            {/* 오른쪽: 주문 요약 */}
            <div className="sticky top-[100px] w-[400px] shrink-0 bg-white p-8 shadow-sm border border-black/10 max-lg:w-full max-lg:static">
              <h2 className="mb-6 border-b border-black/10 pb-4 text-[13px] tracking-[0.1em]">
                ORDER SUMMARY
              </h2>

              <div className="mb-8 max-h-[300px] space-y-4 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="h-[70px] w-[55px] shrink-0 bg-[#f5f4ef]">
                      {item.thumbnailUrl && (
                        <img 
                          src={resolveAssetUrl(item.thumbnailUrl) || ""} 
                          alt={item.productName} 
                          className="h-full w-full object-cover" 
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-[12px] leading-snug text-black">{item.productName}</p>
                      <p className="mt-1 text-[11px] text-[#777]">QTY: {item.quantity}</p>
                    </div>
                    <div className="flex items-center text-[12px] font-bold">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-black/10 pt-6 text-[12px] tracking-[0.05em] text-[#555]">
                <div className="flex justify-between">
                  <span>SUBTOTAL</span>
                  <span>₩{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>SHIPPING</span>
                  <span>₩{SHIPPING_FEE.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-between border-t border-black pt-6 text-[18px] font-bold tracking-[0.05em]">
                <span>TOTAL</span>
                <span>₩{total.toLocaleString()}</span>
              </div>

              <button 
                type="submit" 
                className="mt-8 w-full bg-black py-4 text-[12px] tracking-[0.1em] text-white transition hover:bg-[#333]"
              >
                PLACE ORDER (100원 결제)
              </button>
            </div>
          </form>
        </div>
      </main>
      
      {/* 💡 우편번호 검색 모달 오버레이 */}
      {isPostOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-5">
          <div className="relative w-full max-w-[500px] bg-white p-5 shadow-lg">
            <button 
              onClick={() => setIsPostOpen(false)}
              className="absolute right-4 top-4 text-2xl text-black hover:text-gray-500 z-10"
            >
              x
            </button>
            <div className="mt-6 border border-black/10">
              <Postcode onComplete={handleCompletePost} autoClose={true} />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}