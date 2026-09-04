(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/header/Header.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Header
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAuthStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAuthStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useCartStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useCartStore.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
function Header() {
    _s();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const [isMenuOpen, setIsMenuOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAuthChecking, setIsAuthChecking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const { isLoggedIn, isAdmin, setAuthState, clearAuthState } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAuthStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"])();
    const { cartCount, refreshCartCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useCartStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            setMounted(true);
        }
    }["Header.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            setIsMenuOpen(false);
        }
    }["Header.useEffect"], [
        pathname
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            const initializeAuth = {
                "Header.useEffect.initializeAuth": async ()=>{
                    try {
                        let token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAccessToken"])();
                        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAccessTokenValid"])(token)) {
                            token = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["silentRefresh"])();
                        }
                        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAccessTokenValid"])(token)) {
                            setAuthState(true, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAdminFromToken"])(token));
                        } else {
                            clearAuthState();
                        }
                    } catch (error) {
                        clearAuthState();
                    } finally{
                        setIsAuthChecking(false);
                    }
                }
            }["Header.useEffect.initializeAuth"];
            initializeAuth();
        }
    }["Header.useEffect"], [
        setAuthState,
        clearAuthState
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            if (isMenuOpen) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "unset";
            }
            return ({
                "Header.useEffect": ()=>{
                    document.body.style.overflow = "unset";
                }
            })["Header.useEffect"];
        }
    }["Header.useEffect"], [
        isMenuOpen
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            refreshCartCount();
        }
    }["Header.useEffect"], [
        isLoggedIn,
        refreshCartCount
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Header.useEffect": ()=>{
            const updateLoginState = {
                "Header.useEffect.updateLoginState": ()=>{
                    const token = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getAccessToken"])();
                    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAccessTokenValid"])(token)) {
                        setAuthState(true, (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isAdminFromToken"])(token));
                    } else {
                        clearAuthState();
                    }
                }
            }["Header.useEffect.updateLoginState"];
            window.addEventListener("authStateChanged", updateLoginState);
            return ({
                "Header.useEffect": ()=>{
                    window.removeEventListener("authStateChanged", updateLoginState);
                }
            })["Header.useEffect"];
        }
    }["Header.useEffect"], [
        setAuthState,
        clearAuthState
    ]);
    const handleLogout = async ()=>{
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["logoutUser"])();
        } catch (error) {
            console.error("로그아웃 API 호출 실패", error);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["removeAccessToken"])();
        } finally{
            clearAuthState();
            let redirectPath = pathname;
            const privateRoutes = [
                "/admin",
                "/my",
                "/checkout"
            ];
            const isPrivateRoute = privateRoutes.some((route)=>pathname.startsWith(route));
            if (isPrivateRoute) {
                redirectPath = "/";
            } else if (pathname.startsWith("/shop/")) {
                redirectPath = "/shop";
            }
            window.location.href = redirectPath;
        }
    };
    const isLoadingUI = !mounted || isAuthChecking;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                className: "sticky top-0 z-40 w-full bg-white border-b border-black/10",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mx-auto flex h-[74px] max-w-[1200px] items-center justify-between px-5",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            className: "text-[18px] font-bold tracking-widest",
                            children: "PORTFOLIO"
                        }, void 0, false, {
                            fileName: "[project]/src/components/header/Header.tsx",
                            lineNumber: 130,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                            className: "flex items-center gap-6 max-md:hidden text-[12px] tracking-[0.1em]",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/shop",
                                    className: "hover:text-gray-500",
                                    children: "SHOP"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 135,
                                    columnNumber: 13
                                }, this),
                                isLoadingUI ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "w-[120px] h-[16px] animate-pulse bg-gray-100 rounded-sm"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 140,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: isLoggedIn ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleLogout,
                                        className: "hover:text-gray-500",
                                        children: "LOGOUT"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/header/Header.tsx",
                                        lineNumber: 144,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/login",
                                        className: "hover:text-gray-500",
                                        children: "LOGIN"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/header/Header.tsx",
                                        lineNumber: 151,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 142,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/cart",
                                    className: "hover:text-gray-500",
                                    children: [
                                        "CART (",
                                        mounted ? cartCount : 0,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 158,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/header/Header.tsx",
                            lineNumber: 134,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center gap-4 md:hidden",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: "/cart",
                                    className: "text-[12px] tracking-[0.1em]",
                                    children: [
                                        "CART (",
                                        mounted ? cartCount : 0,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 164,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setIsMenuOpen(true),
                                    className: "p-1",
                                    "aria-label": "Open Menu",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        width: "24",
                                        height: "24",
                                        viewBox: "0 0 24 24",
                                        fill: "none",
                                        stroke: "currentColor",
                                        strokeWidth: "1.5",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M3 12h18M3 6h18M3 18h18",
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/header/Header.tsx",
                                            lineNumber: 184,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/header/Header.tsx",
                                        lineNumber: 176,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 171,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/header/Header.tsx",
                            lineNumber: 163,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/header/Header.tsx",
                    lineNumber: 129,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/header/Header.tsx",
                lineNumber: 128,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`,
                onClick: ()=>setIsMenuOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/components/header/Header.tsx",
                lineNumber: 195,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `fixed right-0 top-0 z-50 h-full w-[250px] bg-white p-6 shadow-xl transition-transform duration-300 md:hidden flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-end mb-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setIsMenuOpen(false),
                            className: "p-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                width: "24",
                                height: "24",
                                viewBox: "0 0 24 24",
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "1.5",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M18 6L6 18M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/header/Header.tsx",
                                    lineNumber: 222,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/header/Header.tsx",
                                lineNumber: 214,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/header/Header.tsx",
                            lineNumber: 210,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/header/Header.tsx",
                        lineNumber: 209,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "flex flex-col gap-6 text-[14px] tracking-[0.1em]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/shop",
                                className: "border-b border-gray-100 pb-2",
                                children: "SHOP"
                            }, void 0, false, {
                                fileName: "[project]/src/components/header/Header.tsx",
                                lineNumber: 228,
                                columnNumber: 11
                            }, this),
                            isLoadingUI ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 h-[150px] w-full animate-pulse bg-gray-50 rounded-sm"
                            }, void 0, false, {
                                fileName: "[project]/src/components/header/Header.tsx",
                                lineNumber: 236,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-gray-50 p-4 rounded-sm flex flex-col gap-4 mt-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[11px] text-gray-500 font-bold mb-1",
                                                children: "ADMIN MENU"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/header/Header.tsx",
                                                lineNumber: 241,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/admin/products",
                                                className: "text-blue-600",
                                                children: "PRODUCT MGT"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/header/Header.tsx",
                                                lineNumber: 245,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                href: "/admin/orders",
                                                className: "text-blue-600",
                                                children: "ORDER MGT"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/header/Header.tsx",
                                                lineNumber: 252,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/header/Header.tsx",
                                        lineNumber: 240,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-auto pt-10 flex flex-col gap-4",
                                        children: isLoggedIn ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: handleLogout,
                                            className: "border border-black py-3 w-full hover:bg-black hover:text-white transition",
                                            children: "LOGOUT"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/header/Header.tsx",
                                            lineNumber: 263,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                            href: "/login",
                                            className: "border border-black py-3 w-full text-center hover:bg-black hover:text-white transition",
                                            children: "LOGIN"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/header/Header.tsx",
                                            lineNumber: 270,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/header/Header.tsx",
                                        lineNumber: 261,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/header/Header.tsx",
                                lineNumber: 238,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/header/Header.tsx",
                        lineNumber: 227,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/header/Header.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/header/Header.tsx",
        lineNumber: 127,
        columnNumber: 5
    }, this);
}
_s(Header, "XTjFC6H0YoEd0sQMT/wPmBcyWlw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAuthStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuthStore"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useCartStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"]
    ];
});
_c = Header;
var _c;
__turbopack_context__.k.register(_c, "Header");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addCartItem",
    ()=>addCartItem,
    "addToCart",
    ()=>addToCart,
    "api",
    ()=>api,
    "clearGuestCart",
    ()=>clearGuestCart,
    "confirmPayment",
    ()=>confirmPayment,
    "createCommunityPost",
    ()=>createCommunityPost,
    "createProduct",
    ()=>createProduct,
    "createProject",
    ()=>createProject,
    "createProjectMedia",
    ()=>createProjectMedia,
    "createResumeEducation",
    ()=>createResumeEducation,
    "createResumeExperience",
    ()=>createResumeExperience,
    "createResumeIntroduction",
    ()=>createResumeIntroduction,
    "createResumeSkill",
    ()=>createResumeSkill,
    "deleteCommunityPost",
    ()=>deleteCommunityPost,
    "deleteProduct",
    ()=>deleteProduct,
    "deleteProductImage",
    ()=>deleteProductImage,
    "deleteProject",
    ()=>deleteProject,
    "deleteProjectMedia",
    ()=>deleteProjectMedia,
    "deleteResumeEducation",
    ()=>deleteResumeEducation,
    "deleteResumeExperience",
    ()=>deleteResumeExperience,
    "deleteResumeIntroduction",
    ()=>deleteResumeIntroduction,
    "deleteResumeSkill",
    ()=>deleteResumeSkill,
    "fetchAdminProducts",
    ()=>fetchAdminProducts,
    "fetchAdminUsers",
    ()=>fetchAdminUsers,
    "fetchCartCount",
    ()=>fetchCartCount,
    "fetchCartItems",
    ()=>fetchCartItems,
    "fetchCommunityPost",
    ()=>fetchCommunityPost,
    "fetchCommunityPosts",
    ()=>fetchCommunityPosts,
    "fetchPaymentHistory",
    ()=>fetchPaymentHistory,
    "fetchProductImages",
    ()=>fetchProductImages,
    "fetchProducts",
    ()=>fetchProducts,
    "fetchProject",
    ()=>fetchProject,
    "fetchProjectMedia",
    ()=>fetchProjectMedia,
    "fetchProjects",
    ()=>fetchProjects,
    "fetchResume",
    ()=>fetchResume,
    "getAccessToken",
    ()=>getAccessToken,
    "getAccessTokenPayload",
    ()=>getAccessTokenPayload,
    "getCustomerTier",
    ()=>getCustomerTier,
    "getGuestCart",
    ()=>getGuestCart,
    "getProductById",
    ()=>getProductById,
    "handleResponseError",
    ()=>handleResponseError,
    "isAccessTokenValid",
    ()=>isAccessTokenValid,
    "isAdminFromToken",
    ()=>isAdminFromToken,
    "loginUser",
    ()=>loginUser,
    "logoutUser",
    ()=>logoutUser,
    "removeAccessToken",
    ()=>removeAccessToken,
    "removeCartItem",
    ()=>removeCartItem,
    "resolveAssetUrl",
    ()=>resolveAssetUrl,
    "setAccessToken",
    ()=>setAccessToken,
    "setGuestCart",
    ()=>setGuestCart,
    "signupUser",
    ()=>signupUser,
    "silentRefresh",
    ()=>silentRefresh,
    "syncLocalCartToServer",
    ()=>syncLocalCartToServer,
    "updateCartItemQuantity",
    ()=>updateCartItemQuantity,
    "updateCommunityPost",
    ()=>updateCommunityPost,
    "updateProduct",
    ()=>updateProduct,
    "updateProject",
    ()=>updateProject,
    "updateProjectMedia",
    ()=>updateProjectMedia,
    "updateResumeEducation",
    ()=>updateResumeEducation,
    "updateResumeExperience",
    ()=>updateResumeExperience,
    "updateResumeIntroduction",
    ()=>updateResumeIntroduction,
    "updateResumeProfile",
    ()=>updateResumeProfile,
    "updateResumeSkill",
    ()=>updateResumeSkill,
    "uploadProductImage",
    ()=>uploadProductImage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/axios/lib/axios.js [app-client] (ecmascript)");
