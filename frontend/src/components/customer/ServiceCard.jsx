import React from 'react';
import { FaArrowRight } from 'react-icons/fa';

const ServiceCard = ({ icon, title, count, price, color, onClick }) => {
    // Map colors to design system accents
    const accentMap = {
        terracotta: 'var(--accent-terracotta)',
        sage: 'var(--accent-sage)',
        ochre: 'var(--accent-ochre)',
        slate: 'var(--accent-slate)',
        clay: 'var(--accent-clay)',
    };

    const activeColor = accentMap[color] || 'var(--text-muted)';

    return (
        <div
            onClick={onClick}
            className="group relative bg-white/60 backdrop-blur-md p-6 rounded-[20px] border border-white/40 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden"
        >
            <div className="relative flex items-center gap-5">
                {/* 1. The Icon (Squircle with background) */}
                <div
                    className="w-16 h-16 flex items-center justify-center rounded-[20px] text-3xl shrink-0 transition-transform group-hover:scale-110 duration-300 shadow-sm"
                    style={{ backgroundColor: `${activeColor}15`, color: activeColor }}
                >
                    {icon}
                </div>

                {/* 2. The Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-[var(--text-primary)] group-hover:text-[var(--accent-terracotta)] transition-colors truncate uppercase tracking-tight">
                        {title}
                    </h3>

                    {/* Availability Marker */}
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-sage)] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-sage)]"></span>
                        </span>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest opacity-70">
                            {count} PROS NEARBY
                        </span>
                    </div>

                    {/* Price Info */}
                    <p className="text-[11px] font-black text-[var(--text-muted)] mt-2 uppercase tracking-wide">
                        FROM <span className="text-[var(--text-primary)]">{price}</span>
                    </p>
                </div>

                {/* 3. Action Arrow */}
                <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 text-[var(--text-muted)] group-hover:bg-[var(--accent-terracotta)] group-hover:text-white transition-all shrink-0 active:scale-90">
                    <FaArrowRight size={12} />
                </div>
            </div>
        </div>
    );
};

export default ServiceCard;
