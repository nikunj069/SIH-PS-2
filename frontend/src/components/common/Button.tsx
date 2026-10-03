import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  disabledReason?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    loadingText = 'Running…',
    icon,
    disabledReason,
    className = '',
    disabled,
    ...props
  },
  ref
) => {
  const isDisabled = disabled || isLoading;

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'h-8 px-3 text-xs font-semibold gap-1.5 rounded-xl',
    md: 'h-10 px-4 text-sm font-semibold gap-2 rounded-xl',
    lg: 'h-12 px-6 text-sm font-bold gap-2.5 rounded-xl',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: [
      'bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-transparent shadow-sm shadow-amber-200',
      'hover:from-amber-400 hover:to-orange-400 hover:shadow-amber active:-translate-y-0',
      'hover:-translate-y-0.5',
      'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
      'disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed disabled:-translate-y-0',
    ].join(' '),

    secondary: [
      'bg-white text-amber-700 border-2 border-amber-300 shadow-sm',
      'hover:bg-amber-50 hover:border-amber-400 hover:-translate-y-0.5',
      'focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2',
      'disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed disabled:-translate-y-0',
    ].join(' '),

    ghost: [
      'bg-transparent text-amber-700 border border-transparent',
      'hover:bg-amber-50 hover:border-amber-200',
      'focus-visible:ring-2 focus-visible:ring-amber-400',
      'disabled:text-slate-400 disabled:cursor-not-allowed',
    ].join(' '),

    danger: [
      'bg-red-500 text-white border border-transparent shadow-sm',
      'hover:bg-red-600 hover:-translate-y-0.5',
      'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2',
      'disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:-translate-y-0',
    ].join(' '),
  };

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      className={`
        inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer
        outline-none focus:outline-none
        ${sizeStyles[size]}
        ${variantStyles[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0 flex items-center">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';
