import React from 'react';
import { Button, type ButtonProps } from './Button';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  dataBasisLabel?: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: ButtonProps['variant'];
  };
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  dataBasisLabel,
  primaryAction,
  secondaryAction,
  children
}) => {
  return (
    <div className="bg-white rounded-[12px] border border-[#D9E0EA] p-6 shadow-[0_1px_3px_rgba(15,23,42,.08),0_1px_2px_rgba(15,23,42,.04)] relative overflow-hidden mb-6">
      {/* 4-px brand-blue left accent */}
      <div className="absolute top-0 left-0 bottom-0 w-1 bg-[#0B63CE]" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {dataBasisLabel && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                {dataBasisLabel}
              </span>
            </div>
          )}
          <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#0F172A] leading-tight font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {children}
          {secondaryAction && (
            <Button 
              variant={secondaryAction.variant || "secondary"} 
              onClick={secondaryAction.onClick}
              icon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button 
              variant={primaryAction.variant || "primary"} 
              onClick={primaryAction.onClick}
              icon={primaryAction.icon}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
