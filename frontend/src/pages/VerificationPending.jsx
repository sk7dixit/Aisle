import React from 'react';
import { Link } from 'react-router-dom';
import { FaClock, FaCheckCircle, FaQuestionCircle, FaArrowRight } from 'react-icons/fa';
import AmbientBackground from '../components/AmbientBackground';

const VerificationPending = () => {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background font-sans">
            <AmbientBackground />

            <div className="w-full max-w-lg z-10 text-center">
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-soft p-10 animate-fade-up">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg shadow-yellow-500/10">
                        <FaClock />
                    </div>

                    <h1 className="text-3xl font-bold text-white mb-4">We’re verifying your shop</h1>
                    <p className="text-text-secondary leading-relaxed mb-8">
                        To keep ShopLens trustworthy, every shop is manually verified before going live. This helps customers rely on real inventory and real locations.
                    </p>

                    {/* Status Steps */}
                    <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left space-y-4 border border-white/5">
                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-green-500 text-black flex items-center justify-center text-xs">
                                <FaCheckCircle />
                            </div>
                            <span className="text-white font-medium">Details submitted</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-6 h-6 rounded-full bg-yellow-500 text-black flex items-center justify-center text-xs">
                                <span className="animate-pulse w-2 h-2 rounded-full bg-black"></span>
                            </div>
                            <div>
                                <span className="text-white font-medium block">Verification in progress</span>
                                <span className="text-text-tertiary text-xs">Usually completed within 24 hours</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4">
                        <Link to="/guide" className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                            <FaQuestionCircle /> Read “How ShopLens works”
                        </Link>

                        <p className="text-text-tertiary text-sm mt-6">
                            You’ll be notified via email/SMS as soon as your shop is approved.
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <Link to="/" className="text-text-tertiary hover:text-white transition-colors flex items-center justify-center gap-2">
                        Back to Home <FaArrowRight />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default VerificationPending;
