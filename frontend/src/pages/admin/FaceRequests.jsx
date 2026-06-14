import React, { useState, useEffect } from 'react';
import GlassCard from '../../components/ui/GlassCard';

/* 
  STEP 14 - FACE REQUESTS WIREFRAME EXECUTION
  Strict layout adherence.
  Identity Security Context.
*/

const FaceRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Pending'); // Pending | Approved | Rejected
    const [selectedRequest, setSelectedRequest] = useState(null); // Review Modal
    const [rejectAction, setRejectAction] = useState(false); // Reject sub-modal state
    const [rejectReason, setRejectReason] = useState('');

    const user = JSON.parse(localStorage.getItem('aisleUser') || '{}');
    const role = user.role?.toLowerCase() || 'visitor';

    const fetchRequests = async () => {
        try {
            const token = user.token;
            // Correct Port 5000
            const res = await fetch('/api/admin/face-requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const mapped = data.map(r => ({
                    id: r._id,
                    displayId: r._id.substring(r._id.length - 8).toUpperCase(),
                    name: r.sellerId?.name || 'Unknown',
                    shopName: r.sellerId?.shopDetails?.shopName || 'Unknown Shop',
                    reason: r.reason || 'Verification',
                    submittedDate: new Date(r.createdAt).toLocaleDateString(),
                    prevStatus: r.currentFaceData ? 'Verified' : 'New Enrolment',
                    imagesCount: r.newFaceData ? 1 : 0,
                    prevRecord: r.currentFaceData ? 'Available' : 'None',
                    currentFace: r.currentFaceData,
                    newFace: r.newFaceData,
                    status: r.status.charAt(0).toUpperCase() + r.status.slice(1).toLowerCase() // Normalize to 'Pending', 'Approved', 'Rejected'
                }));
                // Filter only Pending logic handled by backend usually, but here we can double check
                setRequests(mapped);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (action) => {
        if (!selectedRequest) return;
        const id = selectedRequest.id;

        try {
            const token = user.token;
            const status = action === 'approve' ? 'APPROVED' : 'REJECTED';

            const res = await fetch(`/api/admin/face-requests/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, reason: rejectReason })
            });

            if (res.ok) {
                fetchRequests();
                closeReview();
            } else {
                const d = await res.json();
                alert(d.message || 'Action failed');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const closeReview = () => {
        setSelectedRequest(null);
        setRejectAction(false);
        setRejectReason('');
    };

    // Filter Logic
    const filteredRequests = requests.filter(r =>
        filter === 'All' ? true : r.status === filter
    );

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Identity Queue...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto space-y-8 bg-[#F2F2F2]">

            {/* 2️⃣ PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Face Verification Requests</h1>
                <p className="text-sm text-gray-500 mt-1">Review identity verification requests from sellers</p>
            </div>

            {/* 3️⃣ PRIMARY ACTION ZONE */}
            <div className="bg-white border border-[#CBCBCB] rounded-xl overflow-hidden shadow-sm">

                {/* 4️⃣ FILTER & SEARCH */}
                <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        {['Pending', 'Approved', 'Rejected'].map(f => (
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
                        placeholder="Search by Seller ID"
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-gray-400 text-gray-700"
                    />
                </div>

                {/* 5️⃣ TABLE STRUCTURE */}
                <div className="overflow-x-auto">
                    {filteredRequests.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-[#CBCBCB]">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">Seller Identity</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">Request Context</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">Evidence</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors group">
                                        {/* COL 1: Seller Identity */}
                                        <td className="p-6 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{req.name}</div>
                                            <div className="text-gray-500 text-xs mt-1">Shop: <span className="text-gray-900">{req.shopName}</span></div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: {req.displayId}</div>
                                        </td>

                                        {/* COL 2: Request Context */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Reason: <span className="text-gray-900 font-medium">{req.reason}</span></p>
                                                <p>Submitted: <span className="text-gray-900 font-medium">{req.submittedDate}</span></p>
                                                <p>Prev Status: <span className="text-gray-900 font-medium">{req.prevStatus}</span></p>
                                            </div>
                                        </td>

                                        {/* COL 3: Evidence Indicator */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Images submitted: <span className="text-gray-900 font-bold">{req.imagesCount}</span></p>
                                                <p>Previous record: <span className="text-gray-900 font-medium">{req.prevRecord}</span></p>
                                            </div>
                                        </td>

                                        {/* COL 4: Actions */}
                                        <td className="p-6 align-top text-right">
                                            {role !== 'moderator' ? (
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => { setSelectedRequest(req); setRejectAction(true); }}
                                                        className="px-4 py-2 bg-white border border-[#4D1717]/30 text-[#4D1717] hover:bg-[#4D1717]/5 text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedRequest(req); setRejectAction(false); }}
                                                        className="px-4 py-2 bg-[#174D38] text-white hover:bg-[#123d2c] text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Review & Approve
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end">
                                                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded">View Only</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 🔟 EMPTY STATE */
                        <div className="py-24 text-center">
                            <h3 className="text-gray-900 font-bold mb-1">No face verification requests pending.</h3>
                            <p className="text-sm text-gray-500">Identity trust is stable.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 7️⃣ & 9️⃣ REVIEW / REJECT MODAL */}
            {selectedRequest && !rejectAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">Face Verification Review</h3>
                            <div className="text-xs text-gray-500">Last verified: {selectedRequest.prevRecord === 'Available' ? '02 Nov 2025' : 'Never'}</div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Images Panel */}
                            <div className="w-2/3 bg-gray-100 p-8 overflow-y-auto flex flex-col gap-8 items-center justify-center">
                                <div className="flex gap-12 items-end">
                                    <div className="flex flex-col items-center">
                                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Previous Verified</div>
                                        <div className="w-48 h-48 bg-gray-200 rounded-lg border-2 border-gray-300 overflow-hidden flex items-center justify-center">
                                            {selectedRequest.currentFace ? (
                                                <img
                                                    src={typeof selectedRequest.currentFace === 'string' && selectedRequest.currentFace.startsWith('blob') ? selectedRequest.currentFace : selectedRequest.currentFace}
                                                    className="w-full h-full object-cover grayscale opacity-80"
                                                    alt="Reference"
                                                />
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">No Record</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="pb-20 text-gray-400">→</div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-xs font-bold text-[#174D38] uppercase tracking-wider mb-2">Current Submission</div>
                                        <div className="w-64 h-64 bg-black rounded-lg border-4 border-[#174D38] overflow-hidden shadow-xl relative">
                                            <img src={selectedRequest.newFace} className="w-full h-full object-cover" alt="Candidate" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Panel */}
                            <div className="w-1/3 bg-white p-6 border-l border-gray-200 flex flex-col">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Seller Summary</h4>
                                <div className="space-y-4 mb-8">
                                    <div><div className="text-xs text-gray-500">Name</div><div className="font-bold text-gray-900">{selectedRequest.name}</div></div>
                                    <div><div className="text-xs text-gray-500">Shop</div><div className="font-bold text-gray-900">{selectedRequest.shopName}</div></div>
                                    <div><div className="text-xs text-gray-500">Total Verifications</div><div className="font-bold text-gray-900">1</div></div>
                                </div>

                                <div className="mt-auto">
                                    <p className="text-sm text-gray-600 mb-4 bg-green-50 p-3 rounded border border-green-100">
                                        Approving confirms this seller’s identity matches their record.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        {/* HIDE ACTIONS FOR MODS */}
                                        {role !== 'moderator' ? (
                                            <>
                                                <button
                                                    onClick={() => handleAction('approve')}
                                                    className="w-full py-3 bg-[#174D38] text-white font-bold rounded shadow-md hover:bg-[#123d2c] transition-all"
                                                >
                                                    Confirm Approval
                                                </button>
                                                <button
                                                    onClick={closeReview}
                                                    className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded hover:bg-gray-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={closeReview}
                                                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded hover:bg-gray-200 transition-colors"
                                            >
                                                Close (View Only)
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REJECT MODAL */}
            {selectedRequest && rejectAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-red-100 bg-red-50/50">
                            <h3 className="text-lg font-bold text-[#4D1717]">Reject Identity Verification</h3>
                            <p className="text-sm text-gray-600 mt-1">Rejecting may restrict seller operations.</p>
                        </div>
                        <div className="p-6">
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for rejection (required)</label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="w-full border border-gray-300 rounded p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none h-32 resize-none"
                                placeholder="E.g. Face mismatch, poor quality..."
                            />

                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={closeReview}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleAction('reject')}
                                    disabled={!rejectReason.trim()}
                                    className="px-5 py-2.5 text-sm font-bold text-white bg-[#4D1717] hover:bg-[#3d1212] rounded shadow-sm transition-colors disabled:opacity-50"
                                >
                                    Reject Identity
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default FaceRequests;
