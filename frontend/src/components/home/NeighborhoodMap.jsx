import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';

const MAP_SIZE = 1000;
const NODE_COUNT = 12; // Reduced from 30 for calmness
const CONNECTION_DISTANCE = 300; // Increased slightly for fewer but longer lines

// Light drift animation for "Atmospheric" feel
const driftTransition = {
    duration: 20,
    repeat: Infinity,
    ease: "linear",
    repeatType: "mirror"
};

const NeighborhoodMap = ({ searchTerm = "" }) => {
    // Generate nodes with random initial drift vector
    const [nodes] = useState(() => {
        const n = [];
        for (let i = 0; i < NODE_COUNT; i++) {
            n.push({
                id: i,
                x: Math.random() * MAP_SIZE,
                y: Math.random() * MAP_SIZE,
                driftX: (Math.random() - 0.5) * 50, // Drift range +/- 25px
                driftY: (Math.random() - 0.5) * 50,
                baseOpacity: 0.1 + Math.random() * 0.3, // Ultra subtle (0.1 - 0.4)
                pulseDelay: Math.random() * 10,
            });
        }
        return n;
    });

    // Filter logic (Visual feedback only - subtly boosts opacity)
    const activeNodes = useMemo(() => {
        if (!searchTerm) return new Set(); // No active set by default for atmosphere
        const lowerTerm = searchTerm.toLowerCase();
        // Mock matching logic for visual response
        return new Set(nodes.filter((_, i) => i % 3 === 0).map(n => n.id));
    }, [searchTerm, nodes]);

    // Calculate connections
    const connections = useMemo(() => {
        const lines = [];
        nodes.forEach((nodeA, i) => {
            nodes.forEach((nodeB, j) => {
                if (i < j) {
                    const dist = Math.hypot(nodeA.x - nodeB.x, nodeA.y - nodeB.y);
                    if (dist < CONNECTION_DISTANCE) {
                        lines.push({
                            id: `${nodeA.id}-${nodeB.id}`,
                            x1: nodeA.x,
                            y1: nodeA.y,
                            x2: nodeB.x,
                            y2: nodeB.y,
                            opacity: (1 - (dist / CONNECTION_DISTANCE)) * 0.1, // Near invisible connections
                        });
                    }
                }
            });
        });
        return lines;
    }, [nodes]);

    return (
        <div className="w-full h-full min-h-[500px] relative overflow-hidden pointer-events-none select-none">
            {/* Visual Field - No Background, No Card */}

            <svg
                viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}
                className="w-full h-full absolute inset-0 z-0 p-0"
                style={{ opacity: 0.8 }} // Global dampener
            >
                {/* Connections */}
                {connections.map((line) => (
                    <motion.line
                        key={line.id}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="#0f766e"
                        strokeWidth="1"
                        animate={{
                            opacity: [line.opacity, line.opacity * 0.5, line.opacity], // Gentle twinkle
                        }}
                        transition={{ duration: 5 + Math.random() * 5, repeat: Infinity }}
                    />
                ))}

                {/* Atmospheric Dots */}
                {nodes.map((node) => {
                    const isActive = activeNodes.has(node.id);
                    return (
                        <motion.g
                            key={node.id}
                            animate={{
                                x: [0, node.driftX, 0],
                                y: [0, node.driftY, 0],
                            }}
                            transition={driftTransition}
                        >
                            {/* Dot */}
                            <motion.circle
                                cx={node.x}
                                cy={node.y}
                                r={isActive ? 6 : 4} // Slightly larger if active
                                fill="#14b8a6" // Teal 500
                                animate={{
                                    opacity: isActive ? [0.4, 0.8, 0.4] : [node.baseOpacity, node.baseOpacity * 0.5, node.baseOpacity],
                                    scale: isActive ? [1, 1.2, 1] : 1
                                }}
                                transition={{
                                    duration: 4 + Math.random() * 4, // Slow breathing
                                    repeat: Infinity,
                                    delay: node.pulseDelay,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Occasional soft glow for random nodes */}
                            {node.id % 3 === 0 && (
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={20}
                                    fill="#14b8a6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 0.1, 0] }} // Very faint glow
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        delay: node.pulseDelay + 2,
                                        ease: "easeInOut"
                                    }}
                                />
                            )}
                        </motion.g>
                    );
                })}
            </svg>
        </div>
    );
};

export default NeighborhoodMap;
