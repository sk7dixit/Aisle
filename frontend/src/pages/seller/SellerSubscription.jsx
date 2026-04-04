import React, { useState } from 'react';
import { FaCheck, FaCrown, FaRocket, FaShieldAlt, FaStar, FaBolt, FaInfoCircle, FaLock, FaClock, FaEye, FaBoxOpen } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const SellerSubscription = () => {
    const { token, user, checkUserStatus } = useAuth();
    const subscription = user?.subscriptionStatus || { planId: 'free', currentProductCount: 0, productLimit: 120 };
    const currentPlanId = (subscription.planId || 'free').toLowerCase();

    // State for toggles
    const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, 6months, 12months
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [selectedBoost, setSelectedBoost] = useState(null); // 'daily', 'weekly'
    const [boostLoading, setBoostLoading] = useState(false);

    // Auto-refresh status on mount
    React.useEffect(() => {
        checkUserStatus();
    }, []);

    // Upgrade State
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeDetails, setUpgradeDetails] = useState(null);
    const [loadingPlanId, setLoadingPlanId] = useState(null); // specific plan loading
    const [upgradeLoading, setUpgradeLoading] = useState(false); // Global action loading (e.g. creating order)

    // Payment Flow State
    const [paymentStep, setPaymentStep] = useState('summary'); // summary, gateway, success
    const [paymentData, setPaymentData] = useState(null);

    // Pricing Logic
    const getPrice = (basePrice, cycle) => {
        if (cycle === '6months') return Math.round(basePrice * 6 * 0.85); // 15% off
        if (cycle === '12months') return Math.round(basePrice * 12 * 0.70); // 30% off
        return basePrice;
    };

    const formatPrice = (price) => `₹${price.toLocaleString()}`;

    // Upgrade Handlers
    const handleUpgrade = async (planId) => {
        setLoadingPlanId(planId);
        try {
            console.log(`[Subscription] Fetching preview for ${planId}...`);
            const res = await fetch('/api/seller/upgrade-preview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetPlan: planId, duration: billingCycle })
            });

            const data = await res.json();
            if (res.ok) {
                setUpgradeDetails(data);
                setShowUpgradeModal(true);
                setPaymentStep('summary');
            } else {
                throw new Error(data.message || "Failed to fetch preview");
            }
        } catch (error) {
            console.error("Upgrade Error:", error);
            alert("Connection error. Is the backend server running?");
        } finally {
            setLoadingPlanId(null);
        }
    };

    // Step 1: Create Order & Go to Gateway
    const initiatePayment = async () => {
        if (!termsAccepted) {
            alert("Please accept the Terms & Conditions.");
            return;
        }

        setUpgradeLoading(true);
        try {
            const isBoost = upgradeDetails.type === 'BOOST';
            const body = isBoost ? {
                type: 'BOOST',
                boostDuration: selectedBoost === 'daily' ? 1 : 7
            } : {
                type: 'SUBSCRIPTION',
                planId: upgradeDetails.targetPlan,
                duration: billingCycle
            };

            const orderRes = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            const orderData = await orderRes.json();

            if (!orderRes.ok) throw new Error(orderData.message || "Order creation failed");

            // Move to Gateway
            setPaymentData(orderData);
            setPaymentStep('gateway');

        } catch (error) {
            console.error("Payment Order Error", error);
            alert(`Order Creation Failed: ${error.message}`);
        } finally {
            setUpgradeLoading(false);
        }
    };

    const handleActivateBoost = () => {
        if (!selectedBoost) {
            alert("Please select a boost duration first.");
            return;
        }

        const price = selectedBoost === 'daily' ? 15 : 80;
        const tax = Math.round(price * 0.18);

        setUpgradeDetails({
            type: 'BOOST',
            targetPlan: `${selectedBoost.toUpperCase()} BOOST`,
            duration: selectedBoost === 'daily' ? '1 Day' : '7 Days',
            originalPrice: price,
            finalPrice: price,
            discountPercentage: 0,
            tax: tax,
            total: price + tax
        });

        setShowUpgradeModal(true);
        setPaymentStep('summary');
    };

    // Step 2 & 3: Simulate External Gateway & Verify
    const handleGatewayPayment = async (method) => {
        // In a real app, we would redirect to paymentData.upiIntentUrl 
        // Here we simulate the user completing payment on the gateway
        setUpgradeLoading(true);

        try {
            // Simulate User Time on Gateway
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Verify Payment (The Webhook Callback)
            const verifyRes = await fetch('/api/payment/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    transactionId: paymentData.transactionId,
                    paymentMethod: method
                })
            });

            if (verifyRes.ok) {
                setPaymentStep('success'); // Show Success Screen
                await checkUserStatus(); // Immediate Refresh
            } else {
                alert("Payment Verification Failed. Money will be refunded if deducted.");
            }

        } catch (error) {
            console.error("Verification Error", error);
            alert("Payment Verification Error");
        } finally {
            setUpgradeLoading(false);
        }
    };

    const closeAndRefresh = () => {
        setShowUpgradeModal(false);
        window.location.reload(); // Hard refresh to ensure all limits are applied cleanly
    };

    // Helper: Determine button state
    const getPlanState = (planId) => {
        if (planId === currentPlanId) return { text: 'Current Plan', disabled: true, style: 'bg-slate-100 text-slate-400 cursor-not-allowed' };

        // Logical check: Is the plan "lower" than current?
        const planOrder = ['free', 'growth', 'pro'];
        const currentIndex = planOrder.indexOf(currentPlanId);
        const targetIndex = planOrder.indexOf(planId);

        if (targetIndex < currentIndex) {
            return { text: 'Basic Plan', disabled: true, style: 'bg-slate-50 text-slate-300 cursor-not-allowed' };
        }

        return { text: `Upgrade to ${planId.charAt(0).toUpperCase() + planId.slice(1)}`, disabled: false, style: 'bg-slate-900 text-white hover:bg-slate-800' };
    };

    // Data for Plans
    const plans = [
        {
            id: 'free',
            name: 'Free Premium',
            basePrice: 0,
            features: ['Up to 120 Products', 'Basic Community Access', 'Standard Support'],
            highlight: false
        },
        {
            id: 'growth',
            name: 'Growth Plan',
            basePrice: 50,
            features: [
                'Up to 300 Products',
                'Priority Visibility (+40%)',
                'Advanced Analytics',
                'Priority Email Support'
            ],
            highlight: false
        },
        {
            id: 'pro',
            name: 'Pro Plan',
            basePrice: 99,
            features: [
                'Unlimited Products',
                'Highest Visibility (Top 5)',
                'City-wise Top Selling Insights',
                'Dedicated Account Manager',
                'Early Access to Features'
            ],
            highlight: true
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* 1. Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Subscription & Plans</h1>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Choose a plan that fits your shop’s growth</p>
                </div>
                <div className="inline-flex items-center px-4 py-1.5 bg-emerald-100/50 text-emerald-700 rounded-full text-[11px] font-black border border-emerald-200 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                    {plans.find(p => p.id === currentPlanId)?.name || 'Free Premium'} (Active)
                </div>
            </div>

            {/* 2. Current Plan Card */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Current Plan</span>
                        <h2 className="text-xl font-bold text-slate-800 mt-1">{plans.find(p => p.id === currentPlanId)?.name}</h2>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-2">
                                <FaBoxOpen className="text-slate-400" />
                                {subscription.currentProductCount} / {currentPlanId === 'growth' ? 300 : (subscription.productLimit === null ? '∞' : subscription.productLimit)} Products Used
                            </span>
                            <span className="flex items-center gap-2"><FaEye className="text-slate-400" /> Priority Level: {subscription.visibilityPriority}</span>
                            {subscription.endDate && (
                                <span className="flex items-center gap-2 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full font-bold border border-amber-100">
                                    <FaClock className="text-amber-500" />
                                    {Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))} Days Left
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <button disabled className="px-5 py-2 bg-slate-100 text-slate-400 font-bold text-sm rounded-xl cursor-not-allowed">
                            Current Plan
                        </button>
                    </div>
                </div>
            </div>

            {/* Billing Toggle for Plans */}
            <div className="flex justify-center mb-8">
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
                    {['monthly', '6months', '12months'].map((cycle) => (
                        <button
                            key={cycle}
                            onClick={() => setBillingCycle(cycle)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${billingCycle === cycle
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {cycle === 'monthly' && 'Monthly'}
                            {cycle === '6months' && '6 Months (-15%)'}
                            {cycle === '12months' && '12 Months (-30%)'}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Plan Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 items-stretch max-w-5xl mx-auto">
                {plans.map((plan) => {
                    const { text, disabled } = getPlanState(plan.id);
                    const isCurrent = plan.id === currentPlanId;
                    const finalPrice = getPrice(plan.basePrice || 0, billingCycle);
                    const originalTotal = (plan.basePrice || 0) * (billingCycle === 'monthly' ? 1 : billingCycle === '6months' ? 6 : 12);

                    return (
                        <div
                            key={plan.id}
                            className={`relative p-5 rounded-2xl transition-all duration-300 flex flex-col ${isCurrent
                                ? 'bg-white ring-2 ring-emerald-400 shadow-lg z-10'
                                : plan.highlight
                                    ? 'bg-slate-900 text-white shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/10 border-0 z-10'
                                    : 'bg-white text-slate-800 shadow-sm border border-slate-100 hover:shadow-md'
                                }`}
                        >
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow-lg whitespace-nowrap">
                                    Most Popular
                                </div>
                            )}

                            {isCurrent && (
                                <div className="absolute top-4 right-8 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                    Active
                                </div>
                            )}

                            <h3 className={`text-lg font-black mb-1.5 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>

                            {/* Usage Limit Badge */}
                            <div className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black mb-4 ${plan.highlight ? 'bg-indigo-500/20 text-indigo-200' : 'bg-slate-100 text-slate-500 uppercase tracking-widest'
                                }`}>
                                {plan.id === currentPlanId ? `Currently Locked: ${subscription.currentProductCount}/${subscription.productLimit === null || subscription.productLimit === Infinity ? '∞' : subscription.productLimit}` :
                                    plan.id === 'pro' ? 'Unlimited Products' :
                                        plan.id === 'growth' ? '300 Products' : '120 Products'}
                            </div>

                            <div className="mb-8 min-h-[6rem] flex flex-col justify-end">
                                {/* Price Animation Container */}
                                {plan.basePrice > 0 ? (
                                    <div className="flex flex-col items-start text-left">
                                        {billingCycle !== 'monthly' && (
                                            <span className={`text-sm font-bold line-through decoration-2 opacity-50 mb-1 ${plan.highlight ? 'text-indigo-300' : 'text-slate-400'}`}>
                                                ₹{originalTotal}
                                            </span>
                                        )}
                                        <div className="flex items-baseline gap-1">
                                            <span className={`text-3xl font-black tracking-tighter transition-all duration-500 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                                                ₹{finalPrice}
                                            </span>
                                            <span className={`text-xs font-bold capitalize ${plan.highlight ? 'text-indigo-200' : 'text-slate-400'}`}>
                                                /{billingCycle === 'monthly' ? 'mo' : billingCycle}
                                            </span>
                                        </div>
                                        {billingCycle !== 'monthly' && (
                                            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                                                Save {billingCycle === '6months' ? '15%' : '30%'}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-3xl font-black text-slate-900">Free</div>
                                )}
                            </div>

                            <ul className="space-y-3 mb-6 flex-1">
                                {plan.features && plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold opacity-90 text-left">
                                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.highlight ? 'bg-indigo-500/30 text-indigo-300' : 'bg-emerald-50 text-emerald-600'
                                            }`}>
                                            <FaCheck className="text-[8px]" />
                                        </div>
                                        {/* Handle both string and object feature formats if legacy data exists */}
                                        {typeof feature === 'string' ? feature : feature.text}
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={disabled || !!loadingPlanId}
                                onClick={() => !disabled && handleUpgrade(plan.id)}
                                className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg ${isCurrent
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : plan.highlight ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/30'
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                            >
                                {loadingPlanId === plan.id ? 'Loading...' : text}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Upgrade Confirmation Modal */}
            {
                showUpgradeModal && upgradeDetails && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-up overflow-hidden transition-all duration-300">

                            {/* STEP 1: SUMMARY */}
                            {paymentStep === 'summary' && (
                                <>
                                    <div className="bg-slate-50 p-6 border-b border-slate-100 text-center">
                                        <h2 className="text-xl font-black text-slate-900">Confirm Upgrade</h2>
                                        <p className="text-sm text-slate-500">You are upgrading to <span className="text-indigo-600 font-bold">{upgradeDetails.targetPlan.toUpperCase()} Plan</span></p>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Cycle</span>
                                            <span className="font-bold text-slate-900 capitalize">{upgradeDetails.duration === 'monthly' ? 'Monthly' : upgradeDetails.duration}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">Price</span>
                                            <span className="font-medium text-slate-900">₹{upgradeDetails.originalPrice}</span>
                                        </div>
                                        {upgradeDetails.discountPercentage > 0 && (
                                            <div className="flex justify-between items-center text-sm text-emerald-600">
                                                <span className="font-medium">Discount ({upgradeDetails.discountPercentage}%)</span>
                                                <span className="font-bold">- ₹{upgradeDetails.originalPrice - upgradeDetails.finalPrice}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500">GST (18%)</span>
                                            <span className="font-medium text-slate-900">₹{upgradeDetails.tax}</span>
                                        </div>
                                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-lg">
                                            <span className="font-bold text-slate-900">Total</span>
                                            <span className="font-black text-indigo-600">₹{upgradeDetails.total}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4">
                                            <input
                                                type="checkbox"
                                                id="termsCheck"
                                                checked={termsAccepted}
                                                onChange={(e) => setTermsAccepted(e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                            />
                                            <label htmlFor="termsCheck" className="text-xs text-slate-500">
                                                I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="underline text-indigo-600 font-bold hover:text-indigo-800">Subscription Terms & Conditions</button>
                                            </label>
                                        </div>

                                        <button
                                            onClick={initiatePayment}
                                            disabled={!termsAccepted || upgradeLoading}
                                            className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition-all mt-4 flex items-center justify-center gap-2 ${!termsAccepted || upgradeLoading
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'
                                                }`}
                                        >
                                            {upgradeLoading ? 'Creating Order...' : `Proceed to Pay ₹${upgradeDetails.total}`}
                                        </button>
                                        <button
                                            onClick={() => setShowUpgradeModal(false)}
                                            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 2: GATEWAY (UPI) */}
                            {paymentStep === 'gateway' && paymentData && (
                                <div className="text-center">
                                    <div className="bg-[#1A1C23] p-6 text-white pb-12 rounded-b-[2rem] relative">
                                        <p className="text-slate-400 font-bold uppercase text-xs mb-2 tracking-widest">Total Payable</p>
                                        <h2 className="text-4xl font-black text-white">₹{paymentData.amount}</h2>
                                    </div>

                                    <div className="-mt-8 px-6 pb-8">
                                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xl inline-block mb-6 relative">
                                            {/* Mock Mock QR */}
                                            <div className="w-48 h-48 bg-white flex items-center justify-center relative overflow-hidden group hover:cursor-none">
                                                {/* Simple CSS Pattern to look like QR */}
                                                <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png')] bg-cover bg-center grayscale opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="bg-white p-2 rounded-full shadow-md">
                                                        <span className="font-bold text-xs text-indigo-600">UPI</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium mb-6">Scan with any UPI App or click below</p>

                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleGatewayPayment('GPAY')}
                                                className="w-full py-3 border border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors font-bold text-slate-700"
                                            >
                                                <span className="text-blue-500">G</span> Google Pay
                                            </button>
                                            <button
                                                onClick={() => handleGatewayPayment('PHONEPE')}
                                                className="w-full py-3 border border-slate-200 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors font-bold text-slate-700"
                                            >
                                                <span className="text-[#5f259f]">Pe</span> PhonePe
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setShowUpgradeModal(false)}
                                            className="mt-6 text-xs font-bold text-slate-400 hover:text-slate-600"
                                        >
                                            Cancel Transaction
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: SUCCESS */}
                            {paymentStep === 'success' && (
                                <div className="p-8 text-center py-12">
                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 animate-bounce">
                                        <FaCheck className="text-4xl" />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Successful!</h2>
                                    <p className="text-slate-500 mb-8 max-w-[200px] mx-auto">
                                        Your <span className="font-bold text-indigo-600">{upgradeDetails.targetPlan.toUpperCase()}</span> is now active.
                                    </p>
                                    <button
                                        onClick={closeAndRefresh}
                                        className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform"
                                    >
                                        Continue to Dashboard
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                )
            }

            {/* 4. Visibility Boost Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 mb-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="md:w-1/2">
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm">
                                <FaRocket />
                            </div>
                            <h3 className="text-lg font-black text-slate-900">Visibility Boost</h3>
                        </div>
                        <p className="text-xs text-slate-600 font-medium ml-1">Temporary ranking improvement for your products.</p>

                        <div className="mt-4 flex flex-wrap gap-3">
                            <div
                                onClick={() => !subscription.boost?.active && (currentPlanId === 'free' || !currentPlanId) && setSelectedBoost('daily')}
                                className={`bg-white px-4 py-2 rounded-xl shadow-sm border transition-all ${subscription.boost?.active || (currentPlanId !== 'free' && currentPlanId) ? 'opacity-50 cursor-not-allowed' : (selectedBoost === 'daily' ? 'border-indigo-600 ring-2 ring-indigo-600/20 scale-105' : 'border-indigo-100 hover:border-indigo-300')}`}
                            >
                                <span className="block text-xl font-black text-indigo-600">₹15</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Per Day</span>
                            </div>
                            <div
                                onClick={() => !subscription.boost?.active && (currentPlanId === 'free' || !currentPlanId) && setSelectedBoost('weekly')}
                                className={`bg-white px-4 py-2 rounded-xl shadow-sm border transition-all ${subscription.boost?.active || (currentPlanId !== 'free' && currentPlanId) ? 'opacity-50 cursor-not-allowed' : (selectedBoost === 'weekly' ? 'border-indigo-600 ring-2 ring-indigo-600/20 scale-105' : 'border-indigo-100 hover:border-indigo-300')}`}
                            >
                                <span className="block text-xl font-black text-indigo-600">₹80</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Per Week</span>
                            </div>
                        </div>
                    </div>

                    <div className="md:w-1/2 md:text-right">
                        {subscription.boost?.active ? (
                            <div className="bg-emerald-100 p-4 rounded-xl inline-block text-left mb-4 border border-emerald-200">
                                <p className="text-emerald-800 font-bold mb-1 flex items-center gap-2">
                                    <FaBolt /> Boost Active
                                </p>
                                <p className="text-xs text-emerald-600 font-medium">
                                    Expires on {new Date(subscription.boost.endDate).toLocaleDateString()} at {new Date(subscription.boost.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ) : currentPlanId !== 'free' && currentPlanId ? (
                            <div className="bg-indigo-100/50 p-4 rounded-xl inline-block text-left mb-4 border border-indigo-200">
                                <p className="text-indigo-800 font-bold mb-1 flex items-center gap-2">
                                    <FaCrown /> High Visibility Included
                                </p>
                                <p className="text-xs text-indigo-600 font-medium">
                                    Your {currentPlanId.toUpperCase()} plan already provides priority visibility.
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 mb-4 bg-white/50 p-3 rounded-lg inline-block text-left">
                                <FaInfoCircle className="inline mr-2" />
                                Boost provides limited visibility priority for a fixed duration.
                            </p>
                        )}
                        <br />
                        <button
                            onClick={handleActivateBoost}
                            disabled={subscription.boost?.active || !selectedBoost || (currentPlanId !== 'free' && currentPlanId)}
                            className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all ${subscription.boost?.active || (currentPlanId !== 'free' && currentPlanId)
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                : (selectedBoost ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none')
                                }`}
                        >
                            {subscription.boost?.active ? 'Boost Active' : (currentPlanId !== 'free' && currentPlanId) ? 'Included in Plan' : (selectedBoost ? `Activate ${selectedBoost.charAt(0).toUpperCase() + selectedBoost.slice(1)} Boost` : 'Select Boost')}
                        </button>
                    </div>
                </div>
            </div>

            {/* 5. Feature Comparison Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                    <h3 className="text-md font-black text-slate-900 uppercase tracking-wider">Feature Comparison</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-bold">
                        <thead>
                            <tr className="bg-white border-b border-slate-100">
                                <th className="p-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Feature</th>
                                <th className="p-3 text-slate-900">Free</th>
                                <th className="p-3 text-slate-900">Growth</th>
                                <th className="p-3 text-indigo-600">Pro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="p-3 font-medium text-slate-500">Products Limit</td>
                                <td className="p-3 text-slate-900 font-black">120</td>
                                <td className="p-3 text-slate-900 font-black">300</td>
                                <td className="p-3 text-indigo-600 font-black">Unlimited</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-500">Visibility</td>
                                <td className="p-3 text-slate-400">Normal</td>
                                <td className="p-3 text-slate-900 font-black">+40%</td>
                                <td className="p-3 text-indigo-600 font-black">Highest</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-500">Sales Insight</td>
                                <td className="p-3 text-slate-300">❌</td>
                                <td className="p-3 text-slate-300">❌</td>
                                <td className="p-3 text-emerald-500">✅</td>
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-slate-500">Priority Ranking</td>
                                <td className="p-3 text-slate-300">❌</td>
                                <td className="p-3 text-slate-900 font-black">Top 10</td>
                                <td className="p-3 text-indigo-600 font-black">Top 5</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 6. Transparency Note & Terms */}
            <div className="text-center max-w-2xl mx-auto">
                <p className="text-xs text-slate-400 leading-relaxed">
                    Visibility and ranking depend on product relevance, distance, and availability.
                    <br />
                    Subscription improves priority but does not guarantee sales.
                </p>
                <button
                    onClick={() => setShowTermsModal(true)}
                    className="mt-4 text-xs font-bold text-slate-500 hover:text-indigo-600 underline transition-colors"
                >
                    Read Subscription Terms & Conditions
                </button>
            </div>

            {/* Terms Modal */}
            {
                showTermsModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-scale-up">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl font-black text-slate-900">Subscription Terms & Conditions</h2>
                                <button onClick={() => setShowTermsModal(false)} className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors">
                                    <span className="text-xl">×</span>
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600 leading-relaxed">
                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">1. General Understanding</h3>
                                    <p>ShopLens allows sellers to join and operate with a Free Premium plan by default. Subscriptions are optional upgrades meant to improve visibility, capacity, and insights. No seller is forced to buy a subscription to use ShopLens.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">2. Free Premium Plan (Default)</h3>
                                    <p>When a seller signs up on ShopLens, they receive Free Premium access, which includes:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Ability to add up to 100–120 products</li>
                                        <li>Basic order management</li>
                                        <li>Standard shop visibility</li>
                                        <li>Access to ShopLens Support (AI + system support)</li>
                                    </ul>
                                    <p className="mt-2 text-amber-600 text-xs font-bold">⚠️ Free Premium does not include city-wise top selling product insights or priority visibility.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">3. Growth Plan (Paid Subscription)</h3>
                                    <p>The Growth Plan is designed for sellers who want to grow faster. It includes:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Product limit increased up to 300 products</li>
                                        <li>Visibility priority increased by approximately 40%</li>
                                        <li>Opportunity to appear in Top 10 results when relevant to nearby customers</li>
                                    </ul>
                                    <p className="mt-2 text-xs italic">Note: Visibility improvement is algorithm-based, not guaranteed placement.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">4. Pro Plan (Paid Subscription)</h3>
                                    <p>The Pro Plan is designed for serious and high-activity sellers. It includes:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Unlimited product listing</li>
                                        <li>Highest visibility priority</li>
                                        <li>Opportunity to appear in Top 5 results when relevant</li>
                                        <li>Exclusive access to City-wise Top Selling Product Insights (Monthly)</li>
                                    </ul>
                                    <p className="mt-2 text-xs font-bold text-indigo-600">📌 Important: This insight feature is exclusive to Pro Plan only.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">5. Visibility Boost (Pay-Per-Use)</h3>
                                    <p>Visibility Boost is a temporary promotion option, not a subscription. It offers short-term visibility increase (generally within Top 12–15) available as daily or weekly boosts.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">6. Visibility & Ranking Logic</h3>
                                    <p>ShopLens uses an internal system to decide shop and product visibility based on:</p>
                                    <ul className="list-disc pl-5 mt-1 space-y-1">
                                        <li>Distance between customer and shop</li>
                                        <li>Product relevance</li>
                                        <li>Product availability (in stock)</li>
                                        <li>Subscription priority</li>
                                    </ul>
                                    <p className="mt-2 text-rose-500 font-bold text-xs">⚠️ Subscriptions improve priority but do NOT guarantee sales or orders.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">7. Support Policy</h3>
                                    <p>All sellers receive ShopLens Support (AI + system). Human support priority may be managed internally. ShopLens does not sell support as a paid service to ensure fairness.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">8. Payments & Refunds</h3>
                                    <p>Subscription fees are charged based on the selected plan. Subscriptions activate immediately. Fees are non-refundable once active. Sellers can upgrade at any time.</p>
                                </section>

                                <section>
                                    <h3 className="font-bold text-slate-900 mb-2">9. Changes & Fair Usage</h3>
                                    <p>ShopLens may update features or pricing with advance notice. We reserve the right to limit benefits if misuse or fraud is detected.</p>
                                </section>

                                <div className="pt-4 border-t border-slate-100">
                                    <p className="text-xs text-slate-400">By purchasing or using any subscription or boost, the Seller agrees to these Terms & Conditions.</p>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                                <button
                                    onClick={() => setShowTermsModal(false)}
                                    className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default SellerSubscription;
