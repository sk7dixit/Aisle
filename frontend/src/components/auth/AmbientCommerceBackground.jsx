import React from 'react';
import { motion } from 'framer-motion';

const AmbientCommerceBackground = ({ role }) => {
    // Configuration for floating abstract elements
    // 5-7 elements: mixed shapes (rounded rects, circles, outlined squares)
    const elements = [
        // Layer 1 (Back - Slowest)
        {
            id: 1, type: 'rect', width: 'w-64', height: 'h-80',
            top: '10%', left: '10%', opacity: 0.06, // Was 0.04
            animation: { y: [-20, 20, -20], x: [-10, 10, -10], duration: 25 }
        },
        {
            id: 2, type: 'circle', width: 'w-96', height: 'h-96',
            top: '60%', right: '5%', opacity: 0.05, // Was 0.03
            animation: { y: [30, -30, 30], duration: 30 }
        },
        // Layer 2 (Mid - Medium)
        {
            id: 3, type: 'square-outline', width: 'w-24', height: 'h-24',
            top: '30%', left: '20%', opacity: 0.09, // Was 0.06
            animation: { y: [-40, 40, -40], rotate: [0, 45, 0], duration: 22 }
        },
        {
            id: 4, type: 'rect', width: 'w-48', height: 'h-64',
            bottom: '15%', left: '30%', opacity: 0.08, // Was 0.05
            animation: { y: [20, -20, 20], x: [10, -10, 10], duration: 20 }
        },
        // Layer 3 (Front - Slightly faster)
        {
            id: 5, type: 'circle', width: 'w-32', height: 'h-32',
            top: '20%', right: '25%', opacity: 0.12, // Was 0.08
            animation: { y: [-15, 15, -15], scale: [1, 1.1, 1], duration: 18 }
        },
        {
            id: 6, type: 'square-outline', width: 'w-16', height: 'h-16',
            bottom: '40%', right: '15%', opacity: 0.10, // Was 0.07
            animation: { y: [15, -15, 15], rotate: [0, -90, 0], duration: 24 }
        },
    ];

    // Dynamic Opacity calculation based on Role and Shape Type
    const getOpacity = (baseOpacity, type) => {
        if (role === 'seller') {
            if (type === 'square-outline') return baseOpacity * 2.5; // Emphasize security/scan
            if (type === 'circle') return baseOpacity * 1.5; // Emphasize presence
            if (type === 'rect') return baseOpacity * 0.5; // Reduce product cards
        }
        return baseOpacity; // Customer mode (default)
    };

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {/* Base Background Tint - Subtle shift based on role */}
            <div className={`absolute transition-colors duration-1000 inset-0 ${role === 'seller' ? 'bg-slate-100/60' : 'bg-transparent'
                }`} />

            {elements.map((el) => (
                <motion.div
                    key={el.id}
                    className={`absolute ${el.width} ${el.height}
                        ${el.type === 'circle' ? 'rounded-full bg-slate-400' : ''}
                        ${el.type === 'rect' ? 'rounded-[32px] bg-slate-400' : ''}
                        ${el.type === 'square-outline' ? 'border-[3px] border-slate-400 rounded-2xl' : ''}
                        backdrop-blur-3xl transition-opacity duration-1000
                    `}
                    style={{
                        top: el.top,
                        left: el.left,
                        right: el.right,
                        bottom: el.bottom,
                    }}
                    animate={{
                        ...el.animation,
                        opacity: getOpacity(el.opacity, el.type) // Dynamic opacity
                    }}
                    transition={{
                        duration: el.animation.duration,
                        repeat: Infinity,
                        ease: "linear",
                        opacity: { duration: 1 } // Smooth transition for opacity change
                    }}
                />
            ))}

            {/* Soft Overlay Gradient to blend shapes */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
        </div>
    );
};

export default AmbientCommerceBackground;
