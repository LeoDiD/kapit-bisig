(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_lib_ThemeContext_tsx_904986._.js", {

"[project]/src/lib/ThemeContext.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "ThemeProvider": ()=>ThemeProvider,
    "useTheme": ()=>useTheme
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
var _s = __turbopack_refresh__.signature(), _s1 = __turbopack_refresh__.signature();
'use client';
;
;
const ThemeContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"](null);
function useTheme() {
    _s();
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"](ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}
_s(useTheme, "/dMy7t63NXD4eYACoT93CePwGrg=");
function getSystemTheme() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
function isThemeLockedToLight(pathname) {
    return pathname === '/login';
}
function applyThemeToDOM(t, pathname) {
    const resolved = isThemeLockedToLight(pathname) ? 'light' : t === 'system' ? getSystemTheme() : t;
    const root = document.documentElement;
    if (resolved === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    root.setAttribute('data-theme', resolved);
    return resolved;
}
function applyTextSizeToDOM(size) {
    document.documentElement.setAttribute('data-text-size', size);
}
function ThemeProvider({ children }) {
    _s1();
    const pathname = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]();
    const [theme, setThemeState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('light');
    const [textSize, setTextSizeState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('medium');
    const [resolvedTheme, setResolvedTheme] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('light');
    const [mounted, setMounted] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    // Load from localStorage on mount
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const storedTheme = localStorage.getItem('kb-theme');
        const storedSize = localStorage.getItem('kb-text-size');
        const t = storedTheme && [
            'light',
            'dark',
            'system'
        ].includes(storedTheme) ? storedTheme : 'light';
        const s = storedSize && [
            'small',
            'medium',
            'large'
        ].includes(storedSize) ? storedSize : 'medium';
        setThemeState(t);
        setTextSizeState(s);
        const resolved = applyThemeToDOM(t, pathname);
        setResolvedTheme(resolved);
        applyTextSizeToDOM(s);
        setMounted(true);
    }, [
        pathname
    ]);
    // Listen for system theme changes when theme is 'system'
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!mounted || theme !== 'system') return;
        const mql = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = ()=>{
            const resolved = applyThemeToDOM('system', pathname);
            setResolvedTheme(resolved);
        };
        mql.addEventListener('change', handler);
        return ()=>mql.removeEventListener('change', handler);
    }, [
        theme,
        mounted,
        pathname
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!mounted) return;
        const resolved = applyThemeToDOM(theme, pathname);
        setResolvedTheme(resolved);
    }, [
        mounted,
        pathname,
        theme
    ]);
    const setTheme = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]((t)=>{
        setThemeState(t);
        localStorage.setItem('kb-theme', t);
        const resolved = applyThemeToDOM(t, pathname);
        setResolvedTheme(resolved);
    }, [
        pathname
    ]);
    const setTextSize = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]((s)=>{
        setTextSizeState(s);
        localStorage.setItem('kb-text-size', s);
        applyTextSizeToDOM(s);
    }, []);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ThemeContext.Provider, {
        value: {
            theme,
            textSize,
            resolvedTheme,
            setTheme,
            setTextSize
        },
        children: children
    }, void 0, false, {
        fileName: "<[project]/src/lib/ThemeContext.tsx>",
        lineNumber: 107,
        columnNumber: 5
    }, this);
}
_s1(ThemeProvider, "CYYr8nGJzzNkKEtauX6KbtaYFAw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = ThemeProvider;
var _c;
__turbopack_refresh__.register(_c, "ThemeProvider");

})()),
}]);

//# sourceMappingURL=src_lib_ThemeContext_tsx_904986._.js.map