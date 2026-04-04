import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaCreditCard, FaCheckCircle, FaMobileAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const PaymentSetupModal = ({ isOpen, onClose, onRefresh, initialStep = 1 }) => {
    const { token, checkUserStatus, user } = useAuth();
    const [step, setStep] = useState(initialStep);
    const [loading, setLoading] = useState(false);

    // State for payment settings
    const [upiId, setUpiId] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');

    // Fetch existing settings from the new dedicated collection
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seller/payment-settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.settings) {
                setUpiId(data.settings.upiId || '');
                setDisplayName(data.settings.displayName || user?.shopDetails?.shopName || '');
            }
        } catch (err) {
            console.error("Error fetching payment settings:", err);
        } finally {
            setLoading(false);
        }
    };

    // Update step and fetch data when modal opens/reopens
    useEffect(() => {
        if (isOpen) {
            setStep(initialStep);
            fetchSettings();
            setError('');
        }
    }, [isOpen, initialStep]);

    if (!isOpen) return null;

    // Handle "No" Selection
    const handleDeclineOnline = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seller/payment-settings', {
                method: 'POST', // or PUT, the controller handles both
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    acceptsOnlinePayment: false,
                    paymentSetupCompleted: true
                })
            });

            if (res.ok) {
                await checkUserStatus(); // Refresh user context (for prompt flags)
                if (onRefresh) onRefresh();
                onClose();
            } else {
                alert("Failed to save preference. Please try again.");
            }
        } catch (error) {
            console.error("Payment Preference Error:", error);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    // Handle "Yes" Selection
    const handleAcceptOnline = () => {
        setStep(2); // Move to Step 4 (UPI Collection)
    };

    // Handle Save UPI Details (Step 4)
    const handleSaveDetails = async () => {
        // Validation
        if (!upiId || (!upiId.includes('@') && !upiId.includes('***'))) {
            setError('Please enter a valid UPI ID (e.g., name@upi)');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/seller/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    acceptsOnlinePayment: true,
                    paymentSetupCompleted: true,
                    upiId: upiId,
                    paymentDisplayName: displayName
                })
            });

            if (res.ok) {
                await checkUserStatus();
                if (onRefresh) onRefresh();
                onClose();
            } else {
                const data = await res.json();
                setError(data.message || "Failed to save details.");
            }
        } catch (error) {
            console.error("Payment Details Save Error:", error);
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
                {/* ... existing header and content ... */}
                <div className="p-6 pb-2">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl mb-4">
                        <FaCreditCard />
                    </div>
                    <h2 className="text-xl font-black text-slate-800">Payment Preference</h2>
                    {step === 1 ? (
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Customers pay you directly. Tell us if you accept online payments.
                        </p>
                    ) : (
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            Enter the UPI ID where you want to receive payments.
                        </p>
                    )}
                </div>

                <div className="p-6 pt-2">
                    {step === 1 && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 text-center">
                                Do you accept online payments from customers?
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleAcceptOnline}
                                    className="p-4 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group text-left"
                                >
                                    <div className="font-bold text-slate-800 group-hover:text-emerald-700 mb-1">Yes</div>
                                    <div className="text-xs text-slate-500">I accept via UPI or QR</div>
                                </button>
                                <button
                                    onClick={handleDeclineOnline}
                                    disabled={loading}
                                    className="p-4 rounded-xl border-2 border-slate-100 hover:border-slate-400 hover:bg-slate-50 transition-all group text-left"
                                >
                                    <div className="font-bold text-slate-800 mb-1">No</div>
                                    <div className="text-xs text-slate-500">I verify on visit only</div>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    UPI ID <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    placeholder="example@upi"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                                />
                                {error && <p className="text-xs text-red-500 mt-2 font-bold">{error}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                    Display Name <span className="text-slate-400 font-normal normal-case">(Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your Shop Name"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    This name will be shown to customers when they pay.
                                </p>
                            </div>

                            <button
                                onClick={handleSaveDetails}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:shadow-none mt-4"
                            >
                                {loading ? 'Saving Settings...' : 'Save Payment Settings'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PaymentSetupModal;
