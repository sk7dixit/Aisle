import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiCalendar, FiShield, FiAlertTriangle, FiShoppingBag, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import GlassCard from '../ui/GlassCard';

const UserInspector = ({ user, onClose, onBlock, onUnblock }) => {
    const [blockReason, setBlockReason] = useState('');
    const [isBlocking, setIsBlocking] = useState(false);
    const navigate = useNavigate();

    if (!user) return null;

    const handleBlockSubmit = () => {
        onBlock(user.id, blockReason);
        setIsBlocking(false);
        setBlockReason('');
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            {/* Left: Main Details */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-6">

                {/* User Profile Overview */}
                <GlassCard className="p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/30">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
                                <p className="text-gray-500 font-medium">{user.email}</p>
                            </div>
                        </div>
                        <span className={`
                            px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2
                            ${user.accountStatus === 'Active' ? 'bg-green-100 text-green-600 border-green-200' : ''}
                            ${user.accountStatus === 'Blocked' ? 'bg-red-100 text-red-600 border-red-200' : ''}
                        `}>
                            {user.accountStatus === 'Active' ? <FiCheckCircle /> : <FiXCircle />}
                            {user.accountStatus}
                        </span>
                    </div>

                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FiShield /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Role</p>
                                <p className="font-medium capitalize">{user.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FiCalendar /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Joined On</p>
                                <p className="font-medium">{user.joinedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><FiClock /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Last Active</p>
                                <p className="font-medium">{user.lastActive}</p>
                            </div>
                        </div>
                        {/* Linked Shop (Only for Sellers) */}
                        {user.role === 'Seller' && user.shopName && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-600"><FiShoppingBag /></div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-semibold uppercase">Linked Shop</p>
                                    <button
                                        onClick={() => navigate(`/admin/shops?search=${user.shopName}`)}
                                        className="font-medium text-blue-600 hover:underline text-left"
                                    >
                                        {user.shopName}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Activity Summary (Mock) */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <p>Logged in successfully</p>
                            <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <p>Updated profile details</p>
                            <span className="text-xs text-gray-400 ml-auto">1 day ago</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            <p>Password changed</p>
                            <span className="text-xs text-gray-400 ml-auto">3 days ago</span>
                        </div>
                    </div>
                </GlassCard>
            </div>

            {/* Right: Sticky Action Panel */}
            <div className="w-full md:w-80 min-w-[320px] shrink-0 flex flex-col gap-4">
                <GlassCard className="p-6 flex flex-col gap-4 shadow-md bg-white/70 backdrop-blur-2xl">
                    <h3 className="text-lg font-bold text-gray-800">Governance Actions</h3>

                    {/* Governance Actions - Hidden in Read-Only Mode */
                        props.readOnly ? (
                            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                                <p className="text-sm text-gray-500 font-medium">Read-Only Mode</p>
                                <p className="text-xs text-gray-400 mt-1">Actions are controlled from the main directory.</p>
                            </div>
                        ) : (
                            <>
                                {user.accountStatus === 'Active' && !isBlocking && (
                                    <button
                                        onClick={() => setIsBlocking(true)}
                                        className="w-full py-3 rounded-xl bg-white border border-red-100 text-red-600 font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <FiXCircle size={20} /> Block User
                                    </button>
                                )}

                                {user.accountStatus === 'Blocked' && (
                                    <button
                                        onClick={() => onUnblock(user.id)}
                                        className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                    >
                                        <FiCheckCircle size={20} /> Unblock User
                                    </button>
                                )}

                                {isBlocking && (
                                    <div className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-3">
                                            <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                                                <FiAlertTriangle /> Action is logged.
                                            </p>
                                        </div>
                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for Blocking</label>
                                        <textarea
                                            value={blockReason}
                                            onChange={(e) => setBlockReason(e.target.value)}
                                            className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm min-h-[100px] mb-3"
                                            placeholder="E.g. Violation of terms, suspicious activity..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleBlockSubmit}
                                                disabled={!blockReason.trim()}
                                                className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirm
                                            </button>
                                            <button
                                                onClick={() => setIsBlocking(false)}
                                                className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                    <div className="my-2 border-t border-gray-100"></div>

                    <button className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all">
                        View User Reports
                    </button>

                    {user.role === 'Seller' && (
                        <button
                            onClick={() => navigate(`/admin/shops?search=${user.shopName}`)}
                            className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                        >
                            View Linked Shop
                        </button>
                    )}
                </GlassCard>

                <div className="text-center">
                    <p className="text-xs text-gray-400">Admin cannot edit user personal details.</p>
                </div>
            </div>
        </div>
    );
};

export default UserInspector;
