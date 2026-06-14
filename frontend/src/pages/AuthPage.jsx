import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Webcam from 'react-webcam'; // Ensure this package is installed or use placeholder
import {
    ShoppingBag, Store, ArrowRight, Mail, Lock,
    Smartphone, ScanFace, CheckCircle2, User, ChevronLeft, Eye, EyeOff
} from 'lucide-react';
import AisleLogo from '../components/AisleLogo';
import axios from 'axios';

const AuthPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    // 1. STATE MANAGEMENT
    const [userType, setUserType] = useState('customer'); // 'customer' or 'seller'
    const [isLogin, setIsLogin] = useState(location.pathname !== '/register'); // Toggle between Login and Signup

    // Mobile specific states
    const [mobileSignupStep, setMobileSignupStep] = useState(1);
    const [showMobileFaceModal, setShowMobileFaceModal] = useState(false);

    // Sync state with URL if user navigates history or clicks links while mounted
    useEffect(() => {
        setIsLogin(location.pathname !== '/register');
        setMobileSignupStep(1);
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

    // Auto-send OTP when customer signup reaches step 2 on mobile
    useEffect(() => {
        if (!isLogin && userType === 'customer' && mobileSignupStep === 2 && !otpSent && !otpVerified) {
            handleSendOtp();
        }
    }, [mobileSignupStep, isLogin, userType]);

    const handleSendOtp = async () => {
        const emailToVerify = isLogin ? authForm.identifier : (userType === 'customer' ? authForm.identifier : authForm.identifier);
        if (!emailToVerify || !emailToVerify.includes('@')) {
            setAuthError("Please enter a valid email to verify.");
            return;
        }
        setAuthError('');
        setOtpLoading(true);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToVerify })
            });
            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                if (res.status === 400) throw new Error("Invalid email format or details.");
                throw new Error("Failed to send OTP. Server error.");
            }

            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

            setOtpSent(true);
            if (data.devOtp) {
                setAuthForm(prev => ({ ...prev, otp: data.devOtp }));
                setAuthError(`[Dev Mode] Email limit exceeded. OTP auto-filled: ${data.devOtp}`);
            }
        } catch (error) {
            setAuthError(error.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        const emailToVerify = isLogin ? authForm.identifier : (userType === 'customer' ? authForm.identifier : authForm.identifier);
        if (!authForm.otp) {
            return setAuthError("Please enter OTP");
        }

        try {
            const res = await fetch('/api/auth/verify-otp-only', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailToVerify, otp: authForm.otp })
            });

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                if (res.status === 400) throw new Error("Invalid or expired OTP.");
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
                    if (res.status === 400) throw new Error("User already exists with this email or mobile.");
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

                    try {
                        const res = await axios.post('/api/auth/login-face', {
                            identifier: authForm.identifier,
                            faceData: imageSrc
                        });

                        login(res.data);
                        navigate('/seller/home');
                    } catch (err) {
                        const status = err.response?.status;
                        const data = err.response?.data || {};

                        if (status === 404) {
                            setAuthError("Account not exist, create a new one.");
                        } else if (status === 401) {
                            setAuthError("Face verification failed or user not enrolled.");
                        } else if (status === 403) {
                            if (data.error === 'VERIFICATION_IN_PROGRESS') {
                                setAuthError("Your verification is under review. This usually takes a short time. Please try again later.");
                            } else if (data.error === 'VERIFICATION_PENDING_MANUAL_REVIEW') {
                                setAuthError("Your verification needs manual review. Our team is checking your details.");
                            } else {
                                setAuthError(data.message || "Verification pending.");
                            }
                        } else {
                            setAuthError(data.message || "Face Login failed (Server Error).");
                        }
                    }
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

    // Mobile Seller Stats Carousel Component
    const SellerStatsCarousel = () => {
        const [currentSlide, setCurrentSlide] = useState(0);
        const slides = [
            { title: "Trusted by 200+ businesses", desc: "Local shops growing with Aisle" },
            { title: "5000+ products listed", desc: "Discoverable by nearby customers" },
            { title: "Grow locally", desc: "No commissions, direct customer relations" }
        ];

        useEffect(() => {
            const timer = setInterval(() => {
                setCurrentSlide(prev => (prev + 1) % slides.length);
            }, 3000);
            return () => clearInterval(timer);
        }, []);

        return (
            <div className="h-[140px] w-full bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-5 flex flex-col justify-between text-white overflow-hidden relative shadow-md select-none mt-2 mb-4">
                <div className="relative h-full flex flex-col justify-center">
                    {slides.map((slide, idx) => (
                        <div
                            key={idx}
                            className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 transform ${idx === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}`}
                        >
                            <h4 className="text-base font-bold tracking-tight">{slide.title}</h4>
                            <p className="text-xs text-emerald-100 mt-1">{slide.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-1.5 justify-center z-10">
                    {slides.map((_, idx) => (
                        <button
                            key={idx}
                            type="button"
                            onClick={() => setCurrentSlide(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-4' : 'bg-white/40'}`}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // Theme Config
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
        <div className="min-h-screen w-full font-sans">
            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
                .animate-scanner-line {
                    animation: scan 2s linear infinite;
                }
            `}</style>

            {/* --- DESKTOP VIEWPORT --- */}
            <div className={`hidden md:flex min-h-screen w-full transition-colors duration-700 ease-in-out bg-gradient-to-br ${currentTheme.gradient}`}>
                {/* --- STEP 3: LEFT SIDE (VISUALS) --- */}
                <div className="hidden lg:flex w-1/2 relative items-center justify-center p-12 overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-full opacity-40 mix-blend-multiply filter blur-3xl animate-pulse`}>
                        <div className={`absolute top-10 left-10 w-72 h-72 rounded-full ${userType === 'customer' ? 'bg-orange-300' : 'bg-emerald-300'}`}></div>
                        <div className={`absolute bottom-10 right-10 w-96 h-96 rounded-full ${userType === 'customer' ? 'bg-violet-300' : 'bg-cyan-300'}`}></div>
                    </div>

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
                        <button
                            onClick={() => navigate('/')}
                            className={`group flex items-center gap-2 mb-8 text-sm font-bold transition-all hover:-translate-x-1 cursor-pointer ${currentTheme.text_accent}`}
                        >
                            <ChevronLeft size={18} className="transition-transform group-hover:scale-110" />
                            Back to Home
                        </button>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{isLogin ? "Welcome back!" : "Join the Network"}</h2>

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

                        <div className="bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 transition-all duration-300 relative z-20">
                            {/* CUSTOMER or SELLER LOGIN Form */}
                            {!(userType === 'seller' && !isLogin) ? (
                                <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-3">
                                    {/* CUSTOMER SIGNUP FIELDS */}
                                    {userType === 'customer' && !isLogin && (
                                        <>
                                            <div className="group animate-fade-in">
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                                <input
                                                    type="text" placeholder="e.g. John Doe"
                                                    className={`w-full px-4 py-2.5 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent transition-all relative z-10 ${currentTheme.ring}`}
                                                    value={authForm.fullName}
                                                    onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                                                />
                                            </div>

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
                                                Email or Mobile Number
                                            </label>
                                            <div className="relative z-10">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                    <User size={18} />
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
                                    {userType === 'seller' && isLogin && (
                                        <div className="space-y-4 pt-2">
                                            <div className="flex p-1 bg-gray-100 rounded-xl relative z-10">
                                                <button
                                                    type="button"
                                                    onClick={() => setLoginMethod('password')}
                                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${loginMethod === 'password' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Password
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setLoginMethod('face')}
                                                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${loginMethod === 'face' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                >
                                                    Face ID
                                                </button>
                                            </div>

                                            {loginMethod === 'password' ? (
                                                <div className="group">
                                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
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
                                            ) : (
                                                <div className="text-center space-y-3 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
                                                    <div className="relative w-32 h-32 mx-auto bg-black rounded-full overflow-hidden border-4 border-white shadow-lg">
                                                        <Webcam audio={false} ref={webcamRef} className="object-cover w-full h-full mirror" screenshotFormat="image/jpeg" />
                                                        <div className="absolute inset-0 border-4 border-emerald-500/30 rounded-full animate-pulse"></div>
                                                    </div>
                                                    <p className="text-xs text-emerald-700 font-semibold">Position your face to login</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* CUSTOMER LOGIN PASSWORD */}
                                    {userType === 'customer' && isLogin && (
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
                                    )}

                                    {/* CUSTOMER SIGNUP FIELDS (Password + Confirm) */}
                                    {userType === 'customer' && !isLogin && (
                                        <>
                                            <div className="group animate-fade-in">
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
                                                        autoComplete="new-password"
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
                                        </>
                                    )}

                                    {authError && (
                                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 flex items-center gap-2">
                                            <CheckCircle2 className="rotate-45" size={14} /> {authError}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`w-full mt-4 py-3.5 rounded-xl text-white font-bold shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 relative z-20 cursor-pointer ${currentTheme.accent} ${currentTheme.glow}`}
                                    >
                                        {isLogin ? (userType === 'seller' && loginMethod === 'face' ? "Scan & Login" : "Sign In") : (userType === 'seller' ? "Start Application" : "Create Account")}
                                        <ArrowRight size={20} />
                                    </button>
                                </form>
                            ) : (
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

                            <div className="mt-4 text-center">
                                <p className="text-gray-500 text-sm">
                                    {isLogin ? "New to Aisle?" : "Already have an account?"}
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

            {/* --- MOBILE VIEWPORT --- */}
            <div
                className="block md:hidden min-h-screen w-full relative flex flex-col items-center py-6 px-4 font-sans select-none overflow-y-auto"
                style={{
                    background: userType === 'customer'
                        ? 'linear-gradient(to bottom right, rgba(249, 115, 22, 0.08), rgba(236, 72, 153, 0.08))'
                        : 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.08), rgba(20, 184, 166, 0.08))',
                    transition: 'background 0.7s ease'
                }}
            >
                {/* Left-aligned Logo Header */}
                <div className="w-full flex justify-start mb-6">
                    <AisleLogo imgClassName="h-7" panel={userType} />
                </div>

                {/* Welcome Back & Switcher */}
                <div className="w-full max-w-sm mb-4">
                    <div className="text-center mb-4">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            {isLogin ? "Welcome Back" : (userType === 'customer' ? "Create Account" : "Become a Seller")}
                        </h2>
                    </div>

                    {/* Cust/Seller Segmented Control (Height: 52px) */}
                    <div className="w-full bg-slate-200/60 p-1 rounded-2xl shadow-inner border border-slate-300/40 flex relative h-[52px] items-center mb-4">
                        <div
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-sm transition-all duration-300 ease-out ${userType === 'customer' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
                        ></div>
                        <button
                            type="button"
                            onClick={() => {
                                setUserType('customer');
                                setAuthError('');
                            }}
                            className={`flex-1 h-full z-10 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${userType === 'customer' ? 'text-orange-600' : 'text-gray-500'}`}
                        >
                            Customer
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUserType('seller');
                                setAuthError('');
                            }}
                            className={`flex-1 h-full z-10 flex items-center justify-center text-sm font-bold transition-colors duration-300 ${userType === 'seller' ? 'text-emerald-700' : 'text-gray-500'}`}
                        >
                            Seller
                        </button>
                    </div>
                </div>

                {/* Main Content Form Sheet Card (width 100%, 24px padding, 24px border radius) */}
                <div className="w-full max-w-sm bg-white rounded-[24px] shadow-lg border border-white p-6 relative z-20 flex flex-col">
                    
                    {/* Error Alerts */}
                    {authError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                            <CheckCircle2 className="rotate-45 shrink-0" size={14} /> <span>{authError}</span>
                        </div>
                    )}

                    {/* --- CASE 1: LOGIN MODE --- */}
                    {isLogin && (
                        <form onSubmit={(e) => { e.preventDefault(); handleAuth(); }} className="space-y-4">
                            {/* Email or Phone field (h-14, text-base) */}
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Email or Mobile Number</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="identifier"
                                        placeholder={userType === 'seller' ? "9876543210 or email@shop.com" : "9876543210 or email@example.com"}
                                        className={`w-full h-14 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:bg-white focus:border-transparent transition-all ${userType === 'customer' ? 'focus:ring-orange-500' : 'focus:ring-emerald-500'}`}
                                        value={authForm.identifier}
                                        onChange={e => setAuthForm({ ...authForm, identifier: e.target.value })}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password field with Forgot Password right-aligned (h-14, text-base) */}
                            <div className="group">
                                <div className="flex justify-between items-center mb-1 px-1">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => alert("Please contact support to reset your password.")}
                                        className={`text-xs font-bold hover:underline ${userType === 'customer' ? 'text-orange-600' : 'text-emerald-700'}`}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="••••••••"
                                        className={`w-full h-14 pl-11 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:bg-white focus:border-transparent transition-all ${userType === 'customer' ? 'focus:ring-orange-500' : 'focus:ring-emerald-500'}`}
                                        value={authForm.password}
                                        onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className={`w-full h-14 mt-2 rounded-xl text-white font-bold shadow-md transform transition-all active:scale-[0.98] flex justify-center items-center gap-2 cursor-pointer bg-gradient-to-r ${userType === 'customer' ? 'from-orange-500 to-pink-500 shadow-orange-500/15' : 'from-emerald-600 to-teal-700 shadow-emerald-600/15'}`}
                            >
                                <span>Sign In</span>
                                <ArrowRight size={18} />
                            </button>

                            {/* Face ID Trigger for Seller */}
                            {userType === 'seller' && (
                                <div className="flex flex-col items-center pt-2">
                                    <div className="w-full flex items-center gap-3 my-1">
                                        <div className="flex-1 h-[1px] bg-slate-200"></div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">OR</span>
                                        <div className="flex-1 h-[1px] bg-slate-200"></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!authForm.identifier.trim()) {
                                                setAuthError("Please enter your identifier (email/phone) first to use Face ID");
                                                return;
                                            }
                                            setShowMobileFaceModal(true);
                                        }}
                                        className="w-full h-14 mt-1 border border-emerald-200 rounded-xl flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-bold text-base hover:bg-emerald-100 transition-colors shadow-sm"
                                    >
                                        <ScanFace size={20} />
                                        <span>Use Face ID</span>
                                    </button>
                                </div>
                            )}

                            {/* Social Logins */}
                            <div className="pt-2">
                                <div className="w-full flex items-center gap-3 mb-3">
                                    <div className="flex-1 h-[1px] bg-slate-200"></div>
                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Social Connect</span>
                                    <div className="flex-1 h-[1px] bg-slate-200"></div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => alert("Social login is simulated. Proceed with password.")}
                                        className="w-full h-14 border border-slate-200 rounded-xl flex items-center justify-center gap-3 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition-all text-base shadow-sm"
                                    >
                                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                                            <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.136 4.2A5.6 5.6 0 0 1 8.35 13a5.6 5.6 0 0 1 5.64-5.6c1.458 0 2.8.525 3.843 1.488l3.12-3.12C18.825 3.86 16.5 2.8 14 2.8A10.2 10.2 0 0 0 3.8 13c0 5.636 4.564 10.2 10.2 10.2 5.922 0 10.24-4.164 10.24-10.2 0-.69-.082-1.35-.2-2.015H12.24Z" />
                                        </svg>
                                        <span>Continue with Google</span>
                                    </button>
                                    {userType === 'customer' && (
                                        <button
                                            type="button"
                                            onClick={() => alert("Social login is simulated. Proceed with password.")}
                                            className="w-full h-14 border border-slate-200 rounded-xl flex items-center justify-center gap-3 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition-all text-base shadow-sm"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39Z" />
                                            </svg>
                                            <span>Continue with Apple</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    )}

                    {/* --- CASE 2: CUSTOMER SIGNUP MODE (3-Step wizard) --- */}
                    {!isLogin && userType === 'customer' && (
                        <div className="space-y-4">
                            {/* Step Indicator */}
                            <div className="flex justify-between items-center mb-6 px-1">
                                {[1, 2, 3].map((s) => (
                                    <React.Fragment key={s}>
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                                    mobileSignupStep >= s
                                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                                        : 'bg-slate-100 text-slate-400'
                                                }`}
                                            >
                                                {mobileSignupStep > s ? <CheckCircle2 size={16} /> : s}
                                            </div>
                                            <span className={`text-[10px] font-bold mt-1 ${mobileSignupStep >= s ? 'text-gray-800' : 'text-slate-400'}`}>
                                                {s === 1 ? 'Details' : s === 2 ? 'Verify' : 'Security'}
                                            </span>
                                        </div>
                                        {s < 3 && (
                                            <div
                                                className={`flex-1 h-0.5 mx-2 transition-all ${
                                                    mobileSignupStep > s ? 'bg-orange-500' : 'bg-slate-200'
                                                }`}
                                            ></div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* STEP 1: Name & Email */}
                            {mobileSignupStep === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Full Name</label>
                                        <input
                                            type="text" placeholder="e.g. John Doe"
                                            className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                                            value={authForm.fullName}
                                            onChange={e => setAuthForm({ ...authForm, fullName: e.target.value })}
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email" placeholder="name@example.com"
                                                className="w-full h-14 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                                                value={authForm.identifier}
                                                onChange={e => setAuthForm({ ...authForm, identifier: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!authForm.fullName.trim()) return setAuthError("Name is required");
                                            if (!authForm.identifier.trim() || !authForm.identifier.includes('@')) return setAuthError("Valid Email Address is required");
                                            setAuthError('');
                                            setMobileSignupStep(2);
                                        }}
                                        className="w-full h-14 mt-2 rounded-xl text-white font-bold bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/15 flex justify-center items-center gap-2"
                                    >
                                        <span>Continue</span>
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}

                            {/* STEP 2: Mobile & Email OTP Verification */}
                            {mobileSignupStep === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Mobile Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                                <Smartphone size={18} />
                                            </div>
                                            <input
                                                type="tel" placeholder="9876543210"
                                                className="w-full h-14 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                                                value={authForm.mobile}
                                                onChange={e => setAuthForm({ ...authForm, mobile: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[11px] font-bold text-orange-800 uppercase">Verify Email ({authForm.identifier})</span>
                                            {otpVerified && <CheckCircle2 className="text-green-500" size={16} />}
                                        </div>

                                        {!otpVerified ? (
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-500">We sent a verification code to your email.</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text" placeholder="1234"
                                                        className="flex-1 h-12 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                        value={authForm.otp}
                                                        onChange={e => setAuthForm({ ...authForm, otp: e.target.value })}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleVerifyOtp}
                                                        className="px-4 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                                                    >
                                                        Check
                                                    </button>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleSendOtp}
                                                    disabled={otpLoading}
                                                    className="text-xs font-bold text-orange-600 hover:underline disabled:text-gray-400"
                                                >
                                                    {otpLoading ? "Sending..." : "Resend OTP"}
                                                </button>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-green-700 font-semibold">Email successfully verified!</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMobileSignupStep(1)}
                                            className="px-4 h-14 border border-slate-200 rounded-xl font-bold text-gray-500 hover:bg-slate-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!authForm.mobile || authForm.mobile.length < 10) return setAuthError("Valid Mobile Number is required");
                                                if (!otpVerified) return setAuthError("Please verify your email address OTP first");
                                                setAuthError('');
                                                setMobileSignupStep(3);
                                            }}
                                            className="flex-1 h-14 rounded-xl text-white font-bold bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/15 flex justify-center items-center gap-2"
                                        >
                                            <span>Continue</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Passwords */}
                            {mobileSignupStep === 3 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                                                value={authForm.password}
                                                onChange={e => setAuthForm({ ...authForm, password: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="w-full h-14 px-4 rounded-xl bg-slate-50 border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white focus:border-transparent transition-all"
                                                value={authForm.confirmPassword}
                                                onChange={e => setAuthForm({ ...authForm, confirmPassword: e.target.value })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                            >
                                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setMobileSignupStep(2)}
                                            className="px-4 h-14 border border-slate-200 rounded-xl font-bold text-gray-500 hover:bg-slate-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleAuth}
                                            className="flex-1 h-14 rounded-xl text-white font-bold bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/15 flex justify-center items-center gap-2"
                                        >
                                            <span>Create Account</span>
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- CASE 3: SELLER SIGNUP PRE-SCREEN MODE --- */}
                    {!isLogin && userType === 'seller' && (
                        <div className="space-y-4 animate-fade-up text-center select-none">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-2">
                                <Store size={30} />
                            </div>
                            <h3 className="text-xl font-black text-gray-900">🎯 Become a Seller</h3>

                            {/* Trust list checkmarks */}
                            <div className="text-left space-y-2.5 max-w-[260px] mx-auto py-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <span>Reach local customers</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <span>Real-time inventory</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold">
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                    <span>Direct inquiries</span>
                                </div>
                            </div>

                            {/* Auto rotating stats carousel */}
                            <SellerStatsCarousel />

                            <button
                                type="button"
                                onClick={handleAuth}
                                className="w-full h-14 rounded-xl text-white font-bold shadow-md bg-gradient-to-r from-emerald-600 to-teal-700 shadow-emerald-600/15 flex justify-center items-center gap-2 cursor-pointer mt-2"
                            >
                                <span>Start Application</span>
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}

                    {/* Footer Toggle links (Common for customer signup / seller pre-screen) */}
                    {!isLogin && (
                        <div className="mt-4 text-center">
                            <p className="text-gray-500 text-sm">
                                Already have an account?
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsLogin(true);
                                        setAuthError('');
                                        setMobileSignupStep(1);
                                    }}
                                    className={`ml-2 font-bold hover:underline ${userType === 'customer' ? 'text-orange-600' : 'text-emerald-700'}`}
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Trust Layer Badges below form sheet */}
                <div className="flex justify-center items-center gap-3 mt-6 text-[10px] font-bold text-gray-500/80">
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={13} className={userType === 'customer' ? 'text-orange-500/80' : 'text-emerald-600/80'} />
                        <span>Secure Login</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-400/50 rounded-full"></div>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={13} className={userType === 'customer' ? 'text-orange-500/80' : 'text-emerald-600/80'} />
                        <span>Verified Sellers</span>
                    </div>
                    <div className="w-1 h-1 bg-gray-400/50 rounded-full"></div>
                    <div className="flex items-center gap-1">
                        <CheckCircle2 size={13} className={userType === 'customer' ? 'text-orange-500/80' : 'text-emerald-600/80'} />
                        <span>Privacy Protected</span>
                    </div>
                </div>

                {/* Back to Home Button at the very bottom */}
                <button
                    onClick={() => navigate('/')}
                    className={`mt-6 mb-2 text-sm font-bold flex items-center justify-center gap-1 cursor-pointer transition-all hover:-translate-x-0.5 ${userType === 'customer' ? 'text-orange-600 hover:text-orange-750' : 'text-emerald-750 hover:text-emerald-800'}`}
                >
                    <ChevronLeft size={16} />
                    <span>Back to Home</span>
                </button>
            </div>

            {/* --- FACE SCANNER OVERLAY MODAL FOR MOBILE --- */}
            {showMobileFaceModal && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-6 animate-fade-in">
                    <div className="w-full max-w-sm bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-between min-h-[440px] text-center shadow-2xl">
                        <div className="w-full flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowMobileFaceModal(false)}
                                className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                        </div>
                        
                        <div className="my-2 space-y-1">
                            <h3 className="text-lg font-bold text-white">Face Verification</h3>
                            <p className="text-xs text-slate-400">Position your face inside the green frame</p>
                        </div>

                        {/* Camera viewport circle */}
                        <div className="relative w-44 h-44 bg-black rounded-full overflow-hidden border-4 border-emerald-500/40 shadow-lg mt-4 shadow-emerald-500/10">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                className="object-cover w-full h-full mirror"
                                screenshotFormat="image/jpeg"
                            />
                            {/* Scanning indicator */}
                            <div className="absolute inset-0 border-2 border-emerald-400 rounded-full animate-pulse opacity-20"></div>
                            <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 animate-scanner-line opacity-80"></div>
                        </div>

                        <div className="w-full space-y-3 mt-6">
                            <button
                                type="button"
                                onClick={async () => {
                                    const imageSrc = webcamRef.current?.getScreenshot();
                                    if (!imageSrc) {
                                        setAuthError("Camera not ready or permission denied");
                                        setShowMobileFaceModal(false);
                                        return;
                                    }
                                    setAuthError('');
                                    setShowMobileFaceModal(false);
                                    setLoginMethod('face');
                                    // Trigger Face Login Directly
                                    try {
                                        const res = await axios.post('/api/auth/login-face', {
                                            identifier: authForm.identifier,
                                            faceData: imageSrc
                                        });

                                        login(res.data);
                                        navigate('/seller/home');
                                    } catch (err) {
                                        const status = err.response?.status;
                                        const data = err.response?.data || {};

                                        if (status === 404) {
                                            setAuthError("Account not exist, create a new one.");
                                        } else if (status === 401) {
                                            setAuthError("Face verification failed or user not enrolled.");
                                        } else if (status === 403) {
                                            if (data.error === 'VERIFICATION_IN_PROGRESS') {
                                                setAuthError("Your verification is under review. This usually takes a short time. Please try again later.");
                                            } else if (data.error === 'VERIFICATION_PENDING_MANUAL_REVIEW') {
                                                setAuthError("Your verification needs manual review. Our team is checking your details.");
                                            } else {
                                                setAuthError(data.message || "Verification pending.");
                                            }
                                        } else {
                                            setAuthError(data.message || "Face Login failed (Server Error).");
                                        }
                                    }
                                }}
                                className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20"
                            >
                                Scan & Sign In
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthPage;
