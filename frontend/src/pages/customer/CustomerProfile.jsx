import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUserCircle, FaShieldAlt, FaPen, FaCheckCircle, FaEnvelope, FaPhone, FaCalendarAlt, FaIdCard, FaLock, FaExclamationCircle, FaSave, FaTimes } from 'react-icons/fa';

const CustomerProfile = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State for Edit Mode
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        setLoading(true);
        // Mock Save
        setTimeout(() => {
            if (formData.email !== user.email) {
                alert(`Verification link sent to ${formData.email}.`);
            }
            setLoading(false);
            setIsEditing(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[var(--page-bg)] pt-32 pb-24 font-sans text-[var(--text-primary)] px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-black text-[var(--text-primary)] mb-10 tracking-tight uppercase">My Profile</h1>

                <div className="flex flex-col md:flex-row gap-10 items-start">

                    {/* ❹ LEFT PANEL — Identity Card */}
                    <div className="w-full md:w-[320px] shrink-0">
                        <div className="bg-[var(--card-bg)] rounded-[20px] shadow-standard border border-black/5 overflow-hidden sticky top-32">
                            {/* Environment Header */}
                            <div className="h-32 bg-[var(--env-bg)] relative">
                                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            </div>

                            <div className="px-8 pb-10 text-center -mt-16">
                                {/* Avatar */}
                                <div className="relative inline-block">
                                    <div className="w-32 h-32 rounded-full border-4 border-[var(--card-bg)] shadow-2xl bg-black/5 flex items-center justify-center text-5xl text-[var(--text-muted)] overflow-hidden">
                                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : <FaUserCircle />}
                                    </div>
                                    <div className="absolute bottom-2 right-2 w-9 h-9 bg-[var(--accent-green)] border-4 border-[var(--card-bg)] rounded-full flex items-center justify-center text-white text-xs shadow-md">
                                        <FaCheckCircle />
                                    </div>
                                </div>

                                <div className="mt-5 space-y-1">
                                    <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase">{formData.name || 'User Name'}</h2>
                                    <p className="text-sm font-black text-[var(--text-muted)] uppercase tracking-wider">{formData.email || 'user@example.com'}</p>
                                </div>

                                <div className="mt-8">
                                    <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                                        <FaShieldAlt /> Verified Identity
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ❺ RIGHT PANEL — Details & Controls */}
                    <div className="flex-1 w-full bg-[var(--card-bg)] rounded-[24px] shadow-standard border border-black/5 overflow-hidden min-h-[500px]">

                        {/* Section 1: Account Information */}
                        <div className="p-10 border-b border-black/5">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8">Account Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <InfoItem label="Member Since" value="Jan 2024" icon={<FaCalendarAlt />} />
                                <InfoItem label="Customer ID" value="CUST-88392" icon={<FaIdCard />} mono />
                                <InfoItem label="Account Status" value="Active" icon={<FaCheckCircle />} status="success" />
                            </div>
                        </div>

                        {/* Section 2: Contact Information */}
                        <div className="p-10 border-b border-black/5">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Contact Information</h3>
                                {!isEditing && (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-[10px] font-black text-[var(--text-primary)] hover:bg-black/5 flex items-center gap-2 px-4 py-2 border border-black/10 rounded-xl transition-all uppercase tracking-widest active:scale-95"
                                    >
                                        <FaPen size={10} /> Edit Details
                                    </button>
                                )}
                            </div>

                            {!isEditing ? (
                                <div className="space-y-8">
                                    <DisplayRow label="Full Name" value={formData.name} icon={<FaUserCircle />} />
                                    <DisplayRow label="Email Address" value={formData.email} icon={<FaEnvelope />} verified />
                                    <DisplayRow label="Phone Number" value={formData.phone || 'Not set'} icon={<FaPhone />} />
                                </div>
                            ) : (
                                // ❻ Edit Mode
                                <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                                    <div className="grid gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Full Name</label>
                                            <input
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full p-4 bg-black/5 border border-black/10 rounded-2xl font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] transition-all uppercase"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Email Address</label>
                                            <div className="relative">
                                                <input
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full p-4 bg-black/5 border border-black/10 rounded-2xl font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] transition-all uppercase"
                                                />
                                                <div className="absolute right-4 top-4 text-[var(--accent-orange)] flex items-center gap-1.5 text-[9px] font-black bg-[var(--accent-orange)]/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-[var(--accent-orange)]/20 pointer-events-none">
                                                    <FaExclamationCircle /> Re-verify on change
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Phone Number</label>
                                            <input
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full p-4 bg-black/5 border border-black/10 rounded-2xl font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] transition-all uppercase"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-6">
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="px-8 py-4 bg-[var(--accent-orange)] text-black font-black rounded-2xl hover:bg-black hover:text-white transition-all shadow-xl flex items-center gap-2 uppercase tracking-widest active:scale-95 disabled:opacity-50"
                                        >
                                            {loading ? 'Saving...' : <><FaSave /> Save Changes</>}
                                        </button>
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="px-8 py-4 bg-transparent border-2 border-black/10 text-[var(--text-primary)] font-black rounded-2xl hover:bg-black/5 transition-all uppercase tracking-widest active:scale-95"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Section 3: Security & Trust */}
                        <div className="p-10 bg-black/5">
                            <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-8">Security & Trust</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center gap-4 p-5 bg-[var(--card-bg)] border border-black/5 rounded-2xl shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] flex items-center justify-center text-sm shadow-inner">
                                        <FaCheckCircle />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Email Verified</p>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Trusted Account</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-5 bg-[var(--card-bg)] border border-black/5 rounded-2xl shadow-sm">
                                    <div className="w-10 h-10 rounded-full bg-black/5 text-[var(--text-muted)] flex items-center justify-center text-sm shadow-inner">
                                        <FaLock />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Last Login</p>
                                        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Today, 9:42 PM</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const InfoItem = ({ label, value, icon, mono, status }) => (
    <div className="flex items-center gap-4">
        <div className="text-[var(--text-muted)] opacity-40 text-xl">{icon}</div>
        <div>
            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-0.5">{label}</p>
            <p className={`font-black uppercase tracking-tight ${mono ? 'font-mono text-sm' : 'text-lg'} ${status === 'success' ? 'text-[var(--accent-green)]' : 'text-[var(--text-primary)]'}`}>
                {value}
            </p>
        </div>
    </div>
);

const DisplayRow = ({ label, value, icon, verified }) => (
    <div className="flex items-center justify-between group py-3 border-b border-black/5 hover:border-black/10 transition-all">
        <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-2xl bg-black/5 text-[var(--text-muted)] group-hover:bg-[var(--accent-orange)]/10 group-hover:text-[var(--accent-orange)] transition-all flex items-center justify-center text-xl shadow-inner">
                {icon}
            </div>
            <div>
                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-1">{label}</p>
                <div className="flex items-center gap-3">
                    <p className="font-black text-[var(--text-primary)] text-xl tracking-tight uppercase">{value}</p>
                    {verified && <FaCheckCircle className="text-[var(--accent-green)] text-sm shadow-sm" title="Verified" />}
                </div>
            </div>
        </div>
    </div>
);

export default CustomerProfile;
