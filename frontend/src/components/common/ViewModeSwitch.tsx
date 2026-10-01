import React from 'react';
import { UserCheck, Sliders } from 'lucide-react';
import { copy } from '../../copy/en';
import { Tooltip } from './Tooltip';

export type ViewMode = 'client' | 'analyst';

export interface ViewModeSwitchProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeSwitch: React.FC<ViewModeSwitchProps> = ({
  mode,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center p-0.5 bg-slate-100 border border-border rounded-control ${className}`}
      role="group"
      aria-label="View mode toggle"
    >
      <Tooltip content={copy.viewModes.clientTooltip} position="bottom">
        <button
          type="button"
          onClick={() => onChange('client')}
          aria-pressed={mode === 'client'}
          className={`
            h-8 px-3 text-xs font-semibold rounded-control transition-all flex items-center gap-1.5 cursor-pointer outline-none
            ${
              mode === 'client'
                ? 'bg-surface text-primary shadow-sm border border-border/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }
            focus-visible:ring-2 focus-visible:ring-primary
          `}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{copy.viewModes.client}</span>
        </button>
      </Tooltip>

      <Tooltip content={copy.viewModes.analystTooltip} position="bottom">
        <button
          type="button"
          onClick={() => onChange('analyst')}
          aria-pressed={mode === 'analyst'}
          className={`
            h-8 px-3 text-xs font-semibold rounded-control transition-all flex items-center gap-1.5 cursor-pointer outline-none
            ${
              mode === 'analyst'
                ? 'bg-surface text-primary shadow-sm border border-border/50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }
            focus-visible:ring-2 focus-visible:ring-primary
          `}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{copy.viewModes.analyst}</span>
        </button>
      </Tooltip>
    </div>
  );
};
