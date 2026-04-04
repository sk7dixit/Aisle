import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';

const About = () => {
    return (
        <PageWrapper className="bg-white min-h-screen flex flex-col font-sans">
            <Header />

            <main className="flex-grow pt-32 pb-20 px-6">
                <div className="max-w-[1000px] mx-auto">

                    {/* SECTION 1: TITLE */}
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-slate-900 mb-4">About ShopLens</h1>
                        <p className="text-lg text-slate-500 font-medium">
                            Helping people discover local shops in real time.
                        </p>
                    </div>

                    {/* SECTION 2: WHAT SHOPLENS DOES */}
                    <div className="mb-14 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-3">What ShopLens Does</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            ShopLens shows live inventory from nearby shops so people can find what they need without waiting or guessing.
                        </p>
                    </div>

                    {/* SECTION 3: WHY SHOPLENS EXISTS */}
                    <div className="mb-14 max-w-2xl mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-3">Why We Built ShopLens</h2>
                        <p className="text-slate-600 leading-relaxed text-lg mb-2">
                            Local shops have what people need, but they’re hard to discover online.
                        </p>
                        <p className="text-slate-600 leading-relaxed text-lg">
                            ShopLens connects customers and nearby shops at the right moment.
                        </p>
                    </div>

                    {/* SECTION 4: WHO IT’S FOR */}
                    <div className="mb-20 max-w-4xl mx-auto">
                        <h2 className="text-xl font-bold text-slate-900 mb-8 text-center">Who It’s For</h2>
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Customers */}
                            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    Customers
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5" />
                                        Want to find products nearby
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5" />
                                        Prefer local shopping
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5" />
                                        Don’t want delivery delays
                                    </li>
                                </ul>
                            </div>

                            {/* Local Shops */}
                            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                                <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    Local Shops
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5" />
                                        Want more visibility
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5" />
                                        Want real customers
                                    </li>
                                    <li className="flex items-start gap-3 text-slate-600">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2.5" />
                                        Want simple tools
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: CLOSING LINE */}
                    <div className="text-center pt-8 border-t border-slate-100">
                        <p className="text-slate-400 font-medium">
                            ShopLens is built to support local shopping, simply and transparently.
                        </p>
                    </div>

                </div>
            </main>

            <Footer />
        </PageWrapper>
    );
};

export default About;
