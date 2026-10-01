import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import { DataBasisChip } from './DataBasisChip';
import { Tooltip } from './Tooltip';
import type { RawProvenance } from '../../utils/provenance';

export interface KpiDelta {
  value: string;
  isPositiveGood?: boolean; // true = higher is better; false = lower is better (e.g. emissions)
  direction: 'up' | 'down' | 'neutral';
  comparisonText: string;
}

export interface KpiTileProps {
  label: string;
  value?: string | number | null;
  unit?: string;
  caption?: string;
  delta?: KpiDelta;
  provenance?: RawProvenance | string | null;
  tooltipText?: string;
  className?: string;
}

export const KpiTile: React.FC<KpiTileProps> = ({
  label,
  value,
  unit,
  caption,
  delta,
  provenance,
  tooltipText,
  className = '',
}) => {
  const hasValue = value !== undefined && value !== null && value !== '';
  const displayValue = hasValue ? value : '—';

  // Determine delta color and icon
  const getDeltaStyles = (d: KpiDelta) => {
    if (d.direction === 'neutral') {
      return {
        colorClass: 'text-slate-600 bg-slate-100',
        icon: <Minus className="w-3.5 h-3.5" />,
      };
    }

    const isGood = d.isPositiveGood !== undefined
      ? (d.direction === 'up' && d.isPositiveGood) || (d.direction === 'down' && !d.isPositiveGood)
      : d.direction === 'up';

    if (isGood) {
      return {
        colorClass: 'text-success font-medium',
        icon: d.direction === 'up' ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-success" />,
      };
    } else {
      return {
        colorClass: 'text-danger font-medium',
        icon: d.direction === 'up' ? <ArrowUpRight className="w-4 h-4 text-danger" /> : <ArrowDownRight className="w-4 h-4 text-danger" />,
      };
    }
  };

  return (
    <div
      className={`
        bg-surface border border-border rounded-card p-6 shadow-card
        flex flex-col justify-between transition-all duration-150
        hover:border-border-hover min-h-[148px]
        ${className}
      `}
    >
      {/* Top row: Label + definition tooltip + single data basis chip */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-slate-600 leading-5 truncate">
            {label}
          </span>
          {tooltipText && (
            <Tooltip content={tooltipText} position="top">
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                aria-label={`Definition of ${label}`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          )}
        </div>

        {provenance && (
          <div className="shrink-0">
            <DataBasisChip provenance={provenance} />
          </div>
        )}
      </div>

      {/* Main KPI Number + Unit */}
      <div className="flex items-baseline gap-2 my-1">
        <span className="text-4xl font-semibold text-slate-900 tracking-tight tabular-nums leading-10">
          {displayValue}
        </span>
        {unit && hasValue && (
          <span className="text-sm font-normal text-slate-500">
            {unit}
          </span>
        )}
      </div>

      {/* Meaningful Context / Delta row */}
      <div className="mt-2 text-xs leading-4 min-h-[20px] flex items-center">
        {hasValue && delta ? (
          (() => {
            const styles = getDeltaStyles(delta);
            return (
              <div className="flex items-center gap-1">
                <span className="shrink-0 flex items-center">{styles.icon}</span>
                <span className={styles.colorClass}>{delta.value}</span>
                <span className="text-slate-600">{delta.comparisonText}</span>
              </div>
            );
          })()
        ) : caption ? (
          <span className="text-slate-600">{caption}</span>
        ) : (
          <span className="text-slate-400 italic">
            {hasValue ? 'Baseline performance' : 'Not calculated yet'}
          </span>
        )}
      </div>
    </div>
  );
};
