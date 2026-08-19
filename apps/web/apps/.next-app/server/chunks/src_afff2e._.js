module.exports = {

"[project]/src/components/reports/ReportsHelpers.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "AlertIcon": ()=>AlertIcon,
    "BoltIcon": ()=>BoltIcon,
    "CheckIcon": ()=>CheckIcon,
    "ChevronDownIcon": ()=>ChevronDownIcon,
    "ClaimRateBar": ()=>ClaimRateBar,
    "ClearIcon": ()=>ClearIcon,
    "CubeIcon": ()=>CubeIcon,
    "DocIcon": ()=>DocIcon,
    "Donut": ()=>Donut,
    "DotsIcon": ()=>DotsIcon,
    "DownloadIcon": ()=>DownloadIcon,
    "Dropdown": ()=>Dropdown,
    "EmptyState": ()=>EmptyState,
    "EyeIcon": ()=>EyeIcon,
    "FaceIcon": ()=>FaceIcon,
    "FilterIcon": ()=>FilterIcon,
    "LoadingSpinner": ()=>LoadingSpinner,
    "MenuItem": ()=>MenuItem,
    "MiniBarChart": ()=>MiniBarChart,
    "Pagination": ()=>Pagination,
    "QRIcon": ()=>QRIcon,
    "QuestionIcon": ()=>QuestionIcon,
    "StatCard": ()=>StatCard,
    "StatusPill": ()=>StatusPill,
    "SummaryCell": ()=>SummaryCell,
    "TrendIcon": ()=>TrendIcon,
    "UnclaimedIcon": ()=>UnclaimedIcon,
    "UsersIcon": ()=>UsersIcon,
    "downloadCSV": ()=>downloadCSV,
    "formatDate": ()=>formatDate,
    "getDatePresetRange": ()=>getDatePresetRange
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
function downloadCSV(rows, filename) {
    const headers = [
        'Date',
        'Barangay',
        'Assigned Barangays',
        'Registered Households',
        'Claimed',
        'Unclaimed',
        'Claim Rate (%)',
        'Status'
    ];
    const csvRows = rows.map((r)=>[
            formatDate(r.scheduled || r.createdAt),
            r.barangay,
            (r.assignedBarangays || []).join('; '),
            r.registeredHouseholds,
            r.claimedHouseholds,
            r.unclaimedHouseholds,
            r.claimRate,
            r.status
        ]);
    const csv = [
        headers.join(','),
        ...csvRows.map((row)=>row.map((cell)=>`"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([
        csv
    ], {
        type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function getDatePresetRange(preset) {
    const now = new Date();
    const formatDateStr = (d)=>d.toISOString().split('T')[0];
    if (preset === 'today') {
        const todayStr = formatDateStr(now);
        return {
            start: todayStr,
            end: todayStr
        };
    }
    if (preset === '7d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        return {
            start: formatDateStr(start),
            end: formatDateStr(now)
        };
    }
    if (preset === '30d') {
        const start = new Date(now);
        start.setDate(now.getDate() - 30);
        return {
            start: formatDateStr(start),
            end: formatDateStr(now)
        };
    }
    if (preset === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
            start: formatDateStr(start),
            end: formatDateStr(now)
        };
    }
    if (preset === 'ytd') {
        const start = new Date(now.getFullYear(), 0, 1);
        return {
            start: formatDateStr(start),
            end: formatDateStr(now)
        };
    }
    return {
        start: '',
        end: ''
    };
}
function Dropdown({ value, items, onChange, buttonLabel, widthClass = 'min-w-[200px]' }) {
    const [open, setOpen] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const btnRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    const menuRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const onDown = (e)=>{
            const t = e.target;
            if (!btnRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return ()=>document.removeEventListener('mousedown', onDown);
    }, []);
    const selectedLabel = items.find((i)=>i.value === value)?.label ?? buttonLabel;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: `relative ${widthClass}`,
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                ref: btnRef,
                type: "button",
                onClick: ()=>setOpen((v)=>!v),
                className: "w-full flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-700 shadow-sm transition-all hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: "text-xs sm:text-sm truncate font-medium",
                        children: selectedLabel
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](ChevronDownIcon, {}, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 120,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            open && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                ref: menuRef,
                className: "absolute left-0 top-full z-50 mt-1.5 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-800",
                children: items.map((opt)=>{
                    const isSelected = opt.value === value;
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>{
                            onChange(opt.value);
                            setOpen(false);
                        },
                        className: `w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm text-left transition-colors ${isSelected ? 'bg-emerald-50 text-emerald-800 font-semibold dark:bg-emerald-950/60 dark:text-emerald-300' : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/60'}`,
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "w-4 flex items-center justify-center",
                                children: isSelected ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](CheckIcon, {}, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                    lineNumber: 141,
                                    columnNumber: 33
                                }, this) : null
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 140,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "truncate",
                                children: opt.label
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 143,
                                columnNumber: 17
                            }, this)
                        ]
                    }, opt.value, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 130,
                        columnNumber: 15
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 123,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 112,
        columnNumber: 5
    }, this);
}
function StatCard({ icon, title, value, subtitle, variant = 'emerald' }) {
    const variantStyles = {
        emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/50',
        blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/50',
        amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/50',
        purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/50'
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${variantStyles[variant]}`,
                children: icon
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 175,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "min-w-0",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100",
                        children: value
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 179,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-xs font-semibold text-slate-500 dark:text-slate-400 truncate",
                        children: title
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 182,
                        columnNumber: 9
                    }, this),
                    subtitle && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5",
                        children: subtitle
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 186,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 178,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 174,
        columnNumber: 5
    }, this);
}
function StatusPill({ status }) {
    const isClaimed = status === 'Claimed' || status === 'Completed';
    const isActive = status === 'Partially Claimed' || status === 'Active';
    const cls = isClaimed ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40' : isActive ? 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40' : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    const label = isClaimed ? 'Completed' : isActive ? 'Active' : 'Scheduled';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
        className: `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`,
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: `w-1.5 h-1.5 rounded-full ${isClaimed ? 'bg-emerald-500' : isActive ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}`
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 209,
                columnNumber: 7
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 208,
        columnNumber: 5
    }, this);
}
function ClaimRateBar({ rate }) {
    const color = rate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : rate >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : rate > 0 ? 'bg-gradient-to-r from-orange-500 to-rose-400' : 'bg-slate-300';
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex items-center gap-2.5",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: `h-full rounded-full transition-all duration-500 ${color}`,
                    style: {
                        width: `${Math.min(rate, 100)}%`
                    }
                }, void 0, false, {
                    fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                    lineNumber: 221,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 220,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "w-10 text-right text-xs font-bold text-slate-700 dark:text-slate-300",
                children: [
                    rate,
                    "%"
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 223,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 219,
        columnNumber: 5
    }, this);
}
function Donut({ segments }) {
    const total = segments.reduce((a, s)=>a + s.value, 0) || 1;
    const radius = 48;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex flex-col sm:flex-row items-center justify-between gap-5 select-none",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "relative w-32 h-32 shrink-0",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                        className: "w-full h-full transform -rotate-90",
                        viewBox: "0 0 120 120",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                cx: "60",
                                cy: "60",
                                r: radius,
                                fill: "none",
                                stroke: "currentColor",
                                strokeWidth: "12",
                                className: "text-slate-100 dark:text-slate-800"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 242,
                                columnNumber: 11
                            }, this),
                            segments.map((seg, idx)=>{
                                const dash = seg.value / total * circumference;
                                const gap = circumference - dash;
                                const dashArray = `${dash} ${gap}`;
                                const dashOffset = -offset;
                                offset += dash;
                                return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                                    cx: "60",
                                    cy: "60",
                                    r: radius,
                                    fill: "none",
                                    stroke: seg.stroke,
                                    strokeWidth: "12",
                                    strokeLinecap: "round",
                                    strokeDasharray: dashArray,
                                    strokeDashoffset: dashOffset,
                                    className: "transition-all duration-500"
                                }, idx, false, {
                                    fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                    lineNumber: 250,
                                    columnNumber: 15
                                }, this);
                            })
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 241,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "absolute inset-0 flex flex-col items-center justify-center text-center",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-base font-extrabold text-slate-900 dark:text-slate-100",
                                children: total
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 267,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[9px] font-semibold text-slate-400 uppercase",
                                children: "Distributions"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 268,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 266,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 240,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex-1 space-y-2 max-h-36 overflow-y-auto pr-1 w-full",
                children: segments.map((s)=>{
                    const pct = Math.round(s.value / total * 100);
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between gap-2 text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2 min-w-0",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "w-2.5 h-2.5 rounded-full shrink-0",
                                        style: {
                                            background: s.stroke
                                        }
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                        lineNumber: 278,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "text-slate-700 dark:text-slate-300 font-medium truncate",
                                        children: s.label
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                        lineNumber: 279,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 277,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-slate-900 dark:text-slate-100 font-bold shrink-0",
                                children: [
                                    pct,
                                    "%"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 281,
                                columnNumber: 15
                            }, this)
                        ]
                    }, s.label, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 276,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 272,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 239,
        columnNumber: 5
    }, this);
}
function MiniBarChart({ labels, seriesA, seriesB, legendA, legendB }) {
    const [hoverIndex, setHoverIndex] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const max = Math.max(...seriesA, ...seriesB, 1);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "w-full select-none",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mb-3 flex items-center justify-between text-xs",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "flex items-center gap-1.5",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "w-2.5 h-2.5 rounded-full bg-blue-500"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                        lineNumber: 312,
                                        columnNumber: 13
                                    }, this),
                                    " ",
                                    legendA
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 311,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "flex items-center gap-1.5",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        className: "w-2.5 h-2.5 rounded-full bg-emerald-500"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                        lineNumber: 315,
                                        columnNumber: 13
                                    }, this),
                                    " ",
                                    legendB
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 314,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 310,
                        columnNumber: 9
                    }, this),
                    hoverIndex !== null && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "text-[11px] font-bold text-slate-800 dark:text-slate-200",
                        children: [
                            labels[hoverIndex],
                            ": ",
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-blue-500",
                                children: seriesA[hoverIndex]
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 320,
                                columnNumber: 35
                            }, this),
                            " vs ",
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-emerald-500",
                                children: seriesB[hoverIndex]
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 320,
                                columnNumber: 99
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 319,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 309,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-end gap-2 sm:gap-3 h-36 pt-4 border-b border-slate-100 dark:border-slate-800",
                children: labels.map((m, i)=>{
                    const a = seriesA[i] / max * 100;
                    const b = seriesB[i] / max * 100;
                    const isHovered = hoverIndex === i;
                    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex-1 flex flex-col items-center gap-1 cursor-pointer",
                        onMouseEnter: ()=>setHoverIndex(i),
                        onMouseLeave: ()=>setHoverIndex(null),
                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "flex items-end justify-center gap-1 w-full h-28",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: `w-2.5 sm:w-3.5 rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 ${isHovered ? 'scale-105 brightness-110' : 'opacity-90'}`,
                                    style: {
                                        height: `${a}%`,
                                        minHeight: seriesA[i] > 0 ? '4px' : '0px'
                                    }
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                    lineNumber: 339,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: `w-2.5 sm:w-3.5 rounded-t-md bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 ${isHovered ? 'scale-105 brightness-110' : 'opacity-90'}`,
                                    style: {
                                        height: `${b}%`,
                                        minHeight: seriesB[i] > 0 ? '4px' : '0px'
                                    }
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                    lineNumber: 343,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                            lineNumber: 338,
                            columnNumber: 15
                        }, this)
                    }, m, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 332,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 325,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "mt-2 flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400",
                children: labels.map((m, i)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        className: `w-full text-center cursor-pointer transition-colors ${hoverIndex === i ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`,
                        onMouseEnter: ()=>setHoverIndex(i),
                        children: m
                    }, m, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 355,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 353,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 307,
        columnNumber: 5
    }, this);
}
function SummaryCell({ label, value, valueClass = 'text-slate-900 dark:text-slate-100' }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "text-[11px] font-semibold uppercase tracking-wider text-slate-400",
                children: label
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 379,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: `mt-1 text-lg font-extrabold tracking-tight ${valueClass}`,
                children: value
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 380,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 378,
        columnNumber: 5
    }, this);
}
function MenuItem({ icon, label, onClick }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
        type: "button",
        onClick: onClick,
        className: "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "text-slate-500 dark:text-slate-400",
                children: icon
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 400,
                columnNumber: 7
            }, this),
            label
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 395,
        columnNumber: 5
    }, this);
}
function LoadingSpinner() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex flex-col items-center justify-center py-16",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "h-9 w-9 animate-spin rounded-full border-3 border-slate-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-400"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 409,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                className: "text-xs font-semibold text-slate-500 dark:text-slate-400 mt-3",
                children: "Compiling report analytics..."
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 410,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 408,
        columnNumber: 5
    }, this);
}
function EmptyState({ message }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](DocIcon, {
                className: "w-10 h-10 mb-2.5 text-slate-300 dark:text-slate-600"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 418,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                className: "text-xs font-medium",
                children: message
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 419,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 417,
        columnNumber: 5
    }, this);
}
function ChevronDownIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4 text-slate-400",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 429,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 428,
        columnNumber: 5
    }, this);
}
function CheckIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4 text-emerald-600",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 3,
            d: "M5 13l4 4L19 7"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 436,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 435,
        columnNumber: 5
    }, this);
}
function FilterIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17v-3.586L3.293 6.707A1 1 0 013 6V4z"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 443,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 442,
        columnNumber: 5
    }, this);
}
function BoltIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M13 10V3L4 14h7v7l9-11h-7z"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 450,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 449,
        columnNumber: 5
    }, this);
}
function DownloadIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-4 h-4',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 457,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M7 10l5 5 5-5"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 458,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 15V3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 459,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 456,
        columnNumber: 5
    }, this);
}
function ClearIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-4 h-4',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M6 18L18 6M6 6l12 12"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 466,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 465,
        columnNumber: 5
    }, this);
}
function DocIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M7 7h10M7 11h10M7 15h6"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 473,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M6 3h8l4 4v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 474,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 472,
        columnNumber: 5
    }, this);
}
function CubeIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M21 8l-9-5-9 5 9 5 9-5z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 481,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M3 8v8l9 5 9-5V8"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 482,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 13v8"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 483,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 480,
        columnNumber: 5
    }, this);
}
function UsersIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 490,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 489,
        columnNumber: 5
    }, this);
}
function TrendIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M3 17l6-6 4 4 8-8"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 497,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M14 7h7v7"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 498,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 496,
        columnNumber: 5
    }, this);
}
function AlertIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M12 9v4m0 4h.01"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 505,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 506,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 504,
        columnNumber: 5
    }, this);
}
function UnclaimedIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 513,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 512,
        columnNumber: 5
    }, this);
}
function DotsIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-5 h-5",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 12h.01M12 12h.01M19 12h.01"
        }, void 0, false, {
            fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
            lineNumber: 520,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 519,
        columnNumber: 5
    }, this);
}
function EyeIcon() {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: "w-4 h-4",
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 527,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 528,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 526,
        columnNumber: 5
    }, this);
}
function QRIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3z"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 535,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M14 14h3v3h-3zM14 20h7M20 14v3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 536,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 534,
        columnNumber: 5
    }, this);
}
function FaceIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                strokeWidth: 2
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 543,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M8 14s1.5 2 4 2 4-2 4-2"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 544,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                x1: "9",
                y1: "9",
                x2: "9.01",
                y2: "9",
                strokeWidth: 3,
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 545,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                x1: "15",
                y1: "9",
                x2: "15.01",
                y2: "9",
                strokeWidth: 3,
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 546,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 542,
        columnNumber: 5
    }, this);
}
function QuestionIcon({ className }) {
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
        className: className ?? 'w-5 h-5',
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("circle", {
                cx: "12",
                cy: "12",
                r: "10",
                strokeWidth: 2
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 553,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 554,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("line", {
                x1: "12",
                y1: "17",
                x2: "12.01",
                y2: "17",
                strokeWidth: 3,
                strokeLinecap: "round"
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 555,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 552,
        columnNumber: 5
    }, this);
}
function Pagination({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange, pageSizeOptions = [
    5,
    10,
    20,
    50
] }) {
    if (totalItems <= 0) return null;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(totalItems, currentPage * pageSize);
    // Generate page numbers with ellipsis
    const getPageNumbers = ()=>{
        const pages = [];
        if (totalPages <= 7) {
            for(let i = 1; i <= totalPages; i++)pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for(let i = start; i <= end; i++){
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        return pages;
    };
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex flex-wrap items-center gap-3",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                        children: [
                            "Showing ",
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("strong", {
                                className: "font-semibold text-slate-700 dark:text-slate-200",
                                children: startItem
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 613,
                                columnNumber: 19
                            }, this),
                            " to",
                            ' ',
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("strong", {
                                className: "font-semibold text-slate-700 dark:text-slate-200",
                                children: endItem
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 614,
                                columnNumber: 11
                            }, this),
                            " of",
                            ' ',
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("strong", {
                                className: "font-semibold text-slate-700 dark:text-slate-200",
                                children: totalItems
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 615,
                                columnNumber: 11
                            }, this),
                            " entries"
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 612,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-700",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                children: "Rows:"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 619,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("select", {
                                value: pageSize,
                                onChange: (e)=>onPageSizeChange(Number(e.target.value)),
                                className: "rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer",
                                children: pageSizeOptions.map((opt)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("option", {
                                        value: opt,
                                        children: opt
                                    }, opt, false, {
                                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                        lineNumber: 626,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 620,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 618,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 611,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-center gap-1",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>onPageChange(1),
                        disabled: currentPage === 1,
                        title: "First Page",
                        className: "px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors",
                        children: "««"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 637,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>onPageChange(currentPage - 1),
                        disabled: currentPage === 1,
                        className: "px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium",
                        children: "Prev"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 648,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center gap-1 mx-1",
                        children: getPageNumbers().map((p, idx)=>{
                            if (p === '...') {
                                return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                    className: "px-1 text-slate-400",
                                    children: "..."
                                }, `ellipsis-${idx}`, false, {
                                    fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                    lineNumber: 662,
                                    columnNumber: 17
                                }, this);
                            }
                            const isCurrent = p === currentPage;
                            return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: ()=>onPageChange(Number(p)),
                                className: `min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all ${isCurrent ? 'bg-emerald-600 text-white shadow-sm' : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`,
                                children: p
                            }, `page-${p}`, false, {
                                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                                lineNumber: 669,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 658,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>onPageChange(currentPage + 1),
                        disabled: currentPage === totalPages,
                        className: "px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors font-medium",
                        children: "Next"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 686,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                        type: "button",
                        onClick: ()=>onPageChange(totalPages),
                        disabled: currentPage === totalPages,
                        title: "Last Page",
                        className: "px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors",
                        children: "»»"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                        lineNumber: 696,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
                lineNumber: 635,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsHelpers.tsx>",
        lineNumber: 609,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/components/reports/DetailModal.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "DetailModal": ()=>DetailModal
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/reports/ReportsHelpers.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
;
;
;
function DetailModal({ row, onClose }) {
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const onKey = (e)=>{
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return ()=>document.removeEventListener('keydown', onKey);
    }, [
        onClose
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "fixed inset-0 z-[100] flex items-center justify-center bg-black/50",
        onClick: onClose,
        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
            className: "mx-4 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900 dark:shadow-[0_24px_80px_rgba(0,0,0,0.45)]",
            onClick: (e)=>e.stopPropagation(),
            children: [
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "flex items-center justify-between border-b border-gray-100 p-5 dark:border-slate-800",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                            className: "font-semibold text-gray-900 dark:text-slate-100",
                            children: "Distribution Details"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                            lineNumber: 29,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                            onClick: onClose,
                            className: "p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300",
                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 32,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                lineNumber: 31,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                    lineNumber: 28,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                    className: "p-5 space-y-4",
                    children: [
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "grid grid-cols-2 gap-4",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500 dark:text-slate-400",
                                            children: "Date"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 39,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-slate-100",
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"](row.scheduled || row.createdAt)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 40,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 38,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500 dark:text-slate-400",
                                            children: "Host Barangay"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 43,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-slate-100",
                                            children: row.barangay
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 44,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500 dark:text-slate-400",
                                            children: "Assigned Barangays"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 47,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-sm font-medium text-gray-900 dark:text-slate-100",
                                            children: row.assignedBarangays?.length ? row.assignedBarangays.join(', ') : '—'
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 48,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "text-xs text-gray-500",
                                            children: "Status"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 53,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "mt-0.5",
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatusPill"], {
                                                status: row.status
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                lineNumber: 54,
                                                columnNumber: 39
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 54,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 52,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                            className: "rounded-xl bg-gray-50 p-4 dark:bg-slate-800/80",
                            children: [
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "mb-3 text-xs text-gray-500 dark:text-slate-400",
                                    children: "Household Statistics"
                                }, void 0, false, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 59,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "grid grid-cols-3 gap-4",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-lg font-bold text-gray-900 dark:text-slate-100",
                                                    children: row.registeredHouseholds
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                    lineNumber: 62,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-xs text-gray-500 dark:text-slate-400",
                                                    children: "Registered"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                    lineNumber: 63,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 61,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-lg font-bold text-green-700",
                                                    children: row.claimedHouseholds
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                    lineNumber: 66,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-xs text-gray-500 dark:text-slate-400",
                                                    children: "Claimed"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                    lineNumber: 67,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 65,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            children: [
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-lg font-bold text-amber-600",
                                                    children: row.unclaimedHouseholds
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                    lineNumber: 70,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                    className: "text-xs text-gray-500 dark:text-slate-400",
                                                    children: "Unclaimed"
                                                }, void 0, false, {
                                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                                    lineNumber: 71,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 69,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 60,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "mt-3",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                            className: "mb-1 text-xs text-gray-500 dark:text-slate-400",
                                            children: "Claim Rate"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 75,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ClaimRateBar"], {
                                            rate: row.claimRate
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                            lineNumber: 76,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                                    lineNumber: 74,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "<[project]/src/components/reports/DetailModal.tsx>",
                    lineNumber: 36,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "<[project]/src/components/reports/DetailModal.tsx>",
            lineNumber: 24,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "<[project]/src/components/reports/DetailModal.tsx>",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}

})()),
"[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "AuthProvider": ()=>AuthProvider,
    "useAuth": ()=>useAuth
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api';
const AuthContext = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"](undefined);
function AuthProvider({ children }) {
    const [user, setUser] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](true);
    const getCsrfToken = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](()=>{
        return document.cookie.split('; ').find((c)=>c.startsWith('XSRF-TOKEN='))?.split('=')[1];
    }, []);
    const initAuth = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
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
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        initAuth();
    }, [
        initAuth
    ]);
    const login = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (email, password, rememberMe, otp)=>{
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
    const verifyLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken, otp)=>{
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
    const resendLoginOtp = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (otpToken)=>{
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
    const setInitialPassword = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async (newPassword)=>{
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
    const logout = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
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
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](AuthContext.Provider, {
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
function useAuth() {
    const ctx = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"](AuthContext);
    if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
    return ctx;
}

})()),
"[project]/src/lib/api.ts [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
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
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '/api';
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
            body: JSON.stringify({
                ...data,
                assignedBarangays: data.assignedBarangays ?? []
            })
        });
        return handleResponse(response);
    },
    /**
   * Search eligible scanner staff for a distribution scope.
   */ async getScanEligibleUsers (params) {
        const sp = new URLSearchParams();
        if (params.barangay) sp.append('barangay', params.barangay);
        if (params.hostBarangayId) sp.append('hostBarangayId', params.hostBarangayId);
        if (Array.isArray(params.assignedBarangayIds)) {
            for (const b of params.assignedBarangayIds){
                sp.append('assignedBarangayIds', b);
            }
        }
        if (params.scheduled) sp.append('scheduled', params.scheduled);
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
   * Reschedule an active distribution
   */ async rescheduleDistribution (id, data) {
        const response = await fetch(`${API_URL}/distributions/${id}/reschedule`, {
            method: 'PATCH',
            headers: createHeaders('PATCH'),
            credentials: 'include',
            body: JSON.stringify(data)
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
"[project]/src/components/reports/ReportsPageClient.tsx [app-ssr] (ecmascript)": (({ r: __turbopack_require__, f: __turbopack_require_context__, i: __turbopack_import__, s: __turbopack_esm__, v: __turbopack_export_value__, n: __turbopack_export_namespace__, c: __turbopack_cache__, l: __turbopack_load__, j: __turbopack_dynamic__, p: __turbopack_resolve_absolute_path__, U: __turbopack_relative_url__, R: __turbopack_resolve_module_id_path__, g: global, __dirname, x: __turbopack_external_require__, y: __turbopack_external_import__ }) => (() => {
"use strict";

__turbopack_esm__({
    "default": ()=>ReportsPageClient
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/node_modules/next/dist/server/future/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/api.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/lib/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$DetailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/reports/DetailModal.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_import__("[project]/src/components/reports/ReportsHelpers.tsx [app-ssr] (ecmascript)");
"__TURBOPACK__ecmascript__hoisting__location__";
'use client';
;
;
;
;
;
;
const REPORT_TYPES = [
    {
        value: 'distribution',
        label: 'Distribution Summary'
    },
    {
        value: 'barangay',
        label: 'Barangay Summary'
    }
];
const DONUT_COLORS = [
    '#10B981',
    '#3B82F6',
    '#F59E0B',
    '#8B5CF6',
    '#06B6D4',
    '#EC4899',
    '#F97316',
    '#14B8A6',
    '#6366F1',
    '#84CC16'
];
function ReportsPageClient() {
    const { user } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"]();
    const scopedBarangays = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getScopedBarangays"](user?.role, user?.assignedBarangays), [
        user?.role,
        user?.assignedBarangays
    ]);
    const [reportType, setReportType] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('distribution');
    const [startDate, setStartDate] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('');
    const [endDate, setEndDate] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('');
    const [barangay, setBarangay] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('All');
    const [activePreset, setActivePreset] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('all');
    // Pagination states
    const [currentPage, setCurrentPage] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](1);
    const [pageSize, setPageSize] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](10);
    const [brgyCurrentPage, setBrgyCurrentPage] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](1);
    const [brgyPageSize, setBrgyPageSize] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](10);
    const [data, setData] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [loading, setLoading] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const [error, setError] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"]('');
    const [generated, setGenerated] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    // detail modal
    const [detailRow, setDetailRow] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    // row menu
    const [activeMenu, setActiveMenu] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](null);
    const [menuOpensUp, setMenuOpensUp] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](false);
    const rowMenuWrapRef = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"](null);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        const onDown = (e)=>{
            if (rowMenuWrapRef.current && !rowMenuWrapRef.current.contains(e.target)) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('mousedown', onDown);
        return ()=>document.removeEventListener('mousedown', onDown);
    }, []);
    const fetchReport = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"](async ()=>{
        setLoading(true);
        setError('');
        try {
            const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"].getReportSummary({
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                barangay: barangay !== 'All' ? barangay : undefined,
                reportType
            });
            if (res.success && res.data) {
                setData(res.data);
                setGenerated(true);
            } else {
                setError(res.message || 'Failed to generate report');
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
            setError('Failed to generate report. Please try again.');
        } finally{
            setLoading(false);
        }
    }, [
        startDate,
        endDate,
        barangay,
        reportType
    ]);
    // Auto-fetch on first load
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const overview = data?.overview;
    const distributions = data?.distributions ?? [];
    const monthlyTrends = data?.monthlyTrends ?? [];
    const barangayBreakdown = data?.barangayBreakdown ?? [];
    const verification = data?.verificationMethods;
    // Pagination for Distribution Activity Log
    const totalPages = Math.max(1, Math.ceil(distributions.length / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
    const distStartIndex = (safeCurrentPage - 1) * pageSize;
    const distEndIndex = Math.min(distributions.length, distStartIndex + pageSize);
    const paginatedDistributions = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        return distributions.slice(distStartIndex, distEndIndex);
    }, [
        distributions,
        distStartIndex,
        distEndIndex
    ]);
    const applyDatePreset = (preset)=>{
        setActivePreset(preset);
        const { start, end } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getDatePresetRange"](preset);
        setStartDate(start);
        setEndDate(end);
        setCurrentPage(1);
        setBrgyCurrentPage(1);
    };
    // Barangay summary aggregation (for barangay report type)
    const barangaySummaryRows = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (reportType !== 'barangay' || !distributions.length) return [];
        const map = new Map();
        for (const d of distributions){
            const existing = map.get(d.barangay) || {
                barangay: d.barangay,
                distributions: 0,
                registered: 0,
                claimed: 0,
                unclaimed: 0
            };
            existing.distributions++;
            existing.registered += d.registeredHouseholds;
            existing.claimed += d.claimedHouseholds;
            existing.unclaimed += d.unclaimedHouseholds;
            map.set(d.barangay, existing);
        }
        return Array.from(map.values()).sort((a, b)=>b.distributions - a.distributions);
    }, [
        reportType,
        distributions
    ]);
    // Pagination for Barangay Summary
    const brgyTotalPages = Math.max(1, Math.ceil(barangaySummaryRows.length / brgyPageSize));
    const brgySafeCurrentPage = Math.min(Math.max(1, brgyCurrentPage), brgyTotalPages);
    const brgyStartIndex = (brgySafeCurrentPage - 1) * brgyPageSize;
    const brgyEndIndex = Math.min(barangaySummaryRows.length, brgyStartIndex + brgyPageSize);
    const paginatedBarangayRows = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        return barangaySummaryRows.slice(brgyStartIndex, brgyEndIndex);
    }, [
        barangaySummaryRows,
        brgyStartIndex,
        brgyEndIndex
    ]);
    const barangayItems = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>[
            {
                value: 'All',
                label: 'All Barangays'
            },
            ...scopedBarangays.map((b)=>({
                    value: b,
                    label: b
                }))
        ], [
        scopedBarangays
    ]);
    const onToggleMenu = (id, e)=>{
        e.stopPropagation();
        if (activeMenu === id) {
            setActiveMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuOpensUp(window.innerHeight - rect.bottom < 160);
        setActiveMenu(id);
    };
    const handleExportCSV = ()=>{
        if (!distributions.length) return;
        const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'all';
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["downloadCSV"](distributions, `distribution_report_${dateRange}.csv`);
    };
    const handleExportRowCSV = (row)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["downloadCSV"]([
            row
        ], `distribution_${row.barangay}_${row.id}.csv`);
        setActiveMenu(null);
    };
    // Date range label for the table header
    const dateRangeLabel = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (startDate && endDate) {
            return `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"](startDate)} — ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"](endDate)}`;
        }
        if (startDate) return `From ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"](startDate)}`;
        if (endDate) return `Until ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"](endDate)}`;
        return 'All Time';
    }, [
        startDate,
        endDate
    ]);
    return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "print:hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mb-3.5 flex flex-wrap items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterIcon"], {
                                            className: "h-4 w-4"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 201,
                                            columnNumber: 15
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 200,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                        children: "Report Parameters & Filters"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 203,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 199,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800 text-xs font-semibold",
                                children: [
                                    {
                                        id: 'all',
                                        label: 'All'
                                    },
                                    {
                                        id: 'today',
                                        label: 'Today'
                                    },
                                    {
                                        id: '7d',
                                        label: '7 Days'
                                    },
                                    {
                                        id: '30d',
                                        label: '30 Days'
                                    },
                                    {
                                        id: 'month',
                                        label: 'This Month'
                                    },
                                    {
                                        id: 'ytd',
                                        label: 'YTD'
                                    }
                                ].map((p)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>applyDatePreset(p.id),
                                        className: `px-2.5 py-1 rounded-lg transition-all ${activePreset === p.id ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`,
                                        children: p.label
                                    }, p.id, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 216,
                                        columnNumber: 15
                                    }, this))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 198,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                        className: "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400",
                                        children: "Report Type"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 235,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Dropdown"], {
                                        value: reportType,
                                        buttonLabel: "Distribution Summary",
                                        items: REPORT_TYPES.map((t)=>({
                                                value: t.value,
                                                label: t.label
                                            })),
                                        onChange: (v)=>setReportType(v),
                                        widthClass: "w-full"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 238,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 234,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                        className: "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400",
                                        children: "Start Date"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 248,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                        type: "date",
                                        value: startDate,
                                        onChange: (e)=>{
                                            setStartDate(e.target.value);
                                            setActivePreset('custom');
                                        },
                                        className: "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 251,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 247,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                        className: "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400",
                                        children: "End Date"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 260,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("input", {
                                        type: "date",
                                        value: endDate,
                                        onChange: (e)=>{
                                            setEndDate(e.target.value);
                                            setActivePreset('custom');
                                        },
                                        className: "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-700 shadow-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 263,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 259,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("label", {
                                        className: "mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400",
                                        children: "Sector / Barangay"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 272,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Dropdown"], {
                                        value: barangay,
                                        buttonLabel: "All Barangays",
                                        items: barangayItems,
                                        onChange: setBarangay,
                                        widthClass: "w-full"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 275,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 271,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 233,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex flex-wrap items-center gap-2.5",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: fetchReport,
                                        disabled: loading,
                                        className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 hover:shadow-md",
                                        children: [
                                            loading ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 295,
                                                columnNumber: 17
                                            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BoltIcon"], {
                                                className: "w-4 h-4"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 297,
                                                columnNumber: 17
                                            }, this),
                                            loading ? 'Compiling...' : 'Generate Report'
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 288,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: ()=>window.print(),
                                        className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DocIcon"], {
                                                className: "h-4 w-4 text-slate-500 dark:text-slate-400"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 307,
                                                columnNumber: 15
                                            }, this),
                                            "Print"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 302,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                        type: "button",
                                        onClick: handleExportCSV,
                                        disabled: !distributions.length,
                                        className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DownloadIcon"], {
                                                className: "h-4 w-4 text-slate-500 dark:text-slate-400"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 317,
                                                columnNumber: 15
                                            }, this),
                                            "Export CSV"
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 311,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 287,
                                columnNumber: 11
                            }, this),
                            (startDate || endDate || barangay !== 'All' || activePreset !== 'all') && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                type: "button",
                                onClick: ()=>{
                                    setStartDate('');
                                    setEndDate('');
                                    setBarangay('All');
                                    setReportType('distribution');
                                    setActivePreset('all');
                                },
                                className: "inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ClearIcon"], {
                                        className: "h-3.5 w-3.5"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 328,
                                        columnNumber: 15
                                    }, this),
                                    "Reset Filters"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 286,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlertIcon"], {
                        className: "w-5 h-5 text-red-500 mt-0.5 flex-shrink-0"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 338,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "font-semibold text-red-800 dark:text-red-300",
                                children: "Error generating report"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 340,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "mt-0.5 text-xs text-red-600 dark:text-red-400",
                                children: error
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 341,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 339,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 337,
                columnNumber: 9
            }, this),
            generated && overview && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatCard"], {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CubeIcon"], {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 350,
                            columnNumber: 19
                        }, void 0),
                        title: "Total Distributions",
                        value: `${overview.totalDistributions.toLocaleString()}`,
                        subtitle: "Scheduled cycles",
                        variant: "blue"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 349,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatCard"], {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UsersIcon"], {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 357,
                            columnNumber: 19
                        }, void 0),
                        title: "Households Served",
                        value: `${overview.totalClaimedHouseholds.toLocaleString()}`,
                        subtitle: "Verified recipients",
                        variant: "emerald"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatCard"], {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TrendIcon"], {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 364,
                            columnNumber: 19
                        }, void 0),
                        title: "Overall Claim Rate",
                        value: `${overview.claimRate}%`,
                        subtitle: "Distribution coverage",
                        variant: "purple"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 363,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatCard"], {
                        icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UnclaimedIcon"], {
                            className: "w-5 h-5"
                        }, void 0, false, {
                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                            lineNumber: 371,
                            columnNumber: 19
                        }, void 0),
                        title: "Unclaimed Packages",
                        value: `${overview.totalUnclaimedHouseholds.toLocaleString()}`,
                        subtitle: "Pending follow-up",
                        variant: "amber"
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 370,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 348,
                columnNumber: 9
            }, this),
            loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LoadingSpinner"], {}, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 381,
                columnNumber: 19
            }, this),
            generated && !loading && reportType === 'distribution' && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DocIcon"], {
                                                className: "h-5 w-5 text-emerald-600 dark:text-emerald-400"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 389,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                children: "Distribution Activity Log"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 390,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 388,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400",
                                        children: [
                                            "Filtered period: ",
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("strong", {
                                                className: "text-slate-700 dark:text-slate-300",
                                                children: dateRangeLabel
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 393,
                                                columnNumber: 34
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 392,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 387,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                children: [
                                    distributions.length,
                                    " records found"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 396,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 386,
                        columnNumber: 11
                    }, this),
                    distributions.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                        message: "No distributions found matching the selected filter criteria."
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 402,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "overflow-x-auto w-full",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("table", {
                                    className: "w-full text-left border-collapse table-fixed min-w-[900px]",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("thead", {
                                            className: "bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800",
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[14%]",
                                                        children: "Scheduled Date"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 409,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[16%]",
                                                        children: "Barangay Sector"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 410,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[12%] text-right",
                                                        children: "Registered"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 411,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[12%] text-right",
                                                        children: "Claimed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 412,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[12%] text-right",
                                                        children: "Unclaimed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 413,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[18%]",
                                                        children: "Turnout Rate"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 414,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[11%] text-center",
                                                        children: "Status"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 415,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[5%]"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 416,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 408,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 407,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tbody", {
                                            className: "divide-y divide-slate-100 text-xs sm:text-sm dark:divide-slate-800",
                                            children: paginatedDistributions.map((r, idx)=>/*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                                    className: `hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`,
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 font-medium text-slate-600 dark:text-slate-300",
                                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["formatDate"](r.scheduled || r.createdAt)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 422,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100",
                                                            children: r.barangay
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 425,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300",
                                                            children: r.registeredHouseholds.toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 428,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400",
                                                            children: r.claimedHouseholds.toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 431,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-semibold text-amber-600 dark:text-amber-400",
                                                            children: r.unclaimedHouseholds.toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 434,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ClaimRateBar"], {
                                                                rate: r.claimRate
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 438,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 437,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-center",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StatusPill"], {
                                                                status: r.status
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 441,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 440,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right relative",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                className: "relative inline-block",
                                                                ref: activeMenu === r.id ? rowMenuWrapRef : undefined,
                                                                children: [
                                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("button", {
                                                                        onClick: (e)=>onToggleMenu(r.id, e),
                                                                        className: "rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors",
                                                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DotsIcon"], {}, void 0, false, {
                                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                            lineNumber: 449,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    }, void 0, false, {
                                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                        lineNumber: 445,
                                                                        columnNumber: 29
                                                                    }, this),
                                                                    activeMenu === r.id && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                                        className: [
                                                                            'absolute right-0 z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900',
                                                                            menuOpensUp ? 'bottom-full mb-2' : 'top-full mt-2'
                                                                        ].join(' '),
                                                                        children: [
                                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuItem"], {
                                                                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EyeIcon"], {}, void 0, false, {
                                                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                    lineNumber: 459,
                                                                                    columnNumber: 41
                                                                                }, void 0),
                                                                                label: "View Details",
                                                                                onClick: ()=>{
                                                                                    setDetailRow(r);
                                                                                    setActiveMenu(null);
                                                                                }
                                                                            }, void 0, false, {
                                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                lineNumber: 458,
                                                                                columnNumber: 33
                                                                            }, this),
                                                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MenuItem"], {
                                                                                icon: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DownloadIcon"], {
                                                                                    className: "w-4 h-4"
                                                                                }, void 0, false, {
                                                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                    lineNumber: 464,
                                                                                    columnNumber: 41
                                                                                }, void 0),
                                                                                label: "Export Row CSV",
                                                                                onClick: ()=>handleExportRowCSV(r)
                                                                            }, void 0, false, {
                                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                                lineNumber: 463,
                                                                                columnNumber: 33
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                        lineNumber: 452,
                                                                        columnNumber: 31
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 444,
                                                                columnNumber: 27
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 443,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, r.id, true, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 421,
                                                    columnNumber: 23
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 419,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 406,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 405,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Pagination"], {
                                currentPage: safeCurrentPage,
                                totalPages: totalPages,
                                pageSize: pageSize,
                                totalItems: distributions.length,
                                onPageChange: setCurrentPage,
                                onPageSizeChange: (newSize)=>{
                                    setPageSize(newSize);
                                    setCurrentPage(1);
                                }
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 479,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "border-t border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-900/80",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                    className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCell"], {
                                            label: "Total Batches",
                                            value: `${overview?.totalDistributions ?? 0}`
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 494,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCell"], {
                                            label: "Mapped Households",
                                            value: `${overview?.totalRegisteredHouseholds?.toLocaleString() ?? 0}`
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 495,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCell"], {
                                            label: "Claimed Packages",
                                            value: `${overview?.totalClaimedHouseholds?.toLocaleString() ?? 0}`,
                                            valueClass: "text-emerald-600 dark:text-emerald-400"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 496,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCell"], {
                                            label: "Unclaimed Packages",
                                            value: `${overview?.totalUnclaimedHouseholds?.toLocaleString() ?? 0}`,
                                            valueClass: "text-amber-600 dark:text-amber-400"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 497,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SummaryCell"], {
                                            label: "Average Turnout",
                                            value: `${overview?.claimRate ?? 0}%`,
                                            valueClass: "text-purple-600 dark:text-purple-400"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 498,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 493,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 492,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 385,
                columnNumber: 9
            }, this),
            generated && !loading && reportType === 'barangay' && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "border-b border-slate-100 p-4 sm:p-5 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DocIcon"], {
                                                className: "h-5 w-5 text-emerald-600 dark:text-emerald-400"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 512,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                                children: "Sector / Barangay Aggregated Summary"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 513,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 511,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "mt-0.5 text-xs text-slate-500 dark:text-slate-400",
                                        children: "Performance grouped across barangay jurisdictions"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 515,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 510,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
                                children: [
                                    barangaySummaryRows.length,
                                    " sectors active"
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 519,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 509,
                        columnNumber: 11
                    }, this),
                    barangaySummaryRows.length === 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                        message: "No data found for the selected filters."
                    }, void 0, false, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 525,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "overflow-x-auto w-full",
                                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("table", {
                                    className: "w-full text-left border-collapse table-fixed min-w-[700px]",
                                    children: [
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("thead", {
                                            className: "bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800",
                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                                children: [
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[22%]",
                                                        children: "Barangay Sector"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 532,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[14%] text-right",
                                                        children: "Distributions"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 533,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[16%] text-right",
                                                        children: "Registered"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 534,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[16%] text-right",
                                                        children: "Claimed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 535,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[14%] text-right",
                                                        children: "Unclaimed"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 536,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("th", {
                                                        className: "px-4 py-3.5 w-[18%]",
                                                        children: "Turnout Rate"
                                                    }, void 0, false, {
                                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                        lineNumber: 537,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 531,
                                                columnNumber: 21
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 530,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tbody", {
                                            className: "divide-y divide-slate-100 text-xs sm:text-sm dark:divide-slate-800",
                                            children: paginatedBarangayRows.map((r, idx)=>{
                                                const rate = r.registered > 0 ? Math.round(r.claimed / r.registered * 100) : 0;
                                                return /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("tr", {
                                                    className: `hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`,
                                                    children: [
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 font-bold text-slate-900 dark:text-slate-100",
                                                            children: r.barangay
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 545,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300",
                                                            children: r.distributions
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 546,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-medium text-slate-700 dark:text-slate-300",
                                                            children: r.registered.toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 547,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400",
                                                            children: r.claimed.toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 548,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5 text-right font-semibold text-amber-600 dark:text-amber-400",
                                                            children: r.unclaimed.toLocaleString()
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 549,
                                                            columnNumber: 27
                                                        }, this),
                                                        /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("td", {
                                                            className: "px-4 py-3.5",
                                                            children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ClaimRateBar"], {
                                                                rate: rate
                                                            }, void 0, false, {
                                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                                lineNumber: 550,
                                                                columnNumber: 55
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                            lineNumber: 550,
                                                            columnNumber: 27
                                                        }, this)
                                                    ]
                                                }, r.barangay, true, {
                                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                    lineNumber: 544,
                                                    columnNumber: 25
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 540,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                    lineNumber: 529,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 528,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Pagination"], {
                                currentPage: brgySafeCurrentPage,
                                totalPages: brgyTotalPages,
                                pageSize: brgyPageSize,
                                totalItems: barangaySummaryRows.length,
                                onPageChange: setBrgyCurrentPage,
                                onPageSizeChange: (newSize)=>{
                                    setBrgyPageSize(newSize);
                                    setBrgyCurrentPage(1);
                                }
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 559,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 508,
                columnNumber: 9
            }, this),
            generated && !loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "grid grid-cols-1 lg:grid-cols-12 gap-5",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)] flex flex-col justify-between",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                        className: "font-bold text-slate-900 dark:text-slate-100 text-base",
                                        children: "Monthly Volume Comparison"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 581,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                        className: "mb-4 text-xs text-slate-500 dark:text-slate-400",
                                        children: "Distributions planned vs actual claims fulfilled"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 582,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 580,
                                columnNumber: 13
                            }, this),
                            monthlyTrends.length > 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MiniBarChart"], {
                                labels: monthlyTrends.map((t)=>t.month.split(' ')[0]),
                                seriesA: monthlyTrends.map((t)=>t.distributions),
                                seriesB: monthlyTrends.map((t)=>t.claimed),
                                legendA: "Distributions",
                                legendB: "Claims"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 585,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "py-10 text-center text-xs text-slate-400",
                                children: "No trend data available"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 593,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 579,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "lg:col-span-6 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)] flex flex-col justify-between",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                        className: "font-bold text-slate-900 dark:text-slate-100 text-base",
                                        children: "Sector Allocation Share"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 600,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                        className: "mb-4 text-xs text-slate-500 dark:text-slate-400",
                                        children: "Distribution events share by barangay"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 601,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 599,
                                columnNumber: 13
                            }, this),
                            barangayBreakdown.length > 0 ? /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Donut"], {
                                segments: barangayBreakdown.map((b, i)=>({
                                        label: b.barangay,
                                        value: b.distributions,
                                        stroke: DONUT_COLORS[i % DONUT_COLORS.length]
                                    }))
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 604,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "py-10 text-center text-xs text-slate-400",
                                children: "No sector data available"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 612,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 598,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 577,
                columnNumber: 9
            }, this),
            generated && !loading && verification && (verification.qr > 0 || verification.face > 0) && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_6px_16px_rgba(0,0,0,0.03)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_1px_3px_rgba(0,0,0,0.25)]",
                children: [
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "flex items-center justify-between mb-3",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("h3", {
                                        className: "font-bold text-slate-900 dark:text-slate-100 text-base",
                                        children: "Verification Method Distribution"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 623,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("p", {
                                        className: "text-xs text-slate-500 dark:text-slate-400",
                                        children: "Breakdown of authentication modalities employed for claims"
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 624,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 622,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("span", {
                                className: "text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
                                children: "Multi-factor Enabled"
                            }, void 0, false, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 626,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 621,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                        className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4",
                        children: [
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 rounded-xl p-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QRIcon"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 634,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 633,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "min-w-0",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xl font-extrabold text-slate-900 dark:text-slate-100",
                                                children: verification.qr.toLocaleString()
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 637,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xs font-semibold text-blue-700 dark:text-blue-300",
                                                children: "QR Code Scans"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 638,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 636,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 632,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3.5 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 rounded-xl p-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FaceIcon"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 644,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 643,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "min-w-0",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xl font-extrabold text-slate-900 dark:text-slate-100",
                                                children: verification.face.toLocaleString()
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 647,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xs font-semibold text-purple-700 dark:text-purple-300",
                                                children: "Biometric Face Recognition"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 648,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 646,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 642,
                                columnNumber: 13
                            }, this),
                            verification.unknown > 0 && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                className: "flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 rounded-xl p-4",
                                children: [
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0",
                                        children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QuestionIcon"], {
                                            className: "w-5 h-5"
                                        }, void 0, false, {
                                            fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                            lineNumber: 655,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 654,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                        className: "min-w-0",
                                        children: [
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xl font-extrabold text-slate-900 dark:text-slate-100",
                                                children: verification.unknown.toLocaleString()
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 658,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                                                className: "text-xs font-semibold text-slate-500 dark:text-slate-400",
                                                children: "Manual / Override Claims"
                                            }, void 0, false, {
                                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                                lineNumber: 659,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                        lineNumber: 657,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                                lineNumber: 653,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                        lineNumber: 631,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 620,
                columnNumber: 9
            }, this),
            !generated && !loading && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"]("div", {
                className: "rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900",
                children: /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$ReportsHelpers$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EmptyState"], {
                    message: "Select desired filters and click Generate Report to compile analytics."
                }, void 0, false, {
                    fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                    lineNumber: 670,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 669,
                columnNumber: 9
            }, this),
            detailRow && /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$future$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"](__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$reports$2f$DetailModal$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DetailModal"], {
                row: detailRow,
                onClose: ()=>setDetailRow(null)
            }, void 0, false, {
                fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
                lineNumber: 675,
                columnNumber: 21
            }, this)
        ]
    }, void 0, true, {
        fileName: "<[project]/src/components/reports/ReportsPageClient.tsx>",
        lineNumber: 195,
        columnNumber: 5
    }, this);
}

})()),

};

//# sourceMappingURL=src_afff2e._.js.map