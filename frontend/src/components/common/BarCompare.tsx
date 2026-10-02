import React from 'react';

export interface BarCompareProps {
  label1: string;
  value1: number;
  value1Display: string;
  color1?: string; // e.g. '#64748B' (slate) or '#B42318' (red)
  
  label2: string;
  value2: number;
  value2Display: string;
  color2?: string; // e.g. '#0B63CE' (blue) or '#0F7B5F' (teal)
  
  maxValue: number;
  insightText?: React.ReactNode;
  className?: string;
}

export const BarCompare: React.FC<BarCompareProps> = ({
  label1, value1, value1Display, color1 = '#64748B',
  label2, value2, value2Display, color2 = '#0B63CE',
  maxValue,
  insightText,
  className = ''
}) => {
  const p1 = Math.min(100, Math.max(0, (value1 / (maxValue || 1)) * 100));
  const p2 = Math.min(100, Math.max(0, (value2 / (maxValue || 1)) * 100));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Row 1 */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#475569]">{label1}</span>
          <span className="text-[#0F172A] font-semibold">{value1Display}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${p1}%`, backgroundColor: color1 }}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#475569] font-medium" style={{ color: color2 }}>{label2}</span>
          <span className="text-[#0F172A] font-bold" style={{ color: color2 }}>{value2Display}</span>
        </div>
        <div className="w-full h-3 rounded-full bg-[#E2E8F0] overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${p2}%`, backgroundColor: color2 }}
          />
        </div>
      </div>

      {/* Insight */}
      {insightText && (
        <p className="text-[13px] text-[#475569] pt-2 border-t border-[#E2E8F0] leading-relaxed">
          {insightText}
        </p>
      )}
    </div>
  );
};
