import React from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaLock, FaDownload, FaShareAlt, FaStore, FaClock, FaCalendarAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const EReceiptModal = ({ visit, onClose, onRate }) => {
    const { user } = useAuth();
    if (!visit) return null;

    const visitId = `SL-VST-${(visit.visitId || visit.id || '000000').slice(-6).toUpperCase()}`;

    // Payment Logic based on Visit Status
    const getPaymentStatus = () => {
        if (visit.paymentStatus === 'PAID') return { mode: 'Paid Online', status: 'Fully Processed' };
        if (visit.isService) return { mode: 'No Payment Required', status: 'Consultation Only' };
        return { mode: 'Pay on Visit', status: 'Handled at Store' };
    };

    const payment = getPaymentStatus();

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-start justify-center p-4 pt-32 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-[360px] overflow-hidden shadow-2xl animate-in fade-in duration-300 relative my-auto">
                {/* ... existing receipt content ... */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors z-10 p-1"
                >✕</button>

                <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto scrollbar-hide">
                    <div className="text-center pt-2">
                        <h2 className="text-lg font-black text-black tracking-tight leading-tight">{visit.shopName}</h2>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-1">
                            <FaCheckCircle size={10} /> Visit Completed
                        </div>
                    </div>

                    <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                            <p className="font-bold text-black text-xs leading-none">{user?.name || "Customer"}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID</p>
                            <p className="font-mono text-[10px] font-black text-gray-500 leading-none">{visitId}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-1">
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</p>
                            <p className="text-[11px] font-bold text-black">{new Date(visit.visitDate || visit.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Time</p>
                            <p className="text-[11px] font-bold text-black">{visit.visitTime || '11:00 AM'}</p>
                        </div>
                    </div>

                    <div className="space-y-2 border-t border-gray-50 pt-4">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Items</p>
                        <ul className="space-y-1.5">
                            {visit.items && visit.items.length > 0 ? (
                                visit.items.map((item, idx) => (
                                    <li key={idx} className="flex justify-between text-[11px] font-bold text-black leading-tight">
                                        <span className="opacity-80 flex items-start gap-1.5">
                                            <span className="opacity-30">•</span> {item.productName}
                                        </span>
                                        <span className="shrink-0 ml-4 opacity-50">×{item.quantity || 1}</span>
                                    </li>
                                ))
                            ) : (
                                <li className="flex justify-between text-[11px] font-bold text-black leading-tight">
                                    <span className="opacity-80 flex items-start gap-1.5">
                                        <span className="opacity-30">•</span> {visit.productName}
                                    </span>
                                    <span className="shrink-0 ml-4 opacity-50">×{visit.quantity || 1}</span>
                                </li>
                            )}
                        </ul>
                    </div>

                    <div className="pt-2">
                        <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                            Payment: <span className="text-gray-600">{payment.mode}</span> · <span className="text-gray-600">{payment.status}</span>
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 opacity-80 py-1">
                        <FaLock size={8} className="text-emerald-500" />
                        <span>Visited at {visit.shopName}</span>
                    </div>

                    <div className="flex flex-col gap-3 pt-3">
                        <button className="w-full flex items-center justify-center gap-2 h-11 bg-slate-800 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-slate-900/10">
                            <FaDownload size={12} /> Download Receipt (PDF)
                        </button>

                        <div className="flex items-center justify-center gap-6 pt-1">
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-black transition-colors">
                                Share
                            </button>
                            <button
                                onClick={() => { onClose(); onRate(); }}
                                className="text-[10px] font-black text-[var(--accent-orange)] uppercase tracking-widest hover:underline"
                            >
                                Rate
                            </button>
                            <button className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-rose-600 transition-colors">
                                Report Issue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EReceiptModal;
