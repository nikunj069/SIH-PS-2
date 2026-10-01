import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`
        flex flex-col items-center justify-center p-8 text-center bg-danger-soft/40
        border border-danger/30 rounded-card min-h-[220px]
        ${className}
      `}
    >
      <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center text-danger mb-4 shadow-sm">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-base font-semibold text-slate-900 leading-6">
        {title}
      </h4>
      <p className="mt-1 text-sm text-slate-600 max-w-md leading-5">
        {message}
      </p>
      {onRetry && (
        <div className="mt-5">
          <Button
            variant="secondary"
            onClick={onRetry}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
