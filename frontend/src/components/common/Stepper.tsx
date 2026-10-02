import React from 'react';
import { Check} from 'lucide-react';

export interface StepperNode {
 id: string | number;
 label: string;
}

export interface StepperProps {
 nodes: StepperNode[];
 activeStepIndex: number;
 onStepClick?: (index: number) => void;
 className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ nodes, activeStepIndex, onStepClick, className = ''}) => {
 return (
 <div className={`w-full relative ${className}`}>
 {/* Background line */}
 <div className="absolute top-4 left-0 w-full h-[2px] bg-[#E2E8F0]" />
 
 {/* Active progress line */}
 <div 
 className="absolute top-4 left-0 h-[2px] bg-[#0B63CE] transition-all duration-300"
 style={{ width: `${(activeStepIndex / (nodes.length - 1 || 1)) * 100}%`}}
 />
 
 <div className="flex justify-between relative z-10 w-full" role="tablist">
 {nodes.map((node, i) => {
 const isCompleted = i < activeStepIndex;
 const isActive = i === activeStepIndex;
 const isUpcoming = i > activeStepIndex;

 return (
 <div 
 key={node.id} 
 className="flex flex-col items-center group cursor-pointer w-16"
 onClick={() => onStepClick?.(i)}
 role="tab"
 aria-selected={isActive}
 tabIndex={0}
 onKeyDown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 onStepClick?.(i);
}
 // Implement arrow keys for a real robust component, omitting for brevity here
}}
 >
 {/* Node Circle */}
 <div 
 className={`
 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
 transition-all duration-300 bg-white
 ${isCompleted ? 'bg-[#0B63CE] text-text border-2 border-[#0B63CE]' : ''}
 ${isActive ? 'border-4 border-[#0B63CE] text-[#0B63CE] w-9 h-9 -mt-0.5' : ''}
 ${isUpcoming ? 'border-2 border-[#CBD5E1] text-[#64748B]' : ''}
 `}
 aria-label={isActive ? `Current Step: ${node.label}` : isCompleted ? `Completed: ${node.label}` : `Upcoming: ${node.label}`}
 >
 {isCompleted ? <Check className="w-4 h-4 text-text" /> : (i + 1)}
 </div>
 
 {/* Label */}
 <div 
 className={`
 mt-2 text-center text-[11px] leading-tight break-words max-w-[80px]
 ${isActive ? 'font-bold text-[#0F172A]' : 'font-medium text-[#475569]'}
 `}
 >
 {node.label}
 </div>
 </div>
 );
})}
 </div>
 </div>
 );
};
