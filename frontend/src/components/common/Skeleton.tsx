import React from 'react';

export interface SkeletonProps {
 className?: string;
 count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
 className = 'h-4 w-full',
 count = 1,
}) => {
 return (
 <>
 {Array.from({ length: count}).map((_, i) => (
 <div
 key={i}
 className={`
 bg-slate-200/80 animate-pulse rounded
 ${className}
 `}
 aria-hidden="true"
 />
 ))}
 </>
 );
};

export const CardSkeleton: React.FC<{ rows?: number}> = ({ rows = 3}) => (
 <div className="bg-surface border border-border rounded-card p-6 shadow-card space-y-4">
 <div className="flex justify-between items-center">
 <Skeleton className="h-5 w-1/3" />
 <Skeleton className="h-5 w-16 rounded-full" />
 </div>
 <Skeleton className="h-9 w-1/2" />
 <div className="space-y-2 pt-2">
 <Skeleton count={rows} className="h-3.5 w-full" />
 </div>
 </div>
);
