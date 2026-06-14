import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaBell, FaHistory, FaCreditCard, FaShieldAlt, FaCog,
    FaToggleOn, FaToggleOff, FaCheck, FaSave, FaLaptop, FaMobileAlt, FaTrash
} from 'react-icons/fa';
import axios from 'axios';

const CustomerSettings = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('notifications');
    const [loading, setLoading] = useState(false);

    // --- State Management ---
    const [preferences, setPreferences] = useState({
        // Notifications (Auto-save)
        notifications: {
            orderUpdates: true,
            visitReminders: true,
            announcements: true,
            newShops: false
        },
        // Visits (Manual Save)
        visits: {
            checkoutPref: 'ask', // 'ask' | 'visit' | 'online'
            explainMissed: true,
            remind30: true
        },
        // Privacy (Manual Save)
        privacy: {
            shareConfirmation: true,
            showVerifiedBadge: true,
            allowAnalytics: false
        },
        // App (Auto/Manual hybrid, treating as manual for now for consistency or auto for simple things)
        app: {
            language: 'English',
            locationAccess: true,
            theme: 'System'
        }
    });

    // --- Actions ---

    // Auto-save handler for Toggles (Notifications)
    const toggleNotification = (key) => {
        setPreferences(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
        // Mock Auto-save API call
        console.log(`Auto-saved notification: ${key}`);
    };

    // Manual Save Handler
    const handleSave = (section) => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            // Show toast or success indicator logic here
            alert(`${section} settings saved!`);
        }, 800);
    };

    const updateNested = (section, key, value) => {
        setPreferences(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    // --- Render Components ---

    const renderContent = () => {
        switch (activeTab) {
            case 'notifications':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Notifications</h2>
                            <p className="text-sm text-slate-500 mb-6">Manage how Aisle communicates with you. Changes save automatically.</p>

                            <div className="space-y-1">
                                <ToggleRow
                                    label="Order & Visit Updates"
                                    desc="Get real-time alerts for confirmations and status changes."
                                    checked={preferences.notifications.orderUpdates}
                                    onChange={() => toggleNotification('orderUpdates')}
                                />
                                <ToggleRow
                                    label="Visit Reminders"
                                    desc="Receive a nudge before your scheduled visit time."
                                    checked={preferences.notifications.visitReminders}
                                    onChange={() => toggleNotification('visitReminders')}
                                />
                                <ToggleRow
                                    label="Announcements"
                                    desc="Occasional updates about new features or critical alerts."
                                    checked={preferences.notifications.announcements}
                                    onChange={() => toggleNotification('announcements')}
                                />
                                <ToggleRow
                                    label="New Shops Nearby"
                                    desc=" get notified when a new shop joins your area."
                                    checked={preferences.notifications.newShops}
                                    onChange={() => toggleNotification('newShops')}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'visits':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Visits & Orders</h2>
                            <p className="text-sm text-slate-500 mb-6">Customize your interaction with shops and checkout flow.</p>

                            <div className="space-y-8">
                                {/* Checkout Pref */}
                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Default Checkout Preference</h3>
                                    <div className="space-y-3">
                                        <RadioOption
                                            label="Ask me every time"
                                            selected={preferences.visits.checkoutPref === 'ask'}
                                            onClick={() => updateNested('visits', 'checkoutPref', 'ask')}
                                        />
                                        <RadioOption
                                            label="Pay on Visit (Preferred)"
                                            selected={preferences.visits.checkoutPref === 'visit'}
                                            onClick={() => updateNested('visits', 'checkoutPref', 'visit')}
                                        />
                                        <RadioOption
                                            label="Pay Now (Online)"
                                            selected={preferences.visits.checkoutPref === 'online'}
                                            onClick={() => updateNested('visits', 'checkoutPref', 'online')}
                                        />
                                    </div>
                                </section>

                                {/* No-Show Handling */}
                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">No-Show Handling</h3>
                                    <div className="space-y-4">
                                        <CheckboxRow
                                            label="Allow explanation for missed visits"
                                            checked={preferences.visits.explainMissed}
                                            onChange={() => updateNested('visits', 'explainMissed', !preferences.visits.explainMissed)}
                                        />
                                        <CheckboxRow
                                            label="Remind me 30 min before visit"
                                            checked={preferences.visits.remind30}
                                            onChange={() => updateNested('visits', 'remind30', !preferences.visits.remind30)}
                                        />
                                    </div>
                                </section>
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-100">
                                <SaveButton onClick={() => handleSave('Visits')} loading={loading} />
                            </div>
                        </div>
                    </div>
                );

            case 'payments':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Payments</h2>
                            <p className="text-sm text-slate-500 mb-6">Manage your payment methods and billing preferences.</p>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-center mb-6">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-slate-300">
                                    <FaCreditCard />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900">No Payment Methods Saved</h3>
                                <p className="text-xs text-slate-500 mt-1 mb-4">You haven't added any cards or wallets yet.</p>
                                <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50">
                                    Add Payment Method
                                </button>
                            </div>

                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Preferred Method</h3>
                                <div className="space-y-3">
                                    <RadioOption
                                        label="Pay on Visit (Cash/UPI at Shop)"
                                        selected={true}
                                        onClick={() => { }}
                                    />
                                    <RadioOption
                                        label="Online Payment"
                                        selected={false}
                                        onClick={() => { }}
                                    />
                                </div>
                            </section>
                        </div>
                    </div>
                );

            case 'privacy':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">Privacy & Data</h2>
                            <p className="text-sm text-slate-500 mb-6">Control what information is shared and visible.</p>

                            <div className="space-y-4">
                                <CheckboxRow
                                    label="Share visit confirmation with seller"
                                    checked={preferences.privacy.shareConfirmation}
                                    onChange={() => updateNested('privacy', 'shareConfirmation', !preferences.privacy.shareConfirmation)}
                                />
                                <CheckboxRow
                                    label="Show verified badge on my profile"
                                    checked={preferences.privacy.showVerifiedBadge}
                                    onChange={() => updateNested('privacy', 'showVerifiedBadge', !preferences.privacy.showVerifiedBadge)}
                                />
                                <CheckboxRow
                                    label="Allow analytics for app improvement"
                                    checked={preferences.privacy.allowAnalytics}
                                    onChange={() => updateNested('privacy', 'allowAnalytics', !preferences.privacy.allowAnalytics)}
                                />
                            </div>

                            <div className="pt-6 mt-6 border-t border-slate-100">
                                <SaveButton onClick={() => handleSave('Privacy')} loading={loading} />
                            </div>
                        </div>
                    </div>
                );

            case 'app':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 mb-2">App Preferences</h2>
                            <p className="text-sm text-slate-500 mb-6">Customize the look and feel of Aisle.</p>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Language</label>
                                    <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-900">
                                        <option>English</option>
                                        <option>Hindi (Coming Soon)</option>
                                    </select>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Location Access</p>
                                            <p className="text-xs text-slate-500">Needed for "Nearby Shops"</p>
                                        </div>
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Always Allow</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Theme</p>
                                            <p className="text-xs text-slate-500">Appearance preference</p>
                                        </div>
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">System Default</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'sessions':
                return <SessionsPanel />;

            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-[var(--page-bg)] pt-32 pb-24 font-sans text-[var(--text-primary)] px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-black text-[var(--text-primary)] mb-2 tracking-tight uppercase">Settings</h1>
                <p className="text-[var(--text-secondary)] font-black uppercase tracking-widest text-xs mb-10 opacity-70">Manage how Aisle works for you.</p>

                <div className="flex flex-col md:flex-row gap-10 items-start">

                    {/* LEFT MENU */}
                    <div className="w-full md:w-72 shrink-0">
                        <div className="bg-[var(--card-bg)] rounded-[20px] shadow-standard border border-black/5 overflow-hidden sticky top-32">
                            <MenuButton
                                id="notifications"
                                active={activeTab}
                                onClick={setActiveTab}
                                label="Notifications"
                                icon={<FaBell />}
                            />
                            <MenuButton
                                id="visits"
                                active={activeTab}
                                onClick={setActiveTab}
                                label="Visits & Orders"
                                icon={<FaHistory />}
                            />
                            <MenuButton
                                id="payments"
                                active={activeTab}
                                onClick={setActiveTab}
                                label="Payments"
                                icon={<FaCreditCard />}
                            />
                            <MenuButton
                                id="privacy"
                                active={activeTab}
                                onClick={setActiveTab}
                                label="Privacy"
                                icon={<FaShieldAlt />}
                            />
                            <MenuButton
                                id="sessions"
                                active={activeTab}
                                onClick={setActiveTab}
                                label="Active Sessions"
                                icon={<FaShieldAlt />}
                            />
                            <MenuButton
                                id="app"
                                active={activeTab}
                                onClick={setActiveTab}
                                label="App Preferences"
                                icon={<FaCog />}
                            />
                        </div>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="flex-1 w-full bg-[var(--card-bg)] rounded-[24px] shadow-standard border border-black/5 p-10 min-h-[500px]">
                        {renderContent()}
                    </div>

                </div>
            </div>
        </div>
    );
};

