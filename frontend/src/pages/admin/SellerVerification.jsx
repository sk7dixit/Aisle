import React, { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';

/* 
  STEP 14 - VERIFICATIONS WIREFRAME EXECUTION
  Strict layout adherence.
  Authority over friendliness.
*/

const SellerVerification = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Needs Review'); // Needs Review | Pending | Approved | Rejected by System
    const [actionModal, setActionModal] = useState(null); // { type: 'approve' | 'reject', seller: {} }
    const [rejectReason, setRejectReason] = useState('');

    const fetchQueue = async () => {
        try {
            const storedUser = JSON.parse(localStorage.getItem('aisleUser'));
            const token = storedUser?.token;

            const res = await fetch('/api/admin/verification-queue', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                const mapped = data.map(s => ({
                    id: s._id,
                    shopName: s.shopDetails?.shopName || s.name,
                    sellerName: s.name,
                    category: s.shopDetails?.category || 'General',
                    city: s.shopDetails?.city || s.shopDetails?.address || 'Unknown',
                    submittedTime: new Date(s.createdAt).toLocaleDateString(),
                    docsCount: s.shopDetails?.photos?.length || 0,
                    faceData: s.faceData ? 'Completed' : 'Required',
                    status: s.verificationStatus,
                    source: s.verificationSource || 'ai',
                    reason: s.verificationReason,
                    resubmissions: 0,
                    flags: 0
                }));
                setSellers(mapped);
            }
        } catch (e) {
            console.error("Fetch verification queue error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
    }, []);

    const executeAction = async () => {
        if (!actionModal) return;

        try {
            const storedUser = JSON.parse(localStorage.getItem('aisleUser'));
            const token = storedUser?.token;
            const isApprove = actionModal.type === 'approve';

            const body = isApprove
                ? { verificationStatus: 'approved' }
                : { verificationStatus: 'rejected_by_system', reason: 'manual_rejection' };

            await fetch(`/api/admin/seller/${actionModal.seller.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            fetchQueue();
            setActionModal(null);
            setRejectReason('');
        } catch (e) {
            console.error("Action error", e);
        }
    };

    const filteredSellers = sellers.filter(s => {
        if (filter === 'All') return true;
        const normalizedFilter = filter.toLowerCase().replace(/ /g, '_');
        return s.status === normalizedFilter || s.status === filter;
    });

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Verification Queue...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto space-y-8 bg-[#F2F2F2]">

            {/* 2️⃣ PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Seller Verifications</h1>
                <p className="text-sm text-gray-500 mt-1">Review and approve sellers applying to operate on Aisle</p>
            </div>

            {/* 3️⃣ PRIMARY ACTION ZONE */}
            <div className="bg-white border border-[#CBCBCB] rounded-xl overflow-hidden shadow-sm">

                {/* 4️⃣ FILTER & SEARCH */}
                <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        {['Needs Review', 'Pending', 'Approved', 'Rejected by System', 'All'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filter === f || (f === 'Needs Review' && filter === 'needs_review') || (f === 'Approved' && filter === 'approved') || (f === 'Rejected by System' && filter === 'rejected_by_system') || (f === 'Pending' && filter === 'pending')
                                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {/* Placeholder Search - Visual Only as per wireframe implicit req */}
                    <input
                        type="text"
                        placeholder="Search by Shop / Seller ID"
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-gray-400 text-gray-700"
                    />
                </div>

                {/* 5️⃣ TABLE STRUCTURE */}
                <div className="overflow-x-auto">
                    {filteredSellers.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-[#CBCBCB]">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/3">Seller & Shop</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">Verification Context</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/5">Risk Signals</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSellers.map(seller => (
                                    <tr key={seller.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => {/* Open Detail Drawer Logic Placeholder */ }}>
                                        {/* COL 1: Seller & Shop */}
                                        <td className="p-6 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{seller.shopName}</div>
                                            <div className="text-gray-500 text-xs mt-1">
                                                Seller: <span className="font-medium text-gray-700">{seller.sellerName}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: {seller.id.slice(-8).toUpperCase()}</div>
                                        </td>

                                        {/* COL 2: Context */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Submitted: <span className="text-gray-900 font-medium">{seller.submittedTime}</span></p>
                                                <p>Documents: <span className="text-gray-900 font-medium">{seller.docsCount}</span></p>
                                                <p>Face Verification: <span className={`font-medium ${seller.faceData === 'Completed' ? 'text-[#174D38]' : 'text-orange-600'}`}>{seller.faceData}</span></p>
                                            </div>
                                        </td>

                                        {/* COL 3: Verification Signals */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-[10px] uppercase font-bold tracking-wider">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Source:</span>
                                                    <span className={`px-2 py-0.5 rounded ${seller.source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {seller.source}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-gray-400">Status:</span>
                                                    <span className={`px-2 py-0.5 rounded ${seller.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                            seller.status === 'rejected_by_system' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {seller.status.replace(/_/g, ' ')}
                                                    </span>
                                                </div>
                                            </div>
                                            {seller.reason && (
                                                <p className="text-[10px] text-gray-500 mt-2 italic line-clamp-1 border-t border-gray-100 pt-1">
                                                    AI: {seller.reason}
                                                </p>
                                            )}
                                        </td>

                                        {/* COL 4: Actions */}
                                        <td className="p-6 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                            {(seller.status !== 'approved') && (
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => setActionModal({ type: 'reject', seller })}
                                                        className="px-4 py-2 border border-[#4D1717] text-[#4D1717] bg-white hover:bg-red-50 text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Manual Reject
                                                    </button>
                                                    <button
                                                        onClick={() => setActionModal({ type: 'approve', seller })}
                                                        className="px-4 py-2 bg-[#174D38] text-white hover:bg-[#123d2c] text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Approve Seller
                                                    </button>
                                                </div>
                                            )}
                                            {seller.status === 'approved' && (
                                                <span className="text-xs font-bold px-3 py-1 rounded border bg-[#174D38]/5 text-[#174D38] border-[#174D38]/20">
                                                    APPROVED
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 9️⃣ EMPTY STATE */
                        <div className="py-24 text-center">
                            <h3 className="text-gray-900 font-bold mb-1">No sellers are awaiting verification.</h3>
                            <p className="text-sm text-gray-500">All applications have been reviewed.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
                        {/* 7️⃣ / 8️⃣ MODAL HEADER */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">
                                {actionModal.type === 'approve' ? 'Approve Seller' : 'Reject Seller'}
                            </h3>
                            <div className="border-t border-gray-100 my-3 w-12"></div>
                            {actionModal.type === 'approve' ? (
                                <div className="space-y-1 text-sm bg-gray-50 p-4 rounded border border-gray-100">
                                    <div className="flex justify-between"><span className="text-gray-500">Shop</span> <span className="font-bold text-gray-900">{actionModal.seller.shopName}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Category</span> <span className="font-bold text-gray-900">{actionModal.seller.category}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500">Face Verification</span> <span className="font-bold text-gray-900">{actionModal.seller.faceData}</span></div>
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Reason for rejection (required):
                                </div>
                            )}
                            {actionModal.type === 'approve' && (
                                <p className="text-sm text-gray-600 mt-4">
                                    Approving this seller will allow them to operate on Aisle.
                                </p>
                            )}
                        </div>

                        {/* MODAL BODY (Reject Only) */}
                        {actionModal.type === 'reject' && (
                            <div className="p-6 pt-2">
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none h-32 resize-none"
                                    placeholder="Enter reason..."
                                />
                                <p className="text-xs text-gray-500 mt-2">Rejected sellers cannot operate unless they reapply.</p>
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="p-6 pt-0 flex gap-3 justify-end">
                            <button
                                onClick={() => { setActionModal(null); setRejectReason(''); }}
                                className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAction}
                                disabled={actionModal.type === 'reject' && !rejectReason.trim()}
                                className={`px-5 py-2.5 text-sm font-bold text-white rounded shadow-sm transition-colors ${actionModal.type === 'approve'
                                    ? 'bg-[#174D38] hover:bg-[#123d2c]'
                                    : 'bg-[#4D1717] hover:bg-[#3d1212] disabled:opacity-50'
                                    }`}
                            >
                                {actionModal.type === 'approve' ? 'Confirm Approval' : 'Reject Seller'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerVerification;
