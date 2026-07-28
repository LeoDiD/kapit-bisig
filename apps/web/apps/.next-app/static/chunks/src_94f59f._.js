(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push(["static/chunks/src_94f59f._.js", {

"[project]/src/components/ui/FilterDropdown.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>FilterDropdown
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
var _s = __turbopack_refresh__.signature();
'use client';
;
function FilterDropdown({ value, options, onChange, className = '', buttonClassName = '', menuClassName = '' }) {
    _s();
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    const buttonRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"](null);
    const menuRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        function handleOutside(event) {
            const target = event.target;
            if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutside);
        return ()=>document.removeEventListener('mousedown', handleOutside);
    }, []);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: `relative ${className}`,
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                ref: buttonRef,
                type: "button",
                onClick: ()=>setOpen((prev)=>!prev),
                className: [
                    'w-full flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-gray-700 shadow-sm transition-colors hover:border-[#004A1C]/30 hover:bg-slate-50 hover:text-[#004A1C] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-[#ECC323]/50 dark:hover:bg-slate-800/50 dark:hover:text-[#ECC323]',
                    buttonClassName
                ].join(' '),
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-sm truncate",
                        children: value
                    }, void 0, false, {
                        fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ChevronDownIcon, {}, void 0, false, {
                        fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                        lineNumber: 54,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                ref: menuRef,
                className: [
                    'absolute left-0 top-full mt-2 w-full rounded-2xl border border-[#DCDCDC] bg-[#ECECEC] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.14)] z-50 max-h-64 overflow-y-auto dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]',
                    menuClassName
                ].join(' '),
                children: options.map((opt)=>{
                    const selected = opt.value === value;
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(opt.value);
                            setOpen(false);
                        },
                        className: [
                            'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-left transition-colors',
                            selected ? 'bg-[#EAB308] text-gray-900' : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-slate-700'
                        ].join(' '),
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-5 flex items-center justify-center",
                                children: selected ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](CheckIcon, {}, void 0, false, {
                                    fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                                    lineNumber: 81,
                                    columnNumber: 31
                                }, this) : null
                            }, void 0, false, {
                                fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                                lineNumber: 80,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "truncate",
                                children: opt.label
                            }, void 0, false, {
                                fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                                lineNumber: 83,
                                columnNumber: 17
                            }, this)
                        ]
                    }, opt.value, true, {
                        fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                        lineNumber: 68,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
                lineNumber: 58,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_s(FilterDropdown, "vGcs9PMoVxdKAE7w4LbVWU6rS8s=");
_c = FilterDropdown;
function ChevronDownIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4 text-gray-500",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
            lineNumber: 96,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
        lineNumber: 95,
        columnNumber: 5
    }, this);
}
_c1 = ChevronDownIcon;
function CheckIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 3,
            d: "M5 13l4 4L19 7"
        }, void 0, false, {
            fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
            lineNumber: 104,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/FilterDropdown.tsx>",
        lineNumber: 103,
        columnNumber: 5
    }, this);
}
_c2 = CheckIcon;
var _c, _c1, _c2;
__turbopack_refresh__.register(_c, "FilterDropdown");
__turbopack_refresh__.register(_c1, "ChevronDownIcon");
__turbopack_refresh__.register(_c2, "CheckIcon");

})()),
"[project]/src/components/ui/SummaryMetricCard.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>SummaryMetricCard
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
function SummaryMetricCard({ label, value, helper, icon, className = '' }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("article", {
        className: `rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${className}`.trim(),
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "flex items-start justify-between gap-3",
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "min-w-0",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                            className: "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400",
                            children: label
                        }, void 0, false, {
                            fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
                            lineNumber: 22,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                            className: "mt-2 text-3xl font-bold leading-tight tracking-[-0.04em] text-slate-950 dark:text-slate-100",
                            children: value || value === 0 ? value : '--'
                        }, void 0, false, {
                            fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
                            lineNumber: 23,
                            columnNumber: 11
                        }, this),
                        helper ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                            className: "mt-1 text-sm text-slate-500 dark:text-slate-400",
                            children: helper
                        }, void 0, false, {
                            fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
                            lineNumber: 26,
                            columnNumber: 21
                        }, this) : null
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
                    lineNumber: 21,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
                    children: icon
                }, void 0, false, {
                    fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
                    lineNumber: 28,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/ui/SummaryMetricCard.tsx>",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
_c = SummaryMetricCard;
var _c;
__turbopack_refresh__.register(_c, "SummaryMetricCard");

})()),
"[project]/src/components/ui/ConfirmModal.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>ConfirmModal
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
function ConfirmModal({ isOpen, title, body, confirmLabel = 'Yes, Confirm', cancelLabel = 'Cancel', loading = false, onConfirm, onCancel }) {
    if (!isOpen) return null;
    const modal = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "fixed inset-0 z-[200] flex items-center justify-center p-4",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "absolute inset-0 bg-black/40 backdrop-blur-sm",
                onClick: loading ? undefined : onCancel
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                        className: "text-lg font-bold text-gray-900 dark:text-gray-100",
                        children: title
                    }, void 0, false, {
                        fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                        lineNumber: 43,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "mt-2 text-sm text-gray-600 dark:text-gray-400",
                        children: body
                    }, void 0, false, {
                        fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                        lineNumber: 44,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex justify-end gap-3 mt-6",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: onCancel,
                                disabled: loading,
                                className: "px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50",
                                children: cancelLabel
                            }, void 0, false, {
                                fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                                lineNumber: 47,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: onConfirm,
                                disabled: loading,
                                className: "inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#0F533A] rounded-xl hover:bg-[#0a3f2c] transition-colors disabled:opacity-50",
                                children: [
                                    loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](Spinner, {}, void 0, false, {
                                        fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                                        lineNumber: 61,
                                        columnNumber: 25
                                    }, this),
                                    confirmLabel
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                                lineNumber: 55,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                lineNumber: 42,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
        lineNumber: 34,
        columnNumber: 5
    }, this);
    if (typeof document === 'undefined') return null;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"](modal, document.body);
}
_c = ConfirmModal;
function Spinner() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4 animate-spin",
        viewBox: "0 0 24 24",
        fill: "none",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                className: "opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                lineNumber: 76,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                className: "opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            }, void 0, false, {
                fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
                lineNumber: 77,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/ui/ConfirmModal.tsx>",
        lineNumber: 75,
        columnNumber: 5
    }, this);
}
_c1 = Spinner;
var _c, _c1;
__turbopack_refresh__.register(_c, "ConfirmModal");
__turbopack_refresh__.register(_c1, "Spinner");

})()),
"[project]/src/lib/toast.ts [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

