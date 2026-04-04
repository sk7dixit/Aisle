import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaBell, FaRobot, FaShieldAlt, FaExclamationTriangle, FaCheckCircle,
    FaClock, FaSave, FaUserShield, FaCamera
} from 'react-icons/fa';
import Webcam from 'react-webcam';

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

    useEffect(() => {
        if (user) {
            setPrefs({
                shopUpdates: user.notificationPreferences?.shopUpdates ?? true,
                itemAlerts: user.notificationPreferences?.itemAlerts ?? true,
                paymentAlerts: user.notificationPreferences?.paymentAlerts ?? true,
                autoAccept: user.shopDetails?.autoAccept || false
            });
        }
        fetchFaceStatus();
    }, [user]);

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
        const imageSrc = webcamRef.current.getScreenshot();
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
                                        className="w-full h-full object-cover"
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
