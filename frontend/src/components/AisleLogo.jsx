import React from 'react';

const AisleLogo = ({ className = "", imgClassName = "h-8", panel, hideSubtitle = false }) => {
    // Dynamic panel detection if not explicitly passed as a prop
    let activePanel = panel;
    if (!activePanel && typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/seller')) {
            activePanel = 'seller';
        } else if (path.startsWith('/admin')) {
            activePanel = 'admin';
        } else if (path.startsWith('/moderator')) {
            activePanel = 'moderator';
        } else {
            activePanel = 'customer';
        }
    }

    return (
        <div className={`flex flex-col justify-center select-none ${className}`}>
            <div className="flex items-center gap-2.5">
                <img
                    src="/Aisle_logo_transparent.png"
                    alt="Aisle Logo"
                    className={`${imgClassName} w-auto object-contain`}
                    style={{ maxHeight: '34px' }}
                />
                {activePanel === 'seller' && (
                    <span className="text-[10px] font-black text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0">
                        Seller Hub
                    </span>
                )}
                {activePanel === 'admin' && (
                    <span className="text-[10px] font-black text-emerald-650 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0">
                        Control Center
                    </span>
                )}
                {activePanel === 'moderator' && (
                    <span className="text-[10px] font-black text-rose-650 bg-rose-50 border border-rose-100/50 px-2 py-0.5 rounded uppercase tracking-wider select-none shrink-0">
                        Trust & Safety
                    </span>
                )}
            </div>
            {!hideSubtitle && activePanel === 'customer' && (
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.14em] mt-1 text-left block leading-none">
                    Discover &bull; Connect &bull; Shop
                </span>
            )}
            {!hideSubtitle && activePanel === 'seller' && (
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.14em] mt-1 text-left block leading-none">
                    Manage &bull; Grow &bull; Sell
                </span>
            )}
        </div>
    );
};

export default AisleLogo;