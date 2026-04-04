import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    FaMicrophone,
    FaCamera,
    FaFileExcel,
    FaPen,
    FaDatabase,
    FaArrowRight,
    FaBolt,
    FaLayerGroup,
    FaCommentDots
} from 'react-icons/fa';
import AssistedListingModal from '../../components/seller/AssistedListingModal';

const SellerProducts = () => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ count: 0 });
    const [isAssistedModalOpen, setIsAssistedModalOpen] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/seller/inventory/metrics', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStats({ count: data.totalProducts || 0 });
                }
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
    }, [token]);

    const progressValue = Math.min((stats.count / 120) * 100, 100);

    return (
        <div className="max-w-7xl mx-auto px-6 pb-24 pt-4 animate-fade-in font-sans">

            <AssistedListingModal
                isOpen={isAssistedModalOpen}
                onClose={() => setIsAssistedModalOpen(false)}
            />

            {/* Header Section */}
            <div className="mb-10">
                <div className="flex items-center gap-4 mb-2">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight animate-fade-in-up">
                        Let's add products to your shop <span className="ml-2 inline-block animate-wave">👋</span>
                    </h1>

                    {/* Progress Pill */}
                    <div className="bg-slate-100 rounded-full px-4 py-1.5 flex items-center gap-3">
                        <div className="text-[10px] font-bold text-slate-400">
                            {stats.count} / 120
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressValue}%` }}
                            />
                        </div>
                    </div>
                </div>
                <p className="text-slate-500 font-medium text-lg animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                    Choose a method below. You can switch anytime — we'll help you at every step.
                </p>
            </div>

            {/* Recommended Section */}
            <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-blue-50 p-1.5 rounded-md text-blue-600">
                        <FaBolt size={12} />
                    </div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                        RECOMMENDED (FASTEST)
                    </span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* 1. Add by Voice */}
                    <Link to="/seller/add-product/voice" className="group relative bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-4 right-4">
                            <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                SMART SYNC
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-base mb-2">
                                <FaMicrophone />
                            </div>
                            <h3 className="text-base font-black text-slate-900 mb-1">Add by Voice</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-sm mb-2">
                                Just speak product names and prices. High-quality listings are created for you instantly.
                            </p>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                                Start Voice Listing <FaArrowRight />
                            </div>
                        </div>
                    </Link>

                    {/* 2. Add by Images (Smart Scan) */}
                    <Link to="/seller/image-listing" className="group relative bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="absolute top-4 right-4">
                            <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                SMART SCAN
                            </span>
                        </div>
                        <div className="mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center text-base mb-2">
                                <FaCamera />
                            </div>
                            <h3 className="text-base font-black text-slate-900 mb-1">Add by Images</h3>
                            <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-sm mb-2">
                                Click product photos or shelf images. Detection, categorization, and pricing happen automatically.
                            </p>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                                Upload Images <FaArrowRight />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Structured Methods Section */}
            <div className="mb-12">
                <div className="flex items-center gap-2 mb-4">
                    <div className="bg-slate-100 p-1.5 rounded-md text-slate-600">
                        <FaLayerGroup size={12} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        STRUCTURED METHODS
                    </span>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                    {/* 3. Bulk Upload */}
                    <Link to="/seller/add-product/bulk" className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-base mb-2">
                            <FaFileExcel />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">Bulk Upload (Excel)</h3>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-2 min-h-[30px]">
                            Upload many products at once using a spreadsheet.
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                            UPLOAD EXCEL <FaArrowRight />
                        </div>
                    </Link>

                    {/* 4. Add Manually */}
                    <Link to="/seller/add-product/manual" className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-base mb-2">
                            <FaPen />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">Add Manually</h3>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-2 min-h-[30px]">
                            Add products one by one with full control and preview.
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                            START MANUALLY <FaArrowRight />
                        </div>
                    </Link>

                    {/* 5. Match Catalog */}
                    <Link to="/seller/product-add/catalog" className="group bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-100 transition-all duration-300 hover:-translate-y-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-base mb-2">
                            <FaDatabase />
                        </div>
                        <h3 className="text-sm font-black text-slate-900 mb-1">Match Catalog</h3>
                        <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-2 min-h-[30px]">
                            Select products already on ShopLens and set your price.
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider group-hover:gap-2 transition-all">
                            BROWSE CATALOG <FaArrowRight />
                        </div>
                    </Link>
                </div>
            </div>

            {/* Assistance Banner */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-50 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-start gap-6 relative z-10">
                    <div className="bg-slate-900 text-white rounded-2xl w-14 h-14 flex items-center justify-center text-2xl shadow-lg shadow-slate-200">
                        <FaCommentDots />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Need help? We'll do it for you.</h3>
                        <p className="text-slate-500 font-medium max-w-lg text-sm leading-relaxed mb-3">
                            If you're short on time or facing issues, our dedicated team will visit your
                            shop or take your list and populate your ShopLens shelf for you.
                        </p>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            PAID SERVICE • VERIFIED BY SHOPLENS PROFESSIONALS
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsAssistedModalOpen(true)}
                    className="relative z-10 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-slate-200/50 transform hover:-translate-y-0.5 whitespace-nowrap"
                >
                    REQUEST ASSISTED LISTING
                </button>
            </div>

        </div>
    );
};

export default SellerProducts;
