import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import {
    FaStore, FaMapMarkerAlt, FaCamera, FaCheckCircle,
    FaExclamationTriangle, FaArrowRight, FaArrowLeft, FaShieldAlt,
    FaSpinner, FaUpload, FaMapPin, FaCheck, FaEye, FaEyeSlash
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, Store, Smartphone, Mail, Lock, CheckCircle2 } from 'lucide-react'; // Aurora Icons
import { INDIA_STATES, STATE_CITY_MAP } from '../../utils/indiaLocations';
import { FaInfoCircle } from 'react-icons/fa';
import AisleLogo from '../../components/AisleLogo';
import ShopTypeGuideModal from '../../components/onboarding/ShopTypeGuideModal';

const SellerRegistrationV2 = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- STEP 1: OWNER DETAILS ---
    const [formData, setFormData] = useState({
        ownerName: '',
        mobile: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });
    const [existErrors, setExistErrors] = useState({ email: '', mobile: '' });
    const [otpSent, setOtpSent] = useState(false);
    const [otpVerified, setOtpVerified] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // --- MOBILE SPECIFIC DOCS STATE ---
    const [mobileDocs, setMobileDocs] = useState({
        gst: '',
        pan: '',
        businessProof: null,
        businessProofPreview: null
    });

    // --- STEP 2: SHOP DETAILS ---
    const [shopData, setShopData] = useState({
        shopName: '',
        category: '',
        otherCategory: '',
        state: '',
        city: '',
        address: '',
        lat: null,
        lng: null
    });
    const [photos, setPhotos] = useState({ shopFront: null, insideView: null });
    const [photoPreviews, setPhotoPreviews] = useState({ shopFront: null, insideView: null });

    // --- STEP 3: FACE ID ---
    const webcamRef = useRef(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [showTypeGuide, setShowTypeGuide] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- STEP 4: AI VERIFICATION WINDOW ---
    const [waitingTime, setWaitingTime] = useState(15);

    useEffect(() => {
        let timer;
        if (step === 4 && waitingTime > 0) {
            timer = setInterval(() => {
                setWaitingTime(prev => prev - 1);
            }, 1000);
        } else if (step === 4 && waitingTime === 0) {
            navigate('/login');
        }
        return () => clearInterval(timer);
    }, [step, waitingTime, navigate]);

    // --- CHECK EXISTS LOGIC ---
    const checkExists = async (field, value) => {
        if (!value) return;

        // Simple regex to avoid unnecessary API calls for incomplete formats
        if (field === 'email' && !/\S+@\S+\.\S+/.test(value)) return;
        if (field === 'mobile' && value.length < 10) return;

        try {
            const res = await fetch(`/api/auth/check-exists?${field}=${value}`);
            let data = {};
            try {
                data = await res.clone().json();
            } catch (err) {
                console.warn("Failed to parse check-exists JSON", err);
            }

            if (data.exists) {
                setExistErrors(prev => ({ ...prev, [field]: data.message }));
            } else {
                setExistErrors(prev => ({ ...prev, [field]: '' }));
            }
        } catch (error) {
            console.error("Check exists failed", error);
        }
    };

    // --- HANDLERS ---

    // Step 1: Logic
    const handleSendOtp = async () => {
        // Validation
        if (!/^[6-9]\d{9}$/.test(formData.mobile)) return setError("Invalid Mobile Number");
        if (existErrors.email || existErrors.mobile) return setError("Please fix highlighted errors first");

        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            let data = {};
            try {
                data = await res.json();
            } catch (err) {
                console.warn("Failed to parse send-otp JSON", err);
            }

            if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

            setOtpSent(true);
            if (data.devOtp) {
                setFormData(prev => ({ ...prev, otp: data.devOtp }));
                setError(`[Dev Mode] Email limit exceeded. OTP auto-filled: ${data.devOtp}`);
            }
        } catch (error) {
            setError(error.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!formData.otp) return setError("Please enter OTP");

        try {
            const res = await fetch('/api/auth/verify-otp-only', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp: formData.otp })
            });
            let data = {};
            try {
                data = await res.json();
            } catch (err) {
                console.warn("Failed to parse verify-otp JSON", err);
            }

            if (!res.ok) throw new Error(data.message || 'Invalid OTP');

            setOtpVerified(true);
            setOtpSent(false); // Hide OTP box
            setError('');
        } catch (error) {
            setError(error.message || 'Invalid or expired OTP');
        }
    };

    const nextToShop = () => {
        if (!formData.ownerName || !formData.mobile || !otpVerified || !formData.password) {
            return setError("Please complete all verified fields");
        }
        if (existErrors.email || existErrors.mobile) {
            return setError("Please resolve existing account errors");
        }
        if (formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }
        setStep(2);
        setError('');
    };

    // Step 2: Location & Photos
    const handleLocationDetect = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setShopData(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
                // Mock Reverse Geocode
                setShopData(prev => ({ ...prev, address: "Detected Location: 123, Market Road, " + prev.city }));
            });
        }
    };

    const handlePhotoUpload = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setPhotos(prev => ({ ...prev, [type]: file }));
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreviews(prev => ({ ...prev, [type]: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // Mobile verification docs handler
    const handleMobileDocUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setMobileDocs(prev => ({ ...prev, businessProof: file }));
            const reader = new FileReader();
            reader.onloadend = () => setMobileDocs(prev => ({ ...prev, businessProofPreview: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // Step 3: Face
    const captureFace = () => {
        let imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc || imageSrc === 'data:,' || imageSrc.length < 100) {
            console.warn("Webcam capture returned empty/invalid image.");
            if (import.meta.env.DEV) {
                // Friendly fallback in development mode
                imageSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                console.log("[Dev Mode] Using fallback mockup image: ", imageSrc);
            } else {
                setError("Could not capture image. Please check camera permission and try again.");
                return;
            }
        }
        setCapturedImage(imageSrc);
    };

    // Mobile Stats Carousel
    const StatsCarousel = () => {
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
                <div className="relative h-full flex flex-col justify-center animate-fade-in">
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

    // Final Submit
    const handleSubmit = async () => {
        if (isLoading) return; // Prevent double submission
        setIsLoading(true);
        setError('');

        try {
            const formDataToSend = new FormData();

            // 1. Owner Details
            formDataToSend.append('name', formData.ownerName);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('mobile', formData.mobile);
            formDataToSend.append('phone', formData.mobile);
            formDataToSend.append('password', formData.password);

            // 2. Shop Details
            formDataToSend.append('shopName', shopData.shopName);
            formDataToSend.append('shopCategory', shopData.category);
            if (shopData.otherCategory) formDataToSend.append('customCategoryInput', shopData.otherCategory);

            formDataToSend.append('city', shopData.city);
            formDataToSend.append('shopAddress', `${shopData.address}, ${shopData.city}, ${shopData.state}`);
            formDataToSend.append('area', shopData.city);

            // 3. Files
            if (photos.shopFront) formDataToSend.append('shopFront', photos.shopFront);
            if (photos.insideView) formDataToSend.append('insideView', photos.insideView);

            // Mobile Specific documents
            if (mobileDocs.businessProof) formDataToSend.append('businessProof', mobileDocs.businessProof);
            if (mobileDocs.gst) formDataToSend.append('gst', mobileDocs.gst);
            if (mobileDocs.pan) formDataToSend.append('pan', mobileDocs.pan);

            // 4. Face Data
            if (capturedImage) formDataToSend.append('faceData', capturedImage);

            // 5. Location Coordinates
            if (shopData.lat && shopData.lng) {
                formDataToSend.append('lat', shopData.lat);
                formDataToSend.append('lng', shopData.lng);
            }

            const res = await fetch('/api/auth/register-seller-complete', {
                method: 'POST',
                body: formDataToSend
            });

            console.log("Registration Response Status:", res.status);

            let data = {};
            try {
                data = await res.json();
            } catch (err) {
                console.warn("Failed to parse registration JSON", err);
            }

            if (!res.ok) throw new Error(data.message || 'Registration failed');

            // Success -> Move to Waiting Screen
            setStep(4);

        } catch (error) {
            console.error(error);
            setError(error.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    // --- THEME (Emerald/Teal) ---
    const theme = {
        accent: "bg-emerald-600 hover:bg-emerald-700",
        ring: "focus:ring-emerald-500",
        bg: "bg-emerald-50"
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans w-full flex flex-col">
            <style>{`
                @keyframes scan {
                    0%, 100% { top: 0%; }
                    50% { top: 100%; }
                }
                .animate-scanner-line {
                    animation: scan 2s linear infinite;
                    position: absolute;
                }
            `}</style>

            {/* --- DESKTOP VIEWPORT --- */}
            <div className="hidden md:flex min-h-screen items-center justify-center p-4 lg:p-10 bg-slate-50">
                <div className="bg-white w-full max-w-5xl rounded-3xl shadow-xl overflow-hidden grid lg:grid-cols-[1fr,1.5fr] min-h-[600px]">

                    {/* LEFT SIDE: Visuals */}
                    <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-600 to-teal-800 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="mb-8">
                                <AisleLogo height="40px" />
                            </div>
                            <h1 className="text-4xl font-bold leading-tight mb-6">
                                {step === 1 && "Start your journey."}
                                {step === 2 && "Setup your store."}
                                {step === 3 && "Secure account."}
                            </h1>
                            <p className="text-emerald-100 text-lg">
                                {step === 1 && "Join the neighborhood's most trusted commerce network."}
                                {step === 2 && "Tell us about your business to reach local customers."}
                                {step === 3 && "One-time face verification for lifetime security."}
                            </p>
                        </div>

                        {/* Stepper Dots */}
                        <div className="flex gap-3 relative z-10">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`h-2 rounded-full transition-all duration-500 ${step === i ? 'w-12 bg-white' : 'w-2 bg-white/30'}`} />
                            ))}
                        </div>

                        {/* Abstract Circles */}
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute top-20 -left-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-2xl" />
                    </div>

                    {/* RIGHT SIDE: Form */}
                    <div className="p-8 lg:p-12 overflow-y-auto max-h-[90vh]">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3 text-sm font-semibold">
                                <FaExclamationTriangle /> {error}
                            </div>
                        )}

                        {/* --- STEP 1: OWNER DETAILS --- */}
                        {step === 1 && (
                            <div className="space-y-6 animate-fade-up">
                                <h2 className="text-2xl font-bold text-gray-900">Owner Details</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Owner Full Name</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring}`}
                                            placeholder="e.g. Ramesh Gupta"
                                            value={formData.ownerName} onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mobile Number</label>
                                            <div className="relative">
                                                <Smartphone className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="tel" maxLength={10}
                                                    className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${existErrors.mobile ? 'border-red-500 ring-red-200' : 'border-gray-200'} ${theme.ring}`}
                                                    placeholder="9876543210"
                                                    value={formData.mobile}
                                                    onChange={e => {
                                                        setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') });
                                                        if (existErrors.mobile) setExistErrors(prev => ({ ...prev, mobile: '' }));
                                                    }}
                                                    onBlur={() => checkExists('phone', formData.mobile)}
                                                />
                                            </div>
                                            {existErrors.mobile && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{existErrors.mobile}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                                                <input
                                                    type="email"
                                                    className={`w-full pl-12 pr-24 py-3 rounded-xl border focus:outline-none focus:ring-2 transition-all ${existErrors.email ? 'border-red-500 ring-red-200' : 'border-gray-200'} ${theme.ring}`}
                                                    placeholder="email@example.com"
                                                    value={formData.email}
                                                    onChange={e => {
                                                        setFormData({ ...formData, email: e.target.value });
                                                        if (existErrors.email) setExistErrors(prev => ({ ...prev, email: '' }));
                                                    }}
                                                    onBlur={() => checkExists('email', formData.email)}
                                                    disabled={otpVerified}
                                                />
                                                {!otpVerified && (
                                                    <button
                                                        onClick={handleSendOtp}
                                                        disabled={isLoading || !!existErrors.email}
                                                        className={`absolute right-2 top-2 bottom-2 px-4 text-xs font-bold rounded-lg transition-colors ${isLoading || existErrors.email ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                                                    >
                                                        {isLoading ? 'Sending...' : (otpSent ? 'Resend' : 'Verify')}
                                                    </button>
                                                )}
                                                {otpVerified && <CheckCircle2 className="absolute right-4 top-3.5 text-emerald-600 w-5 h-5" />}
                                            </div>
                                            {existErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{existErrors.email}</p>}
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {otpSent && !otpVerified && (
                                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                                <p className="text-xs text-emerald-800 font-bold mb-2">Enter OTP sent to your email</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text" placeholder="XXXXXX" maxLength={6}
                                                        className="w-full px-4 py-2 rounded-lg border border-emerald-200 focus:outline-none"
                                                        value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })}
                                                    />
                                                    <button onClick={handleVerifyOtp} className="bg-emerald-600 text-white px-6 rounded-lg font-bold text-sm">Submit</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    className={`w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring}`}
                                                    placeholder="••••••••"
                                                    value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirm Password</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    className={`w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring}`}
                                                    placeholder="••••••••"
                                                    value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                >
                                                    {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button onClick={nextToShop} className={`w-full py-4 rounded-xl text-white font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${theme.accent}`}>
                                    Continue to Shop Details <FaArrowRight />
                                </button>
                            </div>
                        )}

                        {/* --- STEP 2: SHOP DETAILS --- */}
                        {step === 2 && (
                            <div className="space-y-6 animate-fade-up">
                                <h2 className="text-2xl font-bold text-gray-900">Shop Details</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Shop Name</label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring}`}
                                            placeholder="e.g. Laxmi General Store"
                                            value={shopData.shopName} onChange={e => setShopData({ ...shopData, shopName: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Shop Type</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowTypeGuide(true)}
                                                className="text-gray-400 hover:text-emerald-600 transition-colors"
                                            >
                                                <FaInfoCircle size={12} />
                                            </button>
                                        </div>
                                        <select
                                            className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring} bg-white`}
                                            value={shopData.category}
                                            onChange={e => setShopData({ ...shopData, category: e.target.value })}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Grocery / Kirana">Grocery / Kirana</option>
                                            <option value="Electronics & Tools">Electronics & Tools</option>
                                            <option value="Tech & Accessories">Tech & Accessories</option>
                                            <option value="Student & Office Supplies">Student & Office Supplies</option>
                                            <option value="Home & Lifestyle Goods">Home & Lifestyle Goods</option>
                                            <option value="Pharmacy / Medical Store">Pharmacy / Medical Store</option>
                                            <option value="Services">Services</option>
                                            <option value="Home Businesses">Home Businesses</option>
                                            <option value="Seasonal / Festive Store">Seasonal / Festive Store</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    {shopData.category === 'Other' && (
                                        <div className="animate-fade-up">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Specify Category</label>
                                            <input
                                                type="text"
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring}`}
                                                placeholder="What do you sell?"
                                                value={shopData.otherCategory}
                                                onChange={e => setShopData({ ...shopData, otherCategory: e.target.value })}
                                            />
                                            {(shopData.otherCategory.toLowerCase().includes('pet') || shopData.otherCategory.toLowerCase().includes('plant') || shopData.otherCategory.toLowerCase().includes('nursery')) && (
                                                <p className="text-xs text-emerald-600 mt-2 font-semibold">
                                                    ℹ️ Special specialized store tools will be enabled for this category.
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">State</label>
                                            <select
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring} bg-white`}
                                                value={shopData.state}
                                                onChange={e => setShopData({ ...shopData, state: e.target.value })}
                                            >
                                                <option value="">Select State</option>
                                                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">City</label>
                                            <select
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring} bg-white`}
                                                value={shopData.city}
                                                onChange={e => setShopData({ ...shopData, city: e.target.value })}
                                                disabled={!shopData.state}
                                            >
                                                <option value="">Select City</option>
                                                {shopData.state && STATE_CITY_MAP[shopData.state]?.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Complete Address</label>
                                        <div className="relative">
                                            <textarea
                                                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all ${theme.ring} min-h-[100px]`}
                                                placeholder="Shop No, Street, Landmark..."
                                                value={shopData.address} onChange={e => setShopData({ ...shopData, address: e.target.value })}
                                            />
                                            <button
                                                onClick={handleLocationDetect}
                                                className="absolute bottom-4 right-4 text-xs bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 hover:bg-emerald-200"
                                            >
                                                <FaMapPin /> Detect Location
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer relative overflow-hidden group">
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handlePhotoUpload(e, 'shopFront')} />
                                            {photoPreviews.shopFront ? (
                                                <img src={photoPreviews.shopFront} className="w-full h-32 object-cover rounded-lg" alt="front" />
                                            ) : (
                                                <div className="py-8">
                                                    <FaStore className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-xs font-bold text-gray-500">Upload Shop Front</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer relative overflow-hidden group">
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handlePhotoUpload(e, 'insideView')} />
                                            {photoPreviews.insideView ? (
                                                <img src={photoPreviews.insideView} className="w-full h-32 object-cover rounded-lg" alt="inside" />
                                            ) : (
                                                <div className="py-8">
                                                    <FaCamera className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-xs font-bold text-gray-500">Upload Inside View</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="px-6 py-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Back</button>
                                    <button onClick={() => setStep(3)} className={`flex-1 py-4 rounded-xl text-white font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${theme.accent}`}>
                                        Next: Face Enrollment <FaArrowRight />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* --- STEP 3: FACE ID --- */}
                        {step === 3 && (
                            <div className="space-y-6 animate-fade-up text-center pt-8">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <ScanFace size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Face Authentication</h2>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Please position your face within the frame. This verifies your identity and secures your seller panel.
                                </p>

                                <div className="relative w-64 h-64 mx-auto bg-black rounded-full overflow-hidden border-4 border-emerald-100 shadow-2xl">
                                    {!capturedImage ? (
                                        !isMobile && (
                                            <Webcam
                                                ref={webcamRef} audio={false}
                                                className="w-full h-full object-cover mirror"
                                                screenshotFormat="image/jpeg"
                                            />
                                        )
                                    ) : (
                                        <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                                    )}
                                </div>

                                <div className="max-w-xs mx-auto space-y-3">
                                    {!capturedImage ? (
                                        <button onClick={captureFace} className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all ${theme.accent}`}>
                                            Capture Face
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={handleSubmit} className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all ${theme.accent}`}>
                                                {isLoading ? 'Processing...' : 'Finish Registration'}
                                            </button>
                                            <button onClick={() => setCapturedImage(null)} className="text-sm font-bold text-gray-400 hover:text-gray-600">
                                                Retake Photo
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6 animate-fade-up text-center pt-12">
                                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <FaSpinner className="w-10 h-10 text-emerald-600 animate-spin" />
                                    <span className="absolute text-xs font-bold mt-16 text-emerald-700">{waitingTime}s</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">AI Verifying Identity...</h2>
                                <p className="text-gray-500 max-w-md mx-auto">
                                    Please wait while our system performs a secure automated check. You will be redirected shortly.
                                </p>
                                <div className="w-full bg-gray-100 rounded-full h-2 max-w-xs mx-auto mt-6 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-linear"
                                        style={{ width: `${((15 - waitingTime) / 15) * 100}%` }}
                                    />
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* --- MOBILE VIEWPORT --- */}
            <div className="block md:hidden min-h-screen w-full py-6 px-5 select-none bg-slate-50 flex flex-col overflow-y-auto">
                
                {/* Left-aligned Logo Header */}
                <div className="w-full flex justify-start mb-4">
                    <AisleLogo imgClassName="h-7" panel="seller" />
                </div>

                {/* Sticky Onboarding Progress Tracker (1 Account -> 2 Shop -> 3 Verification -> 4 Complete) */}
                <div className="sticky top-0 bg-slate-50 z-40 py-3 border-b border-slate-200/60 mb-5 -mx-5 px-5">
                    <div className="flex justify-between items-center max-w-sm mx-auto">
                        {[1, 2, 3, 4].map((s) => (
                            <React.Fragment key={s}>
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                            step >= s
                                                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                                                : 'bg-slate-200 text-slate-400'
                                        }`}
                                    >
                                        {step > s ? <FaCheck size={9} /> : s}
                                    </div>
                                    <span className={`text-[9px] font-black mt-1 uppercase tracking-wider ${step >= s ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        {s === 1 ? 'Account' : s === 2 ? 'Shop' : s === 3 ? 'Verify' : 'Final'}
                                    </span>
                                </div>
                                {s < 4 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-1.5 transition-all ${
                                            step > s ? 'bg-emerald-600' : 'bg-slate-200'
                                        }`}
                                    ></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Main Onboarding Wizard Form Sheet */}
                <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col relative z-25">
                    
                    {/* Error Box */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 flex items-center gap-2 text-xs font-semibold border border-red-100">
                            <FaExclamationTriangle className="shrink-0" /> <span>{error}</span>
                        </div>
                    )}

                    {/* STEP 1: Account Setup */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center mb-1">
                                <h3 className="text-lg font-black text-gray-900 leading-tight">Create Merchant Account</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Let's set up your login credentials</p>
                            </div>

                            {/* Stats Carousel to build confidence */}
                            <StatsCarousel />

                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Owner Full Name</label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                        placeholder="e.g. Ramesh Gupta"
                                        value={formData.ownerName}
                                        onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Mobile Number</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                            <Smartphone size={18} />
                                        </div>
                                        <input
                                            type="tel" maxLength={10}
                                            className={`w-full h-14 pl-11 pr-4 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-slate-50 focus:bg-white ${existErrors.mobile ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'}`}
                                            placeholder="9876543210"
                                            value={formData.mobile}
                                            onChange={e => {
                                                setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') });
                                                if (existErrors.mobile) setExistErrors(prev => ({ ...prev, mobile: '' }));
                                            }}
                                            onBlur={() => checkExists('phone', formData.mobile)}
                                        />
                                    </div>
                                    {existErrors.mobile && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{existErrors.mobile}</p>}
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Email Address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            className={`w-full h-14 pl-11 pr-24 rounded-xl border focus:outline-none focus:ring-2 transition-all bg-slate-50 focus:bg-white ${existErrors.email ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-emerald-500'}`}
                                            placeholder="email@example.com"
                                            value={formData.email}
                                            onChange={e => {
                                                setFormData({ ...formData, email: e.target.value });
                                                if (existErrors.email) setExistErrors(prev => ({ ...prev, email: '' }));
                                            }}
                                            onBlur={() => checkExists('email', formData.email)}
                                            disabled={otpVerified}
                                        />
                                        {!otpVerified && (
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={isLoading || !!existErrors.email}
                                                className={`absolute right-2 top-2 bottom-2 px-3 text-xs font-bold rounded-lg transition-colors ${isLoading || existErrors.email ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-250'}`}
                                            >
                                                {isLoading ? 'Wait...' : (otpSent ? 'Resend' : 'Verify')}
                                            </button>
                                        )}
                                        {otpVerified && <CheckCircle2 className="absolute right-4 top-4 text-emerald-600 w-5 h-5" />}
                                    </div>
                                    {existErrors.email && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{existErrors.email}</p>}
                                </div>

                                {otpSent && !otpVerified && (
                                    <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/30 space-y-2">
                                        <p className="text-xs text-emerald-800 font-bold">Verify OTP sent to {formData.email}</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text" placeholder="XXXXXX" maxLength={6}
                                                className="flex-1 h-12 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })}
                                            />
                                            <button type="button" onClick={handleVerifyOtp} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 rounded-lg font-bold text-xs">Verify</button>
                                        </div>
                                    </div>
                                )}

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                            placeholder="••••••••"
                                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                            placeholder="••••••••"
                                            value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={nextToShop}
                                className="w-full h-14 mt-4 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/15 flex justify-center items-center gap-2"
                            >
                                <span>Continue to Shop Setup</span>
                                <FaArrowRight size={14} />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Shop Details */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center mb-1">
                                <h3 className="text-lg font-black text-gray-900 leading-tight">Store Registration</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Tell us about your retail outlet</p>
                            </div>

                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Shop Name</label>
                                    <input
                                        type="text"
                                        className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                        placeholder="e.g. Laxmi General Store"
                                        value={shopData.shopName} onChange={e => setShopData({ ...shopData, shopName: e.target.value })}
                                    />
                                </div>

                                <div className="group">
                                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Shop Category / Type</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowTypeGuide(true)}
                                            className="text-gray-400 hover:text-emerald-600"
                                        >
                                            <FaInfoCircle size={11} />
                                        </button>
                                    </div>
                                    <select
                                        className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                        value={shopData.category}
                                        onChange={e => setShopData({ ...shopData, category: e.target.value })}
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Grocery / Kirana">Grocery / Kirana</option>
                                        <option value="Electronics & Tools">Electronics & Tools</option>
                                        <option value="Tech & Accessories">Tech & Accessories</option>
                                        <option value="Student & Office Supplies">Student & Office Supplies</option>
                                        <option value="Home & Lifestyle Goods">Home & Lifestyle Goods</option>
                                        <option value="Pharmacy / Medical Store">Pharmacy / Medical Store</option>
                                        <option value="Services">Services</option>
                                        <option value="Home Businesses">Home Businesses</option>
                                        <option value="Seasonal / Festive Store">Seasonal / Festive Store</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {shopData.category === 'Other' && (
                                    <div className="group animate-fade-in">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Specify Category</label>
                                        <input
                                            type="text"
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                            placeholder="What do you sell?"
                                            value={shopData.otherCategory}
                                            onChange={e => setShopData({ ...shopData, otherCategory: e.target.value })}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">State</label>
                                        <select
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                            value={shopData.state}
                                            onChange={e => setShopData({ ...shopData, state: e.target.value })}
                                        >
                                            <option value="">Select State</option>
                                            {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">City</label>
                                        <select
                                            className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                            value={shopData.city}
                                            onChange={e => setShopData({ ...shopData, city: e.target.value })}
                                            disabled={!shopData.state}
                                        >
                                            <option value="">Select City</option>
                                            {shopData.state && STATE_CITY_MAP[shopData.state]?.map(city => (
                                                <option key={city} value={city}>{city}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Complete Address</label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full min-h-[80px] p-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                            placeholder="Shop No, Landmark, Area..."
                                            value={shopData.address}
                                            onChange={e => setShopData({ ...shopData, address: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleLocationDetect}
                                            className="absolute bottom-3 right-3 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-bold flex items-center gap-0.5 hover:bg-emerald-250 transition-colors"
                                        >
                                            <FaMapPin size={10} />
                                            <span>GPS Pin</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Shop photos uploads inline (stacked, smaller h-20 blocks) */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center hover:bg-slate-50 cursor-pointer relative overflow-hidden bg-slate-50 flex flex-col justify-center items-center h-28">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handlePhotoUpload(e, 'shopFront')} />
                                        {photoPreviews.shopFront ? (
                                            <img src={photoPreviews.shopFront} className="w-full h-full object-cover rounded-lg" alt="front" />
                                        ) : (
                                            <div className="py-2">
                                                <FaStore className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                                                <p className="text-[10px] font-bold text-slate-500">Shop Front</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center hover:bg-slate-50 cursor-pointer relative overflow-hidden bg-slate-50 flex flex-col justify-center items-center h-28">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handlePhotoUpload(e, 'insideView')} />
                                        {photoPreviews.insideView ? (
                                            <img src={photoPreviews.insideView} className="w-full h-full object-cover rounded-lg" alt="inside" />
                                        ) : (
                                            <div className="py-2">
                                                <FaCamera className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                                                <p className="text-[10px] font-bold text-slate-500">Inside View</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="px-4 h-14 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (!shopData.shopName || !shopData.category || !shopData.state || !shopData.city || !shopData.address) {
                                            setError("Please complete all shop details");
                                            return;
                                        }
                                        setStep(3);
                                        setError('');
                                    }}
                                    className="flex-1 h-14 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/15 flex justify-center items-center gap-2"
                                >
                                    <span>Continue to Verification</span>
                                    <FaArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Security & Verification */}
                    {step === 3 && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-center mb-1">
                                <h3 className="text-lg font-black text-gray-900 leading-tight">Merchant Verification</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Provide commercial proofs for AI review</p>
                            </div>

                            <div className="space-y-4">
                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">GSTIN (Optional)</label>
                                    <input
                                        type="text" maxLength={15}
                                        className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                        placeholder="e.g. 24ABCDE1234F1Z5"
                                        value={mobileDocs.gst}
                                        onChange={e => setMobileDocs({ ...mobileDocs, gst: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">PAN Card Number</label>
                                    <input
                                        type="text" maxLength={10}
                                        className="w-full h-14 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all bg-slate-50 focus:bg-white"
                                        placeholder="e.g. ABCDE1234F"
                                        value={mobileDocs.pan}
                                        onChange={e => setMobileDocs({ ...mobileDocs, pan: e.target.value.toUpperCase() })}
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 ml-1">Business Proof Document</label>
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-3 text-center hover:bg-slate-50 cursor-pointer relative overflow-hidden bg-slate-50 flex flex-col justify-center items-center min-h-[90px]">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleMobileDocUpload} />
                                        {mobileDocs.businessProofPreview ? (
                                            <div className="flex flex-col items-center">
                                                <FaCheckCircle className="text-emerald-500 w-7 h-7 mb-1 animate-pulse" />
                                                <p className="text-[10px] font-bold text-slate-700 truncate max-w-[200px]">{mobileDocs.businessProof?.name || "Uploaded"}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <FaUpload className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                                                <p className="text-[10px] font-bold text-slate-500">Upload Registration / Utility Bill</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Face ID Enrollment circular viewport */}
                                <div className="space-y-3 pt-1 text-center">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Face Authenticator Enrollment</label>
                                    
                                    <div className="relative w-40 h-40 mx-auto bg-black rounded-full overflow-hidden border-4 border-emerald-100 shadow-md">
                                        {!capturedImage ? (
                                            isMobile && (
                                                <Webcam
                                                    ref={webcamRef} audio={false}
                                                    className="w-full h-full object-cover mirror"
                                                    screenshotFormat="image/jpeg"
                                                />
                                            )
                                        ) : (
                                            <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                                        )}
                                        {!capturedImage && (
                                            <>
                                                <div className="absolute inset-0 border border-emerald-400 rounded-full animate-ping opacity-15"></div>
                                                <div className="absolute left-0 right-0 h-0.5 bg-emerald-400 animate-scanner-line opacity-80"></div>
                                            </>
                                        )}
                                    </div>

                                    <div className="max-w-xs mx-auto">
                                        {!capturedImage ? (
                                            <button
                                                type="button"
                                                onClick={captureFace}
                                                className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-colors"
                                            >
                                                Capture Identity
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setCapturedImage(null)}
                                                className="text-xs font-bold text-red-500 hover:underline"
                                            >
                                                Retake Photo
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={() => setStep(2)}
                                    className="px-4 h-14 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (!capturedImage) {
                                            setError("Face verification capture is required to submit");
                                            return;
                                        }
                                        setError('');
                                        handleSubmit();
                                    }}
                                    className="flex-1 h-14 rounded-xl text-white font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/15 flex justify-center items-center gap-2"
                                >
                                    <span>Review & Submit</span>
                                    <FaArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: AI verification window count-down */}
                    {step === 4 && (
                        <div className="space-y-6 animate-fade-in text-center py-8">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                                <FaSpinner className="w-8 h-8 text-emerald-600 animate-spin" />
                                <span className="absolute text-[10px] font-black text-emerald-700 mt-12">{waitingTime}s</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 leading-tight">AI Identity Verification</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                                Security algorithms are checking your details. You will be redirected to the sign-in screen shortly.
                            </p>
                            
                            <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[200px] mx-auto overflow-hidden mt-4">
                                <div
                                    className="bg-emerald-600 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                                    style={{ width: `${((15 - waitingTime) / 15) * 100}%` }}
                                />
                            </div>
                        </div>
                    )}

                </div>

                {/* Back to Home Button at the very bottom */}
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 mb-2 text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:-translate-x-0.5 text-emerald-700 hover:text-emerald-800"
                >
                    <FaArrowLeft size={12} />
                    <span>Back to Home</span>
                </button>
            </div>

            {/* Modal components */}
            {showTypeGuide && <ShopTypeGuideModal onClose={() => setShowTypeGuide(false)} />}
        </div>
    );
};

export default SellerRegistrationV2;
