import { useRef } from 'react';
import { Loader2, Rocket, Store } from 'lucide-react';

const FinalCTA = ({ userLocation, isLocating, handleLocationDiscovery }) => {
    return (
        /* THEME: Dark Closure (Design System Locked) */
        <section className="bg-dark py-20 px-6 border-t border-dark-muted">
            <div className="max-w-4xl mx-auto text-center relative z-10">

                {/* Icon */}
                <div className="inline-block p-4 rounded-full bg-primary-subtle/10 mb-8 text-primary-light border border-primary-hover/30">
                    <Store size={32} />
                </div>

                {/* Headline */}
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                    Your Neighborhood is <br />
                    <span className="text-primary-light">Open for Business.</span>
                </h2>

                {/* Subtext */}
                <p className="text-lg md:text-xl text-primary-subtle/70 mb-10 font-medium leading-relaxed max-w-2xl mx-auto">
                    Join your neighbors finding hidden gems right around the corner. <br className="hidden md:block" />
                    Don't just search. Find.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleLocationDiscovery}
                        disabled={isLocating || userLocation}
                        className={`relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-lg font-bold transition-all transform hover:-translate-y-1 shadow-lg shadow-teal-900/20 ${userLocation ? 'cursor-default opacity-90' : ''}`}
                    >
                        {isLocating ? (
                            <>
                                <Loader2 className="animate-spin" /> Locating...
                            </>
                        ) : userLocation ? (
                            <>
                                <Rocket /> Launch Map in {userLocation.area}
                            </>
                        ) : (
                            <>
                                Start Exploring Now
                            </>
                        )}
                    </button>

                    <button className="px-8 py-4 rounded-xl bg-transparent border-2 border-primary-hover text-primary-subtle font-bold hover:bg-dark-muted transition-all">
                        View Demo
                    </button>
                </div>
            </div>

            {/* Background Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark to-transparent pointer-events-none opacity-50"></div>
        </section>
    );
};

export default FinalCTA;
