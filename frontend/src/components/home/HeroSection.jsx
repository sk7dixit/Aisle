import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, MapPin, TrendingUp } from 'lucide-react';

const HeroSection = ({ userLocation, isLocating, handleLocationDiscovery }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    return (
        /* THEME: Calm / Abstract / Alive (Emergent Spec) */
        <section className="hero-emergent w-full">
            {/* Ambient Dot Field (Right Side Only - Specific Layout) */}
            <div className="absolute inset-0 pointer-events-none">
                <span className="dot-emergent" style={{ top: '18%', left: '72%' }}></span>
                <span className="dot-emergent" style={{ top: '32%', left: '82%', animationDelay: '2s' }}></span>
                <span className="dot-emergent" style={{ top: '48%', left: '76%', animationDelay: '4s' }}></span>
                <span className="dot-emergent" style={{ top: '62%', left: '88%', animationDelay: '1s' }}></span>
                <span className="dot-emergent" style={{ top: '74%', left: '80%', animationDelay: '3s' }}></span>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-[60px] pb-[80px] lg:pt-[100px] lg:pb-[120px]">
                <div className="grid lg:grid-cols-2 gap-12 items-center">

                    {/* Left Content Area */}
                    <div className="z-10 relative">

                        {/* Live Badge */}
                        <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-white border border-primary-light/30 mb-8 shadow-card">
                            <span className="relative flex h-2.5 w-2.5 mr-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-light opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                            <span className="text-[0.75rem] font-bold text-primary-hover tracking-wider uppercase">
                                LIVE INVENTORY NEARBY
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-dark leading-[1.1] mb-6 tracking-tight">
                            Find <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">
                                Anything
                            </span> <br />
                            near you.
                        </h1>

                        {/* Sub-headline */}
                        <p className="text-lg lg:text-xl text-dark-muted mb-10 max-w-lg leading-relaxed font-medium">
                            Skip the warehouse wait. See which local stores have exactly what you need, right now. Zero delivery markups.
                        </p>

                        {/* Action Area */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            {/* Scan Button - Primary */}
                            <button
                                className="group px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-soft transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 min-w-[200px]"
                                onClick={handleLocationDiscovery}
                                disabled={isLocating}
                            >
                                {isLocating ? (
                                    <Loader2 className="animate-spin h-5 w-5" />
                                ) : (
                                    <MapPin className="h-5 w-5" />
                                )}
                                {isLocating ? "Locating..." : "Scan My Area"}
                            </button>

                            {/* Search Input */}
                            <div className="relative flex-grow max-w-md">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-dark-subtle" />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Looking for 'Nike Shoes'..."
                                    className="block w-full pl-12 pr-4 py-4 rounded-xl bg-surface-muted border border-transparent focus:bg-white text-dark placeholder-dark-subtle focus:ring-2 focus:ring-primary focus:border-transparent focus:outline-none transition-all font-medium shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Popular Tags */}
                        <div className="flex items-center gap-2 text-sm text-dark-subtle font-medium">
                            <TrendingUp className="text-pastel-rose h-5 w-5" />
                            <span>Popular now:</span>
                            <span className="flex flex-wrap gap-1">
                                <span
                                    className="hover:text-primary cursor-pointer transition-colors"
                                    onClick={() => setSearchTerm('coffee')}
                                >
                                    Coffee,
                                </span>
                                <span
                                    className="hover:text-primary cursor-pointer transition-colors"
                                    onClick={() => setSearchTerm('shoes')}
                                >
                                    Shoes,
                                </span>
                                <span
                                    className="hover:text-primary cursor-pointer transition-colors"
                                    onClick={() => setSearchTerm('yoga')}
                                >
                                    Yoga
                                </span>
                            </span>
                        </div>

                    </div>

                    {/* Right Content - Empty spacer to balance layout */}
                    <div className="hidden lg:block relative h-full min-h-[500px] pointer-events-none"></div>

                </div>
            </div>
        </section>
    );
};

export default HeroSection;
