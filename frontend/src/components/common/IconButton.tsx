import React, { forwardRef} from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 icon: React.ReactNode;
 'aria-label': string;
 variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
 icon,
 'aria-label': ariaLabel,
 variant = 'secondary',
 className = '',
 disabled,
 ...props
}, ref) => {
 // Never black. Secondary icon buttons are white with a visible 1-px border and blue icon/tooltip
 const variantStyles = {
 primary: 'bg-[#0B63CE] text-text hover:bg-[#0A55B0] active:bg-[#084792] border-transparent',
 secondary: 'bg-white text-[#0B63CE] border border-[#D9E0EA] hover:bg-surface-alt active:bg-surface-alt',
 ghost: 'bg-transparent text-[#0F172A] hover:bg-surface-alt border-transparent',
 danger: 'bg-[#B42318] text-text hover:bg-red-700 border-transparent'
}[variant];

 return (
 <button
 ref={ref}
 aria-label={ariaLabel}
 title={ariaLabel}
 disabled={disabled}
 className={`
 inline-flex items-center justify-center transition-all duration-150 rounded-[8px]
 w-10 h-10 outline-none focus-visible:ring-3 focus-visible:ring-[#0B63CE] focus-visible:ring-offset-2
 shadow-sm disabled: disabled:cursor-not-allowed
 ${variantStyles}
 ${className}
 `}
 {...props}
 >
 {icon}
 </button>
 );
});

IconButton.displayName = 'IconButton';
