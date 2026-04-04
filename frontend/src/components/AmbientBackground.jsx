import { useEffect, useState } from 'react';

const AmbientBackground = () => {
    // Simple state to ensure client-side rendering matches if needed, though pure CSS is fine here.
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-background">
            {/* Base Gradient Overlay: Deep Navy Gradient (Top-Left Light to Bottom-Right Dark) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0a0f1e] to-black z-[1]" />

            {/* Mesh Gradient Blobs - Large, slow moving, deep colors */}
            <div className="absolute top-[-20%] left-[-20%] w-[90vw] h-[90vw] bg-indigo-900/30 rounded-full blur-[150px] animate-blob mix-blend-overlay" />
            <div className="absolute top-[10%] right-[-20%] w-[80vw] h-[80vw] bg-cyan-900/20 rounded-full blur-[150px] animate-blob animation-delay-2000 mix-blend-overlay" />
            <div className="absolute bottom-[-30%] left-[20%] w-[100vw] h-[100vw] bg-blue-900/20 rounded-full blur-[180px] animate-blob animation-delay-4000 mix-blend-overlay" />

            {/* Cinematic Noise Texture */}
            <div className="absolute inset-0 z-[2] bg-noise mix-blend-soft-light opacity-30" />
        </div>
    );
};

export default AmbientBackground;
