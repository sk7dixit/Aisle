
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiShield, FiLock, FiClock, FiSmartphone, FiMonitor, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

const AdminProfile = () => {
    const navigate = useNavigate();
    const [admin, setAdmin] = useState({
        name: 'Admin',
        email: 'admin@aisle.com',
        role: 'Super Admin',
        lastLogin: 'Just now',
    });

    // Mock History
    const loginHistory = [
        { device: 'MacBook Pro', loc: 'Mumbai, IN', time: 'Just now', status: 'Active' },
        { device: 'iPhone 13', loc: 'Pune, IN', time: 'Yesterday, 10:42 PM', status: 'Logged out' },
        { device: 'Windows PC', loc: 'Delhi, IN', time: 'Dec 20, 09:15 AM', status: 'Logged out' },
    ];

    const permissions = [
        "Manage Users & Sellers",
        "Approve/Reject Verifications",
        "View System Analytics",
        "Edit Global Settings",
        "Access Sensitive Reports"
    ];

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('aisleUser') || '{}');
        if (storedUser.email) {
            setAdmin({
                name: storedUser.name || 'Admin',
                email: storedUser.email,
                role: storedUser.role || 'Super Admin',
                lastLogin: 'Just now'
            });
        }
    }, []);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin')}
                    className="p-2 rounded-xl bg-white/50 hover:bg-white text-gray-500 transition-colors"
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>
                    <p className="text-sm text-gray-500">Account details and security status</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* 1. Basic Info Card */}
                <GlassCard className="lg:col-span-1 p-8 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-1 mb-6 relative">
                        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                            <span className="text-4xl font-bold text-blue-600">{admin.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{admin.name}</h2>
                    <p className="text-gray-500 mb-4">{admin.email}</p>

                    <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider mb-8">
                        {admin.role}
                    </span>

                    <div className="w-full pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
                        <span className="text-gray-500">Last Login</span>
                        <span className="font-bold text-gray-800">{admin.lastLogin}</span>
                    </div>
                </GlassCard>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 2. Security Section (Read Only) */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FiLock className="text-gray-400" /> Security & Sessions
                        </h3>

                        <div className="space-y-4">
                            {loginHistory.map((session, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2.5 rounded-lg ${idx === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {session.device.includes('iPhone') ? <FiSmartphone size={20} /> : <FiMonitor size={20} />}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{session.device}</h4>
                                            <p className="text-xs text-gray-500">{session.loc} • {session.time}</p>
                                        </div>
                                    </div>
                                    <div>
                                        {session.status === 'Active' ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">Active Now</span>
                                        ) : (
                                            <span className="text-gray-400 text-xs font-medium">Logged out</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* 3. Permissions (UI Only) */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <FiShield className="text-gray-400" /> Role Permissions
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {permissions.map((perm, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white/50">
                                    <FiCheckCircle className="text-green-500 shrink-0" />
                                    <span className="text-sm font-medium text-gray-700">{perm}</span>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
