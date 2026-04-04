import React, { useState } from 'react';
import { FaMapMarkerAlt, FaArrowRight, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HeroSection = ({ location }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');

    const handleSearch = () => {
        if (query.trim()) {
            navigate(`/market/search?q=${encodeURIComponent(query)}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="relative w-full flex flex-col items-center justify-center pt-12 pb-12 px-4 text-center">

            {/* 1. The "Pill" Badge - Matches your location context */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/5 border border-black/5 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-10 animate-fade-in-up">
                <FaMapMarkerAlt className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                <span>Showing shops in <span className="text-[var(--text-primary)]">{location || 'your area'}</span></span>
            </div>

            {/* 2. Main Headline - Big, Bold, Readable */}
            <h1 className="max-w-4xl text-5xl md:text-7xl font-black tracking-tight text-[var(--text-primary)] leading-none mb-8 animate-fade-in uppercase" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
                Find what’s <br className="hidden md:block" />
                <span className="text-[var(--accent-orange)]">
                    available
                </span> near you.
            </h1>

            {/* 3. Subtitle - Clear value proposition */}
            <p className="max-w-2xl text-xs text-[var(--text-muted)] mb-12 leading-relaxed font-black uppercase tracking-[0.15em] opacity-60 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                Real shops. Real stock. Updated by owners.
                <br className="hidden md:block" />
                Stop guessing and start finding.
            </p>

            {/* Layer A - Context Strip (Perceived Activity) */}
            <div className="flex flex-wrap gap-5 justify-center mb-10 animate-fade-in-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                <div className="bg-[var(--card-bg)] rounded-2xl px-5 py-3 text-[10px] font-black text-[var(--text-secondary)] shadow-standard flex items-center gap-3 border border-black/5 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-pulse"></span>
                    <span><strong>12 shops</strong> updated today</span>
                </div>
                <div className="bg-[var(--card-bg)] rounded-2xl px-5 py-3 text-[10px] font-black text-[var(--text-secondary)] shadow-standard flex items-center gap-3 border border-black/5 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-[var(--accent-green)]"></span>
                    <span><strong>4 services</strong> available</span>
                </div>
            </div>

            {/* 4. Search Bar REMOVED (Step 1) */}
            {/* Search moved to dedicated Explore tab or removed entirely for Action-first design */}

        </div>
    );
};

export default HeroSection;
