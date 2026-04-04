import useOnScreen from '../../hooks/useOnScreen';
import { FaClock, FaShippingFast, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const ProblemSolution = () => {
    const [ref, visible] = useOnScreen({ threshold: 0.2 });

    return (
        <section className="py-32 relative z-10">
            <div className="container mx-auto px-6">
                <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Left Card: The Problem (Muted Glass) */}
                    <div className={`transition-all duration-1000 transform ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
                        <div className="glass-card-dark rounded-3xl p-10 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
                            {/* Muted Red Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />

                            <div className="flex items-start gap-6 mb-6">
                                <span className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-red-400 text-2xl shadow-lg backdrop-blur-md shrink-0">
                                    <FaTimesCircle />
                                </span>
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary mb-2">The Waiting Game</h3>
                                    <p className="text-text-secondary leading-relaxed">
                                        "Estimated delivery: 3-5 business days." <br />
                                        Why wait for a box to travel 500 miles?
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Card: The Solution (Active Glowing Glass) */}
                    <div className={`transition-all duration-1000 delay-200 transform ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
                        <div className="glass-card-dark rounded-3xl p-10 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500 border-accent-end/30">

                            {/* Vibrant Cyan Glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-accent-start/20 rounded-full blur-[80px] -mr-20 -mt-20 animate-pulse pointer-events-none" />

                            <div className="flex items-start gap-6 mb-6">
                                <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-start to-accent-end text-slate-900 flex items-center justify-center text-2xl shadow-lg shadow-accent-end/20 shrink-0 animate-bounce-slow">
                                    <FaCheckCircle />
                                </span>
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary mb-2">The Local Advantage</h3>
                                    <p className="text-text-secondary leading-relaxed">
                                        <span className="text-gradient-cyan font-bold">Instant gratification.</span> <br />
                                        Reserve it on ShopLens. Pick it up on your lunch break.
                                    </p>
                                </div>
                            </div>

                            {/* Decorative line */}
                            <div className="w-full h-[1px] bg-gradient-to-r from-accent-start/50 to-transparent mt-6" />
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default ProblemSolution;
