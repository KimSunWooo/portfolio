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
  isAccessTokenValid,
  type CartItemResponse,
} from "../../lib/api";

export default function CartPage() {
  const { refreshCartCount } = useCartStore();
  const { isLoggedIn, setIsLoggedIn } = useAuthStore();

  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  /**
   * 현재 인증 상태를 실제 Access Token 기준으로 판단한다.
   *
   * isLoggedIn은 Zustand의 UI 상태이므로
   * 실제 인증 상태와 일시적으로 불일치할 수 있다.
   *
   * 따라서 장바구니처럼 권한이 필요한 API를 호출할 때는
   * 실제 JWT 상태를 우선한다.
   */
  const resolveAuthentication = async (): Promise<boolean> => {
    let token = getAccessToken();

    // 현재 메모리에 유효한 토큰이 있으면 로그인 상태
    if (isAccessTokenValid(token)) {
      return true;
    }

    // Zustand에서는 로그인 상태지만 메모리에 토큰이 없거나
    // 만료된 경우 refresh token으로 Access Token 복구 시도
    if (isLoggedIn) {
      token = await silentRefresh();

      if (isAccessTokenValid(token)) {
        return true;
      }

      // Refresh에도 실패했다면 실제로는 로그인 상태가 아님
      setIsLoggedIn(false);
      return false;
    }

    return false;
  };

  /**
   * 장바구니 조회
   *
   * 로그인 사용자:
   *   Spring Boot /api/cart
   *
   * 비회원:
   *   localStorage["guestCart"]
   */
  const loadCart = async () => {
    try {
      setLoading(true);

      const authenticated = await resolveAuthentication();

      if (authenticated) {
        const items = await fetchCartItems();
        setCartItems(items);
      } else {
        const localCartData = localStorage.getItem("guestCart");

        if (localCartData) {
          try {
            setCartItems(JSON.parse(localCartData));
          } catch (parseError) {
            console.error("비회원 장바구니 데이터 파싱 실패:", parseError);

            // 잘못된 JSON이 저장되어 있다면 초기화
            localStorage.removeItem("guestCart");
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
    } catch (error: any) {
      console.error("장바구니 조회 실패:", error);

      /**
       * 서버 API가 인증 문제로 실패한 경우
       *
       * 비회원으로 강제 전환시키되,
       * 로그인 사용자 장바구니를 guestCart로 임의 변환하지 않는다.
       */
      if (
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.includes("401") ||
        error?.message?.includes("403")
      ) {
        setIsLoggedIn(false);

        const localCartData = localStorage.getItem("guestCart");

        if (localCartData) {
          try {
            setCartItems(JSON.parse(localCartData));
          } catch {
            localStorage.removeItem("guestCart");
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isLoggedIn]);

  /**
   * 수량 변경
   *
   * 로그인:
   *   PUT /api/cart/{cartItemId}
   *
   * 비회원:
   *   localStorage["guestCart"] 수정
   */
  const handleQuantityChange = async (
    cartItemId: number,
    newQuantity: number
  ) => {
    if (newQuantity < 1) return;

    try {
      const authenticated = await resolveAuthentication();

      if (authenticated) {
        await updateCartItemQuantity(cartItemId, newQuantity);

        const updatedItems = cartItems.map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        );

        setCartItems(updatedItems);

        await refreshCartCount();

        return;
      }

      /**
       * 비회원 장바구니
       *
       * 서버 API를 절대 호출하지 않는다.
       */
      const updatedItems = cartItems.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, quantity: newQuantity }
          : item
      );

      setCartItems(updatedItems);

      localStorage.setItem("guestCart", JSON.stringify(updatedItems));

      await refreshCartCount();
    } catch (error: any) {
      console.error("장바구니 수량 변경 실패:", error);
      alert(error?.message || "수량 변경 중 오류가 발생했습니다.");
    }
  };

  /**
   * 장바구니 상품 삭제
   *
   * 로그인:
   *   DELETE /api/cart/{cartItemId}
   *
   * 비회원:
   *   localStorage["guestCart"]에서 삭제
   *
   * 핵심:
   *   비회원 상태에서는 removeCartItem()을 절대로 호출하지 않는다.
   */
  const handleRemove = async (cartItemId: number) => {
    if (!confirm("상품을 삭제하시겠습니까?")) return;

    try {
      const authenticated = await resolveAuthentication();

      if (authenticated) {
        /**
         * 로그인 사용자의 경우에만
         * Spring Boot의 DELETE API를 호출한다.
         */
        await removeCartItem(cartItemId);

        const updatedItems = cartItems.filter(
          (item) => item.cartItemId !== cartItemId
        );

        setCartItems(updatedItems);

        await refreshCartCount();

        return;
      }

      /**
       * ============================
       * 비회원 장바구니 삭제
       * ============================
       *
       * 여기서는 API를 호출하지 않는다.
       *
       * 기존 코드:
       *
       * if (isLoggedIn && token) {
       *   await removeCartItem(cartItemId);
       * }
       *
       * 와 달리 실제 JWT 상태를 기준으로 판단하기 때문에
       * isLoggedIn과 token 상태가 어긋나더라도
       * 비회원에게 DELETE /api/cart가 호출될 가능성을 줄인다.
       */
      const updatedItems = cartItems.filter(
        (item) => item.cartItemId !== cartItemId
      );

      setCartItems(updatedItems);

      localStorage.setItem("guestCart", JSON.stringify(updatedItems));

      await refreshCartCount();
    } catch (error: any) {
      console.error("장바구니 삭제 실패:", error);

      /**
       * 서버 API에서 인증 오류가 발생한 경우
       * 로그인 상태를 무효화한다.
       */
      if (
        error?.status === 401 ||
        error?.status === 403 ||
        error?.message?.includes("401") ||
        error?.message?.includes("403")
      ) {
        setIsLoggedIn(false);
      }

      alert(
        "삭제 중 오류가 발생했습니다: " +
          (error?.message || "알 수 없는 오류")
      );
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <>
      <Header />

      <main className="min-h-[calc(100vh-74px)] bg-[#f9f9f9] px-5 py-20">
        <div className="mx-auto max-w-[900px] bg-white p-10 shadow-sm border border-black/10 max-sm:p-5">
          <h1 className="mb-10 text-center text-[24px] font-normal tracking-[-0.025em]">
            CART
          </h1>

          {loading ? (
            <div className="py-20 text-center text-[11px] tracking-[0.1em] text-[#999]">
              LOADING...
            </div>
          ) : cartItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-6 text-[12px] tracking-[0.05em] text-[#777]">
                장바구니에 담긴 상품이 없습니다.
              </p>

              <Link
                href="/shop"
                className="inline-block border border-black px-6 py-3 text-[10px] tracking-[0.1em] transition hover:bg-black hover:text-white"
              >
                SHOPPING ↗
              </Link>
            </div>
          ) : (
            <>
              <div className="border-t border-black">
                {cartItems.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-center gap-5 border-b border-black/10 py-6 max-sm:flex-col max-sm:items-start"
                  >
                    <Link
                      href={`/product/${item.productId}`}
                      prefetch={false}
                      className="h-[100px] w-[80px] shrink-0 overflow-hidden bg-[#f5f4ef]"
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={resolveAssetUrl(item.thumbnailUrl) || ""}
                          alt={item.productName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[8px] text-[#aaa]">
                          NO IMAGE
                        </div>
                      )}
                    </Link>

                    <div className="flex-1">
                      <Link
                        href={`/product/${item.productId}`}
                        prefetch={false}
                        className="text-[13px] hover:underline"
                      >
                        {item.productName}
                      </Link>

                      <p className="mt-2 text-[11px] text-[#777]">
                        ₩{item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 max-sm:w-full max-sm:justify-between">
                      <div className="flex h-9 items-center border border-black/20">
                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.cartItemId,
                              item.quantity - 1
                            )
                          }
                          className="w-8 text-[#777] hover:text-black"
                        >
                          -
                        </button>

                        <span className="w-8 text-center text-[11px]">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            handleQuantityChange(
                              item.cartItemId,
                              item.quantity + 1
                            )
                          }
                          className="w-8 text-[#777] hover:text-black"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-[100px] text-right text-[12px] font-bold max-sm:w-auto">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </div>

                      <button
                        onClick={() => handleRemove(item.cartItemId)}
                        className="text-[18px] text-[#aaa] hover:text-black"
                      >
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