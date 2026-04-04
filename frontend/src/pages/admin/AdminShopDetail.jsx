import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const AdminShopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shopData, setShopData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Modal State
    const [modalAction, setModalAction] = useState(null); // 'suspend' | 'reinstate' | 'approve' | 'reject'
    const [reason, setReason] = useState('');

    const fetchDetails = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            // Ensure endpoint matches backend route
            const res = await fetch(`/api/admin/shops/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setShopData(data);
            } else {
                console.error('Failed to fetch shop details');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleAction = async () => {
        if (!shopData) return;

        if (modalAction === 'suspend' && !reason.trim()) {
            alert('Reason is required to suspend a shop.');
            return;
        }

        setActionLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            const newStatus = modalAction === 'suspend' ? 'suspended' :
                modalAction === 'reject' ? 'rejected_by_system' : 'approved';

            // Reusing existing status update endpoint
            const body = {
                verificationStatus: newStatus,
                reason: modalAction === 'suspend' ? reason :
                    modalAction === 'reject' ? 'manual_rejection' : 'Approved from Shop Center'
            };

            const res = await fetch(`/api/admin/seller/${shopData.identity.shopId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setModalAction(null);
                setReason('');
                fetchDetails(); // Refresh data
            } else {
                alert('Action failed');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Command Center...</div>;
    if (!shopData) return <div className="p-12 text-center text-gray-500">Shop not found or access denied.</div>;

    const { identity, seller, risk, products, activity } = shopData;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-5xl mx-auto space-y-8 bg-[#F2F2F2]">

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
                <FaArrowLeft />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* 1️⃣ PAGE HEADER */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{identity.shopName}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-mono">
                        <span>Shop ID: SHP-{identity.displayId}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="font-sans">Category: {identity.category}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${identity.status === 'Active' ? 'bg-green-100 text-green-800' :
                            identity.status === 'Suspended' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {identity.status}
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Seller: {seller.name}</p>
                    <p className="text-xs text-gray-400 font-mono">ID: SEL-{seller.sellerId}</p>
                </div>
            </div>

            {/* 2️⃣ STATUS STRIP */}
            <div className="grid grid-cols-4 bg-white border border-[#CBCBCB] rounded-xl divide-x divide-gray-100 shadow-sm">
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Status</p>
                    <p className={`text-lg font-bold ${identity.status === 'Active' ? 'text-[#174D38]' :
                        identity.status === 'Suspended' ? 'text-[#4D1717]' : 'text-gray-900'
                        }`}>{identity.status}</p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Reports</p>
                    <p className={`text-lg font-bold ${risk.totalReports > 0 ? 'text-[#4D1717]' : 'text-gray-900'}`}>
                        {risk.totalReports}
                    </p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Products</p>
                    <p className="text-lg font-bold text-gray-900">{products.total}</p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Last Admin Action</p>
                    <p className="text-sm font-medium text-gray-900 mt-1 truncate px-2">
                        {activity[0] ? new Date(activity[0].date).toLocaleDateString() : 'None'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 3️⃣ SHOP PROFILE (READ-ONLY) */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Shop Information</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Shop Name</span>
                            <span className="text-sm font-medium text-gray-900">{identity.shopName}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Category</span>
                            <span className="text-sm font-medium text-gray-900">{identity.category}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Address</span>
                            <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">{identity.address}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Created On</span>
                            <span className="text-sm font-medium text-gray-900">{new Date(identity.joinedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Verification Date</span>
                            <span className="text-sm font-medium text-gray-900">
                                {identity.verifiedAt ? new Date(identity.verifiedAt).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 4️⃣ SELLER CONTEXT */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Seller Context</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3 shadow-sm">
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Seller Name</span>
                            <span className="text-sm font-medium text-gray-900">{seller.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Contact Email</span>
                            <span className="text-sm font-medium text-gray-900">{seller.email}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Phone</span>
                            <span className="text-sm font-medium text-gray-900">{seller.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="text-xs text-gray-500 font-medium">Identity Status</span>
                            <span className="text-sm font-medium text-gray-900">{seller.faceStatus}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Verification Context (Step 4) */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">AI Verification Details</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-5 grid grid-cols-1 md:grid-cols-3 gap-6 shadow-sm">
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Verification Source</p>
                        <p className="text-sm font-bold text-gray-900 uppercase">{identity.verificationSource}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Status</p>
                        <p className={`text-sm font-bold uppercase ${identity.verificationStatus === 'approved' ? 'text-emerald-600' :
                                identity.verificationStatus === 'rejected_by_system' ? 'text-red-600' :
                                    'text-amber-600'
                            }`}>{identity.verificationStatus.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">AI Internal Reason</p>
                        <p className="text-sm font-medium text-gray-700 italic">"{identity.verificationReason || 'No reason provided'}"</p>
                    </div>
                </div>
            </div>

            {/* 5️⃣ RISK & TRUST SECTION */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Risk Context</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-xs text-gray-500 font-medium">Total Reports</p>
                        <p className={`text-xl font-bold ${risk.totalReports > 0 ? 'text-[#4D1717]' : 'text-gray-900'}`}>{risk.totalReports}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-xs text-gray-500 font-medium">Verification Status</p>
                        <p className="text-xl font-bold text-gray-900 capitalize">{risk.verificationStatus.replace('_', ' ')}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-xs text-gray-500 font-medium">Face Verification</p>
                        <p className={`text-xl font-bold ${seller.faceStatus === 'verified' ? 'text-[#174D38]' : 'text-gray-900'}`}>{seller.faceStatus}</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                    <div className="space-y-1 text-center md:text-left">
                        <p className="text-xs text-gray-500 font-medium">System Flags</p>
                        <p className="text-xl font-bold text-gray-900">{risk.flags}</p>
                    </div>
                </div>
            </div>

            {/* 6️⃣ PRODUCT SNAPSHOT */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Products</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-8 md:gap-12 w-full md:w-auto justify-center">
                            <div className="text-center md:text-left">
                                <p className="text-xs text-gray-500 font-medium">Total</p>
                                <p className="text-xl font-bold text-gray-900">{products.total}</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-xs text-gray-500 font-medium">Active</p>
                                <p className="text-xl font-bold text-[#174D38]">{products.active}</p>
                            </div>
                            <div className="text-center md:text-left">
                                <p className="text-xs text-gray-500 font-medium">Disabled</p>
                                <p className="text-xl font-bold text-[#4D1717]">{products.disabled}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/admin/products?search=' + identity.shopName)}
                            className="text-sm text-[#174D38] font-bold hover:bg-green-50 px-4 py-2 rounded transition-colors"
                        >
                            View All Products →
                        </button>
                    </div>
                </div>
            </div>

            {/* 7️⃣ ACTIVITY TIMELINE */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">Recent System Activity</h3>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4 max-h-64 overflow-y-auto">
                    {activity.length > 0 ? activity.map((log) => (
                        <div key={log.id} className="flex gap-4 items-start border-l-2 border-gray-200 pl-4 py-1">
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-gray-900 uppercase tracking-tight">{log.action.replace(/_/g, ' ')}</p>
                                <p className="text-[10px] text-gray-500">
                                    {new Date(log.date).toLocaleString()} • <span className="font-medium text-gray-700">{log.admin}</span>
                                </p>
                                {log.reason && <p className="text-xs text-gray-600 mt-1 bg-gray-50 p-2 rounded italic font-serif">"{log.reason}"</p>}
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs text-gray-500 italic text-center py-4">No recent activity logged.</p>
                    )}
                </div>
            </div>

            {/* 8️⃣ ACTION ZONE */}
            <div className="border-t border-[#CBCBCB] pt-8 pb-4">
                {identity.status === 'Active' ? (
                    <button
                        onClick={() => setModalAction('suspend')}
                        className="w-full py-4 bg-white border-2 border-[#4D1717] text-[#4D1717] hover:bg-[#4D1717] hover:text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                        Suspend Shop
                    </button>
                ) : (identity.verificationStatus !== 'approved') ? (
                    <div className="flex gap-4">
                        <button
                            onClick={() => setModalAction('reject')}
                            className="flex-1 py-4 bg-white border-2 border-[#4D1717] text-[#4D1717] hover:bg-[#4D1717] hover:text-white font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                        >
                            Reject Seller
                        </button>
                        <button
                            onClick={() => setModalAction('approve')}
                            className="flex-1 py-4 bg-[#174D38] text-white hover:bg-[#123d2c] font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                        >
                            Approve Seller
                        </button>
                    </div>
                ) : identity.status === 'Suspended' ? (
                    <button
                        onClick={() => setModalAction('reinstate')}
                        className="w-full py-4 bg-[#174D38] text-white hover:bg-[#123d2c] font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                    >
                        Reinstate Shop
                    </button>
                ) : (
                    <div className="w-full py-4 bg-gray-100 border border-gray-200 text-gray-400 font-bold rounded-lg text-center text-sm cursor-not-allowed uppercase tracking-wider">
                        Action Unavailable ({identity.status})
                    </div>
                )}
            </div>

            {/* CONFIRMATION MODAL */}
            {modalAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-200">
                        <h3 className={`text-lg font-bold mb-2 ${(modalAction === 'suspend' || modalAction === 'reject') ? 'text-[#4D1717]' : 'text-[#174D38]'
                            }`}>
                            {modalAction === 'suspend' ? 'Suspend Shop' :
                                modalAction === 'reject' ? 'Reject Seller' :
                                    modalAction === 'approve' ? 'Approve Seller' : 'Reinstate Shop'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to {modalAction} <strong>{identity.shopName}</strong>?
                            {modalAction === 'suspend' && <br />}
                            {modalAction === 'suspend' && <span className="text-xs text-[#4D1717] font-medium"> This will hide the shop and all its products from customers.</span>}
                        </p>

                        {modalAction === 'suspend' && (
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Reason for suspension (required for audit logs)"
                                className="w-full border border-gray-300 rounded p-3 text-sm mb-4 h-24 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none"
                            />
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => { setModalAction(null); setReason(''); }}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAction}
                                disabled={actionLoading || (modalAction === 'suspend' && !reason.trim())}
                                className={`px-4 py-2 text-sm font-bold text-white rounded shadow-sm ${modalAction === 'suspend' ? 'bg-[#4D1717] hover:bg-[#3d1212]' : 'bg-[#174D38] hover:bg-[#123d2c]'
                                    } disabled:opacity-50 transition-colors`}
                            >
                                {actionLoading ? 'Processing...' : (
                                    modalAction === 'suspend' ? 'Confirm Suspension' :
                                        modalAction === 'reject' ? 'Confirm Rejection' :
                                            modalAction === 'approve' ? 'Confirm Approval' : 'Confirm Reinstatement'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default AdminShopDetail;
