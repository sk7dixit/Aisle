import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaRocket } from 'react-icons/fa';

const Careers = () => {
    return (
        <div className="bg-[#F6FAFF] min-h-svh flex flex-col font-inter">
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#F6FAFF]/90 backdrop-blur-md border-b border-blue-50/50">
                <Navbar />
            </div>

            <main className="flex-grow pt-32 pb-24 px-6 container mx-auto max-w-2xl text-center">
                <div className="bg-white border border-[#E5EDF6] rounded-[32px] p-16 shadow-[0_24px_60px_rgba(37,99,235,0.08)] animate-soft-in">
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 text-3xl shadow-sm">
                        <FaRocket />
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Join Our Journey</h1>

                    <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">
                        We’re a small, passionate team building ShopLens to empower local commerce.
                    </p>

                    <div className="border-t border-slate-100 pt-10 mt-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-3">No Open Roles Currently</h3>
                        <p className="text-slate-400 font-medium">
                            We are not hiring right now, but new roles will be announced here soon.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Careers;
