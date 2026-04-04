import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaStore, FaQuoteLeft } from 'react-icons/fa';

const SellerSuccess = () => {
    const stories = [
        {
            shop: "Gupta General Store",
            location: "Vadodara, Gujarat",
            text: "Since listing on ShopLens, my regular customers check stock before coming. It saves them time and I get fewer 'do you have this?' calls.",
            initial: "G",
            color: "from-blue-500 to-blue-600"
        },
        {
            shop: "City Medicos",
            location: "Alkapuri, Vadodara",
            text: "People used to order online and wait 2 days. Now they see I have the medicine and come pick it up in 10 minutes.",
            initial: "C",
            color: "from-[#14B8A6] to-teal-600" // Mint gradient
        }
    ];

    return (
        <div className="bg-[#F6FAFF] min-h-svh flex flex-col font-inter">
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#F6FAFF]/90 backdrop-blur-md border-b border-blue-50/50">
                <Navbar />
            </div>

            <main className="flex-grow pt-32 pb-24 px-6 container mx-auto max-w-5xl">
                <div className="text-center mb-16 animate-soft-in">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Seller Success Stories
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        See how local businesses in Vadodara are growing with ShopLens.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {stories.map((story, index) => (
                        <div
                            key={index}
                            className="bg-white p-10 rounded-[28px] border border-[#E5EDF6] shadow-[0_8px_32px_rgba(37,99,235,0.06)] hover:shadow-[0_24px_60px_rgba(37,99,235,0.12)] hover:-translate-y-2 transition-all duration-300 relative animate-soft-in"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <FaQuoteLeft className="text-blue-50 text-6xl absolute top-8 left-8" />

                            <div className="relative z-10 pt-6">
                                <p className="text-slate-600 text-lg leading-relaxed mb-10 italic font-medium">
                                    "{story.text}"
                                </p>
                                <div className="flex items-center gap-4 border-t border-slate-100 pt-8">
                                    <div className={`w-14 h-14 bg-gradient-to-br ${story.color} rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md`}>
                                        {story.initial}
                                    </div>
                                    <div>
                                        <h4 className="text-slate-900 font-bold text-lg">{story.shop}</h4>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium">
                                            <FaStore className="text-blue-400" size={12} /> {story.location}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SellerSuccess;
