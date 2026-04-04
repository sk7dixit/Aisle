import React from 'react';
import { howItWorks } from '../../data/mockData';
import * as Icons from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const HowItWorks = () => {
    const navigate = useNavigate();

    return (
        <section id="how-it-works" className="py-20 bg-gradient-to-br from-gray-900 via-teal-900 to-gray-900 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-coral-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-2 bg-teal-500/20 backdrop-blur-sm rounded-full border border-teal-400/30 mb-4">
                        <span className="text-sm font-semibold text-teal-300 uppercase">The Smart Shopper's Journey</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        From Need to Purchase in Minutes
                    </h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Simple, direct, and efficient. No complexity, just smart local shopping.
                    </p>
                </div>

                {/* Journey Visualization */}
                <div className="relative">
                    {/* Central Hub */}
                    <div className="hidden lg:flex items-center justify-center mb-20">
                        <div className="relative w-48 h-48 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center shadow-2xl animate-pulse-slow">
                            <div className="text-center">
                                <Icons.Store className="w-12 h-12 text-white mx-auto mb-2" />
                                <p className="text-white font-bold text-lg">ShopLens</p>
                                <p className="text-teal-100 text-xs">Local & Live</p>
                            </div>

                            {/* Connecting Lines */}
                            {[0, 72, 144, 216, 288].map((angle, index) => (
                                <div
                                    key={index}
                                    className="absolute w-32 h-0.5 bg-gradient-to-r from-teal-400 to-transparent origin-left"
                                    style={{
                                        transform: `rotate(${angle}deg)`,
                                        left: '50%',
                                        top: '50%'
                                    }}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4">
                        {howItWorks.map((step, index) => {
                            const IconComponent = Icons[step.icon] || Icons.Circle;

                            return (
                                <div
                                    key={step.step}
                                    className="relative group"
                                >
                                    {/* Step Card */}
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl h-full">
                                        {/* Step Number */}
                                        <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-coral-500 to-coral-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            {step.step}
                                        </div>

                                        {/* Icon */}
                                        <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 mx-auto">
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>

                                        {/* Content */}
                                        <h3 className="text-lg font-bold text-white mb-3 text-center">
                                            {step.title}
                                        </h3>
                                        <p className="text-sm text-gray-300 text-center leading-relaxed">
                                            {step.description}
                                        </p>
                                    </div>

                                    {/* Arrow Between Steps (Desktop) */}
                                    {index < howItWorks.length - 1 && (
                                        <div className="hidden lg:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-20">
                                            <Icons.ArrowRight className="w-6 h-6 text-teal-400" />
                                        </div>
                                    )}

                                    {/* Arrow Between Steps (Mobile) */}
                                    {index < howItWorks.length - 1 && (
                                        <div className="lg:hidden flex justify-center my-4">
                                            <Icons.ArrowDown className="w-6 h-6 text-teal-400" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className="text-center mt-16">
                    <p className="text-gray-300 mb-6 text-lg">Ready to discover what's around you?</p>
                    <button
                        onClick={() => navigate('/auth?mode=signup')}
                        className="px-10 py-4 bg-gradient-to-r from-coral-500 to-coral-600 hover:from-coral-600 hover:to-coral-700 text-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-coral-500/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-3 mx-auto"
                    >
                        Start Shopping Local
                        <Icons.Sparkles className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
