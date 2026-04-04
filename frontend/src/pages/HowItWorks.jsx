import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';
import { useNavigate } from 'react-router-dom';

const HowItWorks = () => {
    const [activeTab, setActiveTab] = useState('customer');
    const navigate = useNavigate();

    const customerSteps = [
        {
            number: 1,
            title: "Allow Location",
            desc: "We detect shops near you."
        },
        {
            number: 2,
            title: "Browse Nearby",
            desc: "See shops and products available right now."
        },
        {
            number: 3,
            title: "Pick What You Need",
            desc: "Select a product or shop."
        },
        {
            number: 4,
            title: "Send Request",
            desc: "Your request goes directly to the seller."
        },
        {
            number: 5,
            title: "Visit the Shop",
            desc: "Connect and buy locally."
        }
    ];

    const sellerSteps = [
        {
            number: 1,
            title: "Register Shop",
            desc: "Add your shop and products."
        },
        {
            number: 2,
            title: "Get Verified",
            desc: "Once approved, you go live."
        },
        {
            number: 3,
            title: "Get Requests",
            desc: "Nearby customers send product requests."
        },
        {
            number: 4,
            title: "Respond Easily",
            desc: "Accept or guide customers."
        },
        {
            number: 5,
            title: "Grow Locally",
            desc: "More visibility, real footfall."
        }
    ];

    const currentSteps = activeTab === 'customer' ? customerSteps : sellerSteps;

    return (
        <PageWrapper className="bg-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
                <div className="max-w-[1200px] mx-auto">

                    {/* SECTION 1: TITLE BLOCK */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">How ShopLens Works</h1>
                        <p className="text-lg text-slate-500">
                            See how customers discover shops and how sellers get real requests.
                        </p>
                    </div>

                    {/* SECTION 2: ROLE TOGGLE */}
                    <div className="flex justify-center mb-10">
                        <div className="bg-slate-100 p-1 rounded-full inline-flex">
                            <button
                                onClick={() => setActiveTab('customer')}
                                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeTab === 'customer'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Customer
                            </button>
                            <button
                                onClick={() => setActiveTab('seller')}
                                className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all duration-200 ${activeTab === 'seller'
                                        ? 'bg-teal-600 text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Seller
                            </button>
                        </div>
                    </div>

                    {/* SECTION 3: STEPS GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
                        {currentSteps.map((step) => (
                            <div
                                key={step.number}
                                className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center h-full hover:border-slate-300 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-900 font-bold flex items-center justify-center mb-4 text-lg border border-slate-100">
                                    {step.number}
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* SECTION 4: BOTTOM CTA */}
                    <div className="text-center">
                        <button
                            onClick={() => navigate(activeTab === 'customer' ? '/explore' : '/seller/register')}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            {activeTab === 'customer' ? 'Explore Nearby Shops' : 'Register Your Shop'}
                        </button>
                    </div>

                </div>
            </main>

            <Footer />
        </PageWrapper>
    );
};

export default HowItWorks;
