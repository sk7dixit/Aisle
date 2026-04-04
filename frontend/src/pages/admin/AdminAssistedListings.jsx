import React, { useState, useEffect } from 'react';
import {
    FiArrowLeft, FiFilter, FiCheckCircle, FiClock,
    FiInfo, FiMapPin, FiPhone, FiUser, FiPackage,
    FiDownload, FiExternalLink, FiSearch, FiMoreVertical,
    FiLoader, FiCheck, FiX
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../../components/ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

const AdminAssistedListings = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            const res = await fetch('/api/admin/assisted-listings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRequests(data);
            }
        } catch (error) {
            console.error("Failed to fetch assisted listings", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (requestId, newStatus) => {
        setIsUpdating(true);
        try {
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            const res = await fetch(`/api/admin/assisted-listings/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setRequests(prev => prev.map(req =>
                    req._id === requestId ? { ...req, status: newStatus } : req
                ));
                if (selectedRequest?._id === requestId) {
                    setSelectedRequest(prev => ({ ...prev, status: newStatus }));
                }
            } else {
                const err = await res.json();
                alert(err.message || 'Failed to update status');
            }
        } catch (error) {
            console.error("Update Status Error:", error);
            alert('Something went wrong');
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            req.seller?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.mobile?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded uppercase tracking-wider">New</span>;
            case 'in-progress':
                return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded uppercase tracking-wider">In Progress</span>;
            case 'completed':
                return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded uppercase tracking-wider">Completed</span>;
            default:
                return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black rounded uppercase tracking-wider">{status}</span>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assisted Listing Requests</h1>
                        <p className="text-sm text-slate-500 font-medium tracking-tight">Requests from sellers who want help listing their products.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search seller or mobile..."
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-all w-full md:w-64 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-slate-900 shadow-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All States</option>
                        <option value="pending">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* List Table */}
            <GlassCard className="overflow-hidden border-slate-200/60 shadow-xl shadow-slate-900/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seller</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subscription</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Est. Products</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <FiLoader className="w-8 h-8 text-slate-300 animate-spin" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Requests...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-[1.5rem] flex items-center justify-center">
                                                <FiPackage size={32} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-400">No requests found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr
                                        key={req._id}
                                        onClick={() => setSelectedRequest(req)}
                                        className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                    >
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center text-sm shadow-lg shadow-slate-900/10">
                                                    {req.name?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 tracking-tight">{req.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{req.mobile}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            {req.isPro ? (
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded uppercase tracking-widest border border-indigo-100/50">Pro Seller</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded uppercase tracking-widest border border-slate-100/50">Non-Pro</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 font-mono text-xs font-bold text-slate-600">
                                            {req.estimatedProductCount || 'N/A'}
                                        </td>
                                        <td className="px-6 py-5">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                            {new Date(req.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-900 transition-all">
                                                    <FiMoreVertical />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Detail Drawer */}
            <AnimatePresence>
                {selectedRequest && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRequest(null)}
                            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-[110] shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Request Details</h3>
                                <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                    <FiX className="text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                                {/* Seller Header */}
                                <div className="flex items-start gap-6">
                                    <div className="w-20 h-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-slate-900/20">
                                        {selectedRequest.name?.[0]}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="text-2xl font-black text-slate-900 tracking-tight">{selectedRequest.name}</h4>
                                            {getStatusBadge(selectedRequest.status)}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRequest.isPro ? (
                                                <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded uppercase tracking-widest">PRO SELLER</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase tracking-widest tracking-widest border border-slate-200/50">NON-PRO</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile Number</p>
                                            <a href={`tel:${selectedRequest.mobile}`} className="flex items-center gap-2 text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors">
                                                <FiPhone className="shrink-0" /> {selectedRequest.mobile}
                                            </a>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Shop Address</p>
                                            <div className="flex gap-2">
                                                <FiMapPin className="text-slate-400 shrink-0 mt-0.5" />
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed">{selectedRequest.address}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Est. Product Count</p>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                                                <FiPackage className="text-slate-400" /> {selectedRequest.estimatedProductCount || 'Not specified'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pricing Scheme</p>
                                            {selectedRequest.isPro ? (
                                                <p className="text-xs font-bold text-emerald-600">Included in Pro Plan</p>
                                            ) : (
                                                <p className="text-xs font-bold text-slate-600">₹1 per product (To be confirmed)</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Files Section */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared Product Data ({selectedRequest.files?.length || 0})</p>
                                    {selectedRequest.files && selectedRequest.files.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedRequest.files.map((file, idx) => (
                                                <a
                                                    key={idx}
                                                    href={file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 hover:bg-slate-100 hover:border-slate-200 transition-all group"
                                                >
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-colors">
                                                        <FiDownload size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-black text-slate-800 truncate">File {idx + 1}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">View File</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-6 border-2 border-dashed border-slate-100 rounded-3xl text-center">
                                            <p className="text-xs font-bold text-slate-400">No files shared with this request.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Internal Status Tracking */}
                                <div className="space-y-4 pt-6 mt-6 border-t border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Status Management</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => updateStatus(selectedRequest._id, 'pending')}
                                            className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRequest.status === 'pending' ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            Pending
                                        </button>
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => updateStatus(selectedRequest._id, 'in-progress')}
                                            className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRequest.status === 'in-progress' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            In Progress
                                        </button>
                                        <button
                                            disabled={isUpdating}
                                            onClick={() => updateStatus(selectedRequest._id, 'completed')}
                                            className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedRequest.status === 'completed' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                        >
                                            Completed
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">Changes are instantly reflected to the seller.</p>
                                </div>
                            </div>

                            {/* Drawer Footer Actions */}
                            <div className="p-6 border-t border-slate-50 bg-slate-50/50 flex gap-3">
                                {selectedRequest.status !== 'completed' && (
                                    <button
                                        disabled={isUpdating}
                                        onClick={() => updateStatus(selectedRequest._id, 'completed')}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isUpdating ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                                        Mark as Completed
                                    </button>
                                )}
                                <button className="flex-1 py-4 bg-white border border-slate-200 text-slate-800 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                                    <FiExternalLink /> View Seller Shop
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminAssistedListings;
