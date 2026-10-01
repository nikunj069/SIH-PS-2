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

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
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
}, ref) => {
  const isDisabled = disabled || isLoading;

  // Sizing definitions: heights 36px (sm), 40px (md default), 48px (lg hero)
  const sizeStyles = {
    sm: 'h-9 px-3.5 text-xs font-medium gap-1.5 rounded-control',
    md: 'h-10 px-4 text-sm font-semibold gap-2 rounded-control',
    lg: 'h-12 px-6 text-base font-semibold gap-2.5 rounded-control',
  }[size];

  // Variant definitions with strict contrast and state specifications
  const variantStyles = {
    primary: [
      'bg-primary text-white border border-transparent shadow-sm',
      'hover:bg-primary-hover active:bg-primary-press',
      'focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:bg-slate-200 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:shadow-none'
    ].join(' '),

    secondary: [
      'bg-surface text-primary border-2 border-primary shadow-sm',
      'hover:bg-primary-soft active:bg-blue-100',
      'focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200 disabled:cursor-not-allowed disabled:shadow-none'
    ].join(' '),

    ghost: [
      'bg-transparent text-primary border border-transparent',
      'hover:bg-primary-soft/60 active:bg-primary-soft',
      'focus-visible:ring-2 focus-visible:ring-primary',
      'disabled:text-slate-300 disabled:cursor-not-allowed'
    ].join(' '),

    danger: [
      'bg-danger text-white border border-transparent shadow-sm',
      'hover:bg-red-700 active:bg-red-800',
      'focus-visible:ring-3 focus-visible:ring-danger focus-visible:ring-offset-2',
      'disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed'
    ].join(' ')
  }[variant];

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      title={disabled && disabledReason ? disabledReason : undefined}
      className={`
        inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer
        outline-none focus:outline-none min-h-[36px]
        ${sizeStyles}
        ${variantStyles}
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
