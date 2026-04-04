import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { FaStore, FaBriefcaseMedical, FaCamera, FaHome, FaTree } from 'react-icons/fa';

// --- Configuration ---
const SHOPS = [
    {
        id: "gupta",
        name: "Gupta General",
        distance_m: 180,
        height: 60, // Building height
        color: "#ea580c" // Coral
    },
    {
        id: "city",
        name: "City Medicos",
        distance_m: 550,
        height: 80,
        color: "#f97316" // Orange 500
    },
    {
        id: "photo",
        name: "Photo Studio",
        distance_m: 900,
        height: 50,
        color: "#fb923c" // Orange 400
    }
];

const MAP_WIDTH = 800;
const MAP_HEIGHT = 800;
// Adjusted path for isometric view
const PATH_MAIN = "M 200 600 C 300 500, 500 700, 600 400 C 650 250, 400 150, 300 200";

const BuildingBlock = ({ height, color, label, isActive }) => {
    return (
        <div className="relative" style={{ width: '40px', height: '40px' }}>
            {/* Shadow Base */}
            <div
                className="absolute top-0 left-0 w-full h-full bg-black/20 blur-md rounded-full transform translate-y-2 scale-125"
            ></div>

            {/* 3D Cube Container */}
            <div
                className="w-full h-full relative"
                style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${isActive ? '20px' : '0px'})`,
                    transition: 'transform 0.5s ease'
                }}
            >
                {/* Front Face */}
                <div
                    className="absolute bottom-0 left-0 w-full bg-orange-500 border-white/20 border"
                    style={{
                        height: `${height}px`,
                        transform: 'rotateX(-90deg) translateZ(20px)',
                        transformOrigin: 'bottom',
                        backgroundColor: color,
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Windows */}
                    <div className="w-full h-full grid grid-cols-2 gap-1 p-1">
                        <div className={`bg-white/30 ${isActive ? 'bg-yellow-200/80 animate-pulse' : ''}`}></div>
                        <div className={`bg-white/30 ${isActive ? 'bg-yellow-200/80 animate-pulse' : ''}`}></div>
                        <div className="bg-white/30"></div>
                        <div className="bg-white/30"></div>
                    </div>
                </div>

                {/* Top Face (Roof) */}
                <div
                    className="absolute bottom-0 left-0 w-full h-full bg-orange-200 border-white/40 border"
                    style={{
                        transform: `translateZ(${height}px)`,
                        backgroundColor: '#ffedd5' // Very light peach
                    }}
                >
                    {isActive && (
                        <div className="w-full h-full flex items-center justify-center text-xs">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                        </div>
                    )}
                </div>

                {/* Side Face (Right) */}
                <div
                    className="absolute bottom-0 left-0 h-full w-full bg-orange-600 border-white/20 border"
                    style={{
                        height: `${height}px`,
                        width: '40px',
                        transform: 'rotateY(90deg) rotateX(-90deg) translateZ(20px)',
                        transformOrigin: 'bottom right',
                        filter: 'brightness(0.8)'
                    }}
                ></div>
            </div>

            {/* Floating Label */}
            <div
                className="absolute whitespace-nowrap bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-gray-700 shadow-xl border border-orange-100"
                style={{
                    top: `-${height + 40}px`,
                    left: '50%',
                    transform: 'translateX(-50%) rotateX(-60deg) rotateZ(45deg)', // Counter-rotate to face camera
                    opacity: isActive ? 1 : 0.6,
                    scale: isActive ? 1.1 : 0.9,
                    transition: 'all 0.3s ease'
                }}
            >
                {label}
            </div>
        </div>
    );
};

const LocalDiscoveryMap = () => {
    const MAX_DISTANCE = 1100;

    // Memoize nodes with progress points along the new path
    // We'll estimate progress points manually or distribute them for simplicity
    const nodes = [
        { ...SHOPS[0], progressPoint: 0.2 },
        { ...SHOPS[1], progressPoint: 0.6 },
        { ...SHOPS[2], progressPoint: 0.9 }
    ];

    const progress = useMotionValue(0);
    const pathRef = useRef(null);
    const [pathLength, setPathLength] = useState(0);
    const [activeNode, setActiveNode] = useState(null);

    // Initial Path Measurement
    useEffect(() => {
        if (pathRef.current) {
            setPathLength(pathRef.current.getTotalLength());
        }
    }, []);

    // Animation Loop
    useEffect(() => {
        const controls = animate(progress, 1, {
            duration: 16,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 0,
            onUpdate: (latest) => {
                let foundActive = null;
                let newSpeed = 1;

                nodes.forEach(node => {
                    const p = node.progressPoint;
                    if (latest > p - 0.05 && latest < p + 0.05) {
                        foundActive = node.id;
                        newSpeed = 0.2; // Slow down near shops
                    }
                });

                setActiveNode(foundActive);
                controls.speed = newSpeed;
            }
        });
        return () => controls.stop();
    }, [progress]);

    // Character Movement Logic (3D)
    // We'll calculate the X/Y on the path, then apply it to the character div
    const x = useTransform(progress, (p) => {
        if (!pathRef.current || pathLength === 0) return 200;
        return pathRef.current.getPointAtLength(p * pathLength).x;
    });

    const y = useTransform(progress, (p) => {
        if (!pathRef.current || pathLength === 0) return 600;
        return pathRef.current.getPointAtLength(p * pathLength).y;
    });

    return (
        <div className="relative w-full h-[600px] bg-[#fff7ed] overflow-hidden rounded-[3rem] border-4 border-white shadow-2xl flex items-center justify-center perspective-[1200px]">

            {/* ISOMETRIC WORLD CONTAINER */}
            <div
                className="relative w-[800px] h-[800px] preserve-3d"
                style={{
                    transform: 'rotateX(60deg) rotateZ(-45deg)', // True Isometric Angle
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* 1. FLOOR (Grid) */}
                <div className="absolute inset-0 bg-[#fff7ed] shadow-2xl rounded-3xl"
                    style={{
                        backgroundImage: 'linear-gradient(#fed7aa 2px, transparent 2px), linear-gradient(90deg, #fed7aa 2px, transparent 2px)',
                        backgroundSize: '40px 40px',
                        transform: 'translateZ(-2px)' // Push floor slightly down
                    }}
                ></div>

                {/* 2. PATHS */}
                <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" style={{ transform: 'translateZ(2px)' }}>
                    {/* Main Path Shadow */}
                    <path d={PATH_MAIN} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="18" strokeLinecap="round" />

                    {/* Main Path Glow */}
                    <motion.path
                        ref={pathRef}
                        d={PATH_MAIN}
                        fill="none"
                        stroke="#fb923c"
                        strokeWidth="8"
                        strokeLinecap="round"
                        style={{ filter: 'drop-shadow(0 0 10px #fb923c)' }}
                    />

                    {/* Animated Progress Path (The Light) */}
                    <motion.path
                        d={PATH_MAIN}
                        fill="none"
                        stroke="#fff"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray="20 100"
                        style={{ pathLength: progress }}
                    />
                </svg>

                {/* 3. SHOPS (Building Blocks) */}
                {nodes.map(node => (
                    <NodeMarker
                        key={node.id}
                        node={node}
                        pathRef={pathRef}
                        pathLength={pathLength}
                        isActive={activeNode === node.id}
                    />
                ))}

                {/* 4. TREES (Decorations) */}
                <div className="absolute top-[200px] left-[500px] text-4xl text-green-600/80" style={{ transform: 'translateZ(0px) rotateX(-90deg)' }}><FaTree /></div>
                <div className="absolute top-[400px] left-[200px] text-3xl text-green-500/80" style={{ transform: 'translateZ(0px) rotateX(-90deg)' }}><FaTree /></div>
                <div className="absolute top-[600px] left-[400px] text-5xl text-green-700/80" style={{ transform: 'translateZ(0px) rotateX(-90deg)' }}><FaTree /></div>


                {/* 5. CHARACTER (Leo) */}
                <motion.div
                    className="absolute w-8 h-8 z-50 flex items-center justify-center transform-style-3d will-change-transform"
                    style={{ x, y, z: 10 }}
                >
                    <div
                        className="w-12 h-12 bg-white rounded-full border-4 border-orange-500 shadow-2xl flex items-center justify-center text-xl relative"
                        style={{ transform: 'rotateX(-60deg) rotateZ(45deg) translateY(-20px)' }} // Counter-rotate to face camera upright
                    >
                        🏃
                        {/* Flashlight beam effect */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-8 h-20 bg-gradient-to-b from-yellow-300/30 to-transparent blur-md"></div>
                    </div>
                </motion.div>

            </div>

            {/* Live Status Badge (Overlay) */}
            <div className="absolute right-8 top-8 z-50">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 backdrop-blur-sm shadow-xl border border-orange-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-xs font-bold text-orange-900 uppercase tracking-wide">Isometric View</span>
                </div>
            </div>

        </div>
    );
};

// Helper for positioning nodes on the path
const NodeMarker = ({ node, pathRef, pathLength, isActive }) => {
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (pathRef.current && pathLength > 0) {
            const point = pathRef.current.getPointAtLength(node.progressPoint * pathLength);
            setPos(point);
        }
    }, [pathLength, node.progressPoint]);

    if (pos.x === 0) return null;

    return (
        <div
            className="absolute transform-style-3d"
            style={{
                left: pos.x,
                top: pos.y,
                transform: 'translate(-50%, -50%) translateZ(0px)'
            }}
        >
            <BuildingBlock
                height={node.height}
                color={node.color}
                label={node.name}
                isActive={isActive}
            />
        </div>
    );
};

export default LocalDiscoveryMap;
