(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/app/shop/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShopPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$header$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/header/Header.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$shop$2f$ShopHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/admin/shop/ShopHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$product$2f$ProductGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/product/ProductGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Footer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Footer.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
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
function ShopPage() {
    _s();
    const [products, setProducts] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    // 1. 사용자 입력 상태 (타이핑/선택 중인 값)
    const [keyword, setKeyword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [selectedCategory, setSelectedCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("ALL");
    // 2. 실제 검색에 적용될 상태 (엔터/버튼 클릭 시 업데이트)
    const [appliedFilter, setAppliedFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        category: "ALL",
        search: ""
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ShopPage.useEffect": ()=>{
            const loadData = {
                "ShopPage.useEffect.loadData": async ()=>{
                    setLoading(true);
                    try {
                        // 객체 형태로 API 호출 (lib/api.ts 수정본과 호환)
                        const data = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchProducts"])({
                            category: appliedFilter.category,
                            search: appliedFilter.search
                        });
                        setProducts(data);
                    } catch (error) {
                        console.error("데이터를 불러오는데 실패했습니다.", error);
                    } finally{
                        setLoading(false);
                    }
                }
            }["ShopPage.useEffect.loadData"];
            loadData();
        }
    }["ShopPage.useEffect"], [
        appliedFilter
    ]);
    const handleSearch = (e)=>{
        e.preventDefault();
        setAppliedFilter({
            category: selectedCategory,
            search: keyword
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$header$2f$Header$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/shop/page.tsx",
                lineNumber: 54,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$admin$2f$shop$2f$ShopHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        category: appliedFilter.category,
                        count: products.length
                    }, void 0, false, {
                        fileName: "[project]/src/app/shop/page.tsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                        className: "px-7 pt-[45px] max-sm:px-[14px] max-sm:pt-[30px] max-w-7xl mx-auto",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleSearch,
                                className: "flex flex-col sm:flex-row gap-2 mb-10 w-full justify-end",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                        value: selectedCategory,
                                        onChange: (e)=>setSelectedCategory(e.target.value),
                                        className: "border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-black bg-white cursor-pointer min-w-[140px]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "ALL",
                                                children: "전체 카테고리"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 72,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "LIP",
                                                children: "LIP"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 73,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "EYE",
                                                children: "EYE"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 74,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "BASE",
                                                children: "BASE"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 75,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                value: "NAIL",
                                                children: "NAIL"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 76,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/shop/page.tsx",
                                        lineNumber: 67,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex w-full sm:w-auto",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: keyword,
                                                onChange: (e)=>setKeyword(e.target.value),
                                                placeholder: "상품명을 입력하세요",
                                                className: "w-full sm:w-[250px] border border-gray-300 border-r-0 px-4 py-2 text-sm focus:outline-none focus:border-black transition-colors"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 82,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                className: "bg-black text-white px-6 py-2 text-sm font-medium hover:bg-gray-800 transition-colors whitespace-nowrap",
                                                children: "검색"
                                            }, void 0, false, {
                                                fileName: "[project]/src/app/shop/page.tsx",
                                                lineNumber: 89,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/app/shop/page.tsx",
                                        lineNumber: 81,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/app/shop/page.tsx",
                                lineNumber: 62,
                                columnNumber: 11
                            }, this),
                            loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "py-20 text-center text-gray-500 text-sm",
                                children: "상품을 불러오는 중입니다..."
                            }, void 0, false, {
                                fileName: "[project]/src/app/shop/page.tsx",
                                lineNumber: 100,
                                columnNumber: 13
                            }, this) : products.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "py-20 text-center text-gray-500 text-sm",
                                children: "조건에 맞는 상품이 없습니다."
                            }, void 0, false, {
                                fileName: "[project]/src/app/shop/page.tsx",
                                lineNumber: 102,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$product$2f$ProductGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                products: products
                            }, void 0, false, {
                                fileName: "[project]/src/app/shop/page.tsx",
                                lineNumber: 104,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/app/shop/page.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/app/shop/page.tsx",
                lineNumber: 55,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Footer$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/app/shop/page.tsx",
                lineNumber: 109,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/app/shop/page.tsx",
        lineNumber: 53,
        columnNumber: 5
    }, this);
}
_s(ShopPage, "9xwLkU3Hbx1EL0TSVx0FnUxuS9k=");
_c = ShopPage;
var _c;
__turbopack_context__.k.register(_c, "ShopPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/admin/shop/ShopHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ShopHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/Button.tsx [app-client] (ecmascript)");
;
;
const categories = [
    "ALL",
    "BEST",
    "NEW",
    "BASE",
    "CHEEK",
    "EYE",
    "LIP"
];
function ShopHeader({ category = "ALL", count = 61 }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "border-b border-[#ddd] px-7 pb-7 pt-[132px] max-sm:px-[14px] max-sm:pb-[22px] max-sm:pt-[105px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[9px] tracking-[0.08em] text-[#999]",
                children: [
                    "HOME / SHOP / ",
                    category
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                lineNumber: 8,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-[54px] flex items-end justify-between max-sm:mt-[38px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                        className: "m-0 text-[34px] font-normal tracking-[-0.05em] max-sm:text-[27px]",
                        children: "SHOP"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                        lineNumber: 10,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[9px] text-[#777]",
                        children: [
                            count,
                            " PRODUCTS"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                        lineNumber: 11,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                className: "mt-7 flex flex-wrap gap-[17px]",
                children: categories.map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: item === "ALL" ? "/shop" : `/shop#${item.toLowerCase()}`,
                        className: `text-[10px] tracking-[0.05em] no-underline ${item === category ? "text-[#111]" : "text-[#999]"}`,
                        children: item
                    }, item, false, {
                        fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                        lineNumber: 14,
                        columnNumber: 35
                    }, this))
            }, void 0, false, {
                fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                lineNumber: 13,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-[25px] flex justify-end gap-[25px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        variant: "text",
                        children: "FILTER"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        variant: "text",
                        children: "SORT BY"
                    }, void 0, false, {
                        fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                        lineNumber: 18,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
                lineNumber: 16,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/admin/shop/ShopHeader.tsx",
        lineNumber: 7,
        columnNumber: 5
    }, this);
}
_c = ShopHeader;
var _c;
__turbopack_context__.k.register(_c, "ShopHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/common/Button.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Icon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/Icon.tsx [app-client] (ecmascript)");
;
;
function Button({ children, variant = "text", icon, onClick, type = "button", ariaLabel }) {
    const variants = {
        solid: "min-h-[46px] bg-[#151515] px-[22px] text-[12px] tracking-[0.08em] text-white",
        outline: "min-h-[46px] border border-[#151515] px-[22px] text-[12px] tracking-[0.08em]",
        text: "px-0 py-[3px] text-[12px] tracking-[0.06em]",
        icon: "h-9 w-9 rounded-full"
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        className: `inline-flex items-center justify-center gap-2 transition-opacity duration-200 hover:opacity-60 ${variants[variant]}`,
        onClick: onClick,
        type: type,
        "aria-label": ariaLabel,
        children: [
            children,
            icon && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Icon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                name: icon,
                size: 17
            }, void 0, false, {
                fileName: "[project]/src/components/common/Button.tsx",
                lineNumber: 28,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/common/Button.tsx",
        lineNumber: 21,
        columnNumber: 5
    }, this);
}
_c = Button;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/common/Icon.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Icon
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Icon({ name, size = 20, strokeWidth = 1.3 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true
    };
    switch(name){
        case "menu":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ...common,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 6h18M3 12h18M3 18h18"
                }, void 0, false, {
                    fileName: "[project]/src/components/common/Icon.tsx",
                    lineNumber: 18,
                    columnNumber: 42
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/common/Icon.tsx",
                lineNumber: 18,
                columnNumber: 25
            }, this);
        case "search":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ...common,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                        cx: "10.8",
                        cy: "10.8",
                        r: "6.8"
                    }, void 0, false, {
                        fileName: "[project]/src/components/common/Icon.tsx",
                        lineNumber: 19,
                        columnNumber: 44
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "m16 16 5 5"
                    }, void 0, false, {
                        fileName: "[project]/src/components/common/Icon.tsx",
                        lineNumber: 19,
                        columnNumber: 82
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/common/Icon.tsx",
                lineNumber: 19,
                columnNumber: 27
            }, this);
        case "bag":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ...common,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M5 8.5h14l-1 12H6l-1-12Z"
                    }, void 0, false, {
                        fileName: "[project]/src/components/common/Icon.tsx",
                        lineNumber: 20,
                        columnNumber: 41
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M9 9V6a3 3 0 0 1 6 0v3"
                    }, void 0, false, {
                        fileName: "[project]/src/components/common/Icon.tsx",
                        lineNumber: 20,
                        columnNumber: 78
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/common/Icon.tsx",
                lineNumber: 20,
                columnNumber: 24
            }, this);
        case "close":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ...common,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m5 5 14 14M19 5 5 19"
                }, void 0, false, {
                    fileName: "[project]/src/components/common/Icon.tsx",
                    lineNumber: 21,
                    columnNumber: 43
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/common/Icon.tsx",
                lineNumber: 21,
                columnNumber: 26
            }, this);
        case "arrow":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ...common,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M4 12h15M13 6l6 6-6 6"
                }, void 0, false, {
                    fileName: "[project]/src/components/common/Icon.tsx",
                    lineNumber: 22,
                    columnNumber: 43
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/common/Icon.tsx",
                lineNumber: 22,
                columnNumber: 26
            }, this);
        case "plus":
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                ...common,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M12 5v14M5 12h14"
                }, void 0, false, {
                    fileName: "[project]/src/components/common/Icon.tsx",
                    lineNumber: 23,
                    columnNumber: 42
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/common/Icon.tsx",
                lineNumber: 23,
                columnNumber: 25
            }, this);
    }
}
_c = Icon;
var _c;
__turbopack_context__.k.register(_c, "Icon");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
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
"[project]/src/components/layout/Footer.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Footer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
;
function Footer() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
        className: "mt-[100px] bg-[#f4f3f1] px-7 pb-7 pt-[72px] text-[#191919] max-sm:mt-[70px] max-sm:px-4 max-sm:pb-5 max-sm:pt-[50px]",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[22px] font-semibold tracking-[-0.05em]",
                children: "KIM SUN WOO"
            }, void 0, false, {
                fileName: "[project]/src/components/layout/Footer.tsx",
                lineNumber: 4,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-[70px] grid grid-cols-[2fr_1fr_1fr] gap-[30px] max-sm:mt-[50px] max-sm:grid-cols-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-sm:col-span-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-[15px] text-[9px] tracking-[0.14em] text-[#777]",
                                children: "PROFILE"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 7,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1.5 text-[10px]",
                                children: "BACKEND / FULL-STACK DEVELOPER"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 8,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mb-1.5 text-[10px]",
                                children: "JAVA · MYSQL · REACT"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 9,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/Footer.tsx",
                        lineNumber: 6,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-[15px] text-[9px] tracking-[0.14em] text-[#777]",
                                children: "NAVIGATION"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 12,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/#experience",
                                className: "mb-1.5 block text-[10px] no-underline",
                                children: "EXPERIENCE"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 13,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/#skills",
                                className: "mb-1.5 block text-[10px] no-underline",
                                children: "SKILLS"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 14,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/#projects",
                                className: "mb-1.5 block text-[10px] no-underline",
                                children: "PROJECTS"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 15,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/Footer.tsx",
                        lineNumber: 11,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "mb-[15px] text-[9px] tracking-[0.14em] text-[#777]",
                                children: "LINK"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 18,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "https://github.com/KimSunWooo",
                                target: "_blank",
                                rel: "noreferrer",
                                className: "mb-1.5 block text-[10px] no-underline",
                                children: "GITHUB ↗"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 19,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/#contact",
                                className: "mb-1.5 block text-[10px] no-underline",
                                children: "CONTACT"
                            }, void 0, false, {
                                fileName: "[project]/src/components/layout/Footer.tsx",
                                lineNumber: 20,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/layout/Footer.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/layout/Footer.tsx",
                lineNumber: 5,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "mt-20 border-t border-[#d4d1ce] pt-4 text-[8px] text-[#888]",
                children: "© 2026 KIM SUN WOO. PORTFOLIO."
            }, void 0, false, {
                fileName: "[project]/src/components/layout/Footer.tsx",
                lineNumber: 23,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/layout/Footer.tsx",
        lineNumber: 3,
        columnNumber: 5
    }, this);
}
_c = Footer;
var _c;
__turbopack_context__.k.register(_c, "Footer");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/product/ProductCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)"); // 💡 a 태그 대신 Link 사용
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Icon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/common/Icon.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useCartStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useCartStore.ts [app-client] (ecmascript)"); // 💡 Zustand 스토어 임포트
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
function ProductCard({ product }) {
    _s();
    const imageUrl = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveAssetUrl"])(product.thumbnail) || "/images/no-image.png";
    // Zustand에서 장바구니 새로고침 함수 꺼내기
    const { refreshCartCount } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useCartStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"])();
    let badge = "";
    if (product.isNew) badge = "NEW";
    else if (product.isBest) badge = "BEST";
    const handleAddToCart = async (e)=>{
        e.preventDefault();
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["addCartItem"])(product, 1);
            // 💡 커스텀 이벤트 대신 Zustand 전역 상태 즉시 갱신!
            await refreshCartCount();
            alert("장바구니에 담겼습니다!");
        } catch (error) {
            alert(error.message || "장바구니 담기에 실패했습니다.");
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
        className: "min-w-0",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                href: `/product/${product.id}`,
                prefetch: false,
                className: "group relative block aspect-[1/1.22] overflow-hidden bg-[#f1efec] no-underline",
                children: [
                    badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "absolute left-[13px] top-[13px] z-[2] bg-white px-2 py-1.5 text-[8px] tracking-[0.06em]",
                        children: badge
                    }, void 0, false, {
                        fileName: "[project]/src/components/product/ProductCard.tsx",
                        lineNumber: 42,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: imageUrl,
                        alt: product.name,
                        className: "block h-full w-full object-cover transition-transform duration-[550ms] ease-out group-hover:scale-[1.025]"
                    }, void 0, false, {
                        fileName: "[project]/src/components/product/ProductCard.tsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "absolute bottom-[11px] right-[11px] z-[2] grid h-[35px] w-[35px] place-items-center rounded-full bg-white/95 transition hover:bg-black hover:text-white",
                        "aria-label": `${product.name} 장바구니 담기`,
                        onClick: handleAddToCart,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$common$2f$Icon$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            name: "bag",
                            size: 17
                        }, void 0, false, {
                            fileName: "[project]/src/components/product/ProductCard.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/product/ProductCard.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/product/ProductCard.tsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "pt-[13px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                        href: `/product/${product.id}`,
                        prefetch: false,
                        className: "block text-[12px] leading-[1.45] text-[#111] no-underline",
                        children: product.name
                    }, void 0, false, {
                        fileName: "[project]/src/components/product/ProductCard.tsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-1.5 flex items-baseline gap-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                className: "text-[12px] font-medium",
                                children: [
                                    product.price.toLocaleString(),
                                    "원"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/product/ProductCard.tsx",
                                lineNumber: 65,
                                columnNumber: 11
                            }, this),
                            product.originalPrice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("del", {
                                className: "text-[11px] text-[#aaa]",
                                children: [
                                    product.originalPrice.toLocaleString(),
                                    "원"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/product/ProductCard.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/product/ProductCard.tsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/product/ProductCard.tsx",
                lineNumber: 59,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/product/ProductCard.tsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_s(ProductCard, "S9lBfSJBnea5uWs7pK/uEsRNqLM=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useCartStore$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCartStore"]
    ];
});
_c = ProductCard;
var _c;
__turbopack_context__.k.register(_c, "ProductCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/product/ProductGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProductGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$product$2f$ProductCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/product/ProductCard.tsx [app-client] (ecmascript)");
;
;
function ProductGrid({ products, columns = 4 }) {
    const columnClass = {
        2: "grid-cols-2",
        3: "grid-cols-3 max-[900px]:grid-cols-2",
        4: "grid-cols-4 max-[900px]:grid-cols-2"
    }[columns];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `grid ${columnClass} gap-x-3 gap-y-[42px] max-sm:gap-x-2 max-sm:gap-y-7`,
        children: products.map((product)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$product$2f$ProductCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                product: product
            }, product.id, false, {
                fileName: "[project]/src/components/product/ProductGrid.tsx",
                lineNumber: 20,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/src/components/product/ProductGrid.tsx",
        lineNumber: 18,
        columnNumber: 5
    }, this);
}
_c = ProductGrid;
var _c;
__turbopack_context__.k.register(_c, "ProductGrid");
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
async function fetchProducts(params) {
    const query = new URLSearchParams();
    // 파라미터가 존재할 경우에만 쿼리 스트링에 추가 (자동으로 URL 인코딩 처리됨)
    if (params?.category && params.category !== "ALL") {
        query.append("category", params.category);
    }
    if (params?.search) {
        query.append("search", params.search);
    }
    const queryString = query.toString();
    const url = queryString ? `${API_BASE_URL}/api/products?${queryString}` : `${API_BASE_URL}/api/products`;
    const response = await fetch(url);
    if (!response.ok) {
        await handleResponseError(response);
    }
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

//# sourceMappingURL=src_06283se._.js.map