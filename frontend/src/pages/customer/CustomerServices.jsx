import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTools, FaBolt, FaTint, FaCut, FaBroom, FaChalkboardTeacher, FaMapMarkerAlt, FaStar, FaArrowRight, FaClock, FaCheckCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import EmptyState from '../../components/common/EmptyState';
import ServiceCard from '../../components/customer/ServiceCard';

const URGENT_SERVICES = [
    { id: 'electrician', label: 'Electrician', icon: <FaBolt />, color: 'ochre', count: 12, price: '₹199' },
    { id: 'plumber', label: 'Plumber', icon: <FaTint />, color: 'slate', count: 8, price: '₹149' },
    { id: 'carpenter', label: 'Carpenter', icon: <FaTools />, color: 'terracotta', count: 5, price: '₹249' },
];

const LIFESTYLE_SERVICES = [
    { id: 'salon', label: 'Salon / Barber', icon: <FaCut />, color: 'clay', count: 15, price: '₹99' },
    { id: 'cleaning', label: 'Cleaning', icon: <FaBroom />, color: 'slate', count: 10, price: '₹299' },
    { id: 'tutor', label: 'Tutor', icon: <FaChalkboardTeacher />, color: 'sage', count: 20, price: '₹400/hr' },
];

const CustomerServices = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Mock Data for Providers
    const providers = [
        { id: 1, name: 'QuickFix Electricals', type: 'electrician', distance: '1.2 km', rating: 4.8, jobs: 120 },
        { id: 2, name: 'Sharma Plumbers', type: 'plumber', distance: '0.8 km', rating: 4.5, jobs: 85 },
        { id: 3, name: 'City Power Services', type: 'electrician', distance: '2.5 km', rating: 4.2, jobs: 200 },
        { id: 4, name: 'Home Style Carpenters', type: 'carpenter', distance: '3.0 km', rating: 4.9, jobs: 45 },
    ];

    const activeProviders = selectedCategory ? providers.filter(p => p.type === selectedCategory.id) : [];

    return (
        <div className="min-h-screen bg-transparent pb-24 pt-20 font-sans">
            <div className="px-6 md:px-12 max-w-[1240px] mx-auto pt-8">

                {/* 1. Header Area */}
                <div className="mb-10">
                    {selectedCategory && (
                        <button onClick={() => setSelectedCategory(null)} className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-5 transition-colors font-black text-xs uppercase tracking-widest">
                            <FaArrowRight className="rotate-180" /> Back to Categories
                        </button>
                    )}
                    <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight uppercase">
                        {selectedCategory ? `${selectedCategory.label}s Near You` : 'Find Services'}
                    </h1>
                    <p className="text-[var(--text-secondary)] font-medium mt-2">
                        {selectedCategory ? 'Select a professional to request a service. Local & Trusted.' : 'Choose a category to find verified local pros.'}
                    </p>
                </div>

                {/* VIEW 1: Categories View */}
                {!selectedCategory && (
                    <>
                        {/* 2. Promo Banner (Earthy Modern) */}
                        <div className="mb-12 relative overflow-hidden rounded-[24px] bg-[#2D2424] text-white p-10 md:p-14 shadow-standard">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div>
                                    <span className="inline-block py-1 px-3 rounded-full bg-[var(--accent-terracotta)]/20 text-[var(--accent-terracotta)] text-[10px] font-black uppercase tracking-widest mb-4 border border-[var(--accent-terracotta)]/30">
                                        Market Pulse
                                    </span>
                                    <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">AC SERVICE & REPAIR</h2>
                                    <p className="text-[var(--text-muted)] max-w-sm font-black uppercase tracking-tight text-[11px] opacity-70">Get your coolers serviced before peak summer. Verified pros available instantly.</p>
                                </div>
                                <button className="bg-[var(--accent-terracotta)] text-white px-8 py-4 rounded-xl font-black hover:bg-white hover:text-black transition-all shadow-xl uppercase tracking-widest text-sm">
                                    Book Now ⚡
                                </button>
                            </div>

                            {/* Abstract Glows */}
                            <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-[var(--accent-terracotta)] rounded-full mix-blend-overlay filter blur-[100px] opacity-20"></div>
                        </div>

                        {/* 3. Urgent Services Section */}
                        <div className="mb-12">
                            <h2 className="text-xs font-black text-[var(--text-muted)] mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <span className="w-8 h-[2px] bg-[var(--accent-orange)]"></span>
                                Urgent Home Repairs
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {URGENT_SERVICES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat)}
                                            className="group transition-all duration-300 ease-in-out 
                                                hover:-translate-y-2 hover:shadow-xl
                                                bg-white/70 backdrop-blur-md border border-white/40
                                                p-6 rounded-2xl w-full text-center cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <div className="mb-2 flex h-12 w-12 items-center justify-center 
                                                    rounded-full bg-orange-50 group-hover:bg-orange-100 
                                                    transition-colors duration-300 text-[var(--accent-orange)] text-xl">
                                                {cat.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-800">{cat.label}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Starting at {cat.price}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div> {/* Close Urgent Section */}

                        {/* 4. Lifestyle & Care Section */}
                        <div className="mb-12">
                            <h2 className="text-xs font-black text-[var(--text-muted)] mb-6 flex items-center gap-3 uppercase tracking-widest">
                                <span className="w-8 h-[2px] bg-[var(--accent-purple)]"></span>
                                Lifestyle & Care
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {LIFESTYLE_SERVICES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSelectedCategory(cat)}
                                            className="group transition-all duration-300 ease-in-out 
                                            hover:-translate-y-2 hover:shadow-xl
                                            bg-white/70 backdrop-blur-md border border-white/40
                                            p-6 rounded-2xl w-full text-center cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <div className="mb-2 flex h-12 w-12 items-center justify-center 
                                                rounded-full bg-orange-50 group-hover:bg-orange-100 
                                                transition-colors duration-300 text-[var(--accent-orange)] text-xl">
                                                {cat.icon}
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-gray-800">{cat.label}</h3>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Starting at {cat.price}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div> {/* Close Lifestyle Section */}
                    </>
                )}

                {/* VIEW 2: Provider List View */}
                {selectedCategory && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
                        {activeProviders.length > 0 ? activeProviders.map(provider => (
                            <ProviderCard key={provider.id} provider={provider} categoryLabel={selectedCategory.label} />
                        )) : (
                            <div className="col-span-full">
                                <EmptyState
                                    title={`No ${selectedCategory.label}s found`}
                                    message="We couldn't find any providers nearby for this category."
                                    icon={<FaTools className="text-3xl" />}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-components ---

const ProviderCard = ({ provider, categoryLabel }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="bg-[var(--card-bg)] p-6 rounded-[24px] border border-black/5 shadow-standard hover:shadow-xl hover:translate-y-[-2px] transition-all flex flex-col gap-5">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-1.5 opacity-60">{categoryLabel}</div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{provider.name}</h3>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-[var(--text-secondary)] font-black uppercase tracking-widest">
                            <span className="flex items-center gap-2"><FaMapMarkerAlt className="text-[var(--accent-orange)] opacity-50" /> {provider.distance}</span>
                            <span className="flex items-center gap-2 text-[var(--accent-orange)]"><FaStar /> {provider.rating}</span>
                        </div>
                    </div>
                </div>

                <div className="pt-5 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">{provider.jobs} completed</span>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[var(--accent-terracotta)] text-white hover:bg-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95"
                    >
                        Book Service
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <RequestModal provider={provider} onClose={() => setShowModal(false)} />
                )}
            </AnimatePresence>
        </>
    );
};

const RequestModal = ({ provider, onClose }) => {
    const [step, setStep] = useState(1);
    const handleSubmit = () => {
        setStep(2);
        setTimeout(() => onClose(), 2000);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#181411]/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[var(--card-bg)] rounded-[32px] p-8 max-w-sm w-full shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/5"
            >
                {step === 1 ? (
                    <>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">Request {provider.name}</h3>
                        <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest mb-8 opacity-60">Choose a preferred time slot.</p>
                        <div className="space-y-6 mb-8">
                            <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                                <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-50">Preferred Date</label>
                                <input type="date" className="w-full bg-transparent text-sm font-black text-[var(--text-primary)] outline-none cursor-pointer uppercase tracking-tight" />
                            </div>
                            <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                                <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-50">Time Slot</label>
                                <select className="w-full bg-transparent text-sm font-black text-[var(--text-primary)] outline-none cursor-pointer uppercase tracking-tight">
                                    <option className="bg-[var(--card-bg)]">Morning (9 AM - 12 PM)</option>
                                    <option className="bg-[var(--card-bg)]">Afternoon (12 PM - 4 PM)</option>
                                    <option className="bg-[var(--card-bg)]">Evening (4 PM - 8 PM)</option>
                                </select>
                            </div>
                            <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                                <label className="block text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1.5 opacity-50">Note (Optional)</label>
                                <textarea className="w-full bg-transparent text-sm font-black text-[var(--text-primary)] outline-none resize-none uppercase tracking-tight" rows="2" placeholder="Briefly describe..."></textarea>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={onClose} className="flex-1 py-4 text-[var(--text-muted)] font-black uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors text-[10px]">Cancel</button>
                            <button onClick={handleSubmit} className="flex-1 py-4 bg-[var(--accent-terracotta)] text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl text-[10px] uppercase tracking-widest active:scale-95">Send Request</button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-10">
                        <div className="w-20 h-20 bg-[var(--accent-green)]/10 text-[var(--accent-green)] rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce shadow-inner">
                            <FaCheckCircle className="text-4xl" />
                        </div>
                        <h3 className="text-2xl font-black text-[var(--text-primary)] mb-2 uppercase tracking-tight">Request Sent!</h3>
                        <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest opacity-60">You can track the status in Activity.</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default CustomerServices;