;
const IS_SERVER = ("TURBOPACK compile-time value", "object") === "undefined";
// 💡 수정된 API_BASE_URL 설정
const API_BASE_URL = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ("TURBOPACK compile-time value", "http://localhost:8080") || "http://localhost:8080";
const api = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$axios$2f$lib$2f$axios$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].create({
    baseURL: API_BASE_URL
});
/* =========================================================================
 * 0. 메모리 토큰 저장소 및 헬퍼 함수
 * ========================================================================= */ let inMemoryAccessToken = null;
const getAccessToken = ()=>{
    return inMemoryAccessToken;
};
const getAccessTokenPayload = (token = inMemoryAccessToken)=>{
    if (!token) {
        return null;
    }
    try {
        const parts = token.split(".");
        if (parts.length !== 3) {
            return null;
        }
        const base64Payload = parts[1].replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
        return JSON.parse(atob(base64Payload));
    } catch (error) {
        console.error("Access Token Payload 파싱 실패:", error);
        return null;
    }
};
const isAccessTokenValid = (token = inMemoryAccessToken)=>{
    const payload = getAccessTokenPayload(token);
    if (!payload?.exp) {
        return false;
    }
    return payload.exp * 1000 > Date.now();
};
const isAdminFromToken = (token = inMemoryAccessToken)=>{
    const payload = getAccessTokenPayload(token);
    if (!payload) {
        return false;
    }
    return payload.role === "ROLE_ADMIN";
};
const setAccessToken = (token)=>{
    inMemoryAccessToken = token;
    if ("TURBOPACK compile-time truthy", 1) {
        window.dispatchEvent(new Event("authStateChanged"));
    }
};
const removeAccessToken = ()=>{
    inMemoryAccessToken = null;
    if ("TURBOPACK compile-time truthy", 1) {
        window.dispatchEvent(new Event("authStateChanged"));
        // 과거 버전에서 사용했던 accessToken 찌꺼기 제거
        localStorage.removeItem("accessToken");
    }
};
const getAuthHeaders = (isJson = true)=>{
    const headers = {};
    if (isJson) {
        headers["Content-Type"] = "application/json";
    }
    if (inMemoryAccessToken) {
        headers["Authorization"] = `Bearer ${inMemoryAccessToken}`;
    }
    return headers;
};
async function handleResponseError(response) {
    const errorText = await response.clone().text();
    let errorMessage = "요청 처리에 실패했습니다.";
    try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorMessage;
    } catch  {
        errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
}
function resolveAssetUrl(path) {
    if (!path) {
        return null;
    }
    if (path.startsWith("http")) {
        return path;
    }
    const PUBLIC_URL = ("TURBOPACK compile-time value", "http://localhost:8080") || "http://localhost:8080";
    return `${PUBLIC_URL}${path}`;
}
async function signupUser(userData) {
    const response = await fetch(`${API_BASE_URL}/api/users/signUp`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(userData)
    });
    if (!response.ok) await handleResponseError(response);
    return response.text();
}
async function loginUser(credentials) {
    const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials),
        credentials: "include"
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }
    const data = await response.json();
    if (!data.accessToken) {
        throw new Error("Access Token을 전달받지 못했습니다.");
    }
    setAccessToken(data.accessToken);
    return data;
}
async function silentRefresh() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
            method: "POST",
            credentials: "include"
        });
        if (!response.ok) {
            setAccessToken(null);
            return null;
        }
        const data = await response.json();
        if (!data.accessToken) {
            setAccessToken(null);
            return null;
        }
        setAccessToken(data.accessToken);
        return data.accessToken;
    } catch (error) {
        setAccessToken(null);
        return null;
    }
}
async function logoutUser() {
    try {
        await fetch(`${API_BASE_URL}/api/users/logout`, {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
    // 로그아웃 요청 실패와 관계없이 클라이언트 인증 상태는 제거
    } finally{
        removeAccessToken();
    }
}
async function fetchResume() {
    const response = await fetch(`${API_BASE_URL}/api/resume`);
    if (!response.ok) throw new Error("이력서 데이터를 불러오는데 실패했습니다.");
    return response.json();
}
async function updateResumeProfile(profileData) {
    const isFormData = typeof FormData !== "undefined" && profileData instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/profile`, {
        method: "PUT",
        headers: getAuthHeaders(!isFormData),
        body: isFormData ? profileData : JSON.stringify(profileData),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function createResumeEducation(data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function updateResumeEducation(id, data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteResumeEducation(id) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/educations/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function createResumeExperience(data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function updateResumeExperience(id, data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteResumeExperience(id) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/experiences/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function createResumeSkill(data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function updateResumeSkill(id, data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteResumeSkill(id) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/skills/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function createResumeIntroduction(data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function updateResumeIntroduction(id, data) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteResumeIntroduction(id) {
    const response = await fetch(`${API_BASE_URL}/api/admin/resume/introductions/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function fetchProjects(isFeatured) {
    const url = isFeatured ? `${API_BASE_URL}/api/projects?featured=true` : `${API_BASE_URL}/api/projects`;
    const response = await fetch(url, {
        cache: "no-store"
    });
    if (!response.ok) throw new Error("프로젝트 데이터를 불러오는데 실패했습니다.");
    return response.json();
}
async function fetchProject(projectId) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function createProject(projectData) {
    const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/admin/projects`, {
        method: "POST",
        headers: getAuthHeaders(!isFormData),
        body: isFormData ? projectData : JSON.stringify(projectData),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function updateProject(projectId, projectData) {
    const isFormData = typeof FormData !== "undefined" && projectData instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, {
        method: "PUT",
        headers: getAuthHeaders(!isFormData),
        body: isFormData ? projectData : JSON.stringify(projectData),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteProject(projectId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.text();
}
async function fetchProjectMedia(projectId) {
    const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/media`);
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function createProjectMedia(projectId, data) {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("caption", data.caption || "");
    formData.append("description", data.description || "");
    formData.append("altText", data.altText || "");
    formData.append("sortOrder", String(data.sortOrder));
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media`, {
        method: "POST",
        credentials: "include",
        headers: {
            ...token ? {
                "Authorization": `Bearer ${token}`
            } : {}
        },
        body: formData
    });
    if (!response.ok) throw new Error("미디어 업로드에 실패했습니다.");
    return response.json();
}
async function updateProjectMedia(projectId, mediaId, data) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media/${mediaId}`, {
        method: "PUT",
        headers: getAuthHeaders(!isFormData),
        body: isFormData ? data : JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteProjectMedia(projectId, mediaId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/projects/${projectId}/media/${mediaId}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function fetchProducts(category) {
    const url = category ? `${API_BASE_URL}/api/products?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/products`;
    const response = await fetch(url);
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function getProductById(productId) {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function fetchAdminProducts() {
    const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function createProduct(productData) {
    const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: getAuthHeaders(!isFormData),
        body: isFormData ? productData : JSON.stringify(productData),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function updateProduct(productId, productData) {
    const isFormData = typeof FormData !== "undefined" && productData instanceof FormData;
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: "PUT",
        headers: getAuthHeaders(!isFormData),
        body: isFormData ? productData : JSON.stringify(productData),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteProduct(productId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.text();
}
async function fetchProductImages(productId) {
    const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images`);
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
async function uploadProductImage(productId, data) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    let finalBody = data;
    if (!isFormData && data.file) {
        const formData = new FormData();
        formData.append("file", data.file);
        if (data.imageType) formData.append("imageType", data.imageType);
        if (data.altText) formData.append("altText", data.altText);
        if (data.sortOrder !== undefined) formData.append("sortOrder", String(data.sortOrder));
        finalBody = formData;
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images`, {
        method: "POST",
        headers: getAuthHeaders(false),
        body: finalBody,
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
async function deleteProductImage(productId, imageId) {
    const response = await fetch(`${API_BASE_URL}/api/admin/products/${productId}/images/${imageId}`, {
        method: "DELETE",
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.ok;
}
/**
 * 비회원 장바구니 저장소
 *
 * 프로젝트 전체에서 반드시 "guestCart" 하나만 사용한다.
 */ const GUEST_CART_KEY = "guestCart";
const getGuestCart = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    const stored = localStorage.getItem(GUEST_CART_KEY);
    if (!stored) {
        return [];
    }
    try {
        return JSON.parse(stored);
    } catch (error) {
        console.error("비회원 장바구니 파싱 실패:", error);
        localStorage.removeItem(GUEST_CART_KEY);
        return [];
    }
};
const setGuestCart = (cart)=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
};
const clearGuestCart = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.removeItem(GUEST_CART_KEY);
};
const fetchCartItems = async ()=>{
    const token = getAccessToken();
    if (isAccessTokenValid(token)) {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            credentials: "include"
        });
        if (!response.ok) {
            const error = new Error("장바구니 조회 실패");
            error.status = response.status;
            throw error;
        }
        return response.json();
    }
    return getGuestCart();
};
const addCartItem = async (product, quantity)=>{
    const token = getAccessToken();
    if (isAccessTokenValid(token)) {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                productId: product.id,
                quantity
            }),
            credentials: "include"
        });
        if (!response.ok) {
            const error = new Error("장바구니 담기에 실패했습니다.");
            error.status = response.status;
            throw error;
        }
        return;
    }
    const cart = getGuestCart();
    const existingItemIndex = cart.findIndex((item)=>item.productId === product.id);
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
    } else {
        cart.push({
            cartItemId: Date.now(),
            productId: product.id,
            productName: product.name,
            price: product.price,
            thumbnailUrl: product.thumbnail,
            quantity
        });
    }
    setGuestCart(cart);
};
async function addToCart(productId, quantity = 1) {
    const token = getAccessToken();
    if (!isAccessTokenValid(token)) {
        throw new Error("로그인이 필요한 기능입니다.");
    }
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: "POST",
        headers: {
            ...getAuthHeaders(true),
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            productId,
            quantity
        }),
        credentials: "include"
    });
    if (!response.ok) {
        const error = new Error("장바구니 담기에 실패했습니다.");
        error.status = response.status;
        throw error;
    }
    if ("TURBOPACK compile-time truthy", 1) {
        window.dispatchEvent(new Event("cartChanged"));
    }
    return response.text();
}
async function updateCartItemQuantity(cartItemId, quantity) {
    const token = getAccessToken();
    if (!isAccessTokenValid(token)) {
        throw new Error("로그인이 필요한 기능입니다.");
    }
    const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}?quantity=${quantity}`, {
        method: "PUT",
        headers: {
            ...getAuthHeaders(true),
            Authorization: `Bearer ${token}`
        },
        credentials: "include"
    });
    if (!response.ok) {
        const error = new Error("장바구니 수량 변경에 실패했습니다.");
        error.status = response.status;
        throw error;
    }
    return response.text();
}
async function removeCartItem(cartItemId) {
    const token = getAccessToken();
    if (!isAccessTokenValid(token)) {
        throw new Error("로그인이 필요한 기능입니다.");
    }
    const response = await fetch(`${API_BASE_URL}/api/cart/${cartItemId}`, {
        method: "DELETE",
        headers: {
            ...getAuthHeaders(true),
            Authorization: `Bearer ${token}`
        },
        credentials: "include"
    });
    if (!response.ok) {
        const error = new Error("장바구니 상품 삭제에 실패했습니다.");
        error.status = response.status;
        throw error;
    }
    return response.text();
}
const fetchCartCount = async ()=>{
    const token = getAccessToken();
    if (isAccessTokenValid(token)) {
        const response = await fetch(`${API_BASE_URL}/api/cart/count`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            credentials: "include"
        });
        if (!response.ok) {
            return 0;
        }
        return response.json();
    }
    const cart = getGuestCart();
    return cart.reduce((sum, item)=>sum + item.quantity, 0);
};
async function syncLocalCartToServer(items) {
    const token = getAccessToken();
    if (!isAccessTokenValid(token)) {
        return;
    }
    const response = await fetch(`${API_BASE_URL}/api/cart/sync`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify(items)
    });
    if (!response.ok) {
        throw new Error("장바구니 동기화에 실패했습니다.");
    }
}
async function fetchAdminUsers(page = 0, size = 10, searchName = "", tier = "") {
    const params = new URLSearchParams({
        page: String(page),
        size: String(size)
    });
    if (searchName) params.append("name", searchName);
    if (tier) params.append("tier", tier);
    const response = await fetch(`${API_BASE_URL}/api/admin/users?${params.toString()}`, {
        headers: getAuthHeaders(true),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.json();
}
function getCustomerTier(totalSpent) {
    if (totalSpent >= 1000000) return "VIP";
    if (totalSpent >= 300000) return "GOLD";
    if (totalSpent >= 100000) return "SILVER";
    return "BRONZE";
}
const confirmPayment = async (paymentData)=>{
    const token = getAccessToken();
    const response = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(paymentData)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
};
const fetchPaymentHistory = async (status)=>{
    const token = getAccessToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    const response = await fetch(`${API_BASE_URL}/api/payments/history?status=${status}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    if (!response.ok) throw new Error("결제 내역을 불러오는데 실패했습니다.");
    return response.json();
};
const createCommunityPost = async (data)=>{
    const response = await fetch(`${API_BASE_URL}/api/admin/community/posts`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.json();
};
const updateCommunityPost = async (id, data)=>{
    const response = await fetch(`${API_BASE_URL}/api/admin/community/posts/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(true),
        body: JSON.stringify(data),
        credentials: "include"
    });
    if (!response.ok) await handleResponseError(response);
    return response.json();
};
const fetchCommunityPost = async (id)=>{
    const response = await fetch(`${API_BASE_URL}/api/community/posts/${id}`);
    if (!response.ok) await handleResponseError(response);
    return response.json();
};
const fetchCommunityPosts = async (category)=>{
    const url = category ? `${API_BASE_URL}/api/community/posts?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/community/posts`;
    const response = await fetch(url);
    if (!response.ok) await handleResponseError(response);
    return response.json();
};
async function deleteCommunityPost(id) {
    // getAuthHeaders(true)는 어제 만드신 토큰 헤더 반환 함수입니다.
    const response = await fetch(`${API_BASE_URL}/api/admin/community/posts/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(true)
    });
    if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "게시글 삭제에 실패했습니다.");
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useAuthStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuthStore",
    ()=>useAuthStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
;
const useAuthStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((set)=>({
        isLoggedIn: false,
        isAdmin: false,
        setIsLoggedIn: (status)=>set({
                isLoggedIn: status
            }),
        setIsAdmin: (status)=>set({
                isAdmin: status
            }),
        setAuthState: (isLoggedIn, isAdmin)=>set({
                isLoggedIn,
                isAdmin
            }),
        clearAuthState: ()=>set({
                isLoggedIn: false,
                isAdmin: false
            })
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/store/useCartStore.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useCartStore",
    ()=>useCartStore
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/zustand/esm/react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
;
;
const useCartStore = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zustand$2f$esm$2f$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["create"])()((set)=>({
        cartCount: 0,
        setCartCount: (count)=>set({
                cartCount: count
            }),
        // 로그인/비로그인 분기가 내장된 api.ts의 fetchCartCount를 호출
        refreshCartCount: async ()=>{
            try {
                const count = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchCartCount"])();
                set({
                    cartCount: count
                });
            } catch (error) {
                set({
                    cartCount: 0
                });
            }
        }
    }));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_19eu53_._.js.map