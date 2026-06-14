import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import { useInterested } from "../../context/InterestedContext";
import { useActivity } from "../../context/ActivityContext";
import { useAuth } from "../../context/AuthContext";
import { FaWalking, FaCreditCard, FaChevronLeft, FaCalendarAlt, FaClock, FaExclamationTriangle, FaLock, FaInfoCircle } from 'react-icons/fa';

const Checkout = () => {
    const { shopId } = useParams();
    const navigate = useNavigate();
    const { items, clearInterestedByShop } = useInterested();
    const { addActivity, trustScore, generateVisitId } = useActivity();
    const { user, token } = useAuth();

    const shopItems = items.filter(i => i.shopId === shopId);
    const shopName = shopItems[0]?.shopName || "Shop";

    const isRestricted = trustScore < 50;
    const needsConfirmation = !isRestricted && trustScore < 100;

    // Step 4: Check Stock Confidence
    const hasLowConfidenceItems = shopItems.some(i => i.stockConfidence === 'LOW');

    const [method, setMethod] = useState(null); // 'VISIT' | 'PAY_NOW'
    const [visitDate, setVisitDate] = useState("");
    const [visitTime, setVisitTime] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRushMode, setIsRushMode] = useState(false);
    const [shopSubscription, setShopSubscription] = useState(null);
    const [operatingMode, setOperatingMode] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState(null); // Step 7
    const [shopPhone, setShopPhone] = useState(shopItems[0]?.shopPhone || "9876543210");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Step 5 & 7: Check Shop Mode & Subscription
    React.useEffect(() => {
        if (shopId) {
            axios.get(`/api/customer/shop/${shopId}`)
                .then(res => {
                    const shop = res.data.shop;
                    if (shop?.phone || shop?.shopDetails?.phone) {
                        setShopPhone(shop.phone || shop.shopDetails.phone);
                    }
                    if (shop?.shopDetails?.operatingMode) {
                        setOperatingMode(shop.shopDetails.operatingMode);
                    }
                    if (shop?.shopDetails?.operatingMode === 'RUSH') {
                        setIsRushMode(true);
                    }
                    if (shop?.subscription) {
                        setShopSubscription(shop.subscription);
                    }
                    if (shop?.paymentSettings) {
                        setPaymentSettings(shop.paymentSettings);
                    }
                })
                .catch(err => console.error("Failed to check shop details", err));
        }
    }, [shopId]);

    // Step 7 Logic: Pro sellers allow Medium Confidence Prepaid
    const isPro = shopSubscription?.planId === 'pro';

    // Restricted if: Low Confidence OR (Medium Confidence AND Not Pro)
    // FIX: Optimized Rule - Guaranteed Mode ALWAYS allows prepaid.
    // Step 7 logic: Only allow if seller has enabled and finished setup
    const isOnlinePaymentAvailable = paymentSettings?.acceptsOnlinePayment && paymentSettings?.paymentSetupCompleted;

    const hasRestrictedPrepaidItems = shopItems.some(i => {
        // Explicit override: Guaranteed mode allows prepaid regardless of individual item confidence flags
        if (operatingMode === 'GUARANTEED') return false;

        if (isRushMode) return true; // Rush always blocks prepaid

        if (i.stockConfidence === 'LOW') return true; // Always block Low
        if (i.stockConfidence === 'MEDIUM' && !isPro) return true; // Block Medium for Non-Pro
        return false;
    });

    const isPayNowDisabled = !isOnlinePaymentAvailable || hasRestrictedPrepaidItems || isRushMode;

    if (shopItems.length === 0) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4 text-stone-300">
                    <FaWalking size={40} />
                </div>
                <h2 className="text-xl font-bold text-stone-800 mb-2">No items to checkout</h2>
                <p className="text-stone-500 mb-6">Your interested list for this shop is empty.</p>
                <button
                    onClick={() => navigate('/interested')}
                    className="px-6 py-3 bg-stone-900 text-white rounded-xl font-bold shadow-lg"
                >
                    Back to Interested
                </button>
            </div>
        );
    }

    const handleCheckoutWhatsApp = () => {
        const phone = shopPhone || "9876543210";
        const itemsText = shopItems
            .map(item => `${item.quantity} x ${item.productName || item.name || "Product"}`)
            .join('\n');
        const message = `Hi,\n\nI need:\n\n${itemsText}\n\nAre these available?\n\n- Sent via Aisle`;
        const encodedText = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
    };

    const handleConfirm = async () => {
        if (!method) return;

        if (method === "VISIT" && (!visitDate || !visitTime)) {
            alert("Please select a visit date and time.");
            return;
        }

        setIsProcessing(true);

        // Create Backend Requests for each item
        try {
            const tokenVal = token || user?.token;

            // NEW: Create Real Order (Step 3)
            const res = await axios.post('/api/customer/orders', {
                sellerId: shopId,
                items: shopItems,
                paymentMode: method === 'PAY_NOW' ? 'PREPAID' : 'PAY_ON_VISIT',
                visitDate: method === 'VISIT' ? visitDate : null,
                visitTime: method === 'VISIT' ? visitTime : null
            }, {
                headers: { Authorization: `Bearer ${tokenVal}` }
            });

            const { orderId, qrPayload, status } = res.data;

            // Local Activity Update
            try {
                const newActivity = {
                    id: orderId, // Use Order ID
                    visitId: method === "VISIT" ? generateVisitId() : null, // Keep legacy if needed
                    qrData: JSON.stringify(qrPayload), // Store the JSON payload
                    shopId,
                    shopName,
                    customerId: user?._id || "CUST-GUEST",
                    type: method, // 'VISIT' or 'PAY_NOW'
                    items: shopItems,
                    status: status || (method === "VISIT" ? "UPCOMING" : "READY"),
                    visitDate: method === "VISIT" ? visitDate : null,
                    visitTime: method === "VISIT" ? visitTime : null,
                    createdAt: Date.now()
                };
                addActivity(newActivity);
            } catch (activityErr) {
                console.error("Failed to update activity context:", activityErr);
            }

            // Clear items from Interested list for this shop
            try {
                clearInterestedByShop(shopId);
            } catch (clearErr) {
                console.error("Failed to clear interested items:", clearErr);
            }

            setIsProcessing(false);
            navigate("/activity");

        } catch (error) {
            console.error("Checkout Failed", error);
            alert(error.response?.data?.message || "Failed to confirm request. Please try again.");
            setIsProcessing(false);
        }
    };

    const handleConfirmClick = () => {
        if (!method) return;
        if (method === 'PAY_NOW') {
            setShowConfirmModal(true);
        } else {
            handleConfirm();
        }
    };

    return (
        <div className="min-h-screen bg-transparent pb-32 pt-8">
            {/* Header (Unified) */}
            <div className="px-6 md:px-12 max-w-6xl mx-auto mb-8">
                <button onClick={() => navigate(-1)} className="text-stone-400 hover:text-stone-800 mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
                    <FaChevronLeft /> Back
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Visit Request</h1>
                    <p className="text-sm text-stone-500 mt-2 font-medium">Confirming intent for <span className="text-orange-600 font-bold">{shopName}</span></p>
                </div>
            </div>

            <div className="px-6 md:px-12 max-w-6xl mx-auto space-y-8">

                {/* Item List Summary */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
                    <h2 className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-4">Summary</h2>
                    <div className="space-y-4">
                        {shopItems.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center">
                                <img src={item.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-stone-50" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-stone-800">
                                        <span className="text-orange-600 mr-1">{item.quantity}x</span>
                                        {item.productName}
                                    </h3>
                                    <p className="text-xs text-stone-400 font-medium">{item.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Availability Confirmation Section */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <FaInfoCircle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-stone-900 text-sm">Availability Confirmation</h3>
                            <p className="text-xs text-stone-500 mt-1 font-medium">
                                Need large quantities? Contact seller before payment.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-3">
                        <a
                            href={`tel:${shopPhone}`}
                            className="flex-1 py-3 bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-bold transition-all hover:bg-stone-100 flex items-center justify-center gap-2"
                        >
                            📞 Call Seller
                        </a>
                        <button
                            onClick={handleCheckoutWhatsApp}
                            className="flex-1 py-3 bg-[#25D366] text-white rounded-xl text-xs font-bold transition-all hover:bg-[#20ba56] flex items-center justify-center gap-2 shadow-sm"
                        >
                            💬 WhatsApp Seller
                        </button>
                    </div>
                </div>

                {/* Commitment Choice */}
                <div className="space-y-4">
                    <h2 className="text-stone-400 text-[10px] font-black uppercase tracking-widest ml-2">Commitment Type</h2>

                    {/* Pay on Visit */}
                    <div
                        onClick={() => !isRestricted && setMethod("VISIT")}
                        className={`p-6 rounded-3xl border transition-all relative overflow-hidden backdrop-blur-md ${isRestricted ? 'bg-white/40 border-stone-100 cursor-not-allowed opacity-80' : method === 'VISIT' ? 'border-orange-500 bg-orange-50/50 cursor-pointer shadow-lg' : 'bg-white/70 border-white/50 cursor-pointer hover:shadow-lg hover:-translate-y-1'}`}
                    >
                        {isRestricted && (
                            <div className="absolute inset-0 bg-stone-50/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100 flex items-center gap-2 text-stone-400 font-bold text-xs">
                                    <FaLock className="text-[10px]" /> Option unavailable
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4 items-start relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isRestricted ? 'bg-stone-200 text-stone-400' : method === 'VISIT' ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                <FaWalking size={24} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-stone-900">Pay on Visit</h3>
                                    {needsConfirmation && (
                                        <span className="flex items-center gap-1 bg-orange-100 text-orange-600 text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                                            <FaExclamationTriangle /> Intent Confirmation
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-stone-500 mb-4">Confirm your intent to visit and pay at the shop.</p>

                                {method === 'VISIT' && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                                                <input
                                                    type="date"
                                                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                                                    value={visitDate}
                                                    onChange={e => setVisitDate(e.target.value)}
                                                />
                                            </div>
                                            <div className="relative">
                                                <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs" />
                                                <input
                                                    type="time"
                                                    className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-stone-200 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                                                    value={visitTime}
                                                    onChange={e => setVisitTime(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pay Now */}
                    <div
                        onClick={() => {
                            if (isPayNowDisabled) return; // Prevent selection
                            setMethod("PAY_NOW");
                        }}
                        className={`p-6 rounded-3xl border transition-all relative overflow-hidden backdrop-blur-md ${isPayNowDisabled ? 'bg-white/40 border-stone-100 cursor-not-allowed opacity-60' : method === 'PAY_NOW' ? 'border-green-500 bg-green-50/50 cursor-pointer shadow-lg' : 'bg-white/70 border-white/50 cursor-pointer hover:shadow-lg hover:-translate-y-1'}`}
                    >
                        {isPayNowDisabled && (
                            <div className="absolute inset-0 bg-stone-50/40 backdrop-blur-[1px] z-20 flex items-center justify-center">
                                <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-stone-100 flex items-center gap-2 text-stone-400 font-bold text-[10px] text-center">
                                    <FaLock className="text-[10px]" />
                                    {!isOnlinePaymentAvailable
                                        ? "Seller currently accepts pay at shop only"
                                        : isRushMode
                                            ? "Shop in High Rush. Visit to confirm."
                                            : "Prepaid unavailable for uncertainty (Pro Benefit)"}
                                </div>
                            </div>
                        )}
                        <div className="flex gap-4 items-start relative z-10">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isPayNowDisabled ? 'bg-stone-200 text-stone-400' : method === 'PAY_NOW' ? 'bg-green-500 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                <FaCreditCard size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-stone-900">Pay Now</h3>
                                <p className="text-sm text-stone-500">Secure items immediately. Quick pickup.</p>

                                {method === 'PAY_NOW' && paymentSettings?.upiId && (
                                    <div className="mt-4 p-4 bg-white/80 rounded-2xl border border-green-100 animate-in slide-in-from-top-2">
                                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Direct Payment Target</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black text-stone-700 tracking-tight">{paymentSettings?.upiId}</p>
                                            <span className="text-[8px] font-black bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md uppercase">Direct-to-Seller</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-stone-100 z-40">
                <div className="max-w-6xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="hidden md:block text-xs text-stone-400 font-medium">
                        {method === 'VISIT' ? 'A visit confirmation token will be generated.' : 'Pre-payments are used for availability checks.'}
                    </p>
                    <button
                        onClick={handleConfirmClick}
                        disabled={!method || isProcessing}
                        className={`w-full md:w-auto px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${!method ? 'bg-stone-200 text-stone-400' : 'bg-stone-900 text-white hover:scale-[1.02] active:scale-[0.98]'}`}
                    >
                        {isProcessing ? 'Verifying Intent...' : method === 'VISIT' ? 'Confirm Intent to Visit' : 'Confirm & Pre-Pay Intent'}
                    </button>
                </div>
            </div>

            {/* Confirm Availability Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in animate-duration-200">
                    <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-stone-100 flex flex-col space-y-6 animate-scale-in">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 shrink-0">
                                <FaExclamationTriangle size={18} />
                            </div>
                            <h3 className="text-xl font-bold text-stone-900 tracking-tight">Confirm Availability</h3>
                        </div>

                        <p className="text-sm text-stone-600 leading-relaxed">
                            For bulk quantities or urgent purchases, we recommend contacting the seller before completing payment.
                        </p>

                        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100/80 space-y-1">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Seller Details</p>
                            <p className="font-bold text-stone-900 text-base">{shopName}</p>
                            <p className="text-sm text-stone-500 flex items-center gap-1.5 mt-1">
                                📞 {shopPhone}
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <div className="flex gap-3">
                                <a
                                    href={`tel:${shopPhone}`}
                                    className="flex-1 py-3.5 bg-white border border-stone-200 text-stone-800 text-sm font-bold rounded-2xl hover:bg-stone-50 active:scale-95 transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                                >
                                    📞 Call Seller
                                </a>
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        handleConfirm();
                                    }}
                                    className="flex-1 py-3.5 bg-stone-900 text-white text-sm font-bold rounded-2xl hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    Continue Payment
                                </button>
                            </div>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="w-full py-2.5 text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest transition-colors mt-1"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Checkout;
