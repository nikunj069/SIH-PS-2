import React from 'react';

export interface InsetPanelProps {
 children: React.ReactNode;
 className?: string;
}

export const InsetPanel: React.FC<InsetPanelProps> = ({ children, className = ''}) => {
 // Use #F1F5F9 with no shadow. Never use mid-gray cards.
 return (
 <div className={`bg-[#F1F5F9] rounded-[12px] p-4 ${className}`}>
 {children}
 </div>
 );
};
