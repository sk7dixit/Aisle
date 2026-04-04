import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaCamera, FaUpload, FaTimes, FaCheck, FaInfoCircle, FaSpinner, FaBoxOpen } from 'react-icons/fa'; // Added FaSpinner, FaBoxOpen
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { CATEGORIES, getCategoriesForShop } from "@/constants/categories";

const InstructionScreen = ({ onStart }) => (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-12 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-start relative">

            {/* Background Accent (Faint Radial - Behind Left Column) */}
            <div className="absolute top-0 left-0 w-full h-full md:w-1/2 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10 translate-y-1/4 scale-75 md:scale-100"></div>

            {/* LEFT COLUMN: Context (Primary Visual) */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left pt-4 md:pt-12">

                {/* 1. Camera Hero Area */}
                <div className="relative mb-8 md:mb-12 group inline-block">
                    {/* Continuous Pulse */}
                    <div className="absolute inset-0 bg-indigo-100/50 rounded-full animate-ping-slow opacity-75"></div>

                    {/* Scan Frame Visual (Corner Brackets) */}
                    <div className="absolute -inset-6 border-2 border-indigo-200/50 rounded-3xl opacity-50 scale-100 group-hover:scale-105 transition-transform duration-700"></div>
                    {/* Corner Accents */}
                    <div className="absolute -top-6 -left-6 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-xl"></div>
                    <div className="absolute -top-6 -right-6 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-xl"></div>
                    <div className="absolute -bottom-6 -left-6 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-xl"></div>
                    <div className="absolute -bottom-6 -right-6 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-xl"></div>

                    {/* Main Icon Circle */}
                    <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-100/50 border border-indigo-50 z-10 transition-transform duration-500 hover:scale-105 hover:rotate-2">
                        <FaCamera className="text-5xl text-indigo-600 drop-shadow-sm" />
                    </div>
                </div>

                {/* Title & Helper Text */}
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    Smart Scan
                </h2>
                <p className="text-gray-500 text-lg md:text-xl max-w-md animate-fade-in-up leading-relaxed" style={{ animationDelay: '200ms' }}>
                    Point your camera at any product. <br className="hidden md:block" /> Our AI detects the brand and details.
                </p>
            </div>

            {/* RIGHT COLUMN: Guidance + Controls (Secondary) */}
            <div className="flex flex-col w-full max-w-md mx-auto md:max-w-none md:mx-0 space-y-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>

                {/* Rules Card */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow duration-300 relative z-10">
                    <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-3 text-sm uppercase tracking-wider opacity-80 border-b border-gray-100 pb-4">
                        <FaInfoCircle className="text-indigo-500 text-lg" /> Best Practices
                    </h3>
                    <ul className="space-y-5 text-gray-600">
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                            <span>Scan <strong>one product</strong> at a time for best results</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                            <span>Place item on a clean, flat surface</span>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                            <span>Ensure <strong>brand name</strong> is clearly visible</span>
                        </li>
                    </ul>
                </div>

                {/* Buttons (Stacked below rules) */}
                <div className="flex flex-col sm:flex-row gap-4 w-full relative z-10 pt-2">
                    <button
                        onClick={() => window.history.back()}
                        className="flex-1 px-8 py-4 rounded-2xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 hover:text-gray-900 transition-all active:scale-95 text-center"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onStart}
                        className="flex-[2] px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all active:scale-95 active:shadow-none bg-gradient-to-r from-indigo-600 to-indigo-500 flex items-center justify-center gap-2 group"
                    >
                        <FaCamera className="group-hover:rotate-12 transition-transform" />
                        Start Scanning
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Layer 3: Main Layout
const ImageListingPage = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Config
    const activeCategory = location.state?.activeCategory || "general-provision"; // Default from Inventory
    const shopType = user?.shopDetails?.shopType || "Grocery / Kirana";

    // State
    const [step, setStep] = useState('instructions'); // instructions, scanning, review
    // FiX: Do not initialize from localStorage (User Request: Prevent rehydration of old scans)
    const [sessionId, setSessionId] = useState(null);
    const [items, setItems] = useState([]);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const webcamRef = useRef(null);
    const fileInputRef = useRef(null);

    // FIX 1: Clear any lingering state on mount
    useEffect(() => {
        setItems([]);
        setSessionId(null);
        localStorage.removeItem('imageSessionId');
    }, []);

    // NOTE: Restoration logic removed/disabled to strictly force new sessions per user request.
    // To enable refresh-persistence safely, we would need a session expiry validation.
    // For now, "Browser refresh = New Scan".

    // Start Session
    const handleStart = async () => {
        try {
            const res = await fetch('http://127.0.0.1:5000/api/seller/image-session/start', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setSessionId(data.sessionId);
                localStorage.setItem('imageSessionId', data.sessionId); // Persist for refresh
                setStep('scanning');
            }
        } catch (err) {
            console.error("Failed to start session", err);
            alert("Could not start session. Please checked your connection.");
        }
    };

    // Handle Image Capture/Upload
    const processImage = async (imageSrc, fileObj = null) => {
        setIsProcessing(true);
        try {
            // Case 1: Upload to Cloudinary
            const formData = new FormData();

            if (fileObj) {
                // Case 2: Image Validation (Basic size check handled by browser/multer, toast here if needed)
                if (fileObj.size > 5 * 1024 * 1024) { // 5MB limit
                    alert("Image too large (Max 5MB). Please try another.");
                    setIsProcessing(false);
                    return;
                }
                formData.append('image', fileObj);
            } else {
                const res = await fetch(imageSrc);
                const blob = await res.blob();
                formData.append('image', blob, 'capture.jpg');
            }

            const uploadRes = await fetch('http://127.0.0.1:5000/api/seller/camera/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const uploadData = await uploadRes.json();

            // Case 3: Cloudinary Failure
            if (!uploadRes.ok) throw new Error(uploadData.message || "Upload failed");

            // 2. Add to Session
            const sessionRes = await fetch('http://127.0.0.1:5000/api/seller/image-session/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId,
                    imageUrl: uploadData.imageUrl
                })
            });
            const sessionData = await sessionRes.json();

            // Case 6: Session Expired
            if (sessionRes.status === 410) {
                alert("Session expired. Returning to inventory.");
                localStorage.removeItem('imageSessionId');
                navigate('/seller/inventory');
                return;
            }

            if (sessionRes.ok) {
                // Add to local queue (Right Side)
                // Note: The backend returns the item with "processing started". 
                // In a real socket setup, we'd listen for updates. 
                // For now, we trust the immediate response or mock polling.
                setItems(prev => [sessionData.item, ...prev]);
            }

        } catch (err) {
            console.error("Image processing failed", err);
            alert(`Error: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) processImage(imageSrc);
    }, [webcamRef, sessionId]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            processImage(URL.createObjectURL(file), file);
        }
    };

    const handleSave = () => {
        setStep('review');
    };

    // Review & Save Step
    if (step === 'review') {
        return (
            <ReviewScreen
                items={items}
                token={token}
                sessionId={sessionId}
                defaultCategory={activeCategory} // Rule B: Passed context
                shopType={shopType} // Used for allowed categories
                onSave={() => {
                    localStorage.removeItem('imageSessionId'); // Cleanup
                    navigate('/seller/inventory');
                }}
                onBack={() => setStep('scanning')}
            />
        );
    }

    if (isRestoring) {
        return <div className="min-h-screen flex items-center justify-center">Restoring Session...</div>;
    }

    return (
        <div className="w-full flex flex-col p-4 md:p-6 mb-20 md:mb-0">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            // Rule: "Once page closed (nav away) -> Fresh Start"
                            // We clear session on explicit exit so next time is new.
                            localStorage.removeItem('imageSessionId');
                            navigate('/seller/products');
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                        title="Back to Inventory"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Add by Image</h1>
                        <p className="text-xs text-gray-500">Mode: {activeCategory}</p>
                    </div>
                </div>

                {step === 'scanning' && (
                    <div className="flex gap-2">
                        {/* Fix 4: Clear Scan Button */}
                        <button
                            onClick={() => {
                                if (confirm("Clear current scan session?")) {
                                    setItems([]);
                                    setSessionId(null);
                                    localStorage.removeItem('imageSessionId');
                                    setStep('instructions');
                                }
                            }}
                            className="px-4 py-2 rounded-full border border-red-200 text-red-600 font-medium hover:bg-red-50 text-sm"
                        >
                            Clear Scan
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={items.length === 0}
                            className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${items.length > 0 ? 'bg-[#1a73e8] text-white shadow-md hover:bg-[#1557b0]' : 'bg-gray-200 text-gray-400'
                                }`}
                        >
                            Review & Save ({items.length}) <span>→</span>
                        </button>
                    </div>
                )}
            </div>

            {step === 'instructions' ? (
                <InstructionScreen onStart={handleStart} />
            ) : (
                <div className="flex flex-col md:flex-row gap-6 w-full">
                    {/* LEFT: Camera/Upload Area */}
                    <div className="flex-1 flex flex-col bg-black rounded-2xl relative shadow-md min-h-[400px] overflow-hidden">
                        {isCameraActive ? (
                            <div className="flex-1 relative">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    className="w-full h-full object-cover transform-none relative z-10" // Fix 1: Force no transform
                                    mirrored={false} // Fix 3: Ensure logic doesn't align mirror
                                    videoConstraints={{ facingMode: "environment" }} // Fix 2: Prefer Back Camera
                                />

                                {/* AI Guidance Scanner Layer (Fix 3: Frontend Overlay) */}
                                <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                                    <div className="w-[70%] h-[65%] relative">

                                        {/* 1. Corner Markers (Minimal, Inset) */}
                                        {/* Top-Left */}
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/60 rounded-tl-lg"></div>
                                        {/* Top-Right */}
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/60 rounded-tr-lg"></div>
                                        {/* Bottom-Left */}
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/60 rounded-bl-lg"></div>
                                        {/* Bottom-Right */}
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/60 rounded-br-lg"></div>

                                        {/* 3. Scan Line Animation (Vertical Sweep) */}
                                        {/* Only show when camera is active and not processing */}
                                        {isCameraActive && !isProcessing && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.5)] animate-scan-vertical"></div>
                                        )}

                                        {/* 5. Contextual Helper */}
                                        <div className="absolute -bottom-10 left-0 right-0 text-center">
                                            <span className="text-white/60 text-xs font-medium tracking-wide uppercase">
                                                Align product inside frame
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Overlay Gradient for Text Readability */}
                                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-20"></div>

                                <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 z-20">
                                    <button
                                        onClick={() => fileInputRef.current.click()}
                                        className="p-4 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all active:scale-95"
                                        title="Upload Image"
                                    >
                                        <FaUpload size={24} />
                                    </button>

                                    <button
                                        onClick={capture}
                                        disabled={isProcessing}
                                        className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center bg-white/20 hover:bg-white/30 transition-all active:scale-90 shadow-lg"
                                    >
                                        {isProcessing ? (
                                            <FaSpinner className="animate-spin text-white text-3xl" />
                                        ) : (
                                            <div className="w-16 h-16 bg-white rounded-full"></div>
                                        )}
                                    </button>

                                    <button
                                        onClick={() => setIsCameraActive(false)}
                                        className="p-4 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-all active:scale-95"
                                        title="Pause Camera"
                                    >
                                        <FaTimes size={24} />
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-white bg-gray-900">
                                <p className="mb-4 text-gray-400">Camera is paused</p>
                                <button
                                    onClick={() => setIsCameraActive(true)}
                                    className="px-8 py-3 bg-[#1a73e8] rounded-full font-medium hover:bg-[#1669d6] transition-colors"
                                >
                                    Resume Camera
                                </button>
                            </div>
                        )}

                        {isProcessing && (
                            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
                                <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
                                <p className="text-white font-bold text-lg">Analyzing Image...</p>
                                <p className="text-white/70 text-sm mt-1">Detecting product & brand</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Session Queue */}
                    <div className="w-full md:w-96 flex flex-col">
                        <div className="p-2 flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-800">Scanned Items</h3>
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{items.length}</span>
                        </div>
                        <div className="space-y-3 bg-gray-50/50 rounded-xl max-h-[500px] overflow-y-auto custom-scrollbar p-2">
                            {items.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                    <FaCamera className="text-5xl mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No items scanned yet.</p>
                                    <p className="text-xs opacity-75 mt-1">Images you scan will appear here.</p>
                                </div>
                            ) : (
                                items.map((item, idx) => (
                                    <div key={idx} className="bg-white/40 p-3 rounded-xl border border-transparent hover:border-indigo-100 flex gap-3 animate-in fade-in slide-in-from-right-8 duration-500 hover:shadow-sm transition-all group backdrop-blur-sm">
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img src={item.imageUrl} alt="scan" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            {/* Case 4: No Name/Low Confidence */}
                                            <p className={`font-medium truncate ${!item.detectedName ? 'text-gray-400 italic' : 'text-gray-800'}`}>
                                                {item.detectedName || "Unknown Item"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${!item.requiresManualName
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.requiresManualName ? 'Check' : 'Auto'}
                                                </span>
                                                {item.confidence > 0 && (
                                                    <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                                        {(item.confidence * 100).toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Remove Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newItems = [...items];
                                                newItems.splice(idx, 1);
                                                setItems(newItems);
                                            }}
                                            className="self-center p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove Item"
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// REVIEW SCREEN (Revamped)
const ReviewScreen = ({ items, token, sessionId, onSave, onBack, defaultCategory, shopType }) => {
    // Determine allowed categories for dropdown
    const allowedCategories = getCategoriesForShop(shopType);

    const [products, setProducts] = useState(items.map(i => {
        const catInfo = CATEGORIES.find(c => c.id === defaultCategory || c.label === defaultCategory);
        return {
            ...i,
            name: i.detectedName || '',
            price: '',
            quantity: 1,
            unit: 'piece',
            category: catInfo?.label || 'General Provision / Kirana',
            stock: 1
        };
    }));
    const [isSaving, setIsSaving] = useState(false);
    const [missingFields, setMissingFields] = useState({});

    // State for Success Toast
    const [showSuccess, setShowSuccess] = useState(false);

    const updateProduct = (idx, field, value) => {
        const newProducts = [...products];
        newProducts[idx][field] = value;
        setProducts(newProducts);
        // Clear error
        if (missingFields[`${idx}-${field}`]) {
            const newMissing = { ...missingFields };
            delete newMissing[`${idx}-${field}`];
            setMissingFields(newMissing);
        }
    };

    const handleFinalSave = async () => {
        // Validation
        const errors = {};
        let hasError = false;

        products.forEach((p, idx) => {
            if (!p.name) { errors[`${idx}-name`] = true; hasError = true; }
            if (!p.price) { errors[`${idx}-price`] = true; hasError = true; }
        });

        if (hasError) {
            setMissingFields(errors);
            alert("Please fill in all required fields (Name, Price)");
            return;
        }

        setIsSaving(true);
        // ... (Same save logic as before) ...
        const payload = {
            sessionId,
            products: products.map(p => ({
                name: p.name,
                price: Number(p.price),
                quantity: Number(p.quantity || p.stock), // Fallback
                unit: p.unit,
                category: p.category,
                imageUrl: p.imageUrl
            }))
        };

        try {
            const res = await fetch('http://127.0.0.1:5000/api/seller/image-session/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (res.status === 410) {
                alert("Session expired. Please restart.");
                onSave();
                return;
            }

            if (!res.ok) throw new Error("Failed to save");

            // Success UI
            setShowSuccess(true);
            setTimeout(() => {
                onSave();
            }, 2000); // Wait for animation

        } catch (err) {
            console.error(err);
            alert("Save failed: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full pb-20 relative">
            {/* Custom Success Toast */}
            {showSuccess && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-fade-in-down">
                    <div className="bg-green-600 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md border border-green-400/30">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <FaCheck className="text-white text-sm" />
                        </div>
                        <div>
                            <p className="font-bold text-lg">Products Added Successfully</p>
                            <p className="text-green-100 text-sm">Redirecting to inventory...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header Section */}
            <div className={`max-w-5xl mx-auto mb-8 min-h-[80px] ${showSuccess ? 'blur-sm opacity-50' : ''}`}>
                <button
                    onClick={onBack}
                    className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors mb-4 group font-medium"
                >
                    <span className="mr-2 group-hover:-translate-x-1 transition-transform">←</span>
                    Back to Camera
                </button>
                <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Review Detected Items</h1>
                        <p className="text-gray-500 mt-1">Please verify the details captured by our AI.</p>
                    </div>
                    <button
                        onClick={handleFinalSave}
                        disabled={isSaving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:scale-100"
                    >
                        {isSaving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                        Confirm & Save All
                    </button>
                </div>
            </div>

            {/* List of Cards */}
            <div className="max-w-5xl mx-auto space-y-8">
                {products.map((product, idx) => (
                    <div key={idx} className="bg-white/40 border border-black/5 rounded-xl overflow-hidden backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex flex-col md:flex-row h-full">

                            {/* LEFT: Image Preview Section */}
                            <div className="md:w-1/3 bg-transparent p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 relative">
                                {/* AI Confidence Badge */}
                                {product.confidence > 0 && (
                                    <div className="absolute top-4 left-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <FaCheck className="text-[10px]" />
                                        AI Confidence: {(product.confidence * 100).toFixed(0)}%
                                    </div>
                                )}

                                <div className="relative group">
                                    <img
                                        src={product.imageUrl}
                                        alt="Product Preview"
                                        className="w-48 h-48 object-cover rounded-xl shadow-md border-4 border-white block bg-gray-100"
                                    />
                                    {/* Retake overlay could go here but skipping for simplicity in list view */}
                                </div>
                                <p className="mt-4 text-xs text-gray-400 text-center">
                                    Detected: {product.detectedName || "Unknown Object"}
                                </p>
                            </div>

                            {/* RIGHT: Form Details Section */}
                            <div className="md:w-2/3 p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Product Name */}
                                    <div className="col-span-1 md:col-span-2 group">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                                            Product Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={product.name}
                                            onChange={(e) => updateProduct(idx, 'name', e.target.value)}
                                            className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 font-medium text-gray-800 placeholder-gray-300 ${missingFields[`${idx}-name`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                            placeholder="e.g. Tata Salt 1kg"
                                        />
                                        <div className="h-4 mt-1">
                                            {missingFields[`${idx}-name`] && <p className="text-red-500 text-xs">Required</p>}
                                        </div>
                                    </div>

                                    {/* Price Field */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                                            Selling Price (₹) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 font-bold">
                                                ₹
                                            </div>
                                            <input
                                                type="number"
                                                value={product.price}
                                                onChange={(e) => updateProduct(idx, 'price', e.target.value)}
                                                className={`w-full pl-8 pr-4 py-3 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium ${missingFields[`${idx}-price`] ? 'border-red-500 bg-red-50' : 'border-gray-200'}`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Unit Type */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                                            Unit Type
                                        </label>
                                        <select
                                            value={product.unit}
                                            onChange={(e) => updateProduct(idx, 'unit', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-gray-700"
                                        >
                                            <option value="piece">Piece (pc)</option>
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="packet">Packet</option>
                                            <option value="l">Liter (l)</option>
                                            <option value="ml">Milliliter (ml)</option>
                                            <option value="g">Gram (g)</option>
                                        </select>
                                    </div>

                                    {/* Stock Quantity */}
                                    <div className="group">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                                            Stock Quantity
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                <FaBoxOpen size={14} />
                                            </div>
                                            <input
                                                type="number"
                                                value={product.quantity}
                                                onChange={(e) => updateProduct(idx, 'quantity', e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all font-medium"
                                                placeholder="1"
                                            />
                                        </div>
                                    </div>

                                    {/* Category (Auto-Filled) */}
                                    <div className="col-span-1 md:col-span-2 group">
                                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 group-focus-within:text-indigo-600 transition-colors">
                                            Category
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={product.category}
                                                onChange={(e) => updateProduct(idx, 'category', e.target.value)}
                                                className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg focus:outline-none appearance-none font-medium"
                                            >
                                                {allowedCategories.map(cat => (
                                                    <option key={cat.id} value={cat.label}>{cat.label}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                                                <FaInfoCircle size={16} className="text-indigo-400" />
                                            </div>
                                        </div>
                                        <div className="h-4 mt-1 flex items-center">
                                            <p className="text-[10px] text-indigo-400">AI detected this category automatically.</p>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ImageListingPage;
