import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

const SpotlightCard = ({ title, subtitle, icon, color, to, badge, className = "" }) => {
    const divRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => setOpacity(1);
    const handleBlur = () => setOpacity(0);

    // Determine color schemes
    const colorStyles = {
        orange: { gradient: "from-orange-400 to-pink-500", iconBg: "bg-orange-100 text-orange-600", spotHTML: 'rgba(249, 115, 22, 0.15)' },
        blue: { gradient: "from-blue-400 to-cyan-500", iconBg: "bg-blue-100 text-blue-600", spotHTML: 'rgba(59, 130, 246, 0.15)' },
        pink: { gradient: "from-pink-400 to-rose-500", iconBg: "bg-rose-100 text-rose-600", spotHTML: 'rgba(244, 114, 182, 0.15)' }
    };

    const theme = colorStyles[color] || colorStyles.orange;

    return (
        <Link
            to={to}
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleFocus}
            onMouseLeave={handleBlur}
            className={`relative overflow-hidden rounded-3xl border border-slate-200 bg-white/50 text-slate-900 shadow-xl transition-transform duration-300 hover:-translate-y-1 block ${className}`}
        >
            {/* The Spotlight Effect Layer */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-0"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${theme.spotHTML}, transparent 40%)`,
                }}
            />

            {/* Content */}
            <div className="relative h-full p-8 z-10">
                {/* Icon Container */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${theme.iconBg} shadow-sm transition-transform group-hover:scale-110 duration-300`}>
                    {icon}
                </div>

                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-900">
                        {title}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {subtitle}
                    </p>
                </div>

                {/* Badge if present */}
                {badge && (
                    <div className="absolute top-4 right-4 bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce shadow-md">
                        {badge}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default SpotlightCard;
