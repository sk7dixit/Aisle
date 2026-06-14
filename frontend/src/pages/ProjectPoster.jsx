import React from 'react';
import AisleLogo from '../components/AisleLogo';
import { FiMapPin, FiTruck, FiSearch, FiCheckCircle, FiArrowRight, FiActivity, FiLayers, FiPrinter } from 'react-icons/fi';

const ProjectPoster = () => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-gray-100 min-h-screen py-12 px-4 flex flex-col items-center font-sans text-gray-900 leading-tight print:p-0 print:bg-white">
            {/* PRINT OPTIMIZATION STYLES */}
            <style>
                {`
                    @media print {
                        @page {
                            size: auto;
                            margin: 0;
                        }
                        html, body {
                            height: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        body { 
                            background: white !important; 
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        .no-print { display: none !important; }
                        .poster-container {
                            /* Perfect 3:4 ratio filling the full page height */
                            height: 100vh !important;
                            width: 75vh !important;
                            max-width: 100vw !important;
                            
                            /* Centering */
                            margin: 0 auto !important;
                            
                            border: none !important;
                            box-shadow: none !important;
                            padding: 0 !important;
                            overflow: visible !important;
                        }
                        .print-tight { gap: 0.75rem !important; }
                        .print-body-tight { padding: 1rem 2rem !important; }
                    }
                `}
            </style>

            {/* Floating Action Button for PDF Export */}
            <button
                onClick={handlePrint}
                className="no-print fixed bottom-8 right-8 bg-[#B91C1C] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all z-[100] flex items-center gap-2 font-black uppercase tracking-widest text-xs"
                title="Save as PDF / Print"
            >
                <FiPrinter size={20} />
                <span>Save Poster</span>
            </button>
            {/* Poster Container - 3:4 Aspect Ratio (approx 36x48 inches equivalent for print) */}
            <div className="poster-container bg-white w-full max-w-[900px] shadow-2xl border-4 border-gray-200 overflow-hidden flex flex-col relative print:shadow-none print:border-none print:aspect-auto" style={{ aspectRatio: '3/4' }}>

                {/* --- HEADER --- */}
                <div className="bg-[#B91C1C] text-white p-6 relative overflow-hidden border-b-8 border-black">
                    <div className="absolute top-2 left-0 w-full h-1 bg-white opacity-40"></div>
                    <div className="absolute top-4 left-0 w-full h-0.5 bg-white opacity-20"></div>

                    <div className="flex justify-between items-center relative z-10">
                        <div className="text-center">
                            <h2 className="text-2xl font-black leading-tight tracking-tighter">TECH<br />EXPO</h2>
                            <p className="text-sm font-bold tracking-widest">2026</p>
                        </div>

                        <div className="flex-1 px-8 text-center border-l border-r border-white/20">
                            <h1 className="text-xl font-black uppercase tracking-widest mb-1">A Project Exhibition cum Competition</h1>
                            <p className="text-[10px] leading-tight font-medium opacity-90 max-w-[300px] mx-auto uppercase">
                                For Degree and Diploma Engineering, Applied Science, Computer Application, and Agriculture students, scheduled on 3rd & 4th February 2026.
                            </p>
                        </div>

                        <div className="text-right">
                            <h3 className="text-lg font-bold">Parul<sup>&reg;</sup> University</h3>
                            <div className="inline-block mt-1 bg-white text-black px-2 py-0.5 rounded-sm font-black text-xs">
                                NAAC <span className="text-[#B91C1C]">A++</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/30 text-center relative">
                        <div className="absolute bottom-1 left-0 w-full h-0.5 bg-white opacity-20"></div>
                    </div>
                </div>

                {/* --- CONTENT BODY --- */}
                <div className="flex-1 p-10 flex gap-8 bg-[#FBFAF4] print-body-tight">

                    {/* LEFT COLUMN (60%) */}
                    <div className="flex-[1.6] flex flex-col gap-10 print-tight">
                        {/* Logo & Value Strip */}
                        <div className="mb-2 -mt-4">
                            {/* Refined Logo Section */}
                            <div className="flex items-center justify-center scale-[0.9] origin-center mb-4">
                                <AisleLogo className="h-16 w-auto" />
                            </div>

                            {/* NEW: ONE-LINE VALUE STRIP */}
                            <div className="bg-gray-100 border-y border-gray-200 py-3 px-4 flex items-center justify-between text-[#B91C1C] font-black text-[10px] tracking-widest uppercase shadow-sm">
                                <span className="flex items-center gap-1.5"><FiMapPin size={12} /> Discover nearby businesses</span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5"><FiCheckCircle size={12} /> Check live availability</span>
                                <span className="text-gray-300">•</span>
                                <span className="flex items-center gap-1.5"><FiTruck size={12} /> Shop locally</span>
                            </div>
                        </div>

                        {/* Problem Statement (Bulletted) */}
                        <section className="bg-white/40 p-2 rounded-lg">
                            <h3 className="text-[#B91C1C] font-black text-lg uppercase tracking-wider mb-4 border-b-2 border-red-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#B91C1C] rounded-full"></span>
                                Problem Statement
                            </h3>
                            <ul className="space-y-3 text-sm text-gray-700 font-bold ml-2">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600 mt-0.5">❌</span> Local buyers don't know product availability nearby.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600 mt-0.5">❌</span> Multiple business visits waste significant time and physical effort.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600 mt-0.5">❌</span> Small physical vendors lack digital visibility against e-commerce giants.
                                </li>
                            </ul>
                        </section>

                        {/* Project Description & Key Features */}
                        <section className="space-y-6">
                            <h3 className="text-[#B91C1C] font-black text-lg uppercase tracking-wider mb-4 border-b-2 border-red-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-[#B91C1C] rounded-full"></span>
                                Project Overview
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4 text-xs leading-relaxed text-gray-700">
                                    <p>
                                        <strong className="text-gray-900 block border-l-4 border-red-700 pl-3 mb-2 uppercase tracking-tighter">Mission:</strong>
                                        Aisle is a state-of-the-art hyperlocal commerce engine that digitizes nearby business & creator inventories for instant discovery.
                                    </p>
                                    <p>
                                        <strong className="text-gray-900 block border-l-4 border-gray-400 pl-3 mb-2 uppercase tracking-tighter">Scope:</strong>
                                        Targets urban clusters with dense retail populations across grocery, electronics, and fashion sectors.
                                    </p>
                                </div>
                                {/* NEW: KEY FEATURES BOX */}
                                <div className="bg-red-50 border border-red-100 p-5 rounded-md shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase text-[#B91C1C] mb-2 flex items-center gap-1 underline underline-offset-4">
                                        <FiLayers size={10} /> Key Features
                                    </h4>
                                    <ul className="text-[10px] font-bold text-gray-800 space-y-1.5">
                                        <li className="flex items-center gap-1.5"><FiCheckCircle className="text-red-600" size={10} /> Live product availability</li>
                                        <li className="flex items-center gap-1.5"><FiCheckCircle className="text-red-600" size={10} /> Nearby business & creator discovery</li>
                                        <li className="flex items-center gap-1.5"><FiCheckCircle className="text-red-600" size={10} /> Category-wise browsing</li>
                                        <li className="flex items-center gap-1.5"><FiCheckCircle className="text-red-600" size={10} /> Lightweight seller dashboard</li>
                                    </ul>
                                </div>
                            </div>
                        </section>

                        {/* NEW: USE CASE BOX */}
                        <div className="bg-[#1A1A1A] text-white p-4 rounded-md mt-2 shadow-lg">
                            <h4 className="text-[#B91C1C] font-black uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                                <FiActivity size={12} /> Real-World Use Case
                            </h4>
                            <p className="text-[11px] font-medium leading-relaxed opacity-90">
                                <span className="text-red-500 font-bold">Example (Electronics):</span> A user searches for a specific "Type-C Fast Charger" → System identifies 3 nearby stores with stock → User selects closest shop → Local purchase completed instantly.
                            </p>
                        </div>

                        {/* FINAL ELEMENT: TECH STACK & STATUS STRIP */}
                        <div className="bg-red-50 border border-red-100 p-3 rounded-md mt-4 shadow-sm border-l-4 border-l-[#B91C1C]">
                            <h4 className="text-[10px] font-black uppercase text-gray-800 mb-2 flex items-center gap-2 tracking-wider">
                                🔧 Tech Stack & Project Status
                            </h4>
                            <div className="flex gap-6">
                                {/* TECH STACK */}
                                <div className="flex-1">
                                    <h5 className="text-[8px] font-black text-[#B91C1C] uppercase tracking-tighter mb-1.5 border-b border-red-200 inline-block">Tech Stack</h5>
                                    <ul className="text-[8px] font-bold text-gray-700 space-y-1">
                                        <li className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                            Frontend: <span className="text-gray-900">React</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                            Backend: <span className="text-gray-900">Node.js, Express</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                            Database: <span className="text-gray-900">MongoDB</span>
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-red-400 rounded-full"></span>
                                            APIs: <span className="text-gray-900 text-[7px]">Location & Map Services</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="w-[1px] bg-red-200"></div>
                                {/* PROJECT STATUS */}
                                <div className="flex-1">
                                    <h5 className="text-[8px] font-black text-[#B91C1C] uppercase tracking-tighter mb-1.5 border-b border-red-200 inline-block">Project Status</h5>
                                    <ul className="text-[8px] font-bold text-gray-700 space-y-1">
                                        <li className="flex items-center gap-1.5">
                                            <span className="text-green-600 font-bold">✔</span> Working Prototype
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <span className="text-green-600 font-bold">✔</span> Seller & Customer Panels
                                        </li>
                                        <li className="flex items-center gap-1.5">
                                            <span className="text-green-600 font-bold">✔</span> Real-time Stock Sync
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN (40%) */}
                    <div className="flex-1 flex flex-col gap-8">

                        {/* PROJECT PHOTOS */}
                        <div className="space-y-6">
                            {/* PHOTO 1 */}
                            <div className="relative group">
                                <div className="absolute -top-3 left-0 bg-[#B91C1C] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest transform -skew-x-12 z-10 shadow-md">
                                    Home page
                                </div>
                                <div className="w-full bg-white border border-gray-200 p-1.5 shadow-md overflow-hidden" style={{ aspectRatio: '16/10' }}>
                                    <img src="/poster_workflow.png" alt="Home page" className="w-full h-full object-cover filter brightness-105" />
                                </div>
                                <p className="text-[8px] font-black text-gray-400 mt-1 uppercase text-right tracking-tighter">Hyperlocal Discovery & Map View</p>
                            </div>

                            {/* PHOTO 2 */}
                            <div className="relative group">
                                <div className="absolute -top-3 left-0 bg-[#B91C1C] text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest transform -skew-x-12 z-10 shadow-md">
                                    Workflow
                                </div>
                                <div className="w-full bg-white border border-gray-200 p-1.5 shadow-md overflow-hidden" style={{ aspectRatio: '16/10' }}>
                                    <img src="/poster_hero.png" alt="Workflow" className="w-full h-full object-cover filter brightness-105" />
                                </div>
                                <p className="text-[8px] font-black text-gray-400 mt-1 uppercase text-right tracking-tighter">"Need to Purchase" Efficiency Flow</p>
                            </div>
                        </div>

                        {/* HOW IT WORKS MICRO-FLOW */}
                        <div className="text-center p-4 bg-white border border-gray-200 rounded shadow-md relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 opacity-20"></div>
                            <h4 className="text-[9px] font-black uppercase text-gray-500 mb-4 tracking-[0.2em] relative z-10">Customer Journey Flow</h4>
                            <div className="flex items-center justify-between px-2 relative z-10">
                                <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-[#B91C1C] shadow-sm"><FiSearch size={14} /></div>
                                    <span className="text-[7px] font-black uppercase">Search</span>
                                </div>
                                <FiArrowRight size={12} className="text-gray-300 animate-pulse" />
                                <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-[#B91C1C] shadow-sm"><FiMapPin size={14} /></div>
                                    <span className="text-[7px] font-black uppercase">Locate</span>
                                </div>
                                <FiArrowRight size={12} className="text-gray-300 animate-pulse" />
                                <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center text-[#B91C1C] shadow-sm"><FiCheckCircle size={14} /></div>
                                    <span className="text-[7px] font-black uppercase">Verify</span>
                                </div>
                                <FiArrowRight size={12} className="text-gray-300 animate-pulse" />
                                <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                                    <div className="w-7 h-7 rounded-full bg-[#B91C1C] flex items-center justify-center text-white shadow-md"><FiTruck size={14} /></div>
                                    <span className="text-[7px] font-black uppercase">Visit</span>
                                </div>
                            </div>
                        </div>

                        {/* TEAM & MENTOR (Listing Way) */}
                        <div className="flex flex-col gap-6">
                            {/* TEAM BOX */}
                            <div className="relative group">
                                <div className="absolute -top-2.5 left-2 bg-gray-800 text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-widest transform skew-x-[-15deg] z-10 shadow-sm border-l-2 border-red-600">
                                    Team Members
                                </div>
                                <div className="bg-white border-2 border-gray-200 p-4 pt-6 rounded-sm shadow-md group-hover:border-red-600 transition-colors">
                                    <ul className="text-[9px] font-black text-gray-800 space-y-2">
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                                            Shashwat Dixit <span className="text-red-600 text-[7px] italic ml-1 uppercase">(Team Leader)</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                            Khushaboo Saini
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                            Lakshya Dwivedi
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                            Khushveer Dara
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* MENTOR BOX */}
                            <div className="relative group">
                                <div className="absolute -top-2.5 left-2 bg-[#B91C1C] text-white px-3 py-0.5 text-[8px] font-black uppercase tracking-widest transform skew-x-[-15deg] z-10 shadow-sm border-l-2 border-black">
                                    Guided By (Mentor)
                                </div>
                                <div className="bg-red-50 border-2 border-red-100 p-4 pt-6 rounded-sm shadow-md group-hover:border-red-200 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-white border border-red-200 flex items-center justify-center text-[#B91C1C] font-black text-[9px]">BS</div>
                                        <span className="text-[10px] font-black text-[#B91C1C] tracking-wider uppercase">Bella Shah</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- FOOTER DECORATION --- */}
                <div className="h-6 bg-black flex items-center justify-center print:h-4">
                    <div className="w-full h-1 bg-white/10"></div>
                </div>
            </div>

            {/* Print Note */}
            <p className="no-print mt-8 text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                PROTOTYPE EXHIBITION DOCUMENT // AISLE IDENTITY
            </p>
        </div>
    );
};

export default ProjectPoster;
