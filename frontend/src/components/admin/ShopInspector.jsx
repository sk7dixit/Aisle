import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiPhone, FiMail, FiCalendar, FiBox, FiLayers, FiAlertTriangle, FiActivity, FiXCircle, FiCheckCircle } from 'react-icons/fi';
import GlassCard from '../ui/GlassCard';

const ShopInspector = ({ shop, onClose, onSuspend, onActivate, readOnly }) => {
    const [suspendReason, setSuspendReason] = useState('');
    const [isSuspending, setIsSuspending] = useState(false);
    const navigate = useNavigate();

    if (!shop) return null;

    const handleSuspendSubmit = () => {
        onSuspend(shop.id, suspendReason);
        setIsSuspending(false);
        setSuspendReason('');
    };

    const user = JSON.parse(localStorage.getItem('aisleUser') || '{}');
    const isModerator = user.role === 'moderator';

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            {/* Left: Main Details */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-6">

                {/* Shop Overview */}
                <GlassCard className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{shop.shopName}</h2>
                            <p className="text-gray-500 font-medium">{shop.category} • {shop.id}</p>
                        </div>
                        <span className={`
                            px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2
                            ${shop.operationalStatus === 'Active' ? 'bg-green-100 text-green-600 border-green-200' : ''}
                            ${shop.operationalStatus === 'Suspended' ? 'bg-red-100 text-red-600 border-red-200' : ''}
                        `}>
                            {shop.operationalStatus === 'Active' ? <FiActivity /> : <FiAlertTriangle />}
                            {shop.operationalStatus}
                        </span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FiMapPin /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Location</p>
                                <p className="font-medium">{shop.city}, {shop.area}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FiCalendar /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Verified On</p>
                                <p className="font-medium">{shop.verifiedDate}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600"><FiPhone /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Contact</p>
                                <p className="font-medium">{shop.contact}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><FiMail /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Email</p>
                                <p className="font-medium">{shop.email}</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Inventory Summary (Read Only) */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Summary (Read Only)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/40 border border-white/60 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg"><FiBox size={20} /></div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{shop.productsCount}</p>
                                <p className="text-xs text-gray-500 font-medium">Total Products</p>
                            </div>
                        </div>
                        <div className="p-4 bg-white/40 border border-white/60 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FiLayers size={20} /></div>
                            <div>
                                <p className="text-2xl font-bold text-gray-800">{shop.categoriesCount || 5}</p>
                                <p className="text-xs text-gray-500 font-medium">Categories</p>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-gray-400 italic text-center">
                        Admin cannot edit inventory or shop details.
                    </p>
                </GlassCard>
            </div>

            {/* Right: Sticky Action Panel */}
            <div className="w-full md:w-80 min-w-[320px] shrink-0 flex flex-col gap-4">
                <GlassCard className="p-6 flex flex-col gap-4 shadow-md bg-white/70 backdrop-blur-2xl">
                    <h3 className="text-lg font-bold text-gray-800">Admin Actions</h3>

                    {isModerator || readOnly ? (
                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-center">
                            <p className="text-sm text-gray-500 font-medium">Read-Only Mode</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {readOnly ? 'Actions are controlled from the main directory.' : 'Moderators cannot suspend or reactivate shops.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {shop.operationalStatus === 'Active' && !isSuspending && (
                                <button
                                    onClick={() => setIsSuspending(true)}
                                    className="w-full py-3 rounded-xl bg-white border border-red-100 text-red-600 font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <FiXCircle size={20} /> Suspend Shop
                                </button>
                            )}

                            {shop.operationalStatus === 'Suspended' && (
                                <button
                                    onClick={() => onActivate(shop.id)}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <FiCheckCircle size={20} /> Reactivate Shop
                                </button>
                            )}

                            {isSuspending && (
                                <div className="animate-in fade-in slide-in-from-bottom-2">
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl mb-3">
                                        <p className="text-xs text-red-700 font-medium flex items-center gap-2">
                                            <FiAlertTriangle /> Warning: This will hide all products.
                                        </p>
                                    </div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for Suspension</label>
                                    <textarea
                                        value={suspendReason}
                                        onChange={(e) => setSuspendReason(e.target.value)}
                                        className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm min-h-[100px] mb-3"
                                        placeholder="E.g. Policy violation, customer complaints..."
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSuspendSubmit}
                                            disabled={!suspendReason.trim()}
                                            className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setIsSuspending(false)}
                                            className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="my-2 border-t border-gray-100"></div>
                        </>
                    )}

                    <button className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all">
                        View Reports
                    </button>
                    <button
                        onClick={() => navigate(`/admin/users?search=${shop.email}`)}
                        className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                    >
                        View Seller Profile
                    </button>
                </GlassCard>
            </div>
        </div>
    );
};

export default ShopInspector;
