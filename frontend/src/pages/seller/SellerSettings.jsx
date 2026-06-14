import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaBell, FaRobot, FaShieldAlt, FaExclamationTriangle, FaCheckCircle,
    FaClock, FaSave, FaUserShield, FaCamera, FaLaptop, FaMobileAlt, FaTrash,
    FaStore, FaSpinner
} from 'react-icons/fa';
import Webcam from 'react-webcam';
import axios from 'axios';

const SellerSettings = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);

    // Preferences State
    const [prefs, setPrefs] = useState({
        shopUpdates: true,
        itemAlerts: true,
        paymentAlerts: true,
        autoAccept: false
    });

    // Face Update State
    const [faceStatus, setFaceStatus] = useState(null); // { status: 'PENDING' | 'REJECTED' }
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [reason, setReason] = useState('');
    const webcamRef = React.useRef(null);

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
                showStatus(`Timing updated to: ${data.openingTime} - ${data.closingTime}`, "success");
                setEditTiming(false);
            }
        } catch (err) {
            console.error(err);
            showStatus("Failed to update timing schedule.", "error");
        } finally {
            setOpsLoading(false);
        }
    };

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
                showStatus(`Shop manually set to ${isVisible ? 'OPEN' : 'CLOSED'}`, "success");
            }
        } catch (err) {
            console.error(err);
            showStatus("Error updating visibility.", "error");
        } finally {
            setOpsLoading(false);
        }
    };

    const handleResetAutoTiming = async () => {
        setOpsLoading(true);
        try {
            const res = await fetch('/api/seller/reset-status', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setOperationsStats(prev => ({
                    ...prev,
                    derivedStatus: data.derivedStatus,
                    isManualOverride: data.isManualOverride
                }));
                showStatus("Automatic timing schedule activated.", "success");
            }
        } catch (err) {
            console.error(err);
            showStatus("Error resetting timing.", "error");
        } finally {
            setOpsLoading(false);
        }
    };

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
                showStatus(`Availability System set to: ${
                    mode === 'GUARANTEED' ? 'Live Inventory' :
                    mode === 'BEST_EFFORT' ? 'Verified Availability' : 'Check Before Visit'
                }`, "success");
            }
        } catch (err) {
            console.error("Failed to update operating mode:", err);
            showStatus("Failed to update operating mode.", "error");
        } finally {
            setOpsLoading(false);
        }
    };

    // Sessions State
    const [sessions, setSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);

    const fetchSessions = async () => {
        try {
            const currentDeviceId = localStorage.getItem('aisleDeviceId');
            const res = await axios.get(`/api/auth/sessions?deviceId=${currentDeviceId}`);
            setSessions(res.data);
        } catch (err) {
            console.error("Failed to load sessions", err);
        } finally {
            setLoadingSessions(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        if (!window.confirm("Are you sure you want to log out this device?")) return;
        try {
            await axios.post('/api/auth/sessions/revoke', { sessionId });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            showStatus(err.response?.data?.message || "Failed to log out device", "error");
        }
    };

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
            console.error("Failed to fetch face status");
        }
    };

    const handleToggle = (key) => {
        setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
        // Auto-save logic
        savePreferences({ ...prefs, [key]: !prefs[key] });
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
        } catch (error) {
            console.error("Save failed", error);
        }
    };

    const captureService = () => {
        let imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc || imageSrc === 'data:,' || imageSrc.length < 100) {
            console.warn("Webcam capture returned empty/invalid image.");
            if (import.meta.env.DEV) {
                imageSrc = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                console.log("[Dev Mode] Using fallback mockup image: ", imageSrc);
            } else {
                showStatus("Could not capture image. Please verify camera permission.", "error");
                return;
            }
        }
        setCapturedImage(imageSrc);
    };

    // Status Message State
    const [statusMsg, setStatusMsg] = useState(null); // { text, type }

    const showStatus = (text, type = 'success') => {
        setStatusMsg({ text, type });
        setTimeout(() => setStatusMsg(null), 5000);
    };

    const submitFaceUpdate = async () => {
        if (!capturedImage || !reason) return;
        setLoading(true);
        try {
            const res = await fetch('/api/seller/face-update-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newFaceData: capturedImage, reason })
            });

            if (res.ok) {
                showStatus("Face Update Requested. Waiting for Admin Approval.", "success");
                setShowFaceModal(false);
                setCapturedImage(null);
                setReason('');
                fetchFaceStatus();
            } else {
                const d = await res.json();
                showStatus(d.message || "Request Failed", "error");
            }
        } catch (error) {
            showStatus("Request Failed", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-24 animate-fade-in-up space-y-8 relative">
            {/* Status Toast */}
            {statusMsg && (
                <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl font-bold text-sm animate-fade-in-down flex items-center gap-3 backdrop-blur-md border border-white/20
                    ${statusMsg.type === 'error' ? 'bg-red-500/90 text-white shadow-red-500/30' : 'bg-emerald-600/90 text-white shadow-emerald-500/30'}
                `}>
                    {statusMsg.type === 'error' ? <FaExclamationTriangle /> : <FaCheckCircle />}
                    {statusMsg.text}
                </div>
            )}

            <header className="mb-6">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h1>
                <p className="text-sm text-slate-500 font-medium">Manage preferences, security, and automated behaviors.</p>
            </header>

            {/* STORE OPERATIONS CENTER */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
                            <FaStore />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">Store Operations Center</h2>
                            <p className="text-sm text-slate-500 font-medium">Configure storefront settings, timing schedules, and inventory availability modes.</p>
                        </div>
                    </div>
                    <div>
                        {operationsStats.derivedStatus === 'ONLINE' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                STORE OPEN
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 border border-rose-500/20">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                STORE CLOSED
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 1. Inventory Mode */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Inventory Mode</span>
                            <p className="text-xs font-bold text-slate-850 dark:text-neutral-200 mt-1.5">
                                {operationsStats.operatingMode === 'GUARANTEED' && '🟢 Live Inventory'}
                                {operationsStats.operatingMode === 'BEST_EFFORT' && '🔵 Verified Availability'}
                                {operationsStats.operatingMode === 'RUSH' && '🟡 Check Before Visit'}
                            </p>
                        </div>
                        <div className="mt-4">
                            <select
                                disabled={opsLoading}
                                value={operationsStats.operatingMode || 'GUARANTEED'}
                                onChange={(e) => handleUpdateOperatingMode(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-650 focus:outline-none disabled:opacity-50 text-xs font-bold"
                            >
                                <option value="GUARANTEED">Live Inventory</option>
                                <option value="BEST_EFFORT">Verified Availability</option>
                                <option value="RUSH">Check Before Visit</option>
                            </select>
                        </div>
                    </div>

                    {/* 2. Auto Timing Schedule */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Auto Timing Settings</span>
                            <p className="text-xs font-bold text-slate-850 dark:text-neutral-200 mt-1.5 leading-normal">
                                {operationsStats.isManualOverride 
                                    ? '🔴 Disabled (Manual Override)' 
                                    : `🟢 Enabled (${operationsStats.openingTime || '09:00'} - ${operationsStats.closingTime || '20:00'})`}
                            </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {operationsStats.isManualOverride ? (
                                <button
                                    disabled={opsLoading}
                                    onClick={handleResetAutoTiming}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
                                >
                                    Enable Auto
                                </button>
                            ) : (
                                <button
                                    disabled={opsLoading}
                                    onClick={() => handleToggleVisibility(false)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm"
                                >
                                    Force Close
                                </button>
                            )}
                            <button
                                disabled={opsLoading}
                                onClick={() => setEditTiming(!editTiming)}
                                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-sm font-bold"
                            >
                                {editTiming ? 'Cancel' : 'Edit Timings'}
                            </button>
                        </div>
                    </div>

                    {/* 3. Delivery Mode */}
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">Delivery System Mode</span>
                            <p className="text-xs font-bold text-slate-850 dark:text-neutral-200 mt-1.5">
                                Self Pickup & Home Delivery
                            </p>
                        </div>
                        <div className="mt-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                ACTIVE DELIVERY
                            </span>
                        </div>
                    </div>
                </div>

                {editTiming && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4 animate-scale-up">
                        <div className="flex items-center gap-3">
                            <FaClock className="text-slate-400 text-sm" />
                            <div className="flex items-center gap-2 text-xs font-bold">
                                <span>Open:</span>
                                <input 
                                    type="text" 
                                    value={openTimeInput} 
                                    onChange={(e) => setOpenTimeInput(e.target.value)} 
                                    className="w-16 px-2.5 py-1 border border-slate-200 rounded-lg text-center" 
                                />
                                <span className="ml-2">Close:</span>
                                <input 
                                    type="text" 
                                    value={closeTimeInput} 
                                    onChange={(e) => setCloseTimeInput(e.target.value)} 
                                    className="w-16 px-2.5 py-1 border border-slate-200 rounded-lg text-center" 
                                />
                            </div>
                        </div>
                        <button 
                            disabled={opsLoading}
                            onClick={handleSaveSchedule} 
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow"
                        >
                            Save Timings
                        </button>
                    </div>
                )}
            </section>

            {/* 1. NOTIFICATIONS */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-lg">
                        <FaBell />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Notifications</h2>
                        <p className="text-sm text-slate-500">Manage how and when you want to be alerted.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        { key: 'shopUpdates', label: 'New Customer Requests', desc: 'Get notified when a customer wants to visit.' },
                        { key: 'itemAlerts', label: 'Visit Scheduled', desc: 'Alerts when a visit slot is confirmed.' },
                        { key: 'paymentAlerts', label: 'Payment Confirmation', desc: 'Notify when payment is successful.' }
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-700">{item.label}</h4>
                                <p className="text-xs text-slate-400">{item.desc}</p>
                            </div>
                            <div className="relative inline-block w-12 align-middle select-none">
                                <input
                                    type="checkbox"
                                    checked={prefs[item.key]}
                                    onChange={() => handleToggle(item.key)}
                                    className="peer appearance-none w-12 h-6 bg-slate-200 rounded-full cursor-pointer checked:bg-amber-500 transition-colors"
                                />
                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. SHOP BEHAVIOR */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-lg">
                        <FaRobot />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Shop Behavior</h2>
                        <p className="text-sm text-slate-500">Automate actions when you are busy.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors">
                        <div>
                            <h4 className="font-bold text-slate-700">Auto-Accept Requests</h4>
                            <p className="text-xs text-slate-400">Automatically accept visits if stock is available.</p>
                        </div>
                        <div className="relative inline-block w-12 align-middle select-none">
                            <input
                                type="checkbox"
                                checked={prefs.autoAccept}
                                onChange={() => handleToggle('autoAccept')}
                                className="peer appearance-none w-12 h-6 bg-slate-200 rounded-full cursor-pointer checked:bg-indigo-500 transition-colors"
                            />
                            <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-6"></span>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. SECURITY & IDENTITY */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-lg">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Security & Identity</h2>
                        <p className="text-sm text-slate-500">Manage biometric security and access.</p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <FaUserShield /> Face Authentication
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1
                            ${faceStatus?.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                                : faceStatus?.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                                    : 'bg-emerald-100 text-emerald-700'}
                        `}>
                            {faceStatus?.status === 'PENDING' ? <><FaClock /> Pending Approval</>
                                : faceStatus?.status === 'REJECTED' ? <><FaExclamationTriangle /> Request Rejected</>
                                    : <><FaCheckCircle /> Active (Verified)</>}
                        </span>
                    </div>

                    <p className="text-sm text-slate-500 mb-6">
                        Your face ID is used for secure login. To change it, you must submit a request for admin approval.
                    </p>

                    {faceStatus?.status === 'REJECTED' && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100">
                            Reason: {faceStatus.adminComment || 'Not specified'}
                        </div>
                    )}

                    <button
                        onClick={() => setShowFaceModal(true)}
                        disabled={faceStatus?.status === 'PENDING'}
                        className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {faceStatus?.status === 'PENDING' ? 'Update Request Sent' : 'Request Face Update'}
                    </button>
                </div>
            </section>

            {/* 4. ACTIVE SESSIONS */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-lg">
                        <FaShieldAlt />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Active Sessions</h2>
                        <p className="text-sm text-slate-500">Manage all devices logged in to your seller portal.</p>
                    </div>
                </div>

                {loadingSessions ? (
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Loading active sessions...</div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map(s => {
                            const isMobile = /phone|android|mobile/i.test(s.deviceName);
                            return (
                                <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${s.isCurrent ? 'border-amber-500 bg-amber-500/5' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm text-lg text-slate-500">
                                            {isMobile ? <FaMobileAlt /> : <FaLaptop />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-700 text-sm">{s.deviceName}</span>
                                                {s.isCurrent && (
                                                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                                        Current Device
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {s.browser} • {s.ipAddress} • Last active: {new Date(s.lastSeen).toLocaleTimeString()}
                                            </p>
                                        </div>
                                    </div>

                                    {!s.isCurrent && (
                                        <button
                                            onClick={() => handleRevokeSession(s.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 hover:text-white rounded-lg transition-colors border border-transparent hover:border-red-100"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* FACE UPDATE MODAL */}
            {showFaceModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-up">
                        <div className="p-6 border-b border-slate-100">
                            <h3 className="text-xl font-black text-slate-800">Request Face Update</h3>
                            <p className="text-sm text-slate-500">This action requires admin approval.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {!capturedImage ? (
                                <div className="rounded-2xl overflow-hidden bg-black relative aspect-square">
                                    <Webcam
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        className="w-full h-full object-cover mirror"
                                    />
                                    <button
                                        onClick={captureService}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                                    >
                                        <FaCamera /> Capture
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-2xl overflow-hidden relative aspect-square">
                                    <img src={capturedImage} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => setCapturedImage(null)}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full font-bold backdrop-blur hover:bg-black/70 transition-colors"
                                    >
                                        Retake
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Reason for Update</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-400"
                                    placeholder="e.g., Appearance changed significantly..."
                                    rows="2"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button onClick={() => setShowFaceModal(false)} className="flex-1 font-bold text-slate-500 hover:bg-slate-200 py-3 rounded-xl transition-colors">Cancel</button>
                            <button
                                onClick={submitFaceUpdate}
                                disabled={!capturedImage || !reason || loading}
                                className="flex-[2] bg-slate-900 text-white font-bold py-3 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerSettings;
