import React, { useState, useMemo} from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown} from 'lucide-react';

export interface Column<T> {
 key: string;
 header: string;
 align?: 'left' | 'center' | 'right';
 sortable?: boolean;
 render?: (row: T) => React.ReactNode;
 width?: string;
 analystOnly?: boolean;
}

export interface DataTableProps<T> {
 columns: Column<T>[];
 data: T[];
 keyExtractor: (row: T) => string;
 onRowClick?: (row: T) => void;
 selectedId?: string | null;
 emptyState?: React.ReactNode;
 isLoading?: boolean;
 className?: string;
 analystMode?: boolean;
}

export function DataTable<T extends object>({
 columns,
 data,
 keyExtractor,
 onRowClick,
 selectedId,
 emptyState,
 isLoading = false,
 className = '',
 analystMode = false,
}: DataTableProps<T>) {
 const [sortKey, setSortKey] = useState<string | null>(null);
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

 // Filter columns based on analystMode
 const visibleColumns = useMemo(() => {
 return columns.filter(col => !col.analystOnly || analystMode);
}, [columns, analystMode]);

 // Handle sorting
 const handleSort = (key: string) => {
 if (sortKey === key) {
 if (sortDirection === 'asc') {
 setSortDirection('desc');
} else {
 setSortKey(null);
 setSortDirection('asc');
}
} else {
 setSortKey(key);
 setSortDirection('asc');
}
};

 const sortedData = useMemo(() => {
 if (!sortKey) return data;

 return [...data].sort((a, b) => {
 const valA = (a as Record<string, unknown>)[sortKey];
 const valB = (b as Record<string, unknown>)[sortKey];

 if (valA === valB) return 0;
 if (valA === undefined || valA === null) return 1;
 if (valB === undefined || valB === null) return -1;

 let comparison = 0;
 if (typeof valA === 'number' && typeof valB === 'number') {
 comparison = valA - valB;
} else {
 comparison = String(valA).localeCompare(String(valB));
}

 return sortDirection === 'asc' ? comparison : -comparison;
});
}, [data, sortKey, sortDirection]);

 if (isLoading) {
 return (
 <div className="w-full bg-white/90 border border-slate-200/80 rounded-2xl overflow-hidden p-6 space-y-4">
 <div className="h-6 bg-slate-100 animate-pulse rounded w-1/4" />
 <div className="space-y-3">
 {Array.from({ length: 5}).map((_, i) => (
 <div key={i} className="h-12 bg-slate-100 animate-pulse rounded w-full" />
 ))}
 </div>
 </div>
 );
}

 if (sortedData.length === 0 && emptyState) {
 return <div className="w-full">{emptyState}</div>;
}

 return (
 <div className={`w-full overflow-hidden border border-slate-200/80 rounded-2xl bg-white/90 shadow-card ${className}`}>
 <div className="w-full overflow-x-auto">
 <table className="w-full text-left border-collapse min-w-[720px]">
 {/* Sticky Header */}
 <thead className="bg-slate-50 border-b border-slate-200/80 sticky top-0 z-10">
 <tr>
 {visibleColumns.map((col) => {
 const isSorted = sortKey === col.key;
 const alignClass =
 col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left';

 return (
 <th
 key={col.key}
 scope="col"
 style={{ width: col.width}}
 className={`
 px-4 py-3.5 text-xs font-semibold text-text-muted  select-none
 ${alignClass}
 ${col.sortable ? 'cursor-pointer hover:bg-slate-100/80 hover:text-slate-800 transition-colors' : ''}
 `}
 onClick={col.sortable ? () => handleSort(col.key) : undefined}
 >
 <div
 className={`inline-flex items-center gap-1.5 ${
 col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
}`}
 >
 <span>{col.header}</span>
 {col.sortable && (
 <span className="text-text-muted">
 {isSorted ? (
 sortDirection === 'asc' ? (
 <ArrowUp className="w-3.5 h-3.5 text-amber-500" />
 ) : (
 <ArrowDown className="w-3.5 h-3.5 text-amber-500" />
 )
 ) : (
 <ArrowUpDown className="w-3 h-3 " />
 )}
 </span>
 )}
 </div>
 </th>
 );
})}
 </tr>
 </thead>

 {/* Table Body - 56px rows, hover, selected state */}
 <tbody className="divide-y divide-slate-100 text-sm text-[#0f172a]">
 {sortedData.map((row) => {
 const rowId = keyExtractor(row);
 const isSelected = selectedId === rowId;
 const isClickable = Boolean(onRowClick);

 return (
 <tr
 key={rowId}
 onClick={isClickable ? () => onRowClick?.(row) : undefined}
 className={`
 h-14 transition-colors
 ${isSelected ? 'bg-amber-50/60 ring-1 ring-inset ring-amber-400' : 'hover:bg-slate-50'}
 ${isClickable ? 'cursor-pointer' : ''}
 `}
 >
 {visibleColumns.map((col) => {
 const alignClass =
 col.align === 'right' ? 'text-right font-medium tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left';

 return (
 <td key={col.key} className={`px-4 py-3 ${alignClass}`}>
 {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
 </td>
 );
})}
 </tr>
 );
})}
 </tbody>
 </table>
 </div>
 </div>
 );
}
