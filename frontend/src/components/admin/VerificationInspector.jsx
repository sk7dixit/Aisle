import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiAlertTriangle, FiFileText, FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import GlassCard from '../ui/GlassCard';

const VerificationInspector = ({ seller, onClose, onApprove, onReject }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    if (!seller) return null;

    const handleRejectSubmit = () => {
        onReject(seller.id, rejectReason);
        setIsRejecting(false);
        setRejectReason('');
    };

    return (
        <div className="h-full flex flex-col md:flex-row gap-6">
            {/* Left: Main Details */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-6">

                {/* Header Info */}
                <GlassCard className="p-6">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{seller.shopName}</h2>
                            <p className="text-gray-500 font-medium">{seller.category} • {seller.id}</p>
                        </div>
                        <span className={`
                            px-4 py-1.5 rounded-full text-sm font-bold border
                            ${seller.status === 'Pending' ? 'bg-orange-100 text-orange-600 border-orange-200' : ''}
                            ${seller.status === 'Approved' ? 'bg-green-100 text-green-600 border-green-200' : ''}
                            ${seller.status === 'Rejected' ? 'bg-red-100 text-red-600 border-red-200' : ''}
                        `}>
                            {seller.status}
                        </span>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><FiMapPin /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Location</p>
                                <p className="font-medium">{seller.city}, {seller.area}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><FiFileText /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Submitted</p>
                                <p className="font-medium">{seller.submittedTime}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600"><FiPhone /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Contact</p>
                                <p className="font-medium">{seller.contact}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><FiMail /></div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase">Email</p>
                                <p className="font-medium">{seller.email}</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Shop Images section */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Shop Images</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Shop Front</p>
                            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                {/* Placeholder image logic */}
                                <img src={seller.images?.front || "https://placehold.co/600x400?text=Shop+Front"} alt="Shop Front" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Inside View</p>
                            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                <img src={seller.images?.inside || "https://placehold.co/600x400?text=Inside+View"} alt="Inside View" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Documents section */}
                <GlassCard className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Documents</h3>
                    <div className="flex items-center gap-4 p-4 bg-white/40 rounded-xl border border-white/60">
                        <div className="p-3 bg-gray-100 rounded-lg text-gray-600"><FiFileText size={20} /></div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-800">Business License / GST</p>
                            <p className="text-xs text-gray-500">Provided during registration</p>
                        </div>
                        <button className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">View</button>
                    </div>
                </GlassCard>
            </div>

            {/* Right: Sticky Action Panel */}
            <div className="w-full md:w-80 min-w-[320px] shrink-0 flex flex-col gap-4">
                <GlassCard className="p-6 flex flex-col gap-4 shadow-md bg-white/70 backdrop-blur-2xl">
                    <h3 className="text-lg font-bold text-gray-800">Actions</h3>

                    {!isRejecting ? (
                        <>
                            <button
                                onClick={() => onApprove(seller.id)}
                                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                            >
                                <FiCheckCircle size={20} /> Approve Seller
                            </button>

                            <button
                                onClick={() => setIsRejecting(true)}
                                className="w-full py-3 rounded-xl bg-white border border-red-100 text-red-600 font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                            >
                                <FiXCircle size={20} /> Reject
                            </button>

                            <button className="w-full py-3 rounded-xl bg-white border border-yellow-100 text-yellow-600 font-semibold hover:bg-yellow-50 transition-all flex items-center justify-center gap-2">
                                <FiAlertTriangle size={20} /> Request More Info
                            </button>
                        </>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-2">
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for Rejection</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm min-h-[100px] mb-3"
                                placeholder="E.g. Invalid documents, blurry images..."
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRejectSubmit}
                                    className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                                >
                                    Confirm Reject
                                </button>
                                <button
                                    onClick={() => setIsRejecting(false)}
                                    className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="my-2 border-t border-gray-100"></div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Admin Notes</label>
                        <textarea
                            className="w-full p-3 rounded-xl border border-gray-200 bg-white/50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm min-h-[100px]"
                            placeholder="Internal notes only..."
                        />
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default VerificationInspector;
