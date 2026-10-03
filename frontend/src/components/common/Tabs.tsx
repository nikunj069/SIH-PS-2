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
      <div className={`flex border-b border-slate-200 gap-6 ${className}`} role="tablist">
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
                ${isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'}
                focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2
              `}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`
                    px-1.5 py-0.5 text-[10px] rounded-full font-bold
                    ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}
                  `}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t" />
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
      className={`inline-flex items-center p-1 bg-slate-100/80 border border-slate-200/60 rounded-xl gap-1 ${className}`}
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
              h-9 min-w-[40px] px-3.5 text-sm font-medium rounded-lg transition-all outline-none flex items-center gap-1.5 cursor-pointer
              ${
                isActive
                  ? 'bg-white text-[#0f172a] shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }
              focus-visible:ring-2 focus-visible:ring-amber-400
            `}
          >
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`
                  px-1.5 py-0.5 text-[10px] rounded-full font-bold
                  ${isActive ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}
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
