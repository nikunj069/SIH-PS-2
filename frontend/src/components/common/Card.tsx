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
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      className={`
        bg-surface border rounded-card shadow-card transition-all duration-150
        ${selected ? 'border-primary ring-2 ring-primary/20 bg-primary-soft/30' : 'border-border'}
        ${isInteractive ? 'cursor-pointer hover:shadow-card-hover hover:border-border-hover focus-ring' : ''}
        ${className}
      `}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between gap-4 p-6 pb-4 border-b border-border/50">
          <div className="min-w-0 flex-1">
            {title && (
              <h3 className="text-base font-semibold text-slate-900 leading-6 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-600 leading-5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="shrink-0 flex items-center gap-2">
              {headerAction}
            </div>
          )}
        </div>
      )}

      <div className={`p-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};
