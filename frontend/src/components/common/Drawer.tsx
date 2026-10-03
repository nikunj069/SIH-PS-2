import React, { useEffect} from 'react';
import { X} from 'lucide-react';

export interface DrawerProps {
 isOpen: boolean;
 onClose: () => void;
 title: React.ReactNode;
 subtitle?: React.ReactNode;
 children: React.ReactNode;
 footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
 isOpen,
 onClose,
 title,
 subtitle,
 children,
 footer,
}) => {
 // Listen for Escape key
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && isOpen) {
 onClose();
}
};
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
}, [isOpen, onClose]);

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
 {/* Dimmed backdrop - allows clicking through or clicking to dismiss */}
 <div
 className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm transition-opacity pointer-events-auto"
 onClick={onClose}
 aria-hidden="true"
 />

 <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
 <aside
 role="dialog"
 aria-modal="true"
 aria-label={typeof title === 'string' ? title : 'Detail drawer'}
 className="w-screen max-w-[480px] bg-white/95 backdrop-blur-2xl border-l border-slate-200 shadow-2xl pointer-events-auto flex flex-col h-full animate-in slide-in-from-right duration-200"
 >
 {/* Drawer Header */}
 <div className="flex items-start justify-between p-6 border-b border-slate-200 bg-transparent shrink-0">
 <div className="min-w-0 pr-4">
 <h2 className="text-xl font-bold text-[#0f172a] leading-7 truncate">
 {title}
 </h2>
 {subtitle && (
 <p className="mt-1 text-sm text-slate-500 leading-5">
 {subtitle}
 </p>
 )}
 </div>

 <button
 type="button"
 onClick={onClose}
 className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl focus-ring transition-colors shrink-0"
 aria-label="Close drawer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Drawer Body - Scrollable */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {children}
 </div>

 {/* Drawer Footer if provided */}
 {footer && (
 <div className="p-6 border-t border-slate-200 bg-slate-50/50 shrink-0">
 {footer}
 </div>
 )}
 </aside>
 </div>
 </div>
 );
};
