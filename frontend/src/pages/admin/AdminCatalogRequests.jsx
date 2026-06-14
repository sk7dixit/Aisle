import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaInbox, FaSpinner, FaCheckCircle, FaTimesCircle, FaChevronRight, FaDatabase, FaSearch, FaUser, FaBuilding } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminCatalogRequests = () => {
    const { token } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    
    // Approval correction states
    const [baseName, setBaseName] = useState('');
    const [brand, setBrand] = useState('');
    const [variant, setVariant] = useState('');
    const [size, setSize] = useState('');
    const [productType, setProductType] = useState('REGULAR');
    const [allowedStates, setAllowedStates] = useState('Gujarat');
    const [rejectionNotes, setRejectionNotes] = useState('');
    
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const { data } = await axios.get('/api/master/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(data);
        } catch (err) {
            console.error("Failed to fetch admin requests:", err);
            // Mock data fallback
            setRequests([
                {
                    _id: 'req_1',
                    product_name: 'Boat Airdopes 131 Wireless Earbuds',
                    brand_name: 'Boat',
                    pack_size: '1 unit',
                    category: 'Other',
                    notes: 'Extremely popular wireless earbuds. High demand in technology stores.',
                    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                    status: 'PENDING',
                    requester_id: { name: 'Shashwat (Tech Store)', email: 'techstore@aisle.com' }
                },
                {
                    _id: 'req_2',
                    product_name: 'Amul Organic Cow Ghee',
                    brand_name: 'Amul',
                    pack_size: '1L Tetrapack',
                    category: 'Dairy',
                    notes: 'Requested organic cow ghee line.',
                    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
                    status: 'APPROVED',
                    requester_id: { name: 'Dixit Kirana', email: 'dixit@aisle.com' },
                    admin_notes: 'Successfully mapped under Dairy -> Ghee.'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenReview = (req) => {
        setSelectedRequest(req);
        setBaseName(req.product_name.split(' ')[0] || req.product_name);
        setBrand(req.brand_name || 'Generic');
        setVariant(req.product_name);
        setSize(req.pack_size || '1 Unit');
        setProductType('REGULAR');
        setAllowedStates('Gujarat, Maharashtra');
        setRejectionNotes('');
        setIsReviewOpen(true);
    };

    const handleApprove = async () => {
        if (!selectedRequest) return;
        setActionLoading(true);
        try {
            const payload = {
                approved_base_name: baseName,
                approved_brand: brand,
                approved_variant: variant,
                approved_size: size,
                approved_type: productType,
                allowed_states: allowedStates.split(',').map(s => s.trim())
            };

            await axios.post(`/api/master/request/${selectedRequest._id}/approve`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Catalog request approved and variant fanned out!");
            setIsReviewOpen(false);
            fetchRequests();
        } catch (err) {
            console.error("Approval error:", err);
            // Local update fallback for mock
            setRequests(requests.map(r => r._id === selectedRequest._id ? { ...r, status: 'APPROVED', admin_notes: 'Approved successfully' } : r));
            toast.success("[Mock Mode] Product approved and fanned out!");
            setIsReviewOpen(false);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedRequest) return;
        if (!rejectionNotes.trim()) {
            toast.error("Please add rejection notes/reason.");
            return;
        }

        setActionLoading(true);
        try {
            await axios.post(`/api/master/request/${selectedRequest._id}/reject`, {
                admin_notes: rejectionNotes
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Catalog request rejected.");
            setIsReviewOpen(false);
            fetchRequests();
        } catch (err) {
            console.error("Rejection error:", err);
            // Local update fallback for mock
            setRequests(requests.map(r => r._id === selectedRequest._id ? { ...r, status: 'REJECTED', admin_notes: rejectionNotes } : r));
            toast.success("[Mock Mode] Product request rejected.");
            setIsReviewOpen(false);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <FaSpinner className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-slate-400 font-bold text-sm">Loading Catalog Requests Queue...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in p-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Master Catalog Requests</h1>
                <p className="text-slate-500 text-xs mt-1 font-semibold uppercase tracking-wider">
                    Review, categorize, and approve/reject custom products submitted by sellers
                </p>
            </div>

            {/* Requests Grid/List */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8">
                {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                            <FaInbox size={28} className="text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-400 font-medium">All clear! No pending requests.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-4">Product Details</th>
                                    <th className="py-4">Requested By</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((r) => (
                                    <tr key={r._id} className="group hover:bg-slate-50/40 transition-all">
                                        <td className="py-5 pr-4">
                                            <h4 className="font-black text-slate-800 text-sm leading-tight">{r.product_name}</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                                Brand: {r.brand_name || 'Generic'} &bull; Pack: {r.pack_size || '1 Unit'} &bull; Cat: {r.category}
                                            </p>
                                        </td>

                                        <td className="py-5 pr-4">
                                            <div className="flex items-center gap-2">
                                                <FaUser className="text-slate-400 size-3" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">{r.requester_id?.name || 'Seller'}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold">{r.requester_id?.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="py-5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border
                                                ${r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 border-amber-500/10' : ''}
                                                ${r.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/10' : ''}
                                                ${r.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-600 border-rose-500/10' : ''}
                                            `}>
                                                {r.status}
                                            </span>
                                        </td>

                                        <td className="py-5 text-right">
                                            <button
                                                onClick={() => handleOpenReview(r)}
                                                className="px-4 py-2 bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-900 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1 border-0 ml-auto"
                                            >
                                                Review Request <FaChevronRight size={8} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Drawer / Modal */}
            {isReviewOpen && selectedRequest && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex justify-end">
                    <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-left">
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Review Request</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Moderation & Mapping Console</p>
                            </div>
                            <button
                                onClick={() => setIsReviewOpen(false)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-slate-200 border-0"
                            >
                                Close
                            </button>
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Product Info Summary */}
                            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 space-y-3">
                                <div>
                                    <span className="text-[8px] font-black text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-wider leading-none">
                                        {selectedRequest.category}
                                    </span>
                                    <h4 className="font-black text-slate-800 text-base mt-2 leading-tight">{selectedRequest.product_name}</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                        Brand: {selectedRequest.brand_name || 'Generic'} &bull; Pack: {selectedRequest.pack_size || '1 Unit'}
                                    </p>
                                </div>

                                {selectedRequest.notes && (
                                    <div className="border-t border-slate-200/50 pt-3">
                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seller's Notes</label>
                                        <p className="text-xs font-bold text-slate-500 leading-relaxed italic mt-1">"{selectedRequest.notes}"</p>
                                    </div>
                                )}
                            </div>

                            {selectedRequest.status === 'PENDING' ? (
                                <div className="space-y-6">
                                    {/* correction parameters */}
                                    <div className="border-t border-slate-100 pt-6 space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Approve & Catalog Mapping</h4>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Approved Base Name */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Name (Generic)</label>
                                                <input
                                                    type="text"
                                                    value={baseName}
                                                    onChange={(e) => setBaseName(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none transition-all"
                                                />
                                            </div>

                                            {/* Approved Brand */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Name</label>
                                                <input
                                                    type="text"
                                                    value={brand}
                                                    onChange={(e) => setBrand(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Approved Variant Label */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Variant Label</label>
                                                <input
                                                    type="text"
                                                    value={variant}
                                                    onChange={(e) => setVariant(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none transition-all"
                                                />
                                            </div>

                                            {/* Approved Pack Size */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pack Size</label>
                                                <input
                                                    type="text"
                                                    value={size}
                                                    onChange={(e) => setSize(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Product Type */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Product Type</label>
                                                <select
                                                    value={productType}
                                                    onChange={(e) => setProductType(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none"
                                                >
                                                    <option value="REGULAR">Regular (STANDARD)</option>
                                                    <option value="DAILY">Daily Essential (DAILY)</option>
                                                </select>
                                            </div>

                                            {/* Allowed States */}
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allowed States (CSV)</label>
                                                <input
                                                    type="text"
                                                    value={allowedStates}
                                                    onChange={(e) => setAllowedStates(e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleApprove}
                                            disabled={actionLoading}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 border-0"
                                        >
                                            <FaCheckCircle size={12} /> Approve and Add to Master
                                        </button>
                                    </div>

                                    {/* Rejection Parameter */}
                                    <div className="border-t border-slate-100 pt-6 space-y-3">
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em]">Reject Request</h4>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason for Rejection *</label>
                                            <textarea
                                                rows={2}
                                                placeholder="Explain category mismatch, duplicate products, or missing specifications..."
                                                value={rejectionNotes}
                                                onChange={(e) => setRejectionNotes(e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none resize-none"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleReject}
                                            disabled={actionLoading}
                                            className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 border-0"
                                        >
                                            <FaTimesCircle size={12} /> Reject Request
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="border-t border-slate-100 pt-6 text-center py-10">
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Request already processed</p>
                                    {selectedRequest.admin_notes && (
                                        <p className="mt-3 text-xs bg-slate-50 rounded-xl p-3 italic text-slate-500 font-bold border border-slate-100">
                                            "{selectedRequest.admin_notes}"
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCatalogRequests;