// --- Reusable UI Components ---

const MenuButton = ({ id, active, onClick, label, icon }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-4 px-8 py-5 text-xs font-black transition-all border-r-4 uppercase tracking-widest
            ${active === id
                ? 'border-[var(--accent-orange)] bg-black/5 text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5'
            }`}
    >
        <span className={`text-lg transition-transform ${active === id ? 'scale-110 text-[var(--accent-orange)]' : 'opacity-40'}`}>{icon}</span>
        {label}
    </button>
);

const ToggleRow = ({ label, desc, checked, onChange }) => (
    <div className="flex items-center justify-between py-5 border-b border-black/5 last:border-0 hover:bg-black/5 transition-colors px-4 rounded-2xl -mx-4">
        <div>
            <p className="font-black text-[var(--text-primary)] text-sm uppercase tracking-tight">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest mt-0.5">{desc}</p>
        </div>
        <button
            onClick={onChange}
            className={`w-14 h-7 rounded-full relative transition-all duration-300 shadow-inner ${checked ? 'bg-[var(--accent-green)]' : 'bg-black/10'}`}
        >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 transform ${checked ? 'translate-x-8' : 'translate-x-1'}`}></div>
        </button>
    </div>
);

const CheckboxRow = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-4 cursor-pointer group py-2">
        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-inner ${checked ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white' : 'bg-black/5 border-black/10 group-hover:border-black/20'}`}>
            {checked && <FaCheck size={12} />}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
        <span className="text-sm font-black text-[var(--text-secondary)] uppercase tracking-tight group-hover:text-[var(--text-primary)] transition-colors">{label}</span>
    </label>
);

