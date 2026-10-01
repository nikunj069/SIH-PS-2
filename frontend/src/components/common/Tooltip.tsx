import React, { useState } from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<{
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    'aria-describedby'?: string;
  }>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = React.useId();

  if (!content) return children;

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position];

  return (
    <div className="relative inline-flex items-center">
      {React.cloneElement(children, {
        onMouseEnter: (e: React.MouseEvent) => {
          setIsVisible(true);
          children.props.onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          setIsVisible(false);
          children.props.onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
          setIsVisible(true);
          children.props.onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
          setIsVisible(false);
          children.props.onBlur?.(e);
        },
        'aria-describedby': isVisible ? tooltipId : undefined,
      })}

      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`
            absolute z-50 px-2.5 py-1.5 text-xs font-normal text-white bg-slate-900
            rounded shadow-md pointer-events-none whitespace-normal max-w-xs transition-opacity duration-150
            ${positionStyles}
            ${className}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};
