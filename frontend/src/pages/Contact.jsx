import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaEnvelope } from 'react-icons/fa';
import PageWrapper from '../components/common/PageWrapper';

const Contact = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <PageWrapper className="bg-[#F6FAFF] min-h-svh flex flex-col font-inter">
            <div className="fixed top-0 left-0 right-0 z-50 bg-[#F6FAFF]/90 backdrop-blur-md border-b border-blue-50/50">
                <Navbar />
            </div>

            <main className="flex-grow pt-32 pb-20 px-6 container mx-auto flex flex-col items-center justify-center min-h-[60svh]">

                {/* Hero Text */}
                <div className={`text-center max-w-[680px] mb-12 transition-all duration-700 delay-100 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        Get in Touch
                    </h1>
                    <p className="text-xl text-slate-500 font-medium leading-relaxed">
                        We’re building Aisle in public. <br className="hidden md:block" />
                        Have a question, idea, or partnership in mind?
                    </p>
                </div>

                {/* Contact Card */}
                <div
                    className={`bg-white rounded-[24px] shadow-[0_24px_60px_rgba(37,99,235,0.12)] p-8 md:p-12 text-center w-full max-w-lg border border-slate-100 transition-all duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-5 scale-[0.98]'}`}
                >
                    <div className="w-16 h-16 bg-[#E8F9F4] text-[#14B8A6] rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl shadow-sm">
                        <FaEnvelope />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Contact Support</h2>
                    <p className="text-slate-500 mb-8 font-medium">Early access support & partnerships</p>

                    <a
                        href="mailto:shoplens017@gmail.com"
                        className="block w-full py-4 px-6 bg-slate-50 rounded-xl text-slate-900 font-bold text-lg border border-slate-200 transition-all duration-300 hover:bg-white hover:border-[#14B8A6] hover:text-[#14B8A6] hover:shadow-[0_12px_32px_rgba(20,184,166,0.15)] hover:-translate-y-[2px]"
                    >
                        shoplens017@gmail.com
                    </a>
                </div>

                {/* Reassurance */}
                <p className={`mt-8 text-slate-400 text-sm font-medium transition-all duration-700 delay-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                    We usually respond within 24 hours. No bots. No ticket numbers.
                </p>

            </main>

            <Footer />
        </PageWrapper>
    );
};

export default Contact;