const RadioOption = ({ label, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left group ${selected ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/5' : 'border-black/5 bg-black/5 hover:border-black/10'}`}
    >
        <div className={`w-5 h-5 rounded-full border-4 transition-all ${selected ? 'border-[var(--accent-orange)] bg-white scale-110' : 'border-black/20 bg-white'}`}></div>
        <span className={`text-sm font-black uppercase tracking-tight ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`}>{label}</span>
    </button>
);

const SaveButton = ({ onClick, loading }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="px-8 py-4 bg-[var(--accent-orange)] text-black font-black rounded-2xl hover:bg-black hover:text-white transition-all shadow-xl flex items-center gap-3 text-xs ml-auto uppercase tracking-widest active:scale-95 disabled:opacity-50"
    >
        {loading ? 'Saving...' : <><FaSave /> Save Preferences</>}
    </button>
);

const SessionsPanel = () => {
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

    const handleRevoke = async (sessionId) => {
        if (!window.confirm("Are you sure you want to log out this device?")) return;
        try {
            await axios.post('/api/auth/sessions/revoke', { sessionId });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to revoke session");
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    if (loadingSessions) {
        return <div className="text-slate-500 text-sm font-bold uppercase tracking-widest animate-pulse">Loading active sessions...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Active Sessions</h2>
                <p className="text-sm text-slate-500 mb-6">Manage all devices currently logged in to your account. You can revoke access for any session.</p>

                <div className="space-y-4">
                    {sessions.map(s => {
                        const isMobile = /phone|android|mobile/i.test(s.deviceName);
                        return (
                            <div key={s.id} className={`flex items-center justify-between p-6 rounded-2xl border transition-all ${s.isCurrent ? 'border-[var(--accent-orange)] bg-[var(--accent-orange)]/5' : 'border-black/5 bg-black/5 hover:border-black/10'}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-xl text-slate-600">
                                        {isMobile ? <FaMobileAlt /> : <FaLaptop />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-slate-900 text-sm">{s.deviceName}</p>
                                            {s.isCurrent && (
                                                <span className="text-[9px] font-black uppercase tracking-wider text-[var(--accent-orange)] bg-[var(--accent-orange)]/10 px-2 py-0.5 rounded-full border border-[var(--accent-orange)]/20">
                                                    Current Device
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {s.browser} • {s.ipAddress}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                                            Last active: {new Date(s.lastSeen).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                
                                {!s.isCurrent && (
                                    <button
                                        onClick={() => handleRevoke(s.id)}
                                        className="p-3 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-red-100 hover:border-red-500 shadow-sm"
                                        title="Revoke session"
                                    >
                                        <FaTrash />
                                    </button>
                                )}
                            </div>
                        );
                    })}

                    {sessions.length === 0 && (
                        <div className="text-center py-10 text-slate-500 font-bold uppercase tracking-widest text-xs">
                            No active sessions found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerSettings;
