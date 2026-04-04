import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const InteractiveMap = () => {
    return (
        // --- SEAMLESS INTEGRATION ---
        // Changed bg-gradient to bg-transparent to let Hero's background flow through.
        // Removed min-height to allow Hero's layout to control dimensions.
        <div className="relative w-full h-[500px] flex items-center justify-center overflow-visible">

            {/* Ambient Color Blobs (Reduced opacity for better blending) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-orange-200/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-amber-200/20 rounded-full blur-[100px]" />
            </div>

            {/* Subtle Noise Texture (Lower opacity for white background) */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* The 3D Grid Floor (Moved slightly for better composition) */}
            <div className="absolute inset-0 flex items-center justify-center perspective-[1200px] pointer-events-none">
                <div
                    className="w-[180%] h-[180%]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px',
                        transform: 'rotateX(55deg) translateY(-150px)',
                        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
                        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
                    }}
                />
            </div>

            {/* THE MAP CONTENT */}
            <div className="absolute inset-0 z-20">
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    <defs>
                        <linearGradient id="realGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0d9488" /> {/* Teal-600 for contrast */}
                            <stop offset="100%" stopColor="#ea580c" /> {/* Orange-600 for contrast */}
                        </linearGradient>
                        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Path Background (Slightly more visible) */}
                    <path
                        d="M 120 350 C 250 350, 250 180, 450 140"
                        fill="transparent"
                        stroke="rgba(0,0,0,0.03)"
                        strokeWidth="10"
                        strokeLinecap="round"
                    />

                    {/* Animated Path */}
                    <motion.path
                        d="M 120 350 C 250 350, 250 180, 450 140"
                        fill="transparent"
                        stroke="url(#realGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        filter="url(#softGlow)"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.8, ease: "easeInOut" }}
                    />
                </svg>

                {/* Traveler Dot */}
                <motion.div
                    className="absolute w-5 h-5 bg-white rounded-full shadow-lg z-30 border-[3px] border-teal-500"
                    style={{ offsetPath: 'path("M 120 350 C 250 350, 250 180, 450 140")' }}
                    animate={{ offsetDistance: ["0%", "100%"] }}
                    transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                />

                {/* LOCATION: YOU'RE HERE */}
                <div className="absolute left-[100px] top-[330px]">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-10 h-10 bg-teal-500 rounded-full border-[4px] border-white shadow-2xl flex items-center justify-center relative z-20"
                    >
                        <div className="w-3 h-3 bg-white rounded-full animate-ping opacity-75"></div>
                        <div className="w-2 h-2 bg-white rounded-full absolute"></div>
                    </motion.div>

                    {/* Tooltip */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: -10 }}
                        transition={{ delay: 0.3 }}
                        className="absolute -top-14 -left-10 bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50"
                    >
                        <span className="text-sm font-bold text-gray-700 whitespace-nowrap">You're here</span>
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/90 rotate-45 border-b border-r border-gray-100/50"></div>
                    </motion.div>
                </div>

                {/* LOCATION: SHOPS */}
                <div className="absolute left-[430px] top-[120px]">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1.5, type: "spring", stiffness: 260, damping: 20 }}
                        className="w-12 h-12 bg-orange-500 rounded-full border-[4px] border-white shadow-2xl flex items-center justify-center relative z-20"
                    >
                        <ShoppingBag size={20} className="text-white" />
                    </motion.div>

                    {/* Dark Card Tooltip */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.8 }}
                        className="absolute -top-16 -right-12 bg-[#1C140F]/95 backdrop-blur-sm text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 whitespace-nowrap overflow-hidden"
                    >
                        <span className="text-sm font-semibold">Shops near you</span>
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_#ea580c]"></div>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>
                        {/* Arrow */}
                        <div className="absolute -bottom-1 left-1/2 -translate-x-full w-3 h-3 bg-[#1C140F] rotate-45"></div>
                    </motion.div>
                </div>

                {/* STATS FLOATING CARD (Glassmorphic) */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 2.2 }}
                    className="absolute bottom-8 right-8 bg-white/40 backdrop-blur-xl p-4 pr-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/60 flex items-center gap-4 z-30"
                >
                    <div className="flex -space-x-4">
                        <div className="w-10 h-10 rounded-full bg-teal-500 border-[3px] border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">S1</div>
                        <div className="w-10 h-10 rounded-full bg-orange-500 border-[3px] border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">S2</div>
                        <div className="w-10 h-10 rounded-full bg-yellow-400 border-[3px] border-white flex items-center justify-center text-[10px] text-white font-bold shadow-sm">S3</div>
                    </div>
                    <div>
                        <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">8 Shops Live</h4>
                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest opacity-80">90+ Products</p>
                    </div>
                </motion.div>

            </div>
        </div>
    );
};

export default InteractiveMap;
