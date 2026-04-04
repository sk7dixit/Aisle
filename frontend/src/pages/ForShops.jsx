import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaBell, FaCheckCircle, FaRocket } from 'react-icons/fa';

const ForShops = () => {
    const navigate = useNavigate();

    const benefits = [
        {
            title: "Local Visibility",
            desc: "Your shop appears to customers nearby."
        },
        {
            title: "Real Requests",
            desc: "Only interested customers contact you."
        },
        {
            title: "No Extra Charges",
            desc: "Sell at your own store price."
        },
        {
            title: "Easy Setup",
            desc: "Add products and go live quickly."
        }
    ];

    const steps = [
        {
            number: 1,
            title: "Register Your Shop",
            desc: "Add basic shop details."
        },
        {
            number: 2,
            title: "Add Products",
            desc: "List what you sell."
        },
        {
            number: 3,
            title: "Get Requests",
            desc: "Nearby customers contact you."
        },
        {
            number: 4,
            title: "Sell Locally",
            desc: "Respond and complete the sale."
        }
    ];

    return (
        <PageWrapper className="bg-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
                <div className="max-w-[1200px] mx-auto">

                    {/* SECTION 1: TITLE BLOCK */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">For Local Shops</h1>
                        <p className="text-lg text-slate-500">
                            Get discovered by nearby customers looking for what you sell.
                        </p>
                    </div>

                    {/* SECTION 2: BENEFITS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
                        {benefits.map((benefit, index) => (
                            <div
                                key={index}
                                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center h-full hover:border-slate-300 transition-colors shadow-sm hover:shadow-md"
                            >
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{benefit.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    {benefit.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* SECTION 3: HOW IT WORKS (SELLER) */}
                    <div className="mb-12 text-center">
                        <h2 className="text-2xl font-bold text-slate-900 mb-8">How it works</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {steps.map((step) => (
                                <div key={step.number} className="flex flex-col items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center mb-4 text-lg shadow-md">
                                        {step.number}
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-1">{step.title}</h3>
                                    <p className="text-sm text-slate-500">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SECTION 4: FEATURES */}
                    <div className="max-w-3xl mx-auto mb-16 px-4">
                        <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                            <h3 className="text-center text-slate-400 font-bold uppercase tracking-wider text-xs mb-6">Key Features</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12">
                                <div className="flex items-center gap-3">
                                    <FaStore className="text-teal-600" />
                                    <span className="text-slate-700 font-medium">Shop profile</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FaCheckCircle className="text-teal-600" />
                                    <span className="text-slate-700 font-medium">Product listing</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FaRocket className="text-teal-600" />
                                    <span className="text-slate-700 font-medium">Customer requests</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <FaBell className="text-teal-600" />
                                    <span className="text-slate-700 font-medium">Notifications</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: PRIMARY CTA */}
                    <div className="text-center">
                        <button
                            onClick={() => navigate('/seller/register')}
                            className="bg-slate-900 hover:bg-black text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 mb-3"
                        >
                            Register Your Shop
                        </button>
                        <p className="text-sm text-slate-400 font-medium">Takes only a few minutes</p>
                    </div>

                </div>
            </main>

            <Footer />
        </PageWrapper>
    );
};

export default ForShops;
