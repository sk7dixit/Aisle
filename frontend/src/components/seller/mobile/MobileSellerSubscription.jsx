import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
    Crown, Check, ShieldCheck, Zap, RefreshCw, ArrowLeft, 
    Eye, Clock, Box, HelpCircle, ChevronDown, Lock, 
    TrendingUp, BarChart2, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';

const MobileSellerSubscription = () => {
    const { token, user, checkUserStatus } = useAuth();
    const navigate = useNavigate();
    const carouselRef = useRef(null);

    // Subscription status retrieval
    const subscription = user?.subscriptionStatus || { planId: 'free', currentProductCount: 0, productLimit: 120, visibilityPriority: 1 };
    const currentPlanId = (subscription.planId || 'free').toLowerCase();

    // UI States
    const [billingCycle, setBillingCycle] = useState('monthly'); // monthly, 6months, 12months
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [selectedBoost, setSelectedBoost] = useState(null); // 'daily', 'weekly'
    const [expandedAccordion, setExpandedAccordion] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState(null);

    // Payment/Upgrade modal States
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeDetails, setUpgradeDetails] = useState(null);
    const [loadingPlanId, setLoadingPlanId] = useState(null);
    const [upgradeLoading, setUpgradeLoading] = useState(false);
    const [paymentStep, setPaymentStep] = useState('summary'); // summary, gateway, success
    const [paymentData, setPaymentData] = useState(null);

    // Refresh plan state on load
    useEffect(() => {
        checkUserStatus();
    }, []);

    // Pricing calculator
    const getPrice = (basePrice, cycle) => {
        if (cycle === '6months') return Math.round(basePrice * 6 * 0.85); // 15% off
        if (cycle === '12months') return Math.round(basePrice * 12 * 0.70); // 30% off
        return basePrice;
    };

    // Upgrade Actions
    const handleUpgrade = async (planId) => {
        setLoadingPlanId(planId);
        try {
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
                setTermsAccepted(false);
            } else {
                throw new Error(data.message || "Failed to fetch plan upgrade preview");
            }
        } catch (error) {
            console.error("Upgrade error:", error);
            toast.error(error.message || "Unable to connect to checkout service.");
        } finally {
            setLoadingPlanId(null);
        }
    };

    const handleActivateBoost = () => {
        if (!selectedBoost) {
            toast.error("Please select a boost duration first.");
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
        setTermsAccepted(false);
    };

    const initiatePayment = async () => {
        if (!termsAccepted) {
            toast.error("Please accept the Terms & Conditions.");
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

            setPaymentData(orderData);
            setPaymentStep('gateway');
        } catch (error) {
            console.error("Order creation failed:", error);
            toast.error(`Order Failed: ${error.message}`);
        } finally {
            setUpgradeLoading(false);
        }
    };

    const handleGatewayPayment = async (method) => {
        setUpgradeLoading(true);
        try {
            // Simulate payment processing delay (3s)
            await new Promise(resolve => setTimeout(resolve, 3000));

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
                setPaymentStep('success');
                await checkUserStatus();
                toast.success("Upgrade processed successfully!");
            } else {
                toast.error("Payment Verification Failed. Please contact support.");
            }
        } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Verification error occurred.");
        } finally {
            setUpgradeLoading(false);
        }
    };

    const closeAndRefresh = () => {
        setShowUpgradeModal(false);
        window.location.reload();
    };

    const getPlanState = (planId) => {
        if (planId === currentPlanId) return { text: 'Current Plan', disabled: true };
        const planOrder = ['free', 'growth', 'pro'];
        const currentIndex = planOrder.indexOf(currentPlanId);
        const targetIndex = planOrder.indexOf(planId);

        if (targetIndex < currentIndex) {
            return { text: 'Current Plan Higher', disabled: true };
        }
        return { text: `Upgrade`, disabled: false };
    };

    // Circular Progress Ring Math
    const radius = 28;
    const stroke = 5;
    const circumference = 2 * Math.PI * radius;
    const productLimit = subscription.productLimit === null || subscription.productLimit === Infinity ? null : (subscription.productLimit || 120);
    const currentCount = subscription.currentProductCount || 0;
    const isPro = currentPlanId === 'pro' || productLimit === null;
    const percentage = isPro ? 100 : Math.min(100, Math.round((currentCount / productLimit) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const plans = [
        {
            id: 'free',
            name: 'Free Premium',
            basePrice: 0,
            limitText: '120 Products limit',
            features: ['Up to 120 Products', 'Basic Community Access', 'Standard Support']
        },
        {
            id: 'growth',
            name: 'Growth Plan',
            basePrice: 50,
            limitText: '300 Products limit',
            features: [
                'Up to 300 Products',
                'Priority Visibility (+40%)',
                'Advanced Analytics Hub',
                'Priority Email Support'
            ]
        },
        {
            id: 'pro',
            name: 'Pro Plan',
            basePrice: 99,
            limitText: 'Unlimited Products',
            features: [
                'Unlimited product listings',
                'Highest search priority (Top 5)',
                'City-wise Hot Demand insights',
                'Dedicated Account Manager',
                'Early access to AI upgrades'
            ]
        }
    ];

    const recommendedPlanId = currentPlanId === 'free' ? 'growth' : currentPlanId === 'growth' ? 'pro' : null;

    return (
        <div className="p-4 space-y-6 pb-40 font-sans text-left bg-slate-50 min-h-screen relative select-none">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.25s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-scale-up {
                    animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {/* Header back navigation */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/seller/home')}
                    className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-90 cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Premium Plans
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Grow your shop faster
                    </p>
                </div>
            </div>

            {/* Current Plan Hero Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest block">Current Plan</span>
                        <h2 className="text-2xl font-black tracking-tight leading-none">
                            {plans.find(p => p.id === currentPlanId)?.name || 'Free Premium'}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                🟢 ACTIVE
                            </span>
                            <span className="text-[10px] text-slate-350 font-bold">
                                Priority Level {subscription.visibilityPriority || 1}
                            </span>
                        </div>
                    </div>

                    {/* Progress Circle Container */}
                    <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-slate-900/40 rounded-full border border-slate-800">
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                                className="text-slate-850"
                                strokeWidth={stroke}
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="32"
                                cy="32"
                            />
                            <circle
                                className={isPro ? "text-indigo-400" : (percentage >= 100 ? "text-rose-400 animate-pulse" : "text-emerald-400")}
                                strokeWidth={stroke}
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="32"
                                cy="32"
                                style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {isPro ? (
                                <span className="text-lg font-black text-white">∞</span>
                            ) : (
                                <>
                                    <span className="text-[10px] font-black text-white">{percentage}%</span>
                                    <span className="text-[6px] text-slate-400 font-bold uppercase tracking-wider">Used</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-850/80 flex items-center justify-between text-xs">
                    <span className="text-slate-350 font-medium flex items-center gap-1.5">
                        <Box size={14} className="text-slate-400" />
                        {currentCount} / {isPro ? '∞' : productLimit} products used
                    </span>
                    <button 
                        onClick={() => carouselRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        className="bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl py-1.5 px-3.5 text-[10px] font-extrabold uppercase tracking-wider transition-all"
                    >
                        Manage
                    </button>
                </div>
            </div>

            {/* Segmented Billing Control */}
            <div className="sticky top-[60px] z-20 bg-slate-50/90 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200/50">
                <div className="bg-slate-200/60 p-1 rounded-2xl flex gap-1 shadow-inner">
                    {[
                        { id: 'monthly', label: 'Monthly' },
                        { id: '6months', label: '6 Months', discount: '-15%' },
                        { id: '12months', label: '12 Months', discount: '-30%' }
                    ].map((cycle) => (
                        <button
                            key={cycle.id}
                            onClick={() => setBillingCycle(cycle.id)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 relative flex items-center justify-center gap-1 cursor-pointer ${
                                billingCycle === cycle.id
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/30'
                                    : 'text-slate-500 hover:text-slate-700 bg-transparent'
                            }`}
                        >
                            <span>{cycle.label}</span>
                            {cycle.discount && (
                                <span className={`text-[8px] font-bold px-1 rounded ${
                                    billingCycle === cycle.id 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-slate-200 text-slate-600'
                                }`}>
                                    {cycle.discount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pricing Cards Carousel */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Select Upgrade Tier
                </h3>
                <div 
                    ref={carouselRef}
                    className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-1 scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {plans.map((plan) => {
                        const { text, disabled } = getPlanState(plan.id);
                        const isCurrent = plan.id === currentPlanId;
                        const finalPrice = getPrice(plan.basePrice, billingCycle);
                        const originalTotal = plan.basePrice * (billingCycle === 'monthly' ? 1 : billingCycle === '6months' ? 6 : 12);
                        
                        return (
                            <div 
                                key={plan.id}
                                className={`w-[85%] shrink-0 snap-center rounded-3xl p-5 border shadow-sm relative flex flex-col justify-between min-h-[320px] ${
                                    isCurrent 
                                        ? 'ring-2 ring-emerald-500 bg-white border-transparent' 
                                        : plan.id === 'pro' 
                                            ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white border-slate-800'
                                            : 'bg-white text-slate-800 border-slate-100'
                                }`}
                            >
                                {plan.id === 'growth' && (
                                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                                        Most Popular
                                    </div>
                                )}
                                {isCurrent && (
                                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-250">
                                        Active
                                    </div>
                                )}
                                
                                <div>
                                    <h3 className={`text-base font-black tracking-tight ${plan.id === 'pro' ? 'text-white' : 'text-slate-900'}`}>
                                        {plan.name}
                                    </h3>
                                    <span className={`inline-block mt-1.5 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${
                                        plan.id === 'pro' ? 'bg-indigo-500/20 text-indigo-200' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {plan.limitText}
                                    </span>
                                    
                                    {/* Price section */}
                                    <div className="mt-4 mb-5">
                                        {plan.basePrice > 0 ? (
                                            <div>
                                                {billingCycle !== 'monthly' && (
                                                    <span className={`text-[10px] font-bold line-through opacity-50 block ${
                                                        plan.id === 'pro' ? 'text-indigo-300' : 'text-slate-400'
                                                    }`}>
                                                        ₹{originalTotal}
                                                    </span>
                                                )}
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-2xl font-black ${plan.id === 'pro' ? 'text-white' : 'text-slate-900'}`}>
                                                        ₹{finalPrice}
                                                    </span>
                                                    <span className={`text-[10px] font-bold ${plan.id === 'pro' ? 'text-slate-400' : 'text-slate-550'}`}>
                                                        /{billingCycle === 'monthly' ? 'mo' : billingCycle === '6months' ? '6 mo' : '12 mo'}
                                                    </span>
                                                </div>
                                                {billingCycle !== 'monthly' && (
                                                    <span className="inline-block text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full mt-1.5 animate-pulse uppercase tracking-wider">
                                                        Save {billingCycle === '6months' ? '15%' : '30%'}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={`text-2xl font-black ${plan.id === 'pro' ? 'text-white' : 'text-slate-900'}`}>
                                                Free
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Features list */}
                                    <ul className="space-y-2.5 mb-6">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-[11px] font-semibold text-left">
                                                <Check size={12} className={`shrink-0 mt-0.5 ${
                                                    plan.id === 'pro' ? 'text-indigo-400' : 'text-emerald-500'
                                                }`} />
                                                <span className={plan.id === 'pro' ? 'text-slate-300' : 'text-slate-600'}>
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {/* Upgrade Button */}
                                <button
                                    disabled={disabled || !!loadingPlanId}
                                    onClick={() => !disabled && handleUpgrade(plan.id)}
                                    className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                                        isCurrent 
                                            ? 'bg-slate-100 text-slate-450 cursor-not-allowed shadow-none border border-slate-200/60'
                                            : plan.id === 'pro'
                                                ? 'bg-indigo-650 text-white hover:bg-indigo-700 active:scale-95'
                                                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                                    }`}
                                >
                                    {loadingPlanId === plan.id ? (
                                        <RefreshCw className="animate-spin" size={12} />
                                    ) : (
                                        <>
                                            {plan.id !== 'free' && <Zap size={10} className="fill-current" />}
                                            {text}
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Visibility Boost Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-5 border border-indigo-150 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                        <Zap size={16} className="fill-current" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900">Visibility Boost</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Short-term Rank Accelerator</p>
                    </div>
                </div>
                
                <p className="text-xs text-slate-650 font-semibold leading-relaxed mb-4 pl-1">
                    Instantly push your products to priority positions in nearby search queries. Perfect for weekend sales!
                </p>

                {subscription.boost?.active ? (
                    <div className="bg-emerald-100/60 p-4 rounded-2xl border border-emerald-250 text-left mb-4">
                        <p className="text-emerald-800 font-black text-xs mb-1 flex items-center gap-1.5">
                            <Zap size={12} className="fill-current animate-pulse" /> Boost is Active
                        </p>
                        <p className="text-[10px] text-emerald-600 font-extrabold">
                            Expires on {new Date(subscription.boost.endDate).toLocaleDateString()} at {new Date(subscription.boost.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                ) : currentPlanId !== 'free' && currentPlanId ? (
                    <div className="bg-indigo-150/40 p-4 rounded-2xl border border-indigo-200 text-left mb-4">
                        <p className="text-indigo-800 font-black text-xs mb-1 flex items-center gap-1.5">
                            <Crown size={12} className="fill-current" /> Premium Rank Included
                        </p>
                        <p className="text-[10px] text-indigo-600 font-extrabold leading-normal">
                            Your current {currentPlanId.toUpperCase()} subscription already includes continuous priority ranking.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[
                                { id: 'daily', price: 15, label: 'Per Day' },
                                { id: 'weekly', price: 80, label: 'Per Week' }
                            ].map((boostOpt) => (
                                <button
                                    key={boostOpt.id}
                                    onClick={() => setSelectedBoost(boostOpt.id)}
                                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                        selectedBoost === boostOpt.id
                                            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/10 scale-[1.02] shadow-sm'
                                            : 'bg-white border-slate-205 hover:border-slate-300'
                                    }`}
                                >
                                    <span className="block text-xl font-black text-indigo-650">₹{boostOpt.price}</span>
                                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest block mt-0.5">
                                        {boostOpt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                        
                        <button
                            onClick={handleActivateBoost}
                            disabled={!selectedBoost}
                            className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer ${
                                selectedBoost
                                    ? 'bg-indigo-605 bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/10 active:scale-95'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                            }`}
                        >
                            {selectedBoost ? `Activate ${selectedBoost} Boost` : 'Select Boost Period'}
                        </button>
                    </>
                )}
            </div>

            {/* Why Upgrade? (Benefits Section) */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Why Upgrade to Premium?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: <TrendingUp className="text-indigo-600" size={16} />, title: "More Visibility", desc: "Up to 3x increase in neighborhood search visibility" },
                        { icon: <BarChart2 className="text-indigo-600" size={16} />, title: "Advanced Analytics", desc: "Trace nearby search queries and conversion indices" },
                        { icon: <Star className="text-indigo-600" size={16} />, title: "Better Ranking", desc: "Priority indexing placements in local category lists" },
                        { icon: <Zap className="text-indigo-600" size={16} />, title: "Priority Support", desc: "Direct helpdesk support with rapid response SLAs" }
                    ].map((benefit, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 flex flex-col items-start gap-2 shadow-xs">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                                {benefit.icon}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{benefit.title}</h4>
                                <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-relaxed">{benefit.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Aisle AI Revenue Projection Card */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center gap-2">
                    <Star size={14} className="text-indigo-400 animate-pulse fill-current" />
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">Aisle AI Analytics</span>
                </div>
                
                <div className="space-y-1">
                    <p className="text-xs text-slate-300 font-bold italic leading-relaxed">
                        "Sellers in your neighborhood saw an average of <span className="text-indigo-300 font-extrabold">+40% more visibility</span> after upgrading to Growth Plan."
                    </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-850">
                    <div>
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Potential Reach</span>
                        <span className="text-xs font-extrabold text-emerald-400">+1,200 visits/mo</span>
                    </div>
                    <div>
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider block">Est. Revenue Lift</span>
                        <span className="text-xs font-extrabold text-emerald-400">₹2,500 - ₹6,000</span>
                    </div>
                </div>
                
                <button
                    onClick={() => {
                        setBillingCycle('monthly');
                        carouselRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        setTimeout(() => {
                            handleUpgrade('growth');
                        }, 500);
                    }}
                    className="w-full bg-white hover:bg-slate-50 text-slate-900 rounded-xl py-3 text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                    Upgrade Store Now
                </button>
            </div>

            {/* Feature Comparison Accordion */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Detailed Feature Matrix
                </h3>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-100 shadow-xs">
                    {[
                        { 
                            id: 'products',
                            title: 'Products Limit', 
                            free: '120 Products', 
                            growth: '300 Products', 
                            pro: 'Unlimited Products',
                            desc: 'The total number of products you can have listed on Aisle concurrently.'
                        },
                        { 
                            id: 'visibility',
                            title: 'Search Placement', 
                            free: 'Standard', 
                            growth: 'Priority (+40%)', 
                            pro: 'Top Priority (Highest)',
                            desc: 'How prominently your shop and products are indexed in nearby client queries.'
                        },
                        { 
                            id: 'ranking',
                            title: 'Priority Ranking', 
                            free: 'No Priority', 
                            growth: 'Top 10 listings', 
                            pro: 'Top 5 listings',
                            desc: 'Guaranteed slot bracket ranges when customers look for matching keywords.'
                        },
                        { 
                            id: 'insights',
                            title: 'Sales & Trends Insights', 
                            free: '❌ Basic stats only', 
                            growth: '❌ Basic stats only', 
                            pro: '✅ Hot-demand insights',
                            desc: 'Access highly specific insights about top-selling products inside Indore/Vadodara.'
                        }
                    ].map((row) => {
                        const isExpanded = expandedAccordion === row.id;
                        return (
                            <div key={row.id} className="transition-all">
                                <button
                                    onClick={() => setExpandedAccordion(isExpanded ? null : row.id)}
                                    className="w-full py-4 px-4 flex items-center justify-between text-left font-bold text-xs text-slate-800 cursor-pointer"
                                >
                                    <span>{row.title}</span>
                                    <ChevronDown 
                                        size={16} 
                                        className={`text-slate-450 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-650' : ''}`}
                                    />
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-4 space-y-3 text-[11px] leading-relaxed animate-fade-in text-left">
                                        <p className="text-slate-400 font-semibold italic">{row.desc}</p>
                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 font-extrabold text-center">
                                            <div className="p-2 bg-slate-50 rounded-xl">
                                                <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-black">Free</span>
                                                <span className="text-slate-700 mt-0.5 block">{row.free}</span>
                                            </div>
                                            <div className="p-2 bg-indigo-50/50 rounded-xl">
                                                <span className="block text-[8px] text-indigo-500 uppercase tracking-widest font-black">Growth</span>
                                                <span className="text-slate-700 mt-0.5 block">{row.growth}</span>
                                            </div>
                                            <div className="p-2 bg-indigo-950 text-white rounded-xl">
                                                <span className="block text-[8px] text-indigo-300 uppercase tracking-widest font-black">Pro</span>
                                                <span className="text-white mt-0.5 block">{row.pro}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Collapsible FAQs Section */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                    Frequently Asked Questions
                </h3>
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-100 shadow-xs">
                    {[
                        {
                            q: "Can I cancel my subscription anytime?",
                            a: "Yes! There are no lock-in periods. You can cancel your subscription at any time. Your premium benefits will continue to be active until the end of your current billing cycle."
                        },
                        {
                            q: "What is the visibility boost and how does it work?",
                            a: "Visibility Boost is a temporary promotional rank accelerator that boosts search indexing rankings for Indore/Vadodara. It does not replace a permanent subscription."
                        },
                        {
                            q: "Is GST invoice available?",
                            a: "Yes, once payment is successful, GST invoice credentials will be auto-generated. You can download invoices from the Profile and Transaction history page on the desktop."
                        }
                    ].map((faq, i) => {
                        const isExpanded = expandedFaq === i;
                        return (
                            <div key={i} className="transition-all">
                                <button
                                    onClick={() => setExpandedFaq(isExpanded ? null : i)}
                                    className="w-full py-4 px-4 flex items-center justify-between text-left font-bold text-xs text-slate-800 cursor-pointer"
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown 
                                        size={16} 
                                        className={`text-slate-450 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-650' : ''}`}
                                    />
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-4 text-[11px] text-slate-500 font-semibold leading-relaxed animate-fade-in text-left">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <Lock className="text-emerald-500 shrink-0" size={14} />
                    <span className="text-[9px] font-bold text-slate-650">Secure 256-bit Billing</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <Check className="text-emerald-500 shrink-0 animate-pulse" size={14} />
                    <span className="text-[9px] font-bold text-slate-655">Cancel or Pause Anytime</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={14} />
                    <span className="text-[9px] font-bold text-slate-650">No Hidden Charges</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-100 shadow-xs">
                    <Check className="text-emerald-500 shrink-0" size={14} />
                    <span className="text-[9px] font-bold text-slate-650">GST Invoice Available</span>
                </div>
            </div>

            {/* Terms Button */}
            <div className="text-center pt-2">
                <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-xs font-bold text-slate-500 hover:text-indigo-600 underline transition-colors cursor-pointer"
                >
                    Read Subscription Terms & Conditions
                </button>
            </div>

            {/* Sticky Bottom CTA Bar */}
            {recommendedPlanId && (
                <div className="fixed bottom-[64px] left-0 right-0 p-3 bg-white border-t border-slate-150/60 flex items-center justify-between z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] px-4">
                    <div className="text-left">
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block">Recommended Upgrade</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-xs font-black text-slate-900">
                                {recommendedPlanId === 'growth' ? 'Growth' : 'Pro'} Plan
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">
                                • ₹{recommendedPlanId === 'growth' ? getPrice(50, billingCycle) : getPrice(99, billingCycle)}
                            </span>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => handleUpgrade(recommendedPlanId)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 px-5 text-xs font-black uppercase tracking-wider shadow-md shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Zap size={11} className="fill-current" /> Upgrade Now
                    </button>
                </div>
            )}

            {/* Payment Upgrade Bottom Sheet */}
            {showUpgradeModal && upgradeDetails && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center transition-opacity duration-300 animate-fade-in" onClick={() => setShowUpgradeModal(false)}>
                    <div 
                        className="w-full bg-white rounded-t-[2rem] max-h-[90vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden pb-6"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Handle Bar */}
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0"></div>
                        
                        {/* STEP 1: SUMMARY */}
                        {paymentStep === 'summary' && (
                            <div className="flex-1 overflow-y-auto px-6 text-left">
                                <div className="text-center pb-4 border-b border-slate-100">
                                    <h2 className="text-lg font-black text-slate-900">Confirm Order</h2>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Upgrading to <span className="text-indigo-600 font-extrabold">{upgradeDetails.targetPlan.toUpperCase()}</span>
                                    </p>
                                </div>
                                
                                <div className="mt-5 space-y-3.5">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-450 font-bold uppercase tracking-wider">Plan / Item</span>
                                        <span className="font-extrabold text-slate-800">{upgradeDetails.targetPlan.toUpperCase()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-450 font-bold uppercase tracking-wider">Duration</span>
                                        <span className="font-extrabold text-slate-800 capitalize">{upgradeDetails.duration === 'monthly' ? 'Monthly' : upgradeDetails.duration}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-450 font-bold uppercase tracking-wider">Subtotal</span>
                                        <span className="font-bold text-slate-800">₹{upgradeDetails.originalPrice}</span>
                                    </div>
                                    {upgradeDetails.discountPercentage > 0 && (
                                        <div className="flex justify-between items-center text-xs text-emerald-600 font-bold">
                                            <span>Discount ({upgradeDetails.discountPercentage}%)</span>
                                            <span>- ₹{upgradeDetails.originalPrice - upgradeDetails.finalPrice}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-450 font-bold uppercase tracking-wider">GST (18%)</span>
                                        <span className="font-bold text-slate-800">₹{upgradeDetails.tax}</span>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Payable</span>
                                        <span className="text-xl font-black text-indigo-650">₹{upgradeDetails.total}</span>
                                    </div>
                                </div>
                                
                                {/* Terms checkbox */}
                                <div className="flex items-start gap-2.5 mt-6 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                    <input
                                        type="checkbox"
                                        id="termsCheck"
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                        className="w-4.5 h-4.5 text-indigo-600 rounded border-slate-350 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                                    />
                                    <label htmlFor="termsCheck" className="text-[11px] text-slate-500 font-semibold leading-normal">
                                        I agree to the <button type="button" onClick={() => { setShowTermsModal(true); }} className="underline text-indigo-600 font-extrabold hover:text-indigo-800">Subscription Terms & Conditions</button>.
                                    </label>
                                </div>
                                
                                {/* Actions */}
                                <div className="mt-6 space-y-2">
                                    <button
                                        onClick={initiatePayment}
                                        disabled={!termsAccepted || upgradeLoading}
                                        className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                            !termsAccepted || upgradeLoading
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 active:scale-95'
                                        }`}
                                    >
                                        {upgradeLoading ? (
                                            <RefreshCw className="animate-spin" size={14} />
                                        ) : (
                                            `Proceed to Pay • ₹${upgradeDetails.total}`
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setShowUpgradeModal(false)}
                                        className="w-full py-3.5 rounded-xl text-xs font-extrabold text-slate-400 hover:text-slate-650 uppercase tracking-wider transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* STEP 2: GATEWAY (UPI) */}
                        {paymentStep === 'gateway' && paymentData && (
                            <div className="flex-1 overflow-y-auto px-6 text-center space-y-6">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-widest block">Scan to Pay</span>
                                    <h2 className="text-3xl font-black text-slate-900">₹{paymentData.amount}</h2>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                                        TXN: {paymentData.transactionId}
                                    </span>
                                </div>
                                
                                {/* QR Code Container */}
                                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner inline-block relative">
                                    <div className="w-40 h-40 bg-white flex items-center justify-center relative overflow-hidden rounded-2xl p-2 shadow-sm">
                                        <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png')] bg-cover bg-center grayscale opacity-85"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="bg-white p-2 rounded-xl shadow-md border border-slate-100">
                                                <span className="font-black text-[10px] text-indigo-600">UPI PAY</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-[11px] text-slate-500 font-semibold max-w-[240px] mx-auto leading-normal">
                                    Scan the QR code with any UPI app (GPay, PhonePe, Paytm) or select a redirection option below:
                                </p>
                                
                                <div className="space-y-2.5">
                                    <button
                                        onClick={() => handleGatewayPayment('GPAY')}
                                        disabled={upgradeLoading}
                                        className="w-full py-3.5 border border-slate-205 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-55 font-black text-xs text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {upgradeLoading ? (
                                            <RefreshCw className="animate-spin" size={14} />
                                        ) : (
                                            <>
                                                <span className="text-blue-505 text-blue-600 text-sm font-black">G</span> Google Pay
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleGatewayPayment('PHONEPE')}
                                        disabled={upgradeLoading}
                                        className="w-full py-3.5 border border-slate-205 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-55 font-black text-xs text-slate-700 transition-all cursor-pointer disabled:opacity-50"
                                    >
                                        {upgradeLoading ? (
                                            <RefreshCw className="animate-spin" size={14} />
                                        ) : (
                                            <>
                                                <span className="text-[#5f259f] text-sm font-black">Pe</span> PhonePe
                                            </>
                                        )}
                                    </button>
                                </div>
                                
                                <button
                                    onClick={() => setShowUpgradeModal(false)}
                                    className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase tracking-wider block mx-auto pt-2 cursor-pointer"
                                >
                                    Cancel Transaction
                                </button>
                            </div>
                        )}
                        
                        {/* STEP 3: SUCCESS */}
                        {paymentStep === 'success' && (
                            <div className="flex-1 overflow-y-auto px-6 text-center py-6 space-y-6">
                                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100 shadow-sm animate-bounce">
                                    <Check className="stroke-[3.5]" size={32} />
                                </div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-lg font-black text-slate-905">Payment Successful!</h2>
                                    <p className="text-xs text-slate-500 font-semibold max-w-[220px] mx-auto leading-relaxed">
                                        Your upgraded plan status is now active. Limits and features have been applied to your shop dashboard.
                                    </p>
                                </div>
                                
                                <button
                                    onClick={closeAndRefresh}
                                    className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg hover:bg-slate-800 transition-all cursor-pointer"
                                >
                                    Continue to Store
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Terms and Conditions Modal */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in" onClick={() => setShowTermsModal(false)}>
                    <div 
                        className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl animate-scale-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-base font-black text-slate-900">Subscription Terms</h2>
                            <button 
                                onClick={() => setShowTermsModal(false)} 
                                className="p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-all cursor-pointer"
                            >
                                <span className="text-xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-5 overflow-y-auto space-y-5 text-left text-xs text-slate-600 leading-relaxed">
                            <section>
                                <h3 className="font-bold text-slate-900 mb-1">1. General Policy</h3>
                                <p>Subscriptions on Aisle are completely optional upgrades designed to increase listing capacities and local visibility scores. Standard seller accounts remain Free Premium forever.</p>
                            </section>
                            <section>
                                <h3 className="font-bold text-slate-900 mb-1">2. Billing Cycle and Renewal</h3>
                                <p>Billing is determined by the active cycle selected during checkout (1, 6, or 12 months). Unless explicitly cancelled before the next billing period, subscriptions do not support automated fallback credits.</p>
                            </section>
                            <section>
                                <h3 className="font-bold text-slate-900 mb-1">3. Visibility Improvements</h3>
                                <p>Visibility priorities (Growth: +40% / Pro: Highest) are calculated algorithmically based on customer relevance and physical distance metrics. Exact rank slots are not hard-locked guarantees.</p>
                            </section>
                            <section>
                                <h3 className="font-bold text-slate-900 mb-1">4. Refund Policy</h3>
                                <p>Subscriptions can be cancelled at any time but fees are non-refundable. Premium benefits remain active until the end of the current pre-paid cycle.</p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileSellerSubscription;
