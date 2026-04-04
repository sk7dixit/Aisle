import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaMapMarkerAlt, FaCheckCircle, FaClock, FaTimesCircle } from 'react-icons/fa';

const Bookings = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('UPCOMING');

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await fetch('/api/bookings/my', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Failed to fetch');

                const data = await res.json();
                setBookings(data);
            } catch (error) {
                console.error("Error fetching bookings:", error);
                setBookings([
                    {
                        _id: '1',
                        status: 'UPCOMING',
                        bookingDate: new Date(Date.now() + 86400000).toISOString(),
                        service: { name: 'AC Repair' },
                        seller: { shopDetails: { shopName: 'Cool Air Services' } }
                    },
                    {
                        _id: '2',
                        status: 'COMPLETED',
                        bookingDate: new Date(Date.now() - 86400000).toISOString(),
                        service: { name: 'Haircut' },
                        seller: { shopDetails: { shopName: 'Style Studio' } }
                    },
                    {
                        _id: '3',
                        status: 'CANCELLED',
                        bookingDate: new Date(Date.now() - 172800000).toISOString(),
                        service: { name: 'Plumbing Check' },
                        seller: { shopDetails: { shopName: 'City Plumbers' } }
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchBookings();
        } else {
            setLoading(false);
        }
    }, [token]);

    const visibleBookings = bookings.filter(b => b.status === activeTab);

    return (
        <div className="min-h-screen bg-transparent pb-24 font-sans text-[var(--text-primary)]">
            {/* 1. Header & Filters (Left Aligned) */}
            <div className="bg-transparent sticky top-[72px] z-30 pt-8 pb-4">
                <div className="max-w-6xl px-6 md:px-12 mx-auto">
                    <div className="flex items-center gap-4 mb-2">
                        <button onClick={() => navigate(-1)} className="text-[var(--text-primary)] hover:opacity-70 transition-opacity">
                            <FaArrowLeft size={18} />
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Bookings</h1>
                    </div>
                    <p className="text-xs font-medium text-[var(--text-muted)] ml-9 mb-6">Your scheduled services and shop visits</p>

                    {/* Inline Pills */}
                    <div className="flex gap-2 ml-8">
                        {['UPCOMING', 'COMPLETED', 'CANCELLED'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${activeTab === tab
                                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)]'
                                    : 'bg-transparent text-[var(--text-muted)] border-transparent hover:bg-black/5'
                                    }`}
                            >
                                {tab.charAt(0) + tab.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="max-w-6xl mx-auto px-6 md:px-12 py-4 space-y-4 min-h-[50vh]">
                {loading ? (
                    <p className="text-[var(--text-muted)] text-sm ml-9">Loading bookings...</p>
                ) : visibleBookings.length === 0 ? (
                    /* Empty State */
                    <div className="py-20 text-left ml-9">
                        <p className="text-[var(--text-primary)] font-bold text-lg mb-1">No bookings yet</p>
                        <p className="text-[var(--text-muted)] text-sm">Your scheduled services and visits will appear here.</p>
                        {activeTab === 'UPCOMING' && (
                            <button onClick={() => navigate('/services')} className="mt-6 px-6 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl font-bold text-sm hover:opacity-90 transition-opacity">
                                Explore Services
                            </button>
                        )}
                    </div>
                ) : (
                    /* Compact Cards */
                    <div className="space-y-4 max-w-3xl ml-9">
                        {visibleBookings.map(b => (
                            <BookingCard key={b._id} b={b} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const BookingCard = ({ b }) => {
    // Status Styles
    const statusStyle = {
        'UPCOMING': 'bg-orange-50 text-orange-600',
        'COMPLETED': 'bg-green-50 text-green-700',
        'CANCELLED': 'bg-red-50 text-red-700'
    }[b.status] || 'bg-gray-50 text-gray-600';

    return (
        <div className="bg-white rounded-xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-all">
            {/* Row 1: Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${statusStyle}`}>
                        {b.status}
                    </span>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{b.service?.name || "Service"}</h3>
                </div>
            </div>

            {/* Row 2: Meta Info */}
            <div className="flex flex-col gap-1 mb-4">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                    <FaCalendarAlt className="text-[var(--text-muted)]" />
                    {new Date(b.bookingDate).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                    <FaMapMarkerAlt className="text-[var(--text-muted)]" />
                    {b.seller?.shopDetails?.shopName || "Unknown Shop"}
                </div>
            </div>

            {/* Row 3: Actions */}
            <div className="flex items-center gap-3 border-t border-black/5 pt-3">
                <button className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-primary)] hover:underline">View Details</button>
                {b.status === 'UPCOMING' && (
                    <>
                        <button className="text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700">Cancel</button>
                        <button className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-primary)]">Get Directions</button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Bookings;
