import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaList, FaBoxes, FaHandshake, FaBan } from 'react-icons/fa';

const SellerGuide = () => {
    return (
        <div className="bg-[#F6FAFF] min-h-svh flex flex-col font-inter">
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#F6FAFF]/90 backdrop-blur-md border-b border-blue-50/50">
                <Navbar />
            </div>

            <main className="flex-grow pt-32 pb-24 px-6 container mx-auto max-w-5xl">
                {/* Hero */}
                <div className="text-center mb-16 animate-soft-in">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Seller Guide
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Everything you need to know about selling on Aisle.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* Card 1 */}
                    <div className="bg-white p-8 rounded-[24px] border border-[#E5EDF6] shadow-[0_4px_24px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 animate-soft-in" style={{ animationDelay: '100ms' }}>
                        <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                            <FaList />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">1. List Your Products</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            Simply add products using our Quick Catalog. No need to upload professional photos. Just the name and price.
                        </p>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white p-8 rounded-[24px] border border-[#E5EDF6] shadow-[0_4px_24px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 animate-soft-in" style={{ animationDelay: '200ms' }}>
                        <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                            <FaBoxes />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">2. Manage Inventory</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            Mark items as "In Stock" or "Out of Stock" with one tap. Keep it real-time to build trust.
                        </p>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white p-8 rounded-[24px] border border-[#E5EDF6] shadow-[0_4px_24px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 animate-soft-in" style={{ animationDelay: '300ms' }}>
                        <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                            <FaHandshake />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">3. Customer Interest</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            When a customer clicks "I'm Interested", you get a notification. You can call or WhatsApp them directly.
                        </p>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white p-8 rounded-[24px] border border-[#E5EDF6] shadow-[0_4px_24px_rgba(37,99,235,0.08)] hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all duration-300 animate-soft-in" style={{ animationDelay: '400ms' }}>
                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">
                            <FaBan />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-3">No Delivery, No Commission</h3>
                        <p className="text-slate-500 leading-relaxed text-sm">
                            We don't do delivery. Customers come to your store or pickup location. We don't charge commission on sales.
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default SellerGuide;
