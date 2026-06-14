import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShopInspector from '../../components/admin/ShopInspector';

/* 
  STEP 14 - SHOPS WIREFRAME EXECUTION
  Strict layout adherence.
  Marketplace Control Context.
*/

const Shops = () => {
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Active'); // Active | Suspended | Under Review
    const [searchTerm, setSearchTerm] = useState('');

    // Selection & Actions
    const [selectedShopId, setSelectedShopId] = useState(null); // For Drawer
    const [modalAction, setModalAction] = useState(null); // { type: 'suspend' | 'reinstate', shop: {} }
    const [suspendReason, setSuspendReason] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchShops = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/sellers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const mapped = data.map(s => ({
                    id: s._id,
                    displayId: s._id.substring(s._id.length - 8).toUpperCase(),
                    shopName: s.shopDetails?.shopName || 'Unnamed Shop',
                    category: s.shopDetails?.category || 'General',
                    sellerName: s.name,
                    sellerId: s._id.substring(0, 8).toUpperCase(), // Mock seller ID from user ID
                    status: s.verificationStatus === 'approved' ? 'Active' :
                        s.verificationStatus === 'suspended' ? 'Suspended' :
                            s.verificationStatus === 'under_review' ? 'Under Review' : 'Pending',
                    reportsCount: 0, // Mock, needs backend aggregation
                    lastAction: new Date(s.updatedAt).toLocaleDateString(),
                    productsCount: 0, // Mock for now
                    fullData: s
                }));
                // Filter out 'Pending' strictly as per wireframe implication (Marketplace Control)
                setShops(mapped.filter(s => ['Active', 'Suspended', 'Under Review'].includes(s.status)));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShops();
    }, []);

    const executeAction = async () => {
        if (!modalAction) return;

        if (modalAction.type === 'suspend' && !suspendReason.trim()) {
            alert('Suspension reason is required.');
            return;
        }

        setActionLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const newStatus = modalAction.type === 'suspend' ? 'suspended' : 'approved';

            const body = {
                verificationStatus: newStatus,
                reason: modalAction.type === 'suspend' ? suspendReason : 'Reinstated by Admin',
                note: internalNote
            };

            const res = await fetch(`/api/admin/seller/${modalAction.shop.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                fetchShops();
                closeModal();
            } else {
                alert('Action failed');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setModalAction(null);
        setSuspendReason('');
        setInternalNote('');
    };

    // Filter Logic
    const filteredShops = shops.filter(shop => {
        const matchesSearch = shop.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shop.id.includes(searchTerm);
        if (filter === 'All') return matchesSearch;
        return matchesSearch && shop.status === filter;
    });

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Shop Registry...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto space-y-8 bg-[#F2F2F2]">

            {/* 2️⃣ PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Shops</h1>
                <p className="text-sm text-gray-500 mt-1">Manage shop operational status on Aisle</p>
            </div>

            {/* 3️⃣ PRIMARY ACTION ZONE */}
            <div className="bg-white border border-[#CBCBCB] rounded-xl overflow-hidden shadow-sm">

                {/* 4️⃣ FILTER & SEARCH */}
                <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        {['Active', 'Suspended', 'Under Review'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filter === f
                                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Shop Name / ID"
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-gray-400 text-gray-700"
                    />
                </div>

                {/* 5️⃣ TABLE STRUCTURE */}
                <div className="overflow-x-auto">
                    {filteredShops.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-[#CBCBCB]">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">Shop Identity</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/5">Seller</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/6">Status</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/6">Risk Context</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredShops.map((shop) => (
                                    <tr
                                        key={shop.id}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedShopId(shop.id)}
                                    >
                                        {/* COL 1: Shop Identity */}
                                        <td className="p-6 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{shop.shopName}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: SHP-{shop.displayId}</div>
                                            <div className="text-xs text-gray-500 mt-1">Category: {shop.category}</div>
                                        </td>

                                        {/* COL 2: Seller */}
                                        <td className="p-6 align-top">
                                            <div className="text-sm text-gray-900 font-medium">Seller: {shop.sellerName}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: SEL-{shop.sellerId}</div>
                                        </td>

                                        {/* COL 3: Status */}
                                        <td className="p-6 align-top">
                                            {shop.status === 'Suspended' ? (
                                                <span className="text-xs font-bold text-[#4D1717] bg-[#4D1717]/5 px-2 py-1 rounded">Suspended</span>
                                            ) : (
                                                <span className="text-sm text-gray-900">{shop.status}</span>
                                            )}
                                        </td>

                                        {/* COL 4: Risk Context */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Reports: <span className="text-gray-900 font-medium">{shop.reportsCount}</span></p>
                                                <p>Last action: <span className="text-gray-900 font-medium">{shop.lastAction}</span></p>
                                            </div>
                                        </td>

                                        {/* COL 5: Actions */}
                                        <td className="p-6 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-3 items-center">
                                                <button
                                                    onClick={() => navigate('/admin/shops/' + shop.id)}
                                                    className="text-xs text-gray-400 hover:text-gray-900 hover:underline px-2 transition-colors"
                                                >
                                                    View Details
                                                </button>

                                                {shop.status === 'Active' && (
                                                    <button
                                                        onClick={() => setModalAction({ type: 'suspend', shop })}
                                                        className="px-4 py-2 bg-white border border-[#4D1717]/30 text-[#4D1717] hover:bg-[#4D1717]/5 text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Suspend Shop
                                                    </button>
                                                )}
                                                {shop.status === 'Suspended' && (
                                                    <button
                                                        onClick={() => setModalAction({ type: 'reinstate', shop })}
                                                        className="px-4 py-2 bg-[#174D38] text-white hover:bg-[#123d2c] text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Reinstate Shop
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 9️⃣ EMPTY STATE */
                        <div className="py-24 text-center">
                            <h3 className="text-gray-900 font-bold mb-1">No shops available.</h3>
                            <p className="text-sm text-gray-500">System registry is empty for this view.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 6️⃣ INSPECTOR DRAWER */}
            {selectedShopId && Boolean(shops.find(s => s.id === selectedShopId)) && (
                <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 animate-slide-left">
                        <ShopInspector
                            shop={shops.find(s => s.id === selectedShopId).fullData}
                            onClose={() => setSelectedShopId(null)}
                            readOnly={true}
                        />
                    </div>
                </div>
            )}

            {/* 7️⃣ & 8️⃣ MODALS */}
            {modalAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className={`text-lg font-bold ${modalAction.type === 'suspend' ? 'text-[#4D1717]' : 'text-[#174D38]'}`}>
                                {modalAction.type === 'suspend' ? 'Suspend Shop' : 'Reinstate Shop'}
                            </h3>
                            <div className="text-sm text-gray-500 mt-1">Shop: <span className="text-gray-900 font-medium">{modalAction.shop.shopName}</span></div>
                        </div>

                        <div className="p-6">
                            {modalAction.type === 'suspend' ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for suspension (required)</label>
                                        <textarea
                                            value={suspendReason}
                                            onChange={(e) => setSuspendReason(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none h-24 resize-none"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Internal note (optional)</label>
                                        <textarea
                                            value={internalNote}
                                            onChange={(e) => setInternalNote(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-3 text-sm focus:border-gray-900 outline-none h-16 resize-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Suspending will remove this shop from customer discovery.</p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-600 mb-6">
                                    Reinstating will make this shop visible to customers again. Ensure all previous violations are resolved.
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeAction}
                                    disabled={actionLoading || (modalAction.type === 'suspend' && !suspendReason.trim())}
                                    className={`px-5 py-2.5 text-sm font-bold text-white rounded shadow-sm transition-colors ${modalAction.type === 'suspend'
                                        ? 'bg-[#4D1717] hover:bg-[#3d1212] disabled:opacity-50'
                                        : 'bg-[#174D38] hover:bg-[#123d2c] disabled:opacity-50'
                                        }`}
                                >
                                    {actionLoading ? 'Processing...' : (modalAction.type === 'suspend' ? 'Confirm Suspension' : 'Reinstate Shop')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Shops;
