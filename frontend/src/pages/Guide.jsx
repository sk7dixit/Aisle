import React from 'react';
import Navbar from '../components/Navbar';

const Guide = () => {
    return (
        <div className="pt-24 px-4 md:px-8 pb-16">
            <Navbar />
            <div className="max-w-4xl mx-auto space-y-16">

                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                        User Guide
                    </h1>
                    <p className="text-text-secondary max-w-2xl mx-auto text-lg">
                        Simple steps to get the most out of Aisle.
                    </p>
                </div>

                {/* Quick Cards Grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* What is Aisle */}
                    <SectionCard title="What is Aisle?">
                        <p className="mb-4">Aisle helps you find nearby businesses and creators and see what they have available—before you step out.</p>
                        <p className="text-accent-end font-medium">If a product shows “In Stock” on Aisle, it means it is available at the shop right now.</p>
                    </SectionCard>

                    {/* Trust & Safety */}
                    <SectionCard title="Trust & Safety">
                        <p className="mb-4">Every shop on Aisle goes through a verification process.</p>
                        <p>Verified shops display a <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-sm font-bold mx-1">TRUST BADGE</span>, helping buyers identify genuine local businesses and avoid fake listings.</p>
                    </SectionCard>
                </div>

                {/* For Shops & Buyers Split */}
                <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-mint flex items-center">
                            <span className="w-8 h-8 rounded-full bg-mint/20 flex items-center justify-center mr-3 text-sm">S</span>
                            For Growing Businesses
                        </h2>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <p className="text-text-secondary mb-4">Aisle gives your business a simple digital presence:</p>
                            <ul className="space-y-3 text-text-primary">
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-mint rounded-full mr-3"></span>Create a business profile</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-mint rounded-full mr-3"></span>Add a few product photos</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-mint rounded-full mr-3"></span>Show availability (In Stock / Out of Stock)</li>
                            </ul>
                            <p className="mt-4 text-sm text-text-tertiary">Customers nearby can discover your business presence and contact you directly. No technical skills required.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-accent-end flex items-center">
                            <span className="w-8 h-8 rounded-full bg-accent-end/20 flex items-center justify-center mr-3 text-sm">B</span>
                            For Local Buyers
                        </h2>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                            <p className="text-text-secondary mb-4">With Aisle, you can:</p>
                            <ul className="space-y-3 text-text-primary">
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-accent-end rounded-full mr-3"></span>Discover nearby businesses</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-accent-end rounded-full mr-3"></span>Check product availability</li>
                                <li className="flex items-center"><span className="w-1.5 h-1.5 bg-accent-end rounded-full mr-3"></span>Contact the shop directly</li>
                            </ul>
                            <p className="mt-4 text-sm text-text-tertiary">No delivery delays. No waiting. Just local shopping made easier.</p>
                        </div>
                    </div>
                </div>

                {/* Getting Started */}
                <div className="bg-gradient-to-r from-background to-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center">
                    <h2 className="text-3xl font-bold text-text-primary mb-8">Getting Started</h2>
                    <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-[#E07A5F] mb-2">Buyers</h3>
                            <p className="text-text-secondary">Simply search nearby businesses</p>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-mint mb-2">Sellers</h3>
                            <p className="text-text-secondary">Start your business presence and wait for verification</p>
                        </div>
                    </div>
                    <p className="mt-8 text-xl font-medium text-text-primary">That’s it. No complicated steps.</p>
                </div>
            </div>
        </div>
    );
};

const SectionCard = ({ title, children }) => (
    <div className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
        <h3 className="text-xl font-bold text-text-primary mb-4">{title}</h3>
        <div className="text-text-secondary leading-relaxed">
            {children}
        </div>
    </div>
);

export default Guide;
