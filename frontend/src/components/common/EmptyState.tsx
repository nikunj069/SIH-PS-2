import React from 'react';
import { Button} from './Button';

export interface EmptyStateProps {
 icon?: React.ReactNode;
 title: string;
 description: string;
 actionLabel?: string;
 onAction?: () => void;
 className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
 icon,
 title,
 description,
 actionLabel,
 onAction,
 className = '',
}) => {
 return (
 <div
 className={`
 flex flex-col items-center justify-center p-8 text-center bg-slate-50/80
 border border-dashed border-slate-200 rounded-2xl min-h-[220px]
 ${className}
 `}
 >
 {icon && (
 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
 {icon}
 </div>
 )}
 <h4 className="text-base font-semibold text-text leading-6">
 {title}
 </h4>
 <p className="mt-1 text-sm text-text-muted max-w-md leading-5">
 {description}
 </p>
 {actionLabel && onAction && (
 <div className="mt-5">
 <Button variant="primary" onClick={onAction}>
 {actionLabel}
 </Button>
 </div>
 )}
 </div>
 );
};
