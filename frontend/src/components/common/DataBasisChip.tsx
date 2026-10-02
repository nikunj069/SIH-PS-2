import React from 'react';
import { Info} from 'lucide-react';
import { normalizeProvenance, type RawProvenance} from '../../utils/provenance';
import { Tooltip} from './Tooltip';

export interface DataBasisChipProps {
 provenance?: RawProvenance | string | null;
 className?: string;
}

export const DataBasisChip: React.FC<DataBasisChipProps> = ({
 provenance,
 className = ''
}) => {
 const meta = normalizeProvenance(provenance);

 return (
 <Tooltip content={meta.description} position="top">
 <span
 tabIndex={0}
 aria-label={`Data basis: ${meta.label}. ${meta.description}`}
 className={`
 inline-flex items-center gap-1 px-2 py-0.5 text-[13px] leading-[18px] font-normal
 rounded-full border transition-colors cursor-help outline-none focus-visible:ring-2 focus-visible:ring-primary
 ${meta.colorClass}
 ${className}
 `}
 >
 <Info className="w-3.5 h-3.5 shrink-0 " />
 <span>{meta.label}</span>
 </span>
 </Tooltip>
 );
};
