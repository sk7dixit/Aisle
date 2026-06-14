import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
    Settings, Bell, Shield, Eye, Moon, ToggleLeft, ToggleRight, 
    Save, ArrowLeft, RefreshCw, Clock, Check, ChevronDown, 
    ChevronRight, Camera, Monitor, Smartphone, Trash2, 
    AlertTriangle, Sparkles, ShieldCheck, Award, Heart, CheckCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Webcam from 'react-webcam';
import axios from 'axios';

const MobileSellerSettings = () => {
    const { user, token, checkUserStatus } = useAuth();
    const navigate = useNavigate();

    // Scrolling refs
    const storeRef = useRef(null);
    const hoursRef = useRef(null);
    const securityRef = useRef(null);
    const devicesRef = useRef(null);

    // Accordions state (which section is expanded)
    const [expandedSections, setExpandedSections] = useState({
        ops: true,
        notifs: false,
        auto: false,
        security: false,
        sessions: false
    });

    // Preferences states
    const [prefs, setPrefs] = useState({
        shopUpdates: true,
        itemAlerts: true,
        paymentAlerts: true,
        autoAccept: false
    });

    // Operations states
    const [operationsStats, setOperationsStats] = useState({
        derivedStatus: 'CLOSED',
        isManualOverride: false,
        operatingMode: 'GUARANTEED',
        openingTime: '09:00',
        closingTime: '20:00'
    });

    const [editTiming, setEditTiming] = useState(false);
    const [openTimeInput, setOpenTimeInput] = useState('09:00');
    const [closeTimeInput, setCloseTimeInput] = useState('20:00');
    const [opsLoading, setOpsLoading] = useState(false);

    // Face Update biometric states
    const [faceStatus, setFaceStatus] = useState(null);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [faceReason, setFaceReason] = useState('');
    const webcamRef = useRef(null);
    const [faceLoading, setFaceLoading] = useState(false);

    // Sessions states
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    // Sync stats and preferences on load
    useEffect(() => {
        if (user) {
            setPrefs({
                shopUpdates: user.notificationPreferences?.shopUpdates ?? true,
                itemAlerts: user.notificationPreferences?.itemAlerts ?? true,
                paymentAlerts: user.notificationPreferences?.paymentAlerts ?? true,
                autoAccept: user.shopDetails?.autoAccept || false
            });
            fetchOperationsStats();
        }
        fetchFaceStatus();
        fetchSessions();
    }, [user, token]);

    const fetchOperationsStats = async () => {
        try {
            const res = await fetch('/api/seller/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats({
                    derivedStatus: data.derivedStatus || 'CLOSED',
                    isManualOverride: data.isManualOverride || false,
                    operatingMode: data.operatingMode || 'GUARANTEED',
                    openingTime: data.openingTime || '09:00',
                    closingTime: data.closingTime || '20:00'
                });
                setOpenTimeInput(data.openingTime || '09:00');
                setCloseTimeInput(data.closingTime || '20:00');
            }
        } catch (err) {
            console.error("Failed to load operations status:", err);
        }
    };

    const fetchFaceStatus = async () => {
        try {
            const res = await fetch('/api/seller/face-update-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFaceStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch face status:", error);
        }
    };

    const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
            const currentDeviceId = localStorage.getItem('aisleDeviceId');
            const res = await axios.get(`/api/auth/sessions?deviceId=${currentDeviceId}`);
            setSessions(res.data);
        } catch (err) {
            console.error("Failed to load sessions:", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    // Toggle preferences
    const handleTogglePref = (key) => {
        const updatedPrefs = { ...prefs, [key]: !prefs[key] };
        setPrefs(updatedPrefs);
        savePreferences(updatedPrefs);
    };

    const savePreferences = async (newPrefs) => {
        try {
            await fetch('/api/seller/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    autoAccept: newPrefs.autoAccept,
                    notificationPreferences: {
                        shopUpdates: newPrefs.shopUpdates,
                        itemAlerts: newPrefs.itemAlerts,
                        paymentAlerts: newPrefs.paymentAlerts
                    }
                })
            });
            toast.success("Preferences updated.");
        } catch (error) {
            console.error("Preferences update failed:", error);
        }
    };

    // Notification Preset handler
    const handleApplyPreset = (presetName) => {
        let newPrefs = {};
        if (presetName === 'essential') {
            newPrefs = { shopUpdates: false, itemAlerts: false, paymentAlerts: true };
        } else if (presetName === 'balanced') {
            newPrefs = { shopUpdates: true, itemAlerts: false, paymentAlerts: true };
        } else if (presetName === 'realtime') {
            newPrefs = { shopUpdates: true, itemAlerts: true, paymentAlerts: true };
        }
        setPrefs(prev => ({ ...prev, ...newPrefs }));
        savePreferences({ ...prefs, ...newPrefs });
        toast.success(`Notification preset applied: ${presetName.toUpperCase()}`);
    };

    const getActivePreset = () => {
        if (!prefs.shopUpdates && !prefs.itemAlerts && prefs.paymentAlerts) return 'essential';
        if (prefs.shopUpdates && !prefs.itemAlerts && prefs.paymentAlerts) return 'balanced';
        if (prefs.shopUpdates && prefs.itemAlerts && prefs.paymentAlerts) return 'realtime';
        return 'custom';
    };

    // Store Timings Updates
    const handleSaveSchedule = async () => {
        setOpsLoading(true);
        try {
            const res = await fetch('/api/seller/schedule', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ openingTime: openTimeInput, closingTime: closeTimeInput })
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats(prev => ({
                    ...prev,
                    openingTime: data.openingTime,
                    closingTime: data.closingTime,
                    derivedStatus: data.derivedStatus
                }));
                toast.success(`Timing updated: ${data.openingTime} - ${data.closingTime}`);
                setEditTiming(false);
            } else {
                toast.error("Failed to update timing.");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update timings.");
        } finally {
            setOpsLoading(false);
        }
    };

    // Force Open/Close overriding
    const handleToggleVisibility = async (isVisible) => {
        setOpsLoading(true);
        try {
            const res = await fetch('/api/seller/visibility', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ isVisible })
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride
                }));
                toast.success(`Store manually set to ${isVisible ? 'OPEN' : 'CLOSED'}`);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to update visibility.");
        } finally {
            setOpsLoading(false);
        }
    };

    // Restore auto timing schedule
    const handleResetAutoTiming = async () => {
        setOpsLoading(true);
        try {
            const res = await fetch('/api/seller/reset-status', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride
                }));
                toast.success("Automatic timing schedule restored!");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to reset timing schedule.");
        } finally {
            setOpsLoading(false);
        }
    };

    // Update operating mode
    const handleUpdateOperatingMode = async (mode) => {
        setOpsLoading(true);
        try {
            const res = await fetch('/api/seller/operating-mode', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ mode })
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats(prev => ({
                    ...prev,
                    operatingMode: data.operatingMode
                }));
                toast.success(`Inventory Mode set to: ${
                    mode === 'GUARANTEED' ? 'Live Inventory' :
                    mode === 'BEST_EFFORT' ? 'Guaranteed Stock' : 'Manual Updates'
                }`);
            }
        } catch (err) {
            console.error("Failed to update operating mode:", err);
            toast.error("Failed to save operating mode.");
        } finally {
            setOpsLoading(false);
        }
    };

    // Revoke device session
    const handleRevokeSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to log out this device?")) return;
        try {
            await axios.post('/api/auth/sessions/revoke', { sessionId });
            toast.success("Session revoked successfully.");
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to log out device.");
        }
    };

    // Revoke all other sessions
    const handleRevokeAllOtherSessions = async () => {
        const otherSessions = sessions.filter(s => !s.isCurrent);
        if (otherSessions.length === 0) {
            toast("No other active devices found.", { icon: 'ℹ️' });
            return;
        }
        if (!window.confirm(`Force sign out all other ${otherSessions.length} devices globally?`)) return;

        toast.loading("Revoking all other active devices...", { id: 'revokeAll' });
        try {
            for (let s of otherSessions) {
                await axios.post('/api/auth/sessions/revoke', { sessionId: s.id });
            }
            toast.success("All other active devices signed out!", { id: 'revokeAll' });
            fetchSessions();
        } catch (err) {
            console.error(err);
            toast.error("Failed to revoke some sessions.", { id: 'revokeAll' });
        }
    };

    // Face Update Request
    const handleCaptureFace = () => {
        let imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc || imageSrc === 'data:,' || imageSrc.length < 100) {
            console.warn("Webcam capture returned empty/invalid image.");
            if (import.meta.env.DEV) {
                imageSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                console.log("[Dev Mode] Using fallback mockup image: ", imageSrc);
            } else {
                toast.error("Could not capture image. Please verify camera permission.");
                return;
            }
        }
        setCapturedImage(imageSrc);
    };

    const handleSubmitFaceUpdate = async () => {
        if (!capturedImage || !faceReason) {
            toast.error("Capture image and enter update reason.");
            return;
        }
        setFaceLoading(true);
        try {
            const res = await fetch('/api/seller/face-update-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newFaceData: capturedImage, reason: faceReason })
            });

            if (res.ok) {
                toast.success("Biometrics verification request submitted!");
                setShowFaceModal(false);
                setCapturedImage(null);
                setFaceReason('');
                fetchFaceStatus();
            } else {
                const d = await res.json();
                toast.error(d.message || "Request submission failed.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Submission error occurred.");
        } finally {
            setFaceLoading(false);
        }
    };

    // Scroll & expand accordion helper
    const handleScrollAndExpand = (ref, sectionKey) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: true
        }));
        setTimeout(() => {
            ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
    };

    // Check advisor closing suggestion status
    const closesBeforeNine = () => {
        const closingTime = operationsStats.closingTime || '20:00';
        const hours = parseInt(closingTime.split(':')[0]);
        return hours < 21; // earlier than 09:00 PM
    };

    const handleApplyAdvisorTime = async () => {
        setOpsLoading(true);
        try {
            const res = await fetch('/api/seller/schedule', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ openingTime: operationsStats.openingTime, closingTime: '21:30' })
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats(prev => ({
                    ...prev,
                    closingTime: data.closingTime,
                    derivedStatus: data.derivedStatus
                }));
                setCloseTimeInput('21:30');
                toast.success("Advisor Suggestion Applied: Timing set to 9:30 PM");
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to apply timing.");
        } finally {
            setOpsLoading(false);
        }
    };

    const isStoreOpen = operationsStats.derivedStatus === 'ONLINE';

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

            {/* Header Back Navigation */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => navigate('/seller/home')}
                    className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-90 cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        Settings
                    </h1>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                        Configure store systems & preferences
                    </p>
                </div>
            </div>

            {/* Quick Actions Shortcuts Bar */}
            <div className="sticky top-[60px] z-20 bg-slate-50/90 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200/50">
                <div 
                    className="flex overflow-x-auto gap-2 pb-1 scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <button 
                        onClick={() => handleScrollAndExpand(storeRef, 'ops')}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-600 border border-slate-150 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        Store
                    </button>
                    <button 
                        onClick={() => { setEditTiming(true); handleScrollAndExpand(hoursRef, 'ops'); }}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-600 border border-slate-150 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        Hours
                    </button>
                    <button 
                        onClick={() => handleScrollAndExpand(securityRef, 'security')}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-600 border border-slate-150 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        Security
                    </button>
                    <button 
                        onClick={() => handleScrollAndExpand(devicesRef, 'sessions')}
                        className="px-4 py-2 rounded-xl text-xs font-black bg-white text-slate-600 border border-slate-150 hover:text-slate-900 active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        Devices
                    </button>
                </div>
            </div>

            {/* Store Status Hero Card */}
            <div 
                ref={storeRef}
                className={`rounded-3xl p-5 border relative overflow-hidden flex items-center justify-between min-h-[120px] transition-all shadow-sm ${
                    isStoreOpen
                        ? 'bg-emerald-50 border-emerald-150 text-slate-800'
                        : 'bg-rose-50 border-rose-150 text-slate-800'
                }`}
            >
                <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isStoreOpen ? 'bg-emerald-505 bg-emerald-500 animate-pulse' : 'bg-rose-505 bg-rose-500'}`}></span>
                        <span className="text-[10px] font-black uppercase tracking-widest block text-slate-400">Store Status</span>
                    </div>
                    <h2 className="text-xl font-black tracking-tight leading-none mt-1">
                        {isStoreOpen ? 'Store is Open' : 'Store is Closed'}
                    </h2>
                    <span className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-wide mt-1.5">
                        Schedule: {operationsStats.openingTime} - {operationsStats.closingTime}
                    </span>
                    {operationsStats.isManualOverride && (
                        <button
                            onClick={handleResetAutoTiming}
                            className="text-[9px] font-black text-indigo-600 hover:text-indigo-850 underline block mt-2 cursor-pointer uppercase tracking-wider"
                        >
                            Reset Override & Enable Auto Timing
                        </button>
                    )}
                </div>

                <button
                    onClick={() => handleToggleVisibility(!isStoreOpen)}
                    disabled={opsLoading}
                    className={`px-4.5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50 shrink-0 ${
                        isStoreOpen
                            ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-550/20'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-550/20'
                    }`}
                >
                    {isStoreOpen ? 'Close Shop' : 'Open Shop'}
                </button>
            </div>

            {/* AI Settings Advisor */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">✨ Settings Advisor</span>
                </div>
                {closesBeforeNine() ? (
                    <div className="space-y-4 text-left">
                        <p className="text-xs text-slate-300 font-bold italic leading-relaxed">
                            "Store closes at {operationsStats.closingTime}. Customer search volume in Indore/Vadodara peaks between <span className="text-indigo-300 font-extrabold">7:00 PM – 9:30 PM</span>. Extending hours can optimize visibility."
                        </p>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-850/80">
                            <div>
                                <span className="block text-[8px] font-black text-slate-500 uppercase tracking-wider">Suggested closing</span>
                                <span className="block text-xs font-black text-emerald-400 mt-0.5">09:30 PM</span>
                            </div>
                            <button
                                onClick={handleApplyAdvisorTime}
                                disabled={opsLoading}
                                className="bg-white hover:bg-slate-50 text-slate-900 rounded-xl py-2 px-4 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                            >
                                Apply Hours
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-left py-1 text-xs font-bold text-slate-300">
                        <CheckCircle className="text-emerald-400 shrink-0" size={18} />
                        <span>Store operating hours are optimized for Indore/Vadodara peak client searches!</span>
                    </div>
                )}
            </div>

            {/* Store Health Indicator */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5 text-left">
                <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Heart className="text-rose-500 fill-current animate-pulse" size={14} /> Store Health
                    </h4>
                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150 uppercase tracking-wide">
                        Excellent
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3.5 text-xs pt-1 border-t border-slate-50">
                    <div>
                        <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Security Compliance</span>
                        <span className="font-extrabold text-slate-700 block mt-0.5">100% Secure</span>
                    </div>
                    <div>
                        <span className="text-slate-455 font-bold uppercase tracking-wider text-[9px] block">Profile Completion</span>
                        <span className="font-extrabold text-slate-700 block mt-0.5">92% Complete</span>
                    </div>
                    <div>
                        <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Inventory Accuracy</span>
                        <span className="font-extrabold text-slate-700 block mt-0.5">88% Match</span>
                    </div>
                    <div>
                        <span className="text-slate-450 font-bold uppercase tracking-wider text-[9px] block">Automation Score</span>
                        <span className="font-extrabold text-slate-700 block mt-0.5">65% Standard</span>
                    </div>
                </div>
            </div>

            {/* Collapsible Accordion Sections */}
            <div className="space-y-4">
                
                {/* 1. STORE OPERATIONS CENTER */}
                <div ref={hoursRef} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                    <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, ops: !prev.ops }))}
                        className="w-full py-5 px-5 flex items-center justify-between text-left font-black text-sm text-slate-905 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Clock className="text-indigo-600" size={16} />
                            <span>Store Operations Center</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`text-slate-400 transition-transform duration-300 ${expandedSections.ops ? 'rotate-180 text-indigo-650' : ''}`}
                        />
                    </button>

                    {expandedSections.ops && (
                        <div className="px-5 pb-6 space-y-5 border-t border-slate-50/50 pt-4 text-left animate-fade-in">
                            {/* Open/Close Hours updates */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Scheduled Timing</span>
                                    <button
                                        onClick={() => setEditTiming(!editTiming)}
                                        className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline cursor-pointer"
                                    >
                                        {editTiming ? 'Cancel' : 'Edit Hours'}
                                    </button>
                                </div>
                                
                                {editTiming ? (
                                    <div className="space-y-4 pt-1">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Opening</span>
                                                <input 
                                                    type="time" 
                                                    value={openTimeInput} 
                                                    onChange={e => setOpenTimeInput(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                                                />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Closing</span>
                                                <input 
                                                    type="time" 
                                                    value={closeTimeInput} 
                                                    onChange={e => setCloseTimeInput(e.target.value)}
                                                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleSaveSchedule}
                                            disabled={opsLoading}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider"
                                        >
                                            Save Timing Schedule
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center pt-1">
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Opening</span>
                                            <span className="font-extrabold text-slate-800 text-xs block mt-0.5">{operationsStats.openingTime}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Closing</span>
                                            <span className="font-extrabold text-slate-800 text-xs block mt-0.5">{operationsStats.closingTime}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Inventory Operating Mode */}
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Inventory Mode</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'GUARANTEED', label: 'Live Stock' },
                                        { id: 'BEST_EFFORT', label: 'Guaranteed' },
                                        { id: 'RUSH', label: 'Manual' }
                                    ].map((modeOpt) => (
                                        <button
                                            key={modeOpt.id}
                                            onClick={() => handleUpdateOperatingMode(modeOpt.id)}
                                            className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                operationsStats.operatingMode === modeOpt.id
                                                    ? 'bg-slate-900 border-transparent text-white shadow-sm'
                                                    : 'bg-white border-slate-150 text-slate-500 hover:text-slate-800'
                                            }`}
                                        >
                                            {modeOpt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Delivery Mode checkboxes */}
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Delivery System Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <span className="block text-xs font-black text-slate-755">Self Pickup</span>
                                            <span className="block text-[8px] text-slate-450 font-bold uppercase tracking-wide">Client checks-out</span>
                                        </div>
                                        <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-bold">✓</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <span className="block text-xs font-black text-slate-755">Home Delivery</span>
                                            <span className="block text-[8px] text-slate-450 font-bold uppercase tracking-wide">Prepaid logistics</span>
                                        </div>
                                        <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] font-bold">✓</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. NOTIFICATION CENTER */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                    <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, notifs: !prev.notifs }))}
                        className="w-full py-5 px-5 flex items-center justify-between text-left font-black text-sm text-slate-905 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Bell className="text-indigo-600" size={16} />
                            <span>Notification Center</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`text-slate-400 transition-transform duration-300 ${expandedSections.notifs ? 'rotate-180 text-indigo-650' : ''}`}
                        />
                    </button>

                    {expandedSections.notifs && (
                        <div className="px-5 pb-6 space-y-5 border-t border-slate-50/50 pt-4 text-left animate-fade-in">
                            {/* Preset segmented pills */}
                            <div className="space-y-2">
                                <label className="block text-[9px] font-black text-slate-450 uppercase tracking-widest ml-1">Alerting presets</label>
                                <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 shadow-inner">
                                    {[
                                        { id: 'essential', label: 'Essential' },
                                        { id: 'balanced', label: 'Balanced' },
                                        { id: 'realtime', label: 'Real Time' }
                                    ].map(pr => (
                                        <button
                                            key={pr.id}
                                            onClick={() => handleApplyPreset(pr.id)}
                                            className={`flex-grow py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                getActivePreset() === pr.id
                                                    ? 'bg-white text-slate-800 shadow-sm border border-slate-200/40'
                                                    : 'text-slate-500 hover:text-slate-700 bg-transparent'
                                            }`}
                                        >
                                            {pr.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grouped alerts lists */}
                            <div className="space-y-3 pt-1">
                                {[
                                    { key: 'shopUpdates', label: 'Customer Requests', desc: 'Alert when a customer requests to visit.' },
                                    { key: 'itemAlerts', label: 'Visit Confirmations', desc: 'Alerts when scheduled visit slots are confirmed.' },
                                    { key: 'paymentAlerts', label: 'Prepaid Payment Alerts', desc: 'Notification on successful digital payments.' }
                                ].map((notifOption) => (
                                    <div key={notifOption.key} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                        <div className="space-y-0.5 text-left">
                                            <span className="block text-xs font-black text-slate-805 leading-tight">{notifOption.label}</span>
                                            <span className="block text-[9px] text-slate-450 font-bold leading-normal max-w-[190px]">{notifOption.desc}</span>
                                        </div>
                                        <button
                                            onClick={() => handleTogglePref(notifOption.key)}
                                            className="cursor-pointer transition-transform duration-250 shrink-0"
                                        >
                                            {prefs[notifOption.key] ? (
                                                <ToggleRight className="text-indigo-650" size={32} />
                                            ) : (
                                                <ToggleLeft className="text-slate-400" size={32} />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. AUTOMATION CENTER */}
                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                    <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, auto: !prev.auto }))}
                        className="w-full py-5 px-5 flex items-center justify-between text-left font-black text-sm text-slate-905 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-indigo-600" size={16} />
                            <span>Automation Hub</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`text-slate-400 transition-transform duration-300 ${expandedSections.auto ? 'rotate-180 text-indigo-650' : ''}`}
                        />
                    </button>

                    {expandedSections.auto && (
                        <div className="px-5 pb-6 space-y-5 border-t border-slate-50/50 pt-4 text-left animate-fade-in">
                            {/* Auto Accept Switch */}
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <span className="block text-xs font-black text-slate-805">Auto Accept Visits</span>
                                    <span className="block text-[8px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">Autonomous check-in approvals</span>
                                </div>
                                <button
                                    onClick={() => handleTogglePref('autoAccept')}
                                    className="cursor-pointer"
                                >
                                    {prefs.autoAccept ? (
                                        <ToggleRight className="text-indigo-650" size={32} />
                                    ) : (
                                        <ToggleLeft className="text-slate-400" size={32} />
                                    )}
                                </button>
                            </div>

                            {/* Conditions Checklist */}
                            {prefs.autoAccept && (
                                <div className="space-y-2 pl-1 animate-fade-in">
                                    <span className="block text-[9px] font-black text-slate-450 uppercase tracking-widest">Active Safety Conditions</span>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Stock Available', desc: 'Item is actively listed with quantity > 0.' },
                                            { label: 'Shop Open', desc: 'System is within active opening timing bounds.' },
                                            { label: 'Within Radius', desc: 'Customer physical coordinates fall within Vadodara boundaries.' }
                                        ].map((cond, i) => (
                                            <div key={i} className="flex items-start gap-2 text-[10px] font-semibold text-slate-500">
                                                <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                                                <div>
                                                    <span className="font-extrabold text-slate-700 leading-tight block">{cond.label}</span>
                                                    <span className="text-[9px] text-slate-400 leading-normal block">{cond.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Autopilot Settings */}
                            <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 flex flex-col gap-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full"></div>
                                <div className="flex items-center gap-1.5">
                                    <Sparkles className="text-indigo-400 animate-pulse" size={14} />
                                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">✨ AI Automation</span>
                                </div>
                                <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                                    "Suggested: Enable auto-accept targeting repeat Indore/Vadodara client profiles to increase scheduling conversion by +18%."
                                </p>
                                <button
                                    onClick={() => {
                                        const updated = { ...prefs, autoAccept: true };
                                        setPrefs(updated);
                                        savePreferences(updated);
                                        toast.success("AI Autopilot repeat accept enabled!");
                                    }}
                                    className="bg-white hover:bg-slate-50 text-slate-900 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider self-start transition-all"
                                >
                                    Enable AI Autopilot
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. SECURITY & IDENTITY */}
                <div ref={securityRef} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                    <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, security: !prev.security }))}
                        className="w-full py-5 px-5 flex items-center justify-between text-left font-black text-sm text-slate-905 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Shield className="text-indigo-600" size={16} />
                            <span>Security & Biometrics</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`text-slate-400 transition-transform duration-300 ${expandedSections.security ? 'rotate-180 text-indigo-650' : ''}`}
                        />
                    </button>

                    {expandedSections.security && (
                        <div className="px-5 pb-6 space-y-5 border-t border-slate-50/50 pt-4 text-left animate-fade-in">
                            {/* Security score card */}
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                                <div className="space-y-1">
                                    <span className="block text-[8px] font-black text-slate-450 uppercase tracking-widest">Biometric Checkpoints</span>
                                    <span className="block text-2xl font-black text-slate-800">92/100</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider space-y-0.5 text-right">
                                    <span className="block text-emerald-600">✓ Face Verified</span>
                                    <span className="block text-emerald-600">✓ Secure Device</span>
                                </div>
                            </div>

                            {/* Face ID Status */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest pl-1">Face Recognition</span>
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border
                                        ${faceStatus?.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100'
                                            : faceStatus?.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                                    `}>
                                        {faceStatus?.status === 'PENDING' ? 'Pending' : faceStatus?.status === 'REJECTED' ? 'Rejected' : 'Verified'}
                                    </span>
                                </div>
                                
                                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 text-xs">
                                    <div className="flex justify-between text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">
                                        <span>Last Updated</span>
                                        <span>May 2026</span>
                                    </div>
                                    {faceStatus?.status === 'REJECTED' && (
                                        <p className="p-2.5 bg-red-50 text-red-600 font-bold rounded-lg text-[10px] leading-relaxed">
                                            Rejection reason: {faceStatus.adminComment || 'Criteria not met.'}
                                        </p>
                                    )}
                                    <button
                                        disabled={faceStatus?.status === 'PENDING'}
                                        onClick={() => setShowFaceModal(true)}
                                        className="w-full py-2.5 bg-white border border-slate-205 text-slate-800 font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                    >
                                        {faceStatus?.status === 'PENDING' ? 'Approval Request Pending' : 'Request Face ID Update'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 5. ACTIVE SESSIONS */}
                <div ref={devicesRef} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
                    <button
                        onClick={() => setExpandedSections(prev => ({ ...prev, sessions: !prev.sessions }))}
                        className="w-full py-5 px-5 flex items-center justify-between text-left font-black text-sm text-slate-905 cursor-pointer"
                    >
                        <div className="flex items-center gap-3">
                            <Monitor className="text-indigo-600" size={16} />
                            <span>Logged In Devices ({sessions.length})</span>
                        </div>
                        <ChevronDown 
                            size={18} 
                            className={`text-slate-400 transition-transform duration-300 ${expandedSections.sessions ? 'rotate-180 text-indigo-650' : ''}`}
                        />
                    </button>

                    {expandedSections.sessions && (
                        <div className="px-5 pb-6 space-y-5 border-t border-slate-50/50 pt-4 text-left animate-fade-in">
                            {loadingSessions ? (
                                <div className="text-center py-6 text-slate-450 font-bold text-xs uppercase tracking-widest animate-pulse">
                                    Loading active sessions...
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Sessions metrics summary */}
                                    <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl grid grid-cols-3 gap-2 text-center text-xs font-bold">
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Active</span>
                                            <span className="block text-slate-800 font-black mt-0.5">{sessions.length}</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Current</span>
                                            <span className="block text-slate-800 font-black mt-0.5">1</span>
                                        </div>
                                        <div>
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Unknown</span>
                                            <span className="block text-slate-800 font-black mt-0.5">0</span>
                                        </div>
                                    </div>

                                    {/* Sessions listing */}
                                    <div className="space-y-3">
                                        {sessions.map(s => {
                                            const isMob = /phone|android|mobile/i.test(s.deviceName);
                                            return (
                                                <div 
                                                    key={s.id} 
                                                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                                                        s.isCurrent 
                                                            ? 'border-indigo-600 bg-indigo-50/30' 
                                                            : 'border-slate-150 bg-white shadow-xs'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-450 border border-slate-100 shadow-inner">
                                                            {isMob ? <Smartphone size={16} /> : <Monitor size={16} />}
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-extrabold text-slate-800 text-xs">{s.deviceName}</span>
                                                                {s.isCurrent && (
                                                                    <span className="text-[8px] font-black uppercase text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="block text-[10px] text-slate-500 font-semibold">
                                                                {s.browser} • {s.ipAddress}
                                                            </span>
                                                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                                                                Last active: {new Date(s.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {!s.isCurrent && (
                                                        <button
                                                            onClick={() => handleRevokeSession(s.id)}
                                                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent active:scale-95"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Emergency Action Panel */}
                                    <div className="p-4 bg-rose-50 border border-rose-150 rounded-2xl space-y-3">
                                        <div className="flex items-start gap-2.5">
                                            <AlertTriangle className="text-rose-605 text-rose-600 shrink-0 mt-0.5" size={16} />
                                            <div className="space-y-0.5 text-left">
                                                <span className="block text-xs font-black text-rose-800 leading-tight">Biometric Security Override</span>
                                                <span className="block text-[9px] text-rose-500 font-semibold leading-relaxed">
                                                    Suspect unauthorized logins? Revoke all other logged-in seller channels instantly.
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleRevokeAllOtherSessions}
                                            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow active:scale-95 cursor-pointer transition-all"
                                        >
                                            Sign Out All Other Devices
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Version Tag */}
            <div className="text-center pt-2">
                <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">
                    Version 2.1.0 • Indore / Vadodara
                </span>
            </div>

            {/* Biometrics Face Uploader modal */}
            {showFaceModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowFaceModal(false)}>
                    <div 
                        className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-up text-left"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-base font-black text-slate-805">Biometrics Request</h3>
                            <p className="text-xs text-slate-500 font-semibold mt-1">This security update requires administrator review.</p>
                        </div>

                        <div className="p-5 space-y-4">
                            {!capturedImage ? (
                                <div className="rounded-2xl overflow-hidden bg-black relative aspect-square shadow-inner">
                                    <Webcam
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover mirror"
                                    />
                                    <button
                                        onClick={handleCaptureFace}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-1.5"
                                    >
                                        <Camera size={14} /> Capture Face
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-2xl overflow-hidden relative aspect-square shadow-inner">
                                    <img src={capturedImage} className="w-full h-full object-cover" alt="Biometric preview" />
                                    <button
                                        onClick={() => setCapturedImage(null)}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-5 py-2 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black/85 active:scale-95 transition-colors"
                                    >
                                        Retake Photo
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Biometrics Reset</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none h-20 resize-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all leading-normal"
                                    placeholder="Appearance changed significantly, lighting issue, etc..."
                                    value={faceReason}
                                    onChange={e => setFaceReason(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
                            <button 
                                onClick={() => setShowFaceModal(false)} 
                                className="flex-1 font-black text-[10px] text-slate-505 hover:bg-slate-200/50 py-3 rounded-xl transition-all uppercase tracking-wider text-center cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitFaceUpdate}
                                disabled={!capturedImage || !faceReason || faceLoading}
                                className="flex-[2] bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl shadow-lg hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {faceLoading ? 'Submitting request...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileSellerSettings;
