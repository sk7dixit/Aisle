import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; // Ensure this package is installed or use placeholder
import {
    ShoppingBag, Store, ArrowRight, Mail, Lock,
    Smartphone, ScanFace, CheckCircle2, User, ChevronLeft, Eye, EyeOff
} from 'lucide-react';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    // 1. STATE MANAGEMENT
    const [userType, setUserType] = useState('customer'); // 'customer' or 'seller'
    const [isLogin, setIsLogin] = useState(location.pathname !== '/register'); // Toggle between Login and Signup

    // Sync state with URL if user navigates history or clicks links while mounted
    useEffect(() => {
        setIsLogin(location.pathname !== '/register');
    }, [location.pathname]);

    // Seller Login Method
    const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'face'
    const webcamRef = useRef(null);

    // Auth Form State
    const [authForm, setAuthForm] = useState({
        identifier: '', // Email or Mobile for Login
        password: '',
        fullName: '',
        mobile: '', // Signup Specific
        confirmPassword: '', // Signup Specific
        otp: '' // Signup Email Verification
    });

    // Verification State (Signup)
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);

    const [authError, setAuthError] = useState('');

    const [otpLoading, setOtpLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOtp = async () => {
        if (!authForm.identifier || !authForm.identifier.includes('@')) {
            setAuthError("Please enter a valid email to verify.");
            return;
        }
        setAuthError('');
        setOtpLoading(true);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: authForm.identifier })
            });
            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                throw new Error("Failed to send OTP. Server error.");
            }

            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

            setOtpSent(true);
            // Alert removed as requested - background action is enough since OTP box appears
        } catch (error) {
            setAuthError(error.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!authForm.otp) {
            return setAuthError("Please enter OTP");
        }

        try {
            const res = await fetch('/api/auth/verify-otp-only', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: authForm.identifier, otp: authForm.otp })
            });

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                throw new Error("Failed to verify OTP.");
            }

            if (!res.ok) throw new Error(data.message || 'Invalid OTP');

            setOtpVerified(true);
            setOtpSent(false); // Hide OTP box
        } catch (error) {
            setAuthError(error.message);
        }
    };

    const handleAuth = async () => {
        setAuthError('');

        // 1. Seller Signup Redirect (No validation needed here)
        if (userType === 'seller' && !isLogin) {
            navigate('/seller/register');
            return;
        }

        try {
            // 2. Customer Signup Logic
            if (userType === 'customer' && !isLogin) {
                if (!authForm.fullName.trim()) return setAuthError("Name is required");
                if (!authForm.identifier.trim()) return setAuthError("Email Address is required");
                if (!otpVerified) return setAuthError("Email verification is required");
                if (!authForm.mobile || authForm.mobile.length < 10) return setAuthError("Valid Mobile Number is required");
                if (!authForm.password) return setAuthError("Password is required");
                if (authForm.password !== authForm.confirmPassword) return setAuthError("Passwords do not match");

                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: authForm.fullName,
                        email: authForm.identifier,
                        mobile: authForm.mobile,
                        phone: authForm.mobile,
                        password: authForm.password,
                        role: 'customer',
                        otp: authForm.otp
                    })
                });
                let data;
                try {
                    data = await res.json();
                } catch (jsonError) {
                    console.error("JSON Parse Error:", jsonError);
                    throw new Error("Registration failed (Server Error).");
                }
                if (!res.ok) throw new Error(data.message || "Signup failed");

                login(data);
                navigate('/market');
                return;
            }

            // 3. Customer Login Logic (Email OR Mobile)
            if (userType === 'customer' && isLogin) {
                if (!authForm.identifier.trim()) return setAuthError("Email or Mobile is required");
                if (!authForm.password) return setAuthError("Password is required");

                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        identifier: authForm.identifier,
                        password: authForm.password
                    })
                });

                let data;
                try {
                    data = await res.json();
                } catch (jsonError) {
                    console.error("JSON Parse Error:", jsonError);
                    if (res.status === 404) throw new Error("Account not exist, create a new one.");
                    if (res.status === 401) throw new Error("Invalid email or password.");
                    throw new Error("Server error. Please try again later.");
                }

                if (!res.ok) throw new Error(data.message || "Login failed");

                login(data);
                navigate('/market');
                return;
            }

            // 4. Logic for Seller Login
            if (userType === 'seller') {
                if (loginMethod === 'face') {
                    const imageSrc = webcamRef.current?.getScreenshot();
                    if (!imageSrc) return setAuthError("Camera not ready or permission denied");
                    console.log("Face ID Login");

                    const res = await fetch('/api/auth/login-face', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            identifier: authForm.identifier, // Can be email/phone
                            faceData: imageSrc
                        })
                    });
                    let data;
                    try {
                        data = await res.json();
                    } catch (jsonError) {
                        if (res.status === 404) throw new Error("Account not exist, create a new one.");
                        throw new Error("Face Login failed (Server Error).");
                    }
                    if (!res.ok) {
                        if (data.error === 'VERIFICATION_IN_PROGRESS') {
                            throw new Error("Your verification is under review. This usually takes a short time. Please try again later.");
                        }
                        if (data.error === 'VERIFICATION_PENDING_MANUAL_REVIEW') {
                            throw new Error("Your verification needs manual review. Our team is checking your details.");
                        }
                        throw new Error(data.message || "Face Login failed");
                    }

                    login(data);
                    navigate('/seller/home');
                } else {
                    if (!authForm.password) return setAuthError("Password is required");

                    const res = await fetch('/api/auth/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            identifier: authForm.identifier,
                            password: authForm.password
                        })
                    });

                    let data;
                    try {
                        data = await res.json();
                    } catch (jsonError) {
                        if (res.status === 404) throw new Error("Account not exist, create a new one.");
                        if (res.status === 401) throw new Error("Invalid email or password.");
                        throw new Error("Server error.");
                    }

                    if (!res.ok) {
                        if (data.error === 'VERIFICATION_IN_PROGRESS') {
                            throw new Error("Your verification is under review. This usually takes a short time. Please try again later.");
                        }
                        if (data.error === 'VERIFICATION_PENDING_MANUAL_REVIEW') {
                            throw new Error("Your verification needs manual review. Our team is checking your details.");
                        }
                        throw new Error(data.message || "Login failed");
                    }

                    login(data);
                    navigate('/seller/home');
                }
                return;
            }

        } catch (error) {
            console.error("Auth Error", error);
            setAuthError(error.message || "Authentication failed");
        }
    };

    // 2. THEME CONFIGURATION ( The "Aurora" Logic )
    const theme = {
        customer: {
            gradient: "from-orange-100 via-pink-100 to-violet-100",
            accent: "bg-orange-500 hover:bg-orange-600",
            text_accent: "text-orange-600",
            ring: "focus:ring-orange-500",
            glow: "shadow-orange-500/20",
            icon: ShoppingBag,
            tagline: "Discover hidden gems in your neighborhood.",
            image_abstract: "bg-gradient-to-tr from-orange-400 to-pink-500"
        },
        seller: {
            gradient: "from-emerald-50 via-teal-100 to-cyan-100",
            accent: "bg-emerald-600 hover:bg-emerald-700",
            text_accent: "text-emerald-700",
            ring: "focus:ring-emerald-500",
            glow: "shadow-emerald-500/20",
            icon: Store,
            tagline: "Turn your local inventory into instant sales.",
            image_abstract: "bg-gradient-to-br from-emerald-500 to-cyan-600"
        }
    };

    const currentTheme = theme[userType];

    return (
        <div className={`min-h-screen w-full flex transition-colors duration-700 ease-in-out bg-gradient-to-br ${currentTheme.gradient}`}>

            {/* --- STEP 3: LEFT SIDE (VISUALS) --- */}
            <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
                {/* Abstract Blobs for depth */}
                <div className={`absolute top-0 left-0 w-full h-full opacity-40 mix-blend-multiply filter blur-3xl animate-pulse`}>
                    <div className={`absolute top-10 left-10 w-72 h-72 rounded-full ${userType === 'customer' ? 'bg-orange-300' : 'bg-emerald-300'}`}></div>
                    <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full ${userType === 'customer' ? 'bg-violet-300' : 'bg-cyan-300'}`}></div>
                </div>

                {/* The Glass Card */}
                <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-3xl shadow-2xl max-w-lg">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-lg ${currentTheme.image_abstract} text-white`}>
                        <currentTheme.icon size={32} />
                    </div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {userType === 'customer' ? "Shop Local," : "Sell Local,"} <br />
                        <span className={`text-transparent bg-clip-text bg-gradient-to-r ${userType === 'customer' ? "from-orange-600 to-pink-600" : "from-emerald-600 to-cyan-600"}`}>
                            {userType === 'customer' ? "Live Global." : "Grow Faster."}
                        </span>
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        {currentTheme.tagline}
                    </p>
                </div>
            </div>

            {/* --- STEP 4: RIGHT SIDE (CONTROLS) --- */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 relative">
                <div className="w-full max-w-md">

                    {/* Back Option */}
                    <button
                        onClick={() => navigate('/')}
                        className={`group flex items-center gap-2 mb-8 text-sm font-bold transition-all hover:-translate-x-1 cursor-pointer ${currentTheme.text_accent}`}
                    >
                        <ChevronLeft size={18} className="transition-transform group-hover:scale-110" />
                        Back to Home
                    </button>

                    {/* Header & Toggle */}
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-1">{isLogin ? "Welcome back!" : "Join the Network"}</h2>

                        {/* The Animated Pill */}
                        <div className="bg-white p-1 rounded-full shadow-sm border border-gray-100 inline-flex relative mt-4">
                            <div
                                className={`absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out shadow-sm ${userType === 'customer' ? 'left-1 w-[100px] bg-orange-100 text-orange-700' : 'left-[108px] w-[90px] bg-emerald-100 text-emerald-700'}`}
                            ></div>
                            <button onClick={() => setUserType('customer')} className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${userType === 'customer' ? 'text-orange-700' : 'text-gray-500'}`}>
                                Customer
                            </button>
                            <button type="button" onClick={() => setUserType('seller')} className={`relative z-10 px-6 py-2 rounded-full text-sm font-medium transition-colors ${userType === 'seller' ? 'text-emerald-700' : 'text-gray-500'}`}>
                                Seller
                            </button>
                        </div>
                    </div>

                    {/* Form Placeholder - COMPACT MODE (p-6, space-y-3) */}
                    <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 transition-all duration-300 relative z-20">
                        {/* CUSTOMER or SELLER LOGIN Form */}
                        {!(userType === 'seller' && !isLogin) ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-3">
                                {/* CUSTOMER SIGNUP FIELDS */}
                                {userType === 'customer' && !isLogin && (
                                    <>
                                        {/* Full Name */}
                                        <div className="group animate-fade-in">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                            <input
                                                type="text" placeholder="e.g. John Doe"
                                                className={`w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all relative z-10 ${currentTheme.ring}`}
                                                value={authForm.fullName}
                                                onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                                            />
                                        </div>

                                        {/* Email Address + Verification */}
                                        <div className="group animate-fade-in">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                                            <div className="relative z-10">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                    <Mail size={18} />
                                                </div>
                                                <input
                                                    type="email" placeholder="name@example.com"
                                                    className={`w-full pl-11 pr-20 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${currentTheme.ring}`}
                                                    value={authForm.identifier}
                                                    onChange={e => setAuthForm({ ...authForm, identifier: e.target.value })}
                                                    disabled={otpVerified}
                                                    autoComplete="email"
                                                />
                                                {!otpVerified && (
                                                    <button
                                                        type="button"
                                                        onClick={handleSendOtp}
                                                        disabled={otpLoading}
                                                        className="absolute right-2 top-2 bottom-2 px-3 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-200 z-20 cursor-pointer flex items-center justify-center min-w-[60px]"
                                                    >
                                                        {otpLoading ? (
                                                            <div className="w-4 h-4 border-2 border-orange-700 border-t-transparent rounded-full animate-spin"></div>
                                                        ) : (
                                                            otpSent ? 'Resend' : 'Verify'
                                                        )}
                                                    </button>
                                                )}
                                                {otpVerified && <CheckCircle2 className="absolute right-4 top-3.5 text-green-500 w-5 h-5" />}
                                            </div>
                                        </div>

                                        {/* OTP Input */}
                                        {otpSent && !otpVerified && (
                                            <div className="animate-fade-in bg-orange-50 p-3 rounded-lg border border-orange-100 relative z-10">
                                                <p className="text-xs text-orange-800 mb-2 font-semibold">Enter OTP sent to email</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text" placeholder="1234"
                                                        className="w-full px-3 py-2 rounded border border-orange-200 text-sm"
                                                        value={authForm.otp}
                                                        onChange={e => setAuthForm({ ...authForm, otp: e.target.value })}
                                                    />
                                                    <button type="button" onClick={handleVerifyOtp} className="px-4 py-2 bg-orange-500 text-white rounded text-xs font-bold cursor-pointer">Check</button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Mobile Number */}
                                        <div className="group animate-fade-in">
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mobile Number</label>
                                            <div className="relative z-10">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                    <Smartphone size={18} />
                                                </div>
                                                <input
                                                    type="tel" placeholder="9876543210"
                                                    className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${currentTheme.ring}`}
                                                    value={authForm.mobile}
                                                    onChange={e => setAuthForm({ ...authForm, mobile: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* LOGIN IDENTIFIER (Email or Mobile) */}
                                {isLogin && (userType === 'customer' || userType === 'seller') && (
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            {userType === 'seller' ? "Email or Mobile Number" : "Email or Mobile Number"}
                                        </label>
                                        <div className="relative z-10">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                {userType === 'seller' ? <User size={18} /> : <User size={18} />}
                                            </div>
                                            <input
                                                type="text"
                                                name="identifier"
                                                autoComplete="username"
                                                placeholder={userType === 'seller' ? "9876543210 or email@shop.com" : "9876543210 or email@example.com"}
                                                className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${currentTheme.ring}`}
                                                value={authForm.identifier}
                                                onChange={e => setAuthForm({ ...authForm, identifier: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* SELLER LOGIN: Password or Face Toggle */}
                                {userType === 'seller' && isLogin ? (
                                    <div className="animate-fade-in">
                                        {/* Authentication Method Toggles */}
                                        <div className="flex gap-4 mb-3 relative z-10">
                                            <button
                                                type="button"
                                                onClick={() => setLoginMethod('password')}
                                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${loginMethod === 'password' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Password
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setLoginMethod('face')}
                                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all ${loginMethod === 'face' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                                            >
                                                Face ID
                                            </button>
                                        </div>

                                        {loginMethod === 'password' ? (
                                            <div className="group animate-fade-in">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                        <Lock size={18} />
                                                    </div>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        autoComplete="current-password"
                                                        placeholder="••••••••"
                                                        className={`w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${currentTheme.ring}`}
                                                        value={authForm.password}
                                                        onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center animate-fade-in space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                                <div className="relative w-32 h-32 mx-auto bg-black rounded-full overflow-hidden border-4 border-white shadow-lg">
                                                    <Webcam audio={false} ref={webcamRef} className="object-cover w-full h-full mirror" />
                                                    <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-pulse"></div>
                                                </div>
                                                <p className="text-xs text-emerald-700 font-semibold">Position your face to login</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* CUSTOMER SIGNUP/LOGIN PASSWORD */
                                    (
                                        <>
                                            <div className="group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Password</label>
                                                </div>
                                                <div className="relative z-10">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                        <Lock size={18} />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        name="password"
                                                        autoComplete="current-password"
                                                        placeholder="••••••••"
                                                        className={`w-full pl-11 pr-12 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${currentTheme.ring}`}
                                                        value={authForm.password}
                                                        onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                    >
                                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Confirm Password - CUSTOMER SIGNUP ONLY */}
                                            {userType === 'customer' && !isLogin && (
                                                <div className="group animate-fade-in">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Confirm Password</label>
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                            <Lock size={18} />
                                                        </div>
                                                        <input
                                                            type={showConfirmPassword ? "text" : "password"}
                                                            name="confirmPassword"
                                                            autoComplete="new-password"
                                                            placeholder="••••••••"
                                                            className={`w-full pl-11 pr-12 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${currentTheme.ring}`}
                                                            value={authForm.confirmPassword}
                                                            onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-4 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                        >
                                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )
                                )}

                                {/* Error Message */}
                                {authError && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                                        <CheckCircle2 className="rotate-45" size={14} /> {authError}
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className={`w-full mt-4 py-3.5 rounded-xl text-white font-bold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 relative z-20 cursor-pointer ${currentTheme.accent} ${currentTheme.glow}`}
                                >
                                    {isLogin ? (userType === 'seller' && loginMethod === 'face' ? "Scan & Login" : "Sign In") : (userType === 'seller' ? "Start Application" : "Create Account")}
                                    <ArrowRight size={20} />
                                </button>
                            </form>
                        ) : (
                            /* SELLER SIGNUP CTA (No Inputs) */
                            <div className="text-center py-6 space-y-4 animate-fade-up">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-4 animate-bounce">
                                    <Store size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Become a Seller</h3>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                                    We need to verify your shop details and identity to grant you access to the marketplace.
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 py-2 rounded-lg">
                                    <CheckCircle2 size={14} /> 3-Step Verification
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAuth}
                                    className="w-full mt-4 py-3.5 rounded-xl text-white font-bold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                                >
                                    Start Application <ArrowRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Footer Switch */}
                        <div className="mt-4 text-center">
                            <p className="text-gray-500 text-sm">
                                {isLogin ? "New to ShopLens?" : "Already have an account?"}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setAuthError('');
                                    }}
                                    className={`ml-2 font-bold hover:underline focus:outline-none relative z-20 cursor-pointer ${currentTheme.text_accent}`}
                                >
                                    {isLogin ? "Create an account" : "Sign In"}
                                </button>
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthPage;
