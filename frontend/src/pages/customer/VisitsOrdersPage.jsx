import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaArrowLeft, FaCheckCircle, FaClock, FaTimesCircle, FaWalking, FaHistory, FaQrcode, FaBox } from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';
import EReceiptModal from '../../components/customer/EReceiptModal';
import RatingForm from '../../components/customer/RatingForm';

const VisitsOrdersPage = () => {
    const navigate = useNavigate();
    const { token } = useAuth();
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' 

    const [selectedQR, setSelectedQR] = useState(null);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [ratingItem, setRatingItem] = useState(null);

    const fetchVisits = async () => {
        try {
            const res = await fetch('/api/customer-visits/my-visits', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setVisits(data);
            }
        } catch (error) {
            console.error("Fetch Visits Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisits();
    }, [token]);

    // Derived Logic
    const activeVisits = visits.filter(v => ['UPCOMING', 'ARRIVED'].includes(v.visitStatus));
    const completedVisits = visits.filter(v => ['COMPLETED', 'CANCELLED'].includes(v.visitStatus));

    const getItems = () => {
        return activeTab === 'active' ? activeVisits : completedVisits;
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading activity...</div>;

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
            {/* Header */}
            <div className="bg-white sticky top-[72px] z-30 pt-4 pb-4 border-b border-slate-100 shadow-sm">
                <div className="max-w-xl mx-auto px-6">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={() => navigate(-1)} className="text-slate-600 hover:text-slate-900 transition-colors">
                            <FaArrowLeft size={16} />
                        </button>
                        <h1 className="text-xl font-bold tracking-tight text-slate-800">My Activity</h1>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-6">
                        {['active', 'completed'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`text-xs font-bold uppercase tracking-widest pb-2 transition-all relative ${activeTab === tab
                                    ? 'text-slate-900'
                                    : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-slate-900"></div>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="max-w-xl mx-auto px-6 py-4 space-y-4">
                {getItems().length === 0 ? (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                            {activeTab === 'active' ? <FaWalking size={24} /> : <FaHistory size={24} />}
                        </div>
                        <h3 className="text-slate-500 font-bold text-sm">No {activeTab} visits</h3>
                    </div>
                ) : (
                    getItems().map((visit) => (
                        <div key={visit.visitId} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                            {/* Status Stripe */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${visit.visitStatus === 'COMPLETED' ? 'bg-emerald-500' :
                                    visit.visitStatus === 'ARRIVED' ? 'bg-orange-500' : 'bg-blue-500'
                                }`}></div>

                            <div className="flex justify-between items-start mb-2 pl-3">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                                        {new Date(visit.visitTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </p>
                                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{visit.shopName}</h3>
                                    <p className="text-xs text-slate-500 truncate max-w-[200px]">{visit.shopAddress}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${visit.paymentMode === 'PAID_ONLINE' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {visit.paymentMode === 'PAID_ONLINE' ? 'Paid' : 'Pay at Shop'}
                                </span>
                            </div>

                            {/* Products Preview */}
                            <div className="pl-3 mt-4 space-y-1 mb-4">
                                {visit.products.slice(0, 2).map((p, idx) => (
                                    <div key={idx} className="flex items-center text-xs text-slate-600">
                                        <span className="w-1 h-1 bg-slate-300 rounded-full mr-2"></span>
                                        <span className="font-medium mr-1">{p.name}</span>
                                        <span className="text-slate-400">× {p.qty}</span>
                                    </div>
                                ))}
                                {visit.products.length > 2 && (
                                    <p className="text-[10px] text-slate-400 italic pl-3">+ {visit.products.length - 2} more items</p>
                                )}
                            </div>

                            {/* Status & Action */}
                            <div className="pl-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {visit.visitStatus === 'COMPLETED' ? (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                            <FaCheckCircle /> Completed
                                        </span>
                                    ) : visit.visitStatus === 'ARRIVED' ? (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                                            <FaClock /> Arrived
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                                            <FaWalking /> Upcoming
                                        </span>
                                    )}
                                </div>

                                {/* QR Button: ONLY if UPCOMING */}
                                {visit.visitStatus === 'UPCOMING' && visit.qrToken && (
                                    <button
                                        onClick={() => setSelectedQR(visit)}
                                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md active:scale-95"
                                    >
                                        <FaQrcode /> View Pass
                                    </button>
                                )}

                                {/* Receipt mostly for Completed */}
                                {visit.visitStatus === 'COMPLETED' && (
                                    <button
                                        onClick={() => setSelectedReceipt(visit)}
                                        className="text-xs font-bold text-slate-500 hover:text-slate-900"
                                    >
                                        View Receipt
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* QR View Modal */}
            {selectedQR && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-fade-in">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative animate-scale-in text-center shadow-2xl">
                        <button onClick={() => setSelectedQR(null)} className="absolute top-4 right-4 text-slate-300 hover:text-slate-500">
                            <FaTimesCircle size={24} />
                        </button>

                        <h3 className="text-xl font-black text-slate-800 mb-1">{selectedQR.shopName}</h3>
                        <p className="text-sm text-slate-500 mb-6">Show this QR to the shopkeeper</p>

                        <div className="bg-white p-4 border-2 border-slate-900 rounded-2xl inline-block mb-6 relative">
                            {/* Corner Accents */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-slate-900 -mt-2 -ml-2"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-slate-900 -mt-2 -mr-2"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-slate-900 -mb-2 -ml-2"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-slate-900 -mb-2 -mr-2"></div>

                            <QRCodeSVG value={JSON.stringify({ qrToken: selectedQR.qrToken })} size={200} />
                        </div>

                        <p className="text-xs font-mono bg-slate-100 py-2 px-4 rounded-lg text-slate-500 tracking-widest uppercase">
                            TOKEN: {selectedQR.qrToken.substring(0, 8)}...
                        </p>
                    </div>
                </div>
            )}

            {/* Receipt Modal Wrapper */}
            {selectedReceipt && (
                <EReceiptModal
                    visit={selectedReceipt} // Pass mapped object, EReceipt might need adapting if structure differs wildly
                    order={selectedReceipt} // Compatibility alias
                    onClose={() => setSelectedReceipt(null)}
                />
            )}
        </div>
    );
};

export default VisitsOrdersPage;
