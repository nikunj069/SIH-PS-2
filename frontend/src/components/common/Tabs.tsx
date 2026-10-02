export interface TabItem<T extends string = string> {
 id: T;
 label: string;
 badge?: number | string;
}

export interface TabsProps<T extends string = string> {
 tabs: TabItem<T>[];
 activeTab: T;
 onChange: (tabId: T) => void;
 variant?: 'pills' | 'underline';
 className?: string;
}

export function Tabs<T extends string = string>({
 tabs,
 activeTab,
 onChange,
 variant = 'pills',
 className = '',
}: TabsProps<T>) {
 if (variant === 'underline') {
 return (
 <div className={`flex border-b border-border gap-6 ${className}`} role="tablist">
 {tabs.map((tab) => {
 const isActive = tab.id === activeTab;
 return (
 <button
 key={tab.id}
 role="tab"
 aria-selected={isActive}
 tabIndex={isActive ? 0 : -1}
 onClick={() => onChange(tab.id)}
 className={`
 h-10 min-w-[40px] px-1 text-sm font-semibold transition-all relative outline-none flex items-center gap-2 cursor-pointer
 ${isActive ? 'text-primary' : 'text-text-muted hover:text-text'}
 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
 `}
 >
 <span>{tab.label}</span>
 {tab.badge !== undefined && (
 <span
 className={`
 px-1.5 py-0.5 text-xs rounded-full font-medium
 ${isActive ? 'bg-primary-soft text-primary' : 'bg-surface-alt text-text-muted'}
 `}
 >
 {tab.badge}
 </span>
 )}
 {isActive && (
 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t" />
 )}
 </button>
 );
})}
 </div>
 );
}

 // Pills variant (default)
 return (
 <div
 className={`inline-flex items-center p-1 bg-surface-alt border border-border rounded-control gap-1 ${className}`}
 role="tablist"
 >
 {tabs.map((tab) => {
 const isActive = tab.id === activeTab;
 return (
 <button
 key={tab.id}
 role="tab"
 aria-selected={isActive}
 tabIndex={isActive ? 0 : -1}
 onClick={() => onChange(tab.id)}
 className={`
 h-9 min-w-[40px] px-3.5 text-sm font-medium rounded-md transition-all outline-none flex items-center gap-1.5 cursor-pointer
 ${
 isActive
 ? 'bg-surface text-text shadow-sm font-semibold'
 : 'text-text-muted hover:text-text hover:bg-slate-200/50'
}
 focus-visible:ring-2 focus-visible:ring-primary
 `}
 >
 <span>{tab.label}</span>
 {tab.badge !== undefined && (
 <span
 className={`
 px-1.5 py-0.2 text-xs rounded-full
 ${isActive ? 'bg-primary-soft text-primary font-semibold' : 'bg-slate-200 text-text-muted'}
 `}
 >
 {tab.badge}
 </span>
 )}
 </button>
 );
})}
 </div>
 );
}
