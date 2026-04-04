import React from 'react';
import { MapPin, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

const CTA = () => {
    const navigate = useNavigate();

    return (
        <section className="py-20 relative overflow-hidden">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-teal-900 to-gray-900">
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute top-0 right-1/4 w-96 h-96 bg-coral-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-amber-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-white uppercase">Join 50,000+ Smart Shoppers</span>
                </div>

                {/* Heading */}
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                    Your Neighborhood is
                    <br />
                    <span className="bg-gradient-to-r from-teal-400 via-coral-400 to-amber-400 bg-clip-text text-transparent animate-gradient">
                        Open for Business
                    </span>
                </h2>

                {/* Description */}
                <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                    Join your neighbors finding hidden gems right around the corner.
                    Don't just search. <span className="text-white font-semibold">Find.</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <Button
                        size="lg"
                        className="px-10 py-6 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-coral-500/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                        onClick={() => navigate('/explore')}
                    >
                        <Sparkles className="w-6 h-6" />
                        Start Exploring Now
                    </Button>

                    <Button
                        size="lg"
                        variant="outline"
                        className="px-10 py-6 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-2 border-white/30 rounded-xl font-bold text-lg transform hover:scale-105 transition-all duration-300 flex items-center gap-3"
                    >
                        <MapPin className="w-6 h-6" />
                        View Demo
                    </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-white/20">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">2,500+</p>
                        <p className="text-sm text-gray-300">Verified Shops</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">50K+</p>
                        <p className="text-sm text-gray-300">Active Users</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">100K+</p>
                        <p className="text-sm text-gray-300">Products Available</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white mb-1">4.9/5</p>
                        <p className="text-sm text-gray-300">Customer Rating</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
