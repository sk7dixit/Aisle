import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaArrowRight, FaCheck } from 'react-icons/fa';
import AmbientBackground from '../../components/AmbientBackground';

const SellerIntro = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        ownerName: '',
        shopName: '',
        mobile: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Save to state/localStorage and move to next step
        navigate('/seller/onboarding/basics', { state: formData });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background font-sans">
            <AmbientBackground />

            <div className="w-full max-w-[900px] z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

                {/* Left: Value Prop */}
                <div className="text-left animate-fade-in-left">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center text-white text-3xl shadow-lg mb-8">
                        <FaStore />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        Get your shop online <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-start to-accent-end">in minutes.</span>
                    </h1>
                    <p className="text-text-secondary text-lg mb-8 leading-relaxed max-w-md">
                        Reach nearby customers searching for what you sell. No website needed. No upfront cost.
                    </p>

                    <div className="space-y-4">
                        {['Free listing', 'No technical skills required', 'Verified local badge'].map((item, index) => (
                            <div key={index} className="flex items-center gap-3 text-text-primary">
                                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs">
                                    <FaCheck />
                                </div>
                                <span className="font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Intro Form */}
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-soft p-8 relative overflow-hidden animate-fade-up">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Shop Name</label>
                            <input
                                name="shopName"
                                type="text"
                                placeholder="e.g. Gupta Electronics"
                                className="w-full bg-white/5 text-text-primary px-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                value={formData.shopName} onChange={handleChange} required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Owner Name</label>
                            <input
                                name="ownerName"
                                type="text"
                                placeholder="Your Full Name"
                                className="w-full bg-white/5 text-text-primary px-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                value={formData.ownerName} onChange={handleChange} required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Mobile Number</label>
                            <div className="flex gap-3">
                                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-text-tertiary flex items-center">
                                    +91
                                </div>
                                <input
                                    name="mobile"
                                    type="tel"
                                    placeholder="98765 43210"
                                    className="w-full bg-white/5 text-text-primary px-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                    value={formData.mobile} onChange={handleChange} required
                                    maxLength="10"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gradient-to-r from-accent-start to-accent-end text-white font-bold py-4 rounded-xl shadow-lg shadow-accent-end/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                        >
                            Continue <FaArrowRight />
                        </button>

                        <p className="text-center text-xs text-text-tertiary mt-4">
                            No signup yet. We’ll verify your details first.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SellerIntro;
