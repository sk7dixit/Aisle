import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaClock, FaCalendarAlt, FaCreditCard, FaWalking, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const CustomerCheckout = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // selectedIds from Interested page
    const selectedIds = state?.selectedIds || [];

    // Local State
    const [commitmentMode, setCommitmentMode] = useState(null); // 'visit' | 'now'
    const [visitDate, setVisitDate] = useState('');
    const [visitTime, setVisitTime] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [shopData, setShopData] = useState(null); // Step 7
    const [loadingShop, setLoadingShop] = useState(false);

    // Filter items (In a real app, we'd fetch details again to ensure price/availability validity)
    // For now, we assume we passed necessary display info or fetch minimal info.
    // Simplifying: We will assume the Interested page passed the item details or we mock them for the UI step.
    const items = state?.items || [];
    const shopId = items[0]?.shopId; // Step 7

    // Fetch Shop Data for Payment Settings
    useEffect(() => {
        if (shopId) {
            setLoadingShop(true);
            axios.get(`/api/customer/shop/${shopId}`)
                .then(res => {
                    setShopData(res.data.shop);
                })
                .catch(err => console.error("Error fetching shop data:", err))
                .finally(() => setLoadingShop(false));
        }
    }, [shopId]);

    const paymentSettings = shopData?.paymentSettings;
    const isOnlineAvailable = paymentSettings?.acceptsOnlinePayment && paymentSettings?.paymentSetupCompleted;

    // Calculate Totals (Mock)
    const totalItems = items.length;
    const shopName = items[0]?.sellerShopName || "Shop";

    const handleConfirm = async () => {
        if (!commitmentMode) return;
        if (commitmentMode === 'visit' && (!visitDate || !visitTime)) {
            alert("Please select a visit time.");
            return;
        }

        setIsProcessing(true);

        try {
            const token = localStorage.getItem('token');
            // Confirm Visit API
            if (commitmentMode === 'visit') {
                await Promise.all(selectedIds.map(id =>
                    axios.put(`/api/requests/${id}/confirm-visit`, {
                        visitDate,
                        visitTime
                    }, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ));
            } else {
                // Pay Now Stub
                // In real logic, this would init Stripe/Razorpay
                alert("Payment Gateway integration pending. Marking as paid for demo.");
                // Mock success
            }

            // Success Redirect
            navigate('/activity');

        } catch (error) {
            console.error("Checkout failed", error);
            alert("Failed to process commitment. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (selectedIds.length === 0) return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
            <p>No items selected for checkout.</p>
            <button onClick={() => navigate('/interested')} className="text-blue-600 mt-2">Go Back</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans">

            {/* 1. Header (Context) */}
            <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-2xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-slate-900">Checkout</h1>
                        <p className="text-xs text-slate-500">Committing to <span className="font-bold text-slate-700">{shopName}</span></p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6 mt-4">

                {/* 2. Item Summary (Read Only) */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="text-sm font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Item Summary</h2>
                    <ul className="space-y-3">
                        {items.map((item, idx) => (
                            <li key={idx} className="flex justify-between items-start text-sm">
                                <div>
                                    <span className="font-medium text-slate-700">{item.productName}</span>
                                    <p className="text-xs text-slate-400">Qty: 1 (Default)</p>
                                </div>
                                <span className="font-mono text-slate-500">--</span>
                            </li>
                        ))}
                    </ul>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500">Total Items</span>
                        <span className="font-bold text-slate-900 text-lg">{totalItems}</span>
                    </div>
                </div>

                {/* 3. Commitment Options */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">Choose Commitment Type</h2>

                    {/* Option A: Pay on Visit */}
                    <div
                        onClick={() => setCommitmentMode('visit')}
                        className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group
                            ${commitmentMode === 'visit' ? 'border-[#E35336] ring-1 ring-[#E35336] bg-orange-50/10' : 'border-slate-100 hover:border-slate-200'}
                        `}
                    >
                        <div className="flex items-start gap-4 z-10 relative">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors
                                ${commitmentMode === 'visit' ? 'bg-[#E35336] text-white' : 'bg-slate-100 text-slate-400'}
                            `}>
                                <FaWalking className="text-xl" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-lg">Pay on Visit</h3>
                                <p className="text-sm text-slate-500 mb-3">Reserve items now, pay when you collect.</p>

                                {/* Time Selection (Only if selected) */}
                                {commitmentMode === 'visit' && (
                                    <div className="mt-4 p-4 bg-slate-50 rounded-xl animate-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-3 mb-2">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Date</label>
                                                <input
                                                    type="date"
                                                    className="w-full text-sm p-2 rounded-lg border border-slate-200"
                                                    onChange={e => setVisitDate(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full text-sm p-2 rounded-lg border border-slate-200"
                                                    onChange={e => setVisitTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <FaExclamationTriangle /> Items reserved for this slot only.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Option B: Pay Now */}
                    {isOnlineAvailable && (
                        <div
                            onClick={() => setCommitmentMode('now')}
                            className={`bg-white p-6 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden
                                ${commitmentMode === 'now' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-100 hover:border-slate-200'}
                            `}
                        >
                            <div className="flex items-start gap-4 z-10 relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-colors
                                    ${commitmentMode === 'now' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}
                                `}>
                                    <FaCreditCard className="text-xl" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg">Pay Now</h3>
                                    <p className="text-sm text-slate-500">Secure items immediately. Quick pickup.</p>

                                    {commitmentMode === 'now' && paymentSettings?.upiId && (
                                        <div className="mt-4 p-4 bg-emerald-50 rounded-xl animate-in slide-in-from-top-2 border border-emerald-100">
                                            <p className="text-[10px] font-bold text-emerald-800 uppercase mb-1">Payment Target</p>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black text-emerald-900">{paymentSettings.upiId}</span>
                                                <span className="text-[9px] bg-emerald-200/50 text-emerald-700 px-2 py-0.5 rounded font-black uppercase">Direct</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

            </div>

            {/* 4. Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-30">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={handleConfirm}
                        disabled={!commitmentMode || isProcessing}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-xl transition-all
                            ${!commitmentMode ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#E35336] hover:bg-orange-700 active:scale-[0.98]'}
                        `}
                    >
                        {isProcessing ? 'Processing...' : commitmentMode === 'visit' ? 'Confirm Visit' : commitmentMode === 'now' ? 'Pay Now' : 'Select Option'}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-2">
                        {commitmentMode === 'visit' ? 'You can cancel anytime before the visit.' : 'Refunds subject to seller policy.'}
                    </p>
                </div>
            </div>

        </div>
    );
};

export default CustomerCheckout;
