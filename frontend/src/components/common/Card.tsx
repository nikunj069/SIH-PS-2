import React from 'react';

export interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  onClick?: () => void;
  selected?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  bodyClassName = '',
  onClick,
  selected = false,
}) => {
  const isInteractive = Boolean(onClick);

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
      } : undefined}
      className={`
        bg-white/90 backdrop-blur-sm border rounded-2xl shadow-card
        transition-all duration-200 ease-out
        ${selected
          ? 'border-amber-300 ring-2 ring-amber-200/60 bg-amber-50/40'
          : 'border-slate-200/80'
        }
        ${isInteractive
          ? 'cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 hover:border-slate-300 focus-ring'
          : ''
        }
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-sm font-bold text-[#0f172a] leading-6 truncate">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500 leading-5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0 flex items-center gap-2">{headerAction}</div>
          )}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
};
