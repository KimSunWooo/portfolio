"use client";

import { useCallback, useEffect, useState } from "react";
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
  resolveAuthState,
  getGuestCart,
  setGuestCart,
  syncLocalCartToServer,
  isAdminFromToken,
  ApiRequestError,
  type CartItemResponse,
} from "../../lib/api";

export default function CartPage() {
  const { refreshCartCount } = useCartStore();
  const { isLoggedIn, setIsLoggedIn } = useAuthStore();

  const [cartItems, setCartItems] = useState<CartItemResponse[]>([]);
  const [pendingItems, setPendingItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartError, setCartError] = useState("");
  const [mergeNotice, setMergeNotice] = useState("");
  const [merging, setMerging] = useState(false);

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
  const resolveAuthentication = useCallback(async () => {
    const auth = await resolveAuthState();
    if (auth.phase === "authenticated") {
      useAuthStore.getState().setAuthState(true, isAdminFromToken(auth.token));
    }
    return auth;
  }, []);

  /**
   * 장바구니 조회
   *
   * 로그인 사용자:
   *   Spring Boot /api/cart
   *
   * 비회원:
   *   localStorage["guestCart"]
   */
  const loadCart = useCallback(async () => {
    setCartError("");
    const auth = await resolveAuthentication();
    if (auth.phase === "recovery_failed") {
      setCartItems([]);
      setPendingItems(getGuestCart());
      setCartError(auth.message);
      setLoading(false);
      return;
    }
    if (auth.phase === "guest") {
      setCartItems(getGuestCart());
      setPendingItems([]);
      setLoading(false);
      return;
    }
    const notice = sessionStorage.getItem("cartMergeNotice");
    if (notice) {
      sessionStorage.removeItem("cartMergeNotice");
      setMergeNotice(notice);
    }
    setPendingItems(getGuestCart());
    try {
      setCartItems(await fetchCartItems());
    } catch (error: unknown) {
      console.error("장바구니 조회 실패:", error);
      setCartItems([]);
      setCartError(error instanceof Error ? error.message : "장바구니를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [resolveAuthentication]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      await loadCart();
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, loadCart]);

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
    if (!Number.isInteger(newQuantity) || newQuantity < 1 || newQuantity > 99) return;

    try {
      const wasLoggedIn = useAuthStore.getState().isLoggedIn;
      const auth = await resolveAuthentication();
      if (auth.phase === "recovery_failed") {
        alert(auth.message);
        return;
      }
      if (wasLoggedIn && auth.phase !== "authenticated") {
        return;
      }

      if (auth.phase === "authenticated") {
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

      setGuestCart(updatedItems);

      await refreshCartCount();
    } catch (error: unknown) {
      console.error("장바구니 수량 변경 실패:", error);
      alert(error instanceof Error ? error.message : "수량 변경 중 오류가 발생했습니다.");
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
      const wasLoggedIn = useAuthStore.getState().isLoggedIn;
      const auth = await resolveAuthentication();
      if (auth.phase === "recovery_failed") {
        alert(auth.message);
        return;
      }
      if (wasLoggedIn && auth.phase !== "authenticated") {
        return;
      }

      if (auth.phase === "authenticated") {
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

      setGuestCart(updatedItems);

      await refreshCartCount();
    } catch (error: unknown) {
      console.error("장바구니 삭제 실패:", error);
      if (error instanceof ApiRequestError && (error.kind === "unauthenticated" || error.kind === "forbidden")) {
        setIsLoggedIn(false);
      }
      alert(error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.");
    }
  };

  const changePendingQuantity = async (cartItemId: number, newQuantity: number) => {
    if (!Number.isInteger(newQuantity) || newQuantity < 1 || newQuantity > 99) return;
    const updated = pendingItems.map((item) =>
      item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
    );
    setPendingItems(updated);
    setGuestCart(updated);
    await refreshCartCount();
  };

  const retryMerge = async () => {
    if (merging) return;
    setMerging(true);
    setMergeNotice("");
    try {
      await syncLocalCartToServer(getGuestCart());
      localStorage.removeItem("guestCart");
      setPendingItems([]);
      setMergeNotice("브라우저의 장바구니를 서버에 합쳤습니다.");
      setCartItems(await fetchCartItems());
      await refreshCartCount();
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "장바구니를 서버에 합치지 못했습니다.";
      setPendingItems(getGuestCart());
      setMergeNotice(`${detail} 이 브라우저의 장바구니는 그대로 두었습니다.`);
    } finally {
      setMerging(false);
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

          {mergeNotice && (
            <p className="mb-6 text-center text-[12px] leading-6 text-[#333]">{mergeNotice}</p>
          )}
          {cartError && (cartItems.length > 0 || pendingItems.length > 0) && (
            <p className="mb-6 text-center text-[12px] leading-6 text-[#333]">{cartError}</p>
          )}

          {loading ? (
            <div className="py-20 text-center text-[11px] tracking-[0.1em] text-[#999]">
              LOADING...
            </div>
          ) : cartItems.length === 0 && pendingItems.length === 0 ? (
            <div className="py-20 text-center">
              <p className="mb-6 text-[12px] tracking-[0.05em] text-[#777]">
                {cartError || "장바구니에 담긴 상품이 없습니다."}
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
              {cartItems.length > 0 && <div className="border-t border-black">
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
                        {item.colorName ? `${item.colorName} · ` : ""}₩{item.price.toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 max-sm:w-full max-sm:justify-between">
                      <div className="flex h-9 items-center border border-black/20">
                        <button
                          type="button"
                          aria-label={`${item.productName} 수량 줄이기`}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            handleQuantityChange(
                              item.cartItemId,
                              item.quantity - 1
                            )
                          }
                          className="w-8 text-[#777] hover:text-black disabled:text-[#ccc]"
                        >
                          -
                        </button>

                        <span className="w-8 text-center text-[11px]">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`${item.productName} 수량 늘리기`}
                          disabled={item.quantity >= 99}
                          onClick={() =>
                            handleQuantityChange(
                              item.cartItemId,
                              item.quantity + 1
                            )
                          }
                          className="w-8 text-[#777] hover:text-black disabled:text-[#ccc]"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-[100px] text-right text-[12px] font-bold max-sm:w-auto">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </div>

                      <button
                        type="button"
                        aria-label={`${item.productName} 삭제`}
                        onClick={() => handleRemove(item.cartItemId)}
                        className="text-[18px] text-[#aaa] hover:text-black"
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
              </div>}

              {pendingItems.length > 0 && (
                <section className="mt-8 border border-black/20 p-5">
                  <h2 className="text-[12px] tracking-[0.08em]">아직 서버에 합치지 못한 장바구니</h2>
                  <p className="mt-2 text-[11px] leading-5 text-[#666]">
                    로그인은 유지됩니다. 수량을 조정한 뒤 다시 합칠 수 있습니다.
                  </p>
                  <div className="mt-4 border-t border-black/10">
                    {pendingItems.map((item) => (
                      <div key={`pending-${item.cartItemId}`} className="flex items-center justify-between gap-4 border-b border-black/10 py-4">
                        <div>
                          <p className="text-[13px]">{item.productName}</p>
                          <p className="mt-1 text-[11px] text-[#777]">
                            {item.colorName ? `${item.colorName} · ` : "색상 없음 · "}수량 {item.quantity}
                          </p>
                        </div>
                        <div className="flex h-9 items-center border border-black/20">
                          <button type="button" aria-label={`${item.productName} 미병합 수량 줄이기`} disabled={item.quantity <= 1} onClick={() => changePendingQuantity(item.cartItemId, item.quantity - 1)} className="w-8 text-[#777] disabled:text-[#ccc]">-</button>
                          <span className="w-8 text-center text-[11px]">{item.quantity}</span>
                          <button type="button" aria-label={`${item.productName} 미병합 수량 늘리기`} disabled={item.quantity >= 99} onClick={() => changePendingQuantity(item.cartItemId, item.quantity + 1)} className="w-8 text-[#777] disabled:text-[#ccc]">+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={retryMerge} disabled={merging || Boolean(cartError)} className="mt-4 h-10 border border-black px-4 text-[11px] tracking-[0.08em] disabled:text-[#aaa]">
                    {merging ? "합치는 중" : "다시 합치기"}
                  </button>
                </section>
              )}

              {cartItems.length > 0 && <div className="mt-10 bg-[#f5f4f2] p-8">
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
              </div>}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}