/**
 * Centralized toast helper — wraps sonner's toast API
 * so every call site uses the same style & duration.
 *
 * Usage:
 *   import { showToast } from '@/lib/toast'
 *   showToast.success('Distribution created.')
 *   showToast.error('Login failed. Check credentials.')
 */ __turbopack_esm__({
    "default": ()=>__TURBOPACK__default__export__,
    "showToast": ()=>showToast
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/sonner/dist/index.mjs [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
const showToast = {
    /** Green check-mark toast */ success (message) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].success(message, {
            duration: 3000
        });
    },
    /** Red X toast */ error (message) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].error(message, {
            duration: 4500
        });
    },
    /** Neutral / info toast */ info (message) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"](message, {
            duration: 3000
        });
    },
    /** Shows a loading toast that can be resolved later */ loading (message) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].loading(message);
    },
    /** Dismiss a specific toast by id */ dismiss (id) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$sonner$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["toast"].dismiss(id);
    }
};
const __TURBOPACK__default__export__ = showToast;

})()),
"[project]/src/lib/AuthContext.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
var _s = __turbopack_refresh__.signature(), _s1 = __turbopack_refresh__.signature();
'use client';
;
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL?.trim() || '/api';
const AuthContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"](undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](true);
    const getCsrfToken = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        return document.cookie.split('; ').find((c)=>c.startsWith('XSRF-TOKEN='))?.split('=')[1];
    }, []);
    const initAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        try {
            const res = await fetch(`${API_URL}/auth/me`, {
                credentials: 'include'
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setUser({
                        username: json.data.username,
                        email: json.data.email || json.data.username,
                        role: json.data.role,
                        id: json.data.id,
                        firstName: json.data.firstName,
                        lastName: json.data.lastName,
                        fullName: json.data.fullName,
                        assignedBarangays: json.data.assignedBarangays,
                        forcePasswordReset: !!json.data.forcePasswordReset
                    });
                    return;
                }
            }
            setUser(null);
        } catch  {
            setUser(null);
        } finally{
            setLoading(false);
        }
    }, []);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        initAuth();
    }, [
        initAuth
    ]);
    const login = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (email, password, rememberMe, otp)=>{
        const payload = {
            email: email.trim().toLowerCase(),
            rememberMe: !!rememberMe
        };
        if (typeof password === 'string' && password.length > 0) {
            payload.password = password;
        }
        if (typeof otp === 'string' && otp.length > 0) {
            payload.otp = otp;
        }
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            const firstValidationError = Array.isArray(json.errors) && json.errors.length > 0 ? json.errors[0]?.message : undefined;
            throw new Error(firstValidationError || json.message || 'Login failed');
        }
        if (json.otpRequired) {
            return {
                otpRequired: true,
                otpToken: json.otpToken,
                message: json.message || 'OTP sent to your registered email.'
            };
        }
        const u = json.data.user;
        setUser({
            username: u.username,
            email: u.email || u.username,
            role: u.role,
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            assignedBarangays: u.assignedBarangays,
            forcePasswordReset: !!u.forcePasswordReset
        });
        return {
            otpRequired: false
        };
    }, []);
    const verifyLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken, otp)=>{
        const res = await fetch(`${API_URL}/auth/login/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                otpToken,
                otp
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Verification failed');
        }
        const u = json.data.user;
        setUser({
            username: u.username,
            email: u.email || u.username,
            role: u.role,
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName,
            fullName: u.fullName,
            assignedBarangays: u.assignedBarangays,
            forcePasswordReset: !!u.forcePasswordReset
        });
    }, []);
    const resendLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken)=>{
        const res = await fetch(`${API_URL}/auth/login/resend-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                otpToken
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Failed to resend OTP');
        }
    }, []);
    const setInitialPassword = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async (newPassword)=>{
        const csrfToken = getCsrfToken();
        const res = await fetch(`${API_URL}/auth/set-password`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...csrfToken ? {
                    'X-CSRF-Token': csrfToken
                } : {}
            },
            body: JSON.stringify({
                newPassword
            })
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
            throw new Error(json.message || 'Failed to set password');
        }
        setUser((prev)=>prev ? {
                ...prev,
                forcePasswordReset: false
            } : prev);
    }, [
        getCsrfToken
    ]);
    const logout = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        try {
            const csrfToken = getCsrfToken();
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
                headers: csrfToken ? {
                    'X-CSRF-Token': csrfToken
                } : {}
            });
        } finally{
            setUser(null);
        }
    }, [
        getCsrfToken
    ]);
    const isSuperadmin = user?.role === 'SUPERADMIN';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](AuthContext.Provider, {
        value: {
            user,
            loading,
            login,
            verifyLoginOtp,
            resendLoginOtp,
            setInitialPassword,
            logout,
            isSuperadmin
        },
        children: children
    }, void 0, false, {
        fileName: "<[project]/src/lib/AuthContext.tsx>",
        lineNumber: 220,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "H0B2psBG14wKALxNzaJcBaItHeg=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"](AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}
_s1(useAuth, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_refresh__.register(_c, "AuthProvider");

})()),
"[project]/src/lib/api.ts [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

/**
 * API Service for Kapit-Bisig Web Application
 * 
 * Centralized API client with authentication support and type safety.
 */ __turbopack_esm__({
    "BARANGAY_OPTIONS": ()=>BARANGAY_OPTIONS,
    "api": ()=>api,
    "default": ()=>__TURBOPACK__default__export__,
    "forgotPasswordApi": ()=>forgotPasswordApi,
    "getScopedBarangays": ()=>getScopedBarangays,
    "notificationsApi": ()=>notificationsApi,
    "profileApi": ()=>profileApi
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
const API_URL = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL?.trim() || '/api';
const BARANGAY_OPTIONS = [
    'Bolo',
    'Bongalon',
    'Dulig',
    'Laois',
    'Magsaysay',
    'Poblacion',
    'San Gonzalo',
    'San Jose',
    'Tobuan',
    'Uyong'
];
function getScopedBarangays(role, assignedBarangays) {
    if (role === 'SUPERADMIN' || !assignedBarangays || assignedBarangays.length === 0) {
        return [
            ...BARANGAY_OPTIONS
        ];
    }
    // Preserve canonical order from BARANGAY_OPTIONS
    return BARANGAY_OPTIONS.filter((b)=>assignedBarangays.includes(b));
}
// ========================== HELPERS ==========================
/**
 * Read a cookie value by name (browser-side).
 */ function getCookie(name) {
    if (typeof document === 'undefined') return undefined;
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : undefined;
}
/**
 * Create headers (cookie-based auth – no bearer token needed).
 * Automatically attaches X-CSRF-Token for state-changing requests.
 */ const createHeaders = (method = 'GET')=>{
    const headers = {
        'Content-Type': 'application/json'
    };
    // Attach CSRF token for state-changing methods
    const upper = method.toUpperCase();
    if (upper !== 'GET' && upper !== 'HEAD' && upper !== 'OPTIONS') {
        const csrfToken = getCookie('XSRF-TOKEN');
        if (csrfToken) {
            headers['X-CSRF-Token'] = csrfToken;
        }
    }
    return headers;
};
/**
 * Handle API response.
 *
 * Security: raw server text, HTTP status codes, and non-JSON responses are
 * logged to the console for developer debugging only.  Error.message uses
 * only the server's intentional JSON message or a generic fallback so that
 * downstream UI code can safely display it without leaking system details.
 */ async function handleResponse(response) {
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const rawText = await response.text();
    let data = null;
    if (isJson && rawText) {
        try {
            data = JSON.parse(rawText);
        } catch  {
            data = null;
        }
    }
    if (!response.ok) {
        // Log raw details for developer debugging — never expose to UI
        console.error(`[API] ${response.status} ${response.url}`, isJson ? data : rawText?.slice(0, 300));
        // User-safe message: prefer server's intentional JSON message, else generic
        const userMessage = data?.message || 'Something went wrong. Please try again.';
        const error = new Error(userMessage);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error.response = data ?? {
            message: userMessage
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error.status = response.status;
        throw error;
    }
    return data ?? {};
}
const api = {
    // ==================== STAFF USER MANAGEMENT (SUPERADMIN) ====================
    /**
   * List staff users with optional filters
   */ async getStaffUsers (params) {
        const sp = new URLSearchParams();
        if (params?.search) sp.append('search', params.search);
        if (params?.status) sp.append('status', params.status);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        const qs = sp.toString();
        const url = `${API_URL}/admin/users${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get staff user stats
   */ async getStaffStats () {
        const response = await fetch(`${API_URL}/admin/users/stats`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Create a new staff user
   */ async createStaffUser (data) {
        const response = await fetch(`${API_URL}/admin/users`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Update a staff user
   */ async updateStaffUser (id, data) {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Reset a staff user's password
   */ async resetStaffPassword (id, newPassword) {
        const response = await fetch(`${API_URL}/admin/users/${id}/reset-password`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify({
                newPassword
            })
        });
        return handleResponse(response);
    },
    // ==================== HEALTH ====================
    /**
   * Health check
   */ async healthCheck () {
        const response = await fetch(`${API_URL}/health`);
        if (!response.ok) throw new Error('Server is not responding');
        return response.json();
    },
    // ==================== DISTRIBUTIONS ====================
    /**
   * Get all distributions
   */ async getDistributions () {
        const response = await fetch(`${API_URL}/distributions`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Create a new distribution
   */ async createDistribution (data, options) {
        const headers = createHeaders('POST');
        if (options?.idempotencyKey) {
            headers['Idempotency-Key'] = options.idempotencyKey;
        }
        const response = await fetch(`${API_URL}/distributions`, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Search eligible scanner staff for a distribution scope.
   */ async getScanEligibleUsers (params) {
        const sp = new URLSearchParams();
        sp.append('hostBarangayId', params.hostBarangayId);
        for (const barangay of params.assignedBarangayIds){
            sp.append('assignedBarangayIds', barangay);
        }
        if (params.q) sp.append('q', params.q);
        if (typeof params.cursor === 'number') sp.append('cursor', String(params.cursor));
        if (typeof params.limit === 'number') sp.append('limit', String(params.limit));
        const response = await fetch(`${API_URL}/users/scan-eligible?${sp.toString()}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Mark a distribution as claimed
   */ async claimDistribution (id) {
        const response = await fetch(`${API_URL}/distributions/${id}/claim`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get households for a distribution (claimed / not-yet-claimed)
   */ async getDistributionHouseholds (distributionId) {
        const response = await fetch(`${API_URL}/distributions/${distributionId}/households`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    // ==================== HOUSEHOLDS ====================
    /**
   * Get registered households list.
   * Supports search, barangay, status, and pagination filters.
   */ async getHouseholds (params) {
        const sp = new URLSearchParams();
        if (params?.search) sp.append('search', params.search);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        if (params?.status && params.status !== 'All Status') sp.append('status', params.status);
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        const qs = sp.toString();
        const url = `${API_URL}/households${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Delete a staff user
   */ async deleteStaffUser (id) {
        const response = await fetch(`${API_URL}/admin/users/${id}`, {
            method: 'DELETE',
            headers: createHeaders('DELETE'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    // ==================== RESIDENT REGISTRATIONS ====================
    /**
   * Get resident registrations with optional filters.
   */ async getResidents (params) {
        const sp = new URLSearchParams();
        if (params?.search) sp.append('search', params.search);
        if (params?.barangay && params.barangay !== 'All Barangays') {
            sp.append('barangay', params.barangay);
        }
        if (params?.status && params.status !== 'All') {
            sp.append('status', params.status);
        }
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        const qs = sp.toString();
        const url = `${API_URL}/residents${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get one resident registration detail for admin review.
   */ async getResident (id) {
        const response = await fetch(`${API_URL}/residents/${id}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Approve or reject a resident registration.
   */ async updateResidentStatus (id, payload) {
        const response = await fetch(`${API_URL}/residents/${id}/status`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    /**
   * Get disaster events used for target beneficiary review.
   */ async getBeneficiaryEvents (params) {
        const sp = new URLSearchParams();
        if (params?.status) sp.append('status', params.status);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        const qs = sp.toString();
        const response = await fetch(`${API_URL}/beneficiaries/events${qs ? `?${qs}` : ''}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Get current active disaster event for target beneficiary flow.
   */ async getActiveBeneficiaryEvent () {
        const response = await fetch(`${API_URL}/beneficiaries/events/active`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Create a new disaster event.
   */ async createBeneficiaryEvent (data) {
        const response = await fetch(`${API_URL}/beneficiaries/events`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Get proof submissions for target beneficiary verification.
   */ async getBeneficiaryProofSubmissions (params) {
        const sp = new URLSearchParams();
        if (params?.disasterEventId) sp.append('disasterEventId', params.disasterEventId);
        if (params?.residentId) sp.append('residentId', params.residentId);
        if (params?.status) sp.append('status', params.status);
        if (params?.barangay && params.barangay !== 'All Barangays') sp.append('barangay', params.barangay);
        if (params?.search) sp.append('search', params.search);
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        const qs = sp.toString();
        const response = await fetch(`${API_URL}/beneficiaries/admin/proof-submissions${qs ? `?${qs}` : ''}`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /**
   * Approve or reject a proof submission.
   */ async reviewBeneficiaryProofSubmission (id, payload) {
        const response = await fetch(`${API_URL}/beneficiaries/admin/proof-submissions/${id}/review`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        return handleResponse(response);
    },
    /**
   * Record a relief-pack claim (sends token + distribution info).
   */ async recordClaim (data) {
        const response = await fetch(`${API_URL}/claims/record-claim`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /**
   * Record multiple relief-pack claims in one request.
   */ async recordClaimBatch (data) {
        const response = await fetch(`${API_URL}/claims/record-claim-batch`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    // ==================== REPORTS ====================
    /**
   * Get report summary with aggregated distribution data.
   */ async getReportSummary (params) {
        const sp = new URLSearchParams();
        if (params?.startDate) sp.append('startDate', params.startDate);
        if (params?.endDate) sp.append('endDate', params.endDate);
        if (params?.barangay && params.barangay !== 'All') sp.append('barangay', params.barangay);
        if (params?.reportType) sp.append('reportType', params.reportType);
        const qs = sp.toString();
        const url = `${API_URL}/reports/summary${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    // ==================== AUDIT LOGS ====================
    /**
   * Get audit logs
   */ async getAuditLogs (params) {
        const sp = new URLSearchParams();
        if (typeof params?.page === 'number') sp.append('page', String(params.page));
        if (typeof params?.limit === 'number') sp.append('limit', String(params.limit));
        if (params?.action) sp.append('action', params.action);
        if (params?.entityType) sp.append('entityType', params.entityType);
        if (params?.actorRole) sp.append('actorRole', params.actorRole);
        const qs = sp.toString();
        const url = `${API_URL}/audit-logs${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    }
};
const __TURBOPACK__default__export__ = api;
const profileApi = {
    /** GET /api/users/me – current user profile */ async getProfile () {
        const response = await fetch(`${API_URL}/users/me`, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** PATCH /api/users/me – update profile fields */ async updateProfile (data) {
        const response = await fetch(`${API_URL}/users/me`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /** POST /api/users/me/avatar – upload avatar image */ async uploadAvatar (file) {
        const formData = new FormData();
        formData.append('avatar', file);
        // Don't set Content-Type header — browser sets it with boundary for FormData
        const csrfToken = getCookie('XSRF-TOKEN');
        const response = await fetch(`${API_URL}/users/me/avatar`, {
            method: 'POST',
            headers: {
                ...csrfToken ? {
                    'X-CSRF-Token': csrfToken
                } : {}
            },
            credentials: 'include',
            body: formData
        });
        return handleResponse(response);
    },
    /** POST /api/users/me/change-password/request-otp — Step 1: validate password, send OTP */ async requestPasswordChangeOtp (data) {
        const response = await fetch(`${API_URL}/users/me/change-password/request-otp`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /** POST /api/users/me/change-password/confirm — Step 2: verify OTP, change password */ async confirmPasswordChange (data) {
        const response = await fetch(`${API_URL}/users/me/change-password/confirm`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    },
    /** PATCH /api/users/me/preferences */ async updatePreferences (data) {
        const response = await fetch(`${API_URL}/users/me/preferences`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return handleResponse(response);
    }
};
const notificationsApi = {
    /** GET /api/notifications */ async getNotifications (params) {
        const sp = new URLSearchParams();
        if (params?.limit) sp.append('limit', String(params.limit));
        if (params?.offset) sp.append('offset', String(params.offset));
        if (params?.unreadOnly) sp.append('unreadOnly', 'true');
        const qs = sp.toString();
        const url = `${API_URL}/notifications${qs ? `?${qs}` : ''}`;
        const response = await fetch(url, {
            headers: createHeaders(),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** PATCH /api/notifications/mark-all-read */ async markAllRead () {
        const response = await fetch(`${API_URL}/notifications/mark-all-read`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** PATCH /api/notifications/:id/read */ async markRead (id) {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** DELETE /api/notifications/:id */ async deleteNotification (id) {
        const response = await fetch(`${API_URL}/notifications/${id}`, {
            method: 'DELETE',
            headers: createHeaders('DELETE'),
            credentials: 'include'
        });
        return handleResponse(response);
    },
    /** DELETE /api/notifications */ async deleteAllNotifications () {
        const response = await fetch(`${API_URL}/notifications`, {
            method: 'DELETE',
            headers: createHeaders('DELETE'),
            credentials: 'include'
        });
        return handleResponse(response);
    }
};
const forgotPasswordApi = {
    /**
   * Step 1: Request OTP for password reset
   */ async sendOtp (email) {
        const response = await fetch(`${API_URL}/auth/forgot-password/send-otp`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify({
                email
            })
        });
        return handleResponse(response);
    },
    /**
   * Step 2: Verify OTP and get a reset token
   */ async verifyOtp (email, otp) {
        const response = await fetch(`${API_URL}/auth/forgot-password/verify-otp`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify({
                email,
                otp
            })
        });
        return handleResponse(response);
    },
    /**
   * Step 3: Reset password using the reset token
   */ async resetPassword (resetToken, newPassword) {
        const response = await fetch(`${API_URL}/auth/forgot-password/reset`, {
            method: 'POST',
            headers: createHeaders('POST'),
            credentials: 'include',
            body: JSON.stringify({
                resetToken,
                newPassword
            })
        });
        return handleResponse(response);
    }
};

})()),
"[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx [app-client] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, k: __turbopack_refresh__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>TargetBeneficiariesPageClient
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/compiled/react-dom/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/ConfirmModal.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SummaryMetricCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/SummaryMetricCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$FilterDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/ui/FilterDropdown.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
var _s = __turbopack_refresh__.signature();
'use client';
;
;
;
;
;
;
;
;
const ALL_STATUSES = '__ALL_STATUSES__';
const ALL_BARANGAYS = 'All Barangays';
const PAGE_SIZE = 12;
const PENDING_STATUS = 'Pending Verification';
const INITIAL_PROOF_SUMMARY = {
    total: 0,
    pendingVerification: 0,
    approved: 0,
    rejected: 0
};
const API_BASE = (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_API_URL?.trim() || '/api').replace(/\/api\/?$/, '');
function getProofId(submission) {
    return String(submission.id || submission._id || '');
}
function formatDateTime(value) {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
function statusBadgeClass(status) {
    switch(status){
        case 'Pending Verification':
            return 'bg-amber-100 text-amber-800 border-amber-200';
        case 'Approved':
        case 'Eligible':
        case 'Active':
            return 'bg-emerald-100 text-emerald-800 border-emerald-200';
        case 'Rejected':
        case 'Not Eligible':
        case 'Closed':
            return 'bg-rose-100 text-rose-800 border-rose-200';
        case 'Draft':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200';
    }
}
function getProofStatusLabel(status) {
    return status === 'Rejected' ? 'Needs Revision' : status;
}
function resolveProofAssetUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '#';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) {
        return API_BASE ? `${API_BASE}${raw}` : raw;
    }
    return raw;
}
function getProofUrls(submission) {
    const sources = Array.isArray(submission.photoProofUrls) && submission.photoProofUrls.length > 0 ? submission.photoProofUrls : [
        submission.photoProofUrl
    ];
    return sources.map((value)=>resolveProofAssetUrl(value)).filter((value, index, array)=>value !== '#' && array.indexOf(value) === index).slice(0, 5);
}
function truncateText(value, maxLength) {
    const text = String(value || '').trim();
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trimEnd()}...`;
}
function RevisionRequestModal({ open, loading, residentName, eventName, reason, onReasonChange, onClose, onSubmit }) {
    if (!open || typeof document === 'undefined') return null;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2d$dom$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createPortal"](/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "fixed inset-0 z-[210] flex items-center justify-center p-4",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "absolute inset-0 bg-black/45 backdrop-blur-sm",
                onClick: loading ? undefined : onClose
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 124,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "text-xs font-bold uppercase tracking-[0.18em] text-amber-600",
                        children: "Return Submission"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 126,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                        className: "mt-2 text-xl font-black text-gray-900 dark:text-slate-100",
                        children: "Request more proof or missing requirements"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 127,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                        className: "mt-2 text-sm text-gray-600 dark:text-slate-400",
                        children: [
                            "This note will be sent back to ",
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "font-semibold text-gray-900 dark:text-slate-100",
                                children: residentName
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 129,
                                columnNumber: 42
                            }, this),
                            " for",
                            ' ',
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "font-semibold text-gray-900 dark:text-slate-100",
                                children: eventName
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 130,
                                columnNumber: 11
                            }, this),
                            "."
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("textarea", {
                        value: reason,
                        onChange: (event)=>onReasonChange(event.target.value),
                        rows: 5,
                        placeholder: "Explain what the resident still needs to upload or clarify, such as a barangay indigency certificate or clearer damage photos.",
                        className: "mt-5 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-slate-500"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 133,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mt-5 flex items-center justify-end gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: onClose,
                                disabled: loading,
                                className: "rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800",
                                children: "Cancel"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 142,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: onSubmit,
                                disabled: loading,
                                className: "inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50",
                                children: [
                                    loading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SpinnerIcon, {
                                        className: "h-4 w-4"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 156,
                                        columnNumber: 24
                                    }, this) : null,
                                    "Return for revision"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 150,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 141,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 125,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 123,
        columnNumber: 5
    }, this), document.body);
}
_c = RevisionRequestModal;
function TargetBeneficiariesPageClient() {
    _s();
    const { user, loading } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]();
    const scopedBarangays = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"](()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getScopedBarangays"](user?.role, user?.assignedBarangays), [
        user?.role,
        user?.assignedBarangays
    ]);
    const [proofRows, setProofRows] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]([]);
    const [proofSummary, setProofSummary] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](INITIAL_PROOF_SUMMARY);
    const [proofLoading, setProofLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](true);
    const [page, setPage] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](1);
    const [totalPages, setTotalPages] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](1);
    const [selectedStatus, setSelectedStatus] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](PENDING_STATUS);
    const [selectedBarangay, setSelectedBarangay] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](ALL_BARANGAYS);
    const [searchInput, setSearchInput] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('');
    const [appliedSearch, setAppliedSearch] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('');
    const [error, setError] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    const [reviewTarget, setReviewTarget] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](null);
    const [reviewDecision, setReviewDecision] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('Approved');
    const [reviewReason, setReviewReason] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]('');
    const [reviewLoading, setReviewLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    const [confirmApproveOpen, setConfirmApproveOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"](false);
    const fetchProofQueue = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        if (!user) return;
        try {
            setProofLoading(true);
            setError(null);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].getBeneficiaryProofSubmissions({
                status: selectedStatus !== ALL_STATUSES ? selectedStatus : undefined,
                barangay: selectedBarangay !== ALL_BARANGAYS ? selectedBarangay : undefined,
                search: appliedSearch || undefined,
                page,
                limit: PAGE_SIZE
            });
            const rows = Array.isArray(response.data) ? response.data : [];
            const nextTotalPages = response.pagination?.totalPages || 1;
            const nextSummary = response.summary || {
                total: rows.length,
                pendingVerification: rows.filter((row)=>row.status === 'Pending Verification').length,
                approved: rows.filter((row)=>row.status === 'Approved').length,
                rejected: rows.filter((row)=>row.status === 'Rejected').length
            };
            setProofRows(rows);
            setProofSummary(nextSummary);
            setTotalPages(nextTotalPages);
        } catch (err) {
            console.error('Failed to load proof submissions:', err);
            setError('Failed to load proof submissions. Please try again.');
            setProofRows([]);
            setProofSummary(INITIAL_PROOF_SUMMARY);
        } finally{
            setProofLoading(false);
        }
    }, [
        appliedSearch,
        page,
        selectedBarangay,
        selectedStatus,
        user
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (loading || !user) return;
        void fetchProofQueue();
    }, [
        fetchProofQueue,
        loading,
        user
    ]);
    const handleApplySearch = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        setPage(1);
        setAppliedSearch(searchInput.trim());
    }, [
        searchInput
    ]);
    const handleClearFilters = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        setSelectedStatus(PENDING_STATUS);
        setSelectedBarangay(ALL_BARANGAYS);
        setSearchInput('');
        setAppliedSearch('');
        setPage(1);
    }, []);
    const openApproveModal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]((submission)=>{
        setReviewTarget(submission);
        setReviewDecision('Approved');
        setReviewReason('');
        setConfirmApproveOpen(true);
    }, []);
    const openRejectModal = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"]((submission)=>{
        setReviewTarget(submission);
        setReviewDecision('Rejected');
        setReviewReason(submission.rejectionReason || '');
    }, []);
    const closeReviewModals = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        setConfirmApproveOpen(false);
        setReviewTarget(null);
        setReviewReason('');
        setReviewLoading(false);
    }, []);
    const submitReview = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        if (!reviewTarget) return;
        if (reviewDecision === 'Rejected' && !reviewReason.trim()) {
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["showToast"].error('A revision note is required.');
            return;
        }
        setReviewLoading(true);
        try {
            const reviewedId = getProofId(reviewTarget);
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].reviewBeneficiaryProofSubmission(getProofId(reviewTarget), {
                decision: reviewDecision,
                rejectionReason: reviewDecision === 'Rejected' ? reviewReason.trim() : undefined
            });
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["showToast"].success(response.message || `Submission ${reviewDecision === 'Approved' ? 'approved' : 'returned for revision'}.`);
            closeReviewModals();
            // Keep the review queue focused on items that still need action.
            setProofRows((prev)=>prev.filter((row)=>getProofId(row) !== reviewedId));
            setProofSummary((prev)=>({
                    total: Math.max(0, prev.total - 1),
                    pendingVerification: Math.max(0, prev.pendingVerification - 1),
                    approved: reviewDecision === 'Approved' ? prev.approved + 1 : prev.approved,
                    rejected: reviewDecision === 'Rejected' ? prev.rejected + 1 : prev.rejected
                }));
            if (page > 1 && proofRows.length === 1) {
                setPage((prev)=>Math.max(1, prev - 1));
                return;
            }
            if (selectedStatus !== PENDING_STATUS) {
                setSelectedStatus(PENDING_STATUS);
                setPage(1);
                return;
            }
        } catch (err) {
            console.error('Failed to update proof submission:', err);
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["showToast"].error('Failed to update proof submission. Please try again.');
            setReviewLoading(false);
        }
    }, [
        closeReviewModals,
        page,
        proofRows.length,
        reviewDecision,
        reviewReason,
        reviewTarget,
        selectedStatus
    ]);
    if (loading) return null;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("section", {
                className: "rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_12px_40px_rgba(0,0,0,0.22)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400",
                                children: "Target Beneficiary Control"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 317,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("h2", {
                                className: "mt-2 text-2xl font-black text-gray-900 dark:text-slate-100",
                                children: "Event-scoped eligibility review"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 318,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                className: "mt-2 max-w-3xl text-sm text-gray-600 dark:text-slate-400",
                                children: "Review affected-resident proof submissions, approve complete requests, and return incomplete requests so residents can upload clearer proof or missing barangay documents for each distribution."
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 319,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 316,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SummaryMetricCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Matched Submissions",
                                value: String(proofSummary.total),
                                helper: "Across the current proof queue filter",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ClipboardIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                    lineNumber: 325,
                                    columnNumber: 146
                                }, void 0)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 325,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SummaryMetricCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Pending Reviews",
                                value: String(proofSummary.pendingVerification),
                                helper: "Across the current queue filter",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ClockIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                    lineNumber: 326,
                                    columnNumber: 150
                                }, void 0)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 326,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SummaryMetricCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Approved Proofs",
                                value: String(proofSummary.approved),
                                helper: "Across the current queue filter",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ShieldCheckIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                    lineNumber: 327,
                                    columnNumber: 139
                                }, void 0)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 327,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SummaryMetricCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                label: "Returned Proofs",
                                value: String(proofSummary.rejected),
                                helper: "Sent back for additional proof",
                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](AlertIcon, {
                                    className: "h-5 w-5"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                    lineNumber: 328,
                                    columnNumber: 138
                                }, void 0)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 328,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 324,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 315,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("section", {
                className: "overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_12px_40px_rgba(0,0,0,0.22)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-b border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex flex-col gap-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "text-xs font-bold uppercase tracking-[0.18em] text-gray-500 dark:text-slate-400",
                                                children: "Verification Queue"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 336,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                                className: "mt-1 text-lg font-black text-gray-900 dark:text-slate-100",
                                                children: "Proof submission review queue"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 337,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "mt-1 text-sm text-gray-600 dark:text-slate-400",
                                                children: "Approve complete submissions or return incomplete ones with guidance for resubmission."
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 338,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 335,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_260px]",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "flex gap-2",
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                        className: "relative flex-1",
                                                        children: [
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SearchIcon, {
                                                                className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                lineNumber: 346,
                                                                columnNumber: 19
                                                            }, this),
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                                                value: searchInput,
                                                                onChange: (event)=>setSearchInput(event.target.value),
                                                                onKeyDown: (event)=>{
                                                                    if (event.key === 'Enter') {
                                                                        event.preventDefault();
                                                                        handleApplySearch();
                                                                    }
                                                                },
                                                                placeholder: "Search resident or code",
                                                                className: "w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 shadow-sm outline-none transition-colors focus:border-gray-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:focus:border-slate-500"
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                lineNumber: 347,
                                                                columnNumber: 19
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                        lineNumber: 345,
                                                        columnNumber: 17
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                        type: "button",
                                                        onClick: handleApplySearch,
                                                        className: "rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-gray-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white",
                                                        children: "Search"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                        lineNumber: 360,
                                                        columnNumber: 17
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 344,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$FilterDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: selectedStatus,
                                                options: [
                                                    {
                                                        value: 'Pending Verification',
                                                        label: 'Pending Verification'
                                                    },
                                                    {
                                                        value: ALL_STATUSES,
                                                        label: 'All Statuses'
                                                    },
                                                    {
                                                        value: 'Approved',
                                                        label: 'Approved'
                                                    },
                                                    {
                                                        value: 'Rejected',
                                                        label: 'Needs Revision'
                                                    }
                                                ],
                                                onChange: (val)=>{
                                                    setSelectedStatus(val);
                                                    setPage(1);
                                                }
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 369,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$FilterDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                value: selectedBarangay,
                                                options: [
                                                    {
                                                        value: ALL_BARANGAYS,
                                                        label: ALL_BARANGAYS
                                                    },
                                                    ...scopedBarangays.map((barangay)=>({
                                                            value: barangay,
                                                            label: barangay
                                                        }))
                                                ],
                                                onChange: (val)=>{
                                                    setSelectedBarangay(val);
                                                    setPage(1);
                                                }
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 383,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 343,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 334,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-3 flex flex-wrap items-center gap-2",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>void fetchProofQueue(),
                                        className: "inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](RefreshIcon, {
                                                className: "h-3.5 w-3.5"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 403,
                                                columnNumber: 15
                                            }, this),
                                            "Refresh queue"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 398,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: handleClearFilters,
                                        className: "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800",
                                        children: "Reset filters"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 406,
                                        columnNumber: 13
                                    }, this),
                                    appliedSearch ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300",
                                        children: [
                                            "Search: ",
                                            appliedSearch
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 414,
                                        columnNumber: 15
                                    }, this) : null,
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300",
                                        children: [
                                            proofSummary.total,
                                            " matched submission",
                                            proofSummary.total === 1 ? '' : 's'
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 418,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 397,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 333,
                        columnNumber: 9
                    }, this),
                    error ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "px-6 py-10 text-center",
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                            className: "text-sm font-semibold text-red-600",
                            children: error
                        }, void 0, false, {
                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                            lineNumber: 426,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                        lineNumber: 425,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "space-y-2 p-3 sm:p-4",
                                children: proofLoading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "px-6 py-16 text-center",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "inline-flex flex-col items-center gap-2 text-gray-500 dark:text-slate-400",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](SpinnerIcon, {
                                                className: "h-8 w-8"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 434,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                className: "text-xs font-semibold uppercase tracking-[0.16em]",
                                                children: "Loading proof queue"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 435,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 433,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                    lineNumber: 432,
                                    columnNumber: 17
                                }, this) : proofRows.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "px-6 py-16 text-center",
                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mx-auto max-w-xl",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "text-base font-bold text-gray-800 dark:text-slate-100",
                                                children: "No proof submissions matched this filter"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 441,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                className: "mt-2 text-sm text-gray-600 dark:text-slate-400",
                                                children: "Try clearing filters, changing the search, or waiting for residents to sync new disaster proof requests."
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 442,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 440,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                    lineNumber: 439,
                                    columnNumber: 17
                                }, this) : proofRows.map((row)=>{
                                    const rowId = getProofId(row);
                                    const proofUrls = getProofUrls(row);
                                    const proofUrl = proofUrls[0] || '#';
                                    const reviewNote = row.status === 'Rejected' ? row.rejectionReason || 'Returned for revision without a note.' : row.status === 'Approved' ? `Approved by ${row.reviewedBy || 'reviewer'}` : 'Awaiting admin verification';
                                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("article", {
                                        className: "rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm transition-colors hover:bg-gray-50/70 dark:border-slate-700 dark:bg-slate-950 dark:hover:bg-slate-900/80",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "min-w-0 flex-1 space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                            className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                                                            children: [
                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                    className: "min-w-0",
                                                                    children: [
                                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                            className: "flex flex-wrap items-center gap-1.5",
                                                                            children: [
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                                    className: "truncate text-sm font-black text-gray-900 dark:text-slate-100 sm:text-base",
                                                                                    children: row.resident.fullName
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 468,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    className: `inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${statusBadgeClass(row.status)}`,
                                                                                    children: getProofStatusLabel(row.status)
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 469,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    className: "inline-flex rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
                                                                                    children: row.damageType
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 472,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 467,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                            className: "mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500 dark:text-slate-400",
                                                                            children: [
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    className: "font-semibold uppercase tracking-[0.12em]",
                                                                                    children: row.resident.residentCode
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 477,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    className: "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-slate-800 dark:text-slate-200",
                                                                                    children: [
                                                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](MapPinIcon, {
                                                                                            className: "h-3.5 w-3.5"
                                                                                        }, void 0, false, {
                                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                            lineNumber: 479,
                                                                                            columnNumber: 35
                                                                                        }, this),
                                                                                        row.resident.barangay
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 478,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    className: "truncate",
                                                                                    children: row.event.name
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 482,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    children: row.event.disasterType
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 483,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    children: [
                                                                                        "Submitted ",
                                                                                        formatDateTime(row.dateSubmitted)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 484,
                                                                                    columnNumber: 33
                                                                                }, this),
                                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                                                    children: [
                                                                                        "Version ",
                                                                                        row.submissionVersion
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 485,
                                                                                    columnNumber: 33
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 476,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                    lineNumber: 466,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                    className: "shrink-0",
                                                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                        className: "flex flex-wrap items-center justify-end gap-1.5",
                                                                        children: [
                                                                            proofUrls.map((url, index)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("a", {
                                                                                    href: url,
                                                                                    target: "_blank",
                                                                                    rel: "noreferrer",
                                                                                    className: "group relative block h-12 w-12 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow-sm dark:border-slate-700 dark:bg-slate-800",
                                                                                    title: `Proof photo ${index + 1}`,
                                                                                    children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("img", {
                                                                                        src: url,
                                                                                        alt: `Proof photo ${index + 1} for ${row.resident.fullName}`,
                                                                                        className: "h-full w-full object-cover transition-transform duration-150 group-hover:scale-105"
                                                                                    }, void 0, false, {
                                                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                        lineNumber: 500,
                                                                                        columnNumber: 37
                                                                                    }, this)
                                                                                }, `${rowId}-proof-${index + 1}`, false, {
                                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                    lineNumber: 492,
                                                                                    columnNumber: 35
                                                                                }, this)),
                                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("a", {
                                                                                href: proofUrl,
                                                                                target: "_blank",
                                                                                rel: "noreferrer",
                                                                                className: "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                                                                                children: [
                                                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](ImageIcon, {
                                                                                        className: "h-3.5 w-3.5"
                                                                                    }, void 0, false, {
                                                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                        lineNumber: 513,
                                                                                        columnNumber: 35
                                                                                    }, this),
                                                                                    proofUrls.length > 1 ? `${proofUrls.length} photos` : 'View proof'
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                                lineNumber: 507,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                        lineNumber: 490,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                }, void 0, false, {
                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                    lineNumber: 489,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                            lineNumber: 465,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                            className: "grid gap-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]",
                                                            children: [
                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                    className: "rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-800/80",
                                                                    children: [
                                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                            className: "text-sm text-gray-700 dark:text-slate-200",
                                                                            children: truncateText(row.description, 120)
                                                                        }, void 0, false, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 522,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        row.supportingInfo ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                            className: "mt-1 text-[11px] text-gray-500 dark:text-slate-400",
                                                                            children: truncateText(row.supportingInfo, 90)
                                                                        }, void 0, false, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 524,
                                                                            columnNumber: 33
                                                                        }, this) : null
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                    lineNumber: 521,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                    className: "rounded-xl bg-gray-50 px-3 py-2 dark:bg-slate-800/80",
                                                                    children: [
                                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                            className: "text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-slate-400",
                                                                            children: "Review"
                                                                        }, void 0, false, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 529,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                            className: "mt-1 text-sm text-gray-600 dark:text-slate-300",
                                                                            children: truncateText(reviewNote, 90)
                                                                        }, void 0, false, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 530,
                                                                            columnNumber: 31
                                                                        }, this),
                                                                        row.reviewedAt ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                                                            className: "mt-1 text-[11px] text-gray-500 dark:text-slate-400",
                                                                            children: [
                                                                                "Reviewed ",
                                                                                formatDateTime(row.reviewedAt)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                            lineNumber: 532,
                                                                            columnNumber: 33
                                                                        }, this) : null
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                    lineNumber: 528,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                            lineNumber: 520,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                    lineNumber: 464,
                                                    columnNumber: 25
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "lg:w-36 lg:pl-2",
                                                    children: row.status === 'Pending Verification' ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                        className: "grid grid-cols-2 gap-2 lg:grid-cols-1",
                                                        children: [
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                                type: "button",
                                                                onClick: ()=>openApproveModal(row),
                                                                className: "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100",
                                                                children: "Approve"
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                lineNumber: 541,
                                                                columnNumber: 31
                                                            }, this),
                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                                type: "button",
                                                                onClick: ()=>openRejectModal(row),
                                                                className: "rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100",
                                                                children: "Return"
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                                lineNumber: 548,
                                                                columnNumber: 31
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                        lineNumber: 540,
                                                        columnNumber: 29
                                                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                        className: "rounded-xl border border-dashed border-gray-200 px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:border-slate-700 dark:text-slate-500",
                                                        children: "No action needed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                        lineNumber: 557,
                                                        columnNumber: 29
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                    lineNumber: 538,
                                                    columnNumber: 25
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                            lineNumber: 463,
                                            columnNumber: 23
                                        }, this)
                                    }, rowId, false, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 459,
                                        columnNumber: 21
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 430,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex flex-col gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-center sm:justify-between",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                        className: "text-xs font-bold uppercase tracking-[0.16em] text-gray-500 dark:text-slate-400",
                                        children: [
                                            "Page ",
                                            page,
                                            " of ",
                                            totalPages
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 570,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                type: "button",
                                                onClick: ()=>setPage((prev)=>Math.max(1, prev - 1)),
                                                disabled: page <= 1 || proofLoading,
                                                className: "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800",
                                                children: "Prev"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 572,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                type: "button",
                                                onClick: ()=>setPage((prev)=>Math.min(totalPages, prev + 1)),
                                                disabled: page >= totalPages || proofLoading,
                                                className: "rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800",
                                                children: "Next"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                                lineNumber: 580,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                        lineNumber: 571,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                                lineNumber: 569,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 332,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ConfirmModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                isOpen: confirmApproveOpen && !!reviewTarget,
                title: "Approve Proof Submission",
                body: reviewTarget ? `Approve the proof submission from ${reviewTarget.resident.fullName} for ${reviewTarget.event.name}? This will make the resident eligible for that distribution once the registration record is approved.` : '',
                confirmLabel: reviewLoading ? 'Approving...' : 'Approve Submission',
                loading: reviewLoading,
                onCancel: closeReviewModals,
                onConfirm: submitReview
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 594,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"](RevisionRequestModal, {
                open: !!reviewTarget && reviewDecision === 'Rejected',
                loading: reviewLoading,
                residentName: reviewTarget?.resident.fullName || '',
                eventName: reviewTarget?.event.name || '',
                reason: reviewReason,
                onReasonChange: setReviewReason,
                onClose: closeReviewModals,
                onSubmit: submitReview
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 608,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 314,
        columnNumber: 5
    }, this);
}
_s(TargetBeneficiariesPageClient, "3egn1xLyAfv3tHrfFsURUV98KOU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c1 = TargetBeneficiariesPageClient;
function SpinnerIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: `${className || ''} animate-spin`,
        viewBox: "0 0 24 24",
        fill: "none",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                className: "opacity-20",
                cx: "12",
                cy: "12",
                r: "9",
                stroke: "currentColor",
                strokeWidth: "3"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 625,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                d: "M21 12a9 9 0 00-9-9",
                stroke: "currentColor",
                strokeWidth: "3",
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 626,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 624,
        columnNumber: 5
    }, this);
}
_c2 = SpinnerIcon;
function ClipboardIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M9 4h6m-7 3h8a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 634,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M10 4.5A1.5 1.5 0 0111.5 3h1A1.5 1.5 0 0114 4.5V7h-4V4.5z"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 635,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 633,
        columnNumber: 5
    }, this);
}
_c3 = ClipboardIcon;
function ClockIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2.2,
            d: "M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
            lineNumber: 643,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 642,
        columnNumber: 5
    }, this);
}
_c4 = ClockIcon;
function ShieldCheckIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M12 3l7 3v6c0 5-3.5 8.5-7 9-3.5-.5-7-4-7-9V6l7-3z"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 651,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M9 12l2 2 4-4"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 652,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 650,
        columnNumber: 5
    }, this);
}
_c5 = ShieldCheckIcon;
function AlertIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2.2,
            d: "M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.74 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
            lineNumber: 660,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 659,
        columnNumber: 5
    }, this);
}
_c6 = AlertIcon;
function RefreshIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2.2,
            d: "M4 4v5h5M20 20v-5h-5M5.8 9A7 7 0 0118 6.3M18.2 15A7 7 0 016 17.7"
        }, void 0, false, {
            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
            lineNumber: 668,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 667,
        columnNumber: 5
    }, this);
}
_c7 = RefreshIcon;
function SearchIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2.2,
            d: "M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
        }, void 0, false, {
            fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
            lineNumber: 676,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 675,
        columnNumber: 5
    }, this);
}
_c8 = SearchIcon;
function ImageIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 684,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M8 14l2.5-2.5L15 16l2-2 3 3M9 9h.01"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 685,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 683,
        columnNumber: 5
    }, this);
}
_c9 = ImageIcon;
function MapPinIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M12 21s6-4.5 6-10a6 6 0 10-12 0c0 5.5 6 10 6 10z"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 693,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2.2,
                d: "M12 11a2 2 0 100-4 2 2 0 000 4z"
            }, void 0, false, {
                fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
                lineNumber: 694,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/beneficiaries/TargetBeneficiariesPageClient.tsx>",
        lineNumber: 692,
        columnNumber: 5
    }, this);
}
_c10 = MapPinIcon;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10;
__turbopack_refresh__.register(_c, "RevisionRequestModal");
__turbopack_refresh__.register(_c1, "TargetBeneficiariesPageClient");
__turbopack_refresh__.register(_c2, "SpinnerIcon");
__turbopack_refresh__.register(_c3, "ClipboardIcon");
__turbopack_refresh__.register(_c4, "ClockIcon");
__turbopack_refresh__.register(_c5, "ShieldCheckIcon");
__turbopack_refresh__.register(_c6, "AlertIcon");
__turbopack_refresh__.register(_c7, "RefreshIcon");
__turbopack_refresh__.register(_c8, "SearchIcon");
__turbopack_refresh__.register(_c9, "ImageIcon");
__turbopack_refresh__.register(_c10, "MapPinIcon");

})()),
}]);

//# sourceMappingURL=src_94f59f._.js.map