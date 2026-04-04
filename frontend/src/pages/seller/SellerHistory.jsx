import React, { useState, useEffect } from 'react';
import { FaHistory, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const SellerHistory = () => {
    const { token } = useAuth();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSalesHistory();
    }, []);

    const fetchSalesHistory = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/seller/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sales history');
            }

            const data = await response.json();
            setHistory(data);
            setError(null);
        } catch (err) {
            console.error('Sales History Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const hasHistory = history.length > 0;

    if (loading) {
        return (
            <div className="space-y-6 pb-20 animate-fade-in-up">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up">
            {/* 1. Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <FaHistory className="text-blue-500" /> Sales History
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Your completed sales, organized by date
                    </p>
                </div>

                {/* Optional Filter (Visual Only for now) */}
                <button
                    onClick={fetchSalesHistory}
                    className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-500 font-bold text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                    <FaCalendarAlt /> Refresh
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
                    Error loading sales history: {error}
                </div>
            )}

            {/* 2. Main Content */}
            {hasHistory ? (
                <div className="space-y-8">
                    {history.map((day, index) => (
                        <div key={index} className="animate-fade-in">
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                {day.displayDate}
                            </h3>
                            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                                {day.items.map((item, idx) => (
                                    <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm md:text-base">{item.productName}</p>
                                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                                Qty: {item.quantity} • {item.customerName}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-slate-800">₹{item.price}</p>
                                            <p className="text-[10px] text-slate-400 font-medium lowercase">{item.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* 3. Empty State */
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 border-dashed">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <FaHistory className="text-3xl text-slate-300" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-lg mb-1">No sales history yet</h3>
                    <p className="text-slate-400 text-sm max-w-xs text-center">
                        Once you start verifying customer visits and orders, your completed sales will appear here.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SellerHistory;
