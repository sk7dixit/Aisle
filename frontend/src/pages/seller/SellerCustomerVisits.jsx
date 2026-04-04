import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaCheckCircle, FaClock, FaMapMarkerAlt, FaMobileAlt, FaBox, FaQrcode, FaTimes, FaMoneyBillWave } from 'react-icons/fa';
import QRScannerModal from '../../components/seller/QRScannerModal';

const SellerCustomerVisits = () => {
    const { token } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    // Scan & Action State
    const [showScanner, setShowScanner] = useState(false);
    const [actionModal, setActionModal] = useState(null); // { type, message, visitId, ... }
    const [processing, setProcessing] = useState(false);

    const fetchVisits = async () => {
        try {
            const res = await fetch('/api/seller/customer-visits', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('Failed to fetch visits');
            }

            const data = await res.json();
            setVisits(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setVisits([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, []); // 👈 REQUIRED: No dependencies unless strictly needed

    // 1. Handle QR Scan
    const handleScanSuccess = async (decodedText) => {
        setShowScanner(false);
        setProcessing(true);

        try {
            // Parse if JSON, else take as string token
            let qrToken = decodedText;
            try {
                const parsed = JSON.parse(decodedText);
                if (parsed.qrToken) qrToken = parsed.qrToken;
                // If legacy format (orderId mapped to visitId internally by backend virtual, but we need token or ID)
                // For this Step 3, we rely on the backend finding it via Token.
                // If old QR payload, it might be tricky. 
                // Assumption: New CustomerVisit creates a specialized token.
                // Backend controller expects { qrToken }. 
                // If the QR contains valid JSON with other props, we extract token if present, else send raw.
            } catch (e) {
                // Raw string
            }

            const res = await fetch('/api/customer-visits/scan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ qrToken })
            });

            const data = await res.json();

            if (res.ok) {
                // Success - Show Action Modal
                if (data.type === 'INFO') {
                    alert(data.message); // Simple alert for "Already Completed"
                } else {
                    setActionModal(data); // { type: 'PAID'|'PAY_ON_VISIT', message, visitId, action }
                    fetchStats(); // Update list background
                }
            } else {
                alert(data.message || "Scan Failed");
            }

        } catch (error) {
            console.error("Scan Error:", error);
            alert("Network Error during Scan");
        } finally {
            setProcessing(false);
        }
    };

    // 2. Complete Visit
    const handleComplete = async () => {
        if (!actionModal?.visitId) return;
        setProcessing(true);
        try {
            const res = await fetch(`/api/customer-visits/${actionModal.visitId}/complete`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setActionModal(null); // Close Modal
                fetchVisits(); // Refresh List
                // alert("Visit Completed!"); // Optional toast
            } else {
                alert(data.message || "Completion Failed");
            }
        } catch (error) {
            console.error("Complete Error:", error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading visits...</div>;

    return (
        <div className="space-y-4 animate-fade-in-up pb-24 relative min-h-screen">
            {/* Header */}
            <header className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Customer Activity</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{visits.length} Active</span>
            </header>

            {/* Empty State */}
            {visits.length === 0 && (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaUser size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">No Upcoming Visits</h3>
                    <p className="text-slate-500 text-sm">Customers will appear here when they plan a visit.</p>
                </div>
            )}

            {/* Visit Cards */}
            <div className="grid gap-4">
                {visits.map(visit => {
                    const isCompleted = visit.visitStatus === 'COMPLETED';
                    const isPaid = visit.paymentStatus === 'COMPLETED';
                    const isArrived = visit.visitStatus === 'ARRIVED';

                    return (
                        <div key={visit.visitId} className={`bg-white rounded-2xl p-5 border shadow-sm relative overflow-hidden transition-all ${isCompleted ? 'opacity-60 border-slate-100' : isArrived ? 'border-emerald-200 ring-1 ring-emerald-500 ring-offset-2' : 'border-slate-100'}`}>
                            {/* Status Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full ${isCompleted ? 'bg-slate-300' : isArrived ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>

                            <div className="flex justify-between items-start mb-4 pl-3">
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{visit.customerName}</h3>
                                    {visit.customerMobile && (
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                                            <FaMobileAlt className="text-slate-400" />
                                            {visit.customerMobile}
                                        </div>
                                    )}
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">
                                        {new Date(visit.visitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {visit.paymentMode === 'PAY_ON_VISIT' ? 'Pay on Visit' : 'Prepaid'}
                                    </span>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="pl-3 mb-4 space-y-2">
                                {visit.products.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg">
                                        {p.image ? (
                                            <img src={p.image} alt={p.name} className="w-8 h-8 rounded bg-white object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-slate-300 text-xs">
                                                <FaBox />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-slate-700 line-clamp-1">{p.name}</p>
                                            <p className="text-[10px] text-slate-500">Qty: {p.qty} × ₹{p.price}</p>
                                        </div>
                                        <div className="text-xs font-black text-slate-800">
                                            ₹{p.price * p.qty}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer Status */}
                            <div className="pl-3 flex items-center gap-4 text-xs font-bold border-t border-slate-50 pt-3">
                                <div className={`flex items-center gap-1.5 ${isCompleted ? 'text-slate-500' : isArrived ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {isCompleted ? <FaCheckCircle /> : <FaMapMarkerAlt />}
                                    <span className="uppercase tracking-wider">{visit.visitStatus}</span>
                                </div>

                                <div className="ml-auto text-slate-400">
                                    Total: <span className="text-slate-800 text-sm font-black ml-1">₹{visit.totalAmount}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Floating Scan Button */}
            <div className="fixed bottom-24 right-6 z-30">
                <button
                    onClick={() => setShowScanner(true)}
                    className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-900/40 hover:scale-105 active:scale-95 transition-all border-2 border-slate-700"
                >
                    <FaQrcode size={28} />
                </button>
            </div>

            {/* QR Scanner Modal */}
            {showScanner && (
                <QRScannerModal
                    onScan={handleScanSuccess}
                    onClose={() => setShowScanner(false)}
                />
            )}

            {/* Action Modal (PAID / PAY ON VISIT) */}
            {actionModal && (
                <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-slide-up relative overflow-hidden">

                        {/* Header Color Strip */}
                        <div className={`absolute top-0 left-0 w-full h-2 ${actionModal.type === 'PAID' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>

                        <button
                            onClick={() => setActionModal(null)}
                            className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 p-2"
                        >
                            <FaTimes size={20} />
                        </button>

                        <div className="text-center pt-4 mb-6">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${actionModal.type === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                                }`}>
                                {actionModal.type === 'PAID' ? <FaCheckCircle size={40} /> : <FaMoneyBillWave size={40} />}
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-2">
                                {actionModal.type === 'PAID' ? "Payment Completed" : "Collect Payment"}
                            </h3>

                            <p className="text-slate-500 font-medium leading-relaxed">
                                {actionModal.message}
                            </p>

                            <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Total Amount</p>
                                <p className="text-3xl font-black text-slate-900">₹{actionModal.totalAmount}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleComplete}
                            disabled={processing}
                            className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg shadow-slate-200 transform transition-all active:scale-95 ${actionModal.type === 'PAID' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
                                }`}
                        >
                            {processing ? "Processing..." : "Mark Visit Completed"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerCustomerVisits;
