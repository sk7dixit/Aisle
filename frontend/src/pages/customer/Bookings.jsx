import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    FaArrowLeft, 
    FaCalendarAlt, 
    FaMapMarkerAlt, 
    FaCheckCircle, 
    FaClock, 
    FaTimesCircle,
    FaFilter,
    FaCheck,
    FaTimes
} from 'react-icons/fa';

const Bookings = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('UPCOMING');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTime, setSelectedTime] = useState('All Time');

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
                // Pre-populate with diverse mock data for full filter capabilities in dev/fallback
                setBookings([
                    {
                        _id: '1',
                        status: 'UPCOMING',
                        bookingDate: new Date(Date.now() + 3600000).toISOString(), // Today
                        service: { name: 'AC Repair' },
                        seller: { shopDetails: { shopName: 'Cool Air Services' } },
                        notes: 'Please call before arrival.'
                    },
                    {
                        _id: '2',
                        status: 'COMPLETED',
                        bookingDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                        service: { name: 'Haircut' },
                        seller: { shopDetails: { shopName: 'Style Studio' } }
                    },
                    {
                        _id: '3',
                        status: 'CANCELLED',
                        bookingDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
                        service: { name: 'Plumbing Check' },
                        seller: { shopDetails: { shopName: 'City Plumbers' } }
                    },
                    {
                        _id: '4',
                        status: 'COMPLETED',
                        bookingDate: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
                        service: { name: 'Deep Home Cleaning' },
                        seller: { shopDetails: { shopName: 'PureClean Co.' } }
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

    // Classification Helpers
    const getBookingType = (b) => {
        const name = b.service?.name?.toLowerCase() || '';
        if (!b.service?.name) return 'Shop Visits';
        if (name.includes('repair') || name.includes('plumbing') || name.includes('cleaning') || name.includes('home')) {
            return 'Home Services';
        }
        return 'Services';
    };

    const isToday = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    const isThisWeek = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return d >= startOfWeek && d <= endOfWeek;
    };

    const isThisMonth = (dateStr) => {
        const d = new Date(dateStr);
        const today = new Date();
        return d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    // Calculate Counts dynamically based on current Category and Time filter
    const getTabCount = (status) => {
        return bookings.filter(b => {
            if (b.status !== status) return false;

            // Apply Category filter
            if (selectedCategory !== 'All') {
                const bType = getBookingType(b);
                if (bType !== selectedCategory) return false;
            }

            // Apply Time filter
            if (selectedTime === 'Today') {
                return isToday(b.bookingDate);
            } else if (selectedTime === 'This Week') {
                return isThisWeek(b.bookingDate);
            } else if (selectedTime === 'This Month') {
                return isThisMonth(b.bookingDate);
            }

            return true;
        }).length;
    };

    const upcomingCount = getTabCount('UPCOMING');
    const completedCount = getTabCount('COMPLETED');
    const cancelledCount = getTabCount('CANCELLED');

    // Filter Bookings list for active display
    const filteredBookings = bookings.filter(b => {
        if (b.status !== activeTab) return false;

        // Apply Category filter
        if (selectedCategory !== 'All') {
            const bType = getBookingType(b);
            if (bType !== selectedCategory) return false;
        }

        // Apply Time filter
        if (selectedTime === 'Today') {
            return isToday(b.bookingDate);
        } else if (selectedTime === 'This Week') {
            return isThisWeek(b.bookingDate);
        } else if (selectedTime === 'This Month') {
            return isThisMonth(b.bookingDate);
        }

        return true;
    });

    // Grouping by Date for Timeline View
    const formatDateHeader = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const groupedBookings = {};
    filteredBookings.forEach(b => {
        const dateHeader = formatDateHeader(b.bookingDate);
        if (!groupedBookings[dateHeader]) {
            groupedBookings[dateHeader] = [];
        }
        groupedBookings[dateHeader].push(b);
    });

    const sortedDates = Object.keys(groupedBookings).sort((a, b) => {
        if (activeTab === 'UPCOMING') {
            return new Date(a) - new Date(b); // Soonest first
        } else {
            return new Date(b) - new Date(a); // Most recent first
        }
    });

    return (
        <div 
            className="bookings-container min-h-screen pb-24 font-sans text-stone-800 transition-all"
            style={{
                background: 'linear-gradient(180deg, #fafbff 0%, #f5f7ff 100%)'
            }}
        >
            <div className="max-w-[1400px] mx-auto px-6 md:px-12 pt-8 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-start gap-4">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-3 bg-white rounded-2xl border border-stone-100 shadow-sm text-stone-600 hover:text-stone-900 hover:bg-stone-50 hover:shadow-md transition-all duration-300 mt-1"
                        >
                            <FaArrowLeft size={16} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="text-3xl">📅</span>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900">
                                    Bookings
                                </h1>
                            </div>
                            <p className="text-sm font-medium text-stone-500 mt-2 max-w-xl">
                                Manage all your appointments, service requests and shop visits.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Statistics Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Card 1: Upcoming */}
                    <div 
                        onClick={() => setActiveTab('UPCOMING')}
                        className={`cursor-pointer p-6 rounded-3xl border backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 ${activeTab === 'UPCOMING' ? 'bg-orange-50/70 border-orange-200 shadow-md ring-1 ring-orange-200/50' : 'bg-white/60 border-stone-100 hover:border-stone-200 hover:shadow-md'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-orange-600">Upcoming</span>
                            <span className="p-2 bg-orange-100/50 text-orange-600 rounded-xl">
                                <FaCalendarAlt size={16} />
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold text-stone-900">{upcomingCount}</div>
                        <p className="text-xs text-stone-400 mt-1">Scheduled appointments</p>
                    </div>

                    {/* Card 2: Completed */}
                    <div 
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`cursor-pointer p-6 rounded-3xl border backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 ${activeTab === 'COMPLETED' ? 'bg-green-50/70 border-green-200 shadow-md ring-1 ring-green-200/50' : 'bg-white/60 border-stone-100 hover:border-stone-200 hover:shadow-md'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-green-700">Completed</span>
                            <span className="p-2 bg-green-100/50 text-green-700 rounded-xl">
                                <FaCheckCircle size={16} />
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold text-stone-900">{completedCount}</div>
                        <p className="text-xs text-stone-400 mt-1">Finished visits</p>
                    </div>

                    {/* Card 3: Cancelled */}
                    <div 
                        onClick={() => setActiveTab('CANCELLED')}
                        className={`cursor-pointer p-6 rounded-3xl border backdrop-blur-md transition-all duration-300 transform hover:-translate-y-1 ${activeTab === 'CANCELLED' ? 'bg-red-50/70 border-red-200 shadow-md ring-1 ring-red-200/50' : 'bg-white/60 border-stone-100 hover:border-stone-200 hover:shadow-md'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-red-700">Cancelled</span>
                            <span className="p-2 bg-red-100/50 text-red-700 rounded-xl">
                                <FaTimesCircle size={16} />
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold text-stone-900">{cancelledCount}</div>
                        <p className="text-xs text-stone-400 mt-1">Revoked visits</p>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-white/45 border border-stone-200/40 rounded-3xl p-4 backdrop-blur-md shadow-sm">
                    {/* Category Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-stone-400 mr-2 flex items-center gap-1.5">
                            <FaFilter size={10} /> Type:
                        </span>
                        {['All', 'Services', 'Shop Visits', 'Home Services'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === cat ? 'bg-stone-900 text-white shadow-sm' : 'bg-white/60 text-stone-600 border border-stone-100 hover:bg-stone-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Time Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-stone-400 mr-2">
                            Date:
                        </span>
                        {['All Time', 'Today', 'This Week', 'This Month'].map(time => (
                            <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedTime === time ? 'bg-stone-900 text-white shadow-sm' : 'bg-white/60 text-stone-600 border border-stone-100 hover:bg-stone-50'}`}
                            >
                                {time}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active Tabs Navigation */}
                <div className="flex gap-4 border-b border-stone-200/60 pb-4 mb-8">
                    <button
                        onClick={() => setActiveTab('UPCOMING')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold tracking-tight transition-all duration-300 ${activeTab === 'UPCOMING' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
                    >
                        <span>📅 Upcoming</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === 'UPCOMING' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>{upcomingCount}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('COMPLETED')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold tracking-tight transition-all duration-300 ${activeTab === 'COMPLETED' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
                    >
                        <span>✓ Completed</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === 'COMPLETED' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>{completedCount}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('CANCELLED')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold tracking-tight transition-all duration-300 ${activeTab === 'CANCELLED' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'}`}
                    >
                        <span>✕ Cancelled</span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === 'CANCELLED' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>{cancelledCount}</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="py-4 min-h-[40vh]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <p className="text-stone-500 text-sm animate-pulse">Loading your appointments...</p>
                        </div>
                    ) : filteredBookings.length === 0 ? (
                        /* Centered Empty State */
                        <div className="flex flex-col items-center justify-center py-20 text-center max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                            <div className="w-24 h-24 bg-white rounded-full border border-stone-100 flex items-center justify-center mb-6 text-stone-400 shadow-md">
                                <span className="text-4xl">📅</span>
                            </div>
                            <h2 className="text-2xl font-extrabold text-stone-900 mb-2">No Bookings Yet</h2>
                            <p className="text-sm text-stone-500 leading-relaxed mb-8 max-w-sm">
                                Book a service, reserve a slot, or schedule a shop visit. Your upcoming appointments will appear here.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md px-6">
                                <button
                                    onClick={() => navigate('/services')}
                                    className="flex-1 py-3 bg-stone-900 text-white rounded-2xl font-bold text-sm hover:bg-stone-800 transition-all duration-300 shadow-lg shadow-stone-900/10 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Explore Services
                                </button>
                                <button
                                    onClick={() => navigate('/shops')}
                                    className="flex-1 py-3 bg-white border border-stone-200 text-stone-800 rounded-2xl font-bold text-sm hover:bg-stone-50 transition-all duration-300 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Browse Businesses
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Timeline View */
                        <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-[2px] before:bg-stone-200/60 max-w-4xl mx-auto">
                            {sortedDates.map((dateHeader, dateIdx) => (
                                <div key={dateIdx} className="relative pl-12 animate-in fade-in slide-in-from-top-4 duration-300" style={{ animationDelay: `${dateIdx * 50}ms` }}>
                                    {/* Circle dot on timeline */}
                                    <div className="absolute left-[-2px] top-1.5 w-6 h-6 bg-white border-2 border-stone-300 rounded-full flex items-center justify-center z-10 shadow-sm">
                                        <div className="w-2 h-2 bg-stone-500 rounded-full"></div>
                                    </div>
                                    <h3 className="text-lg font-black text-stone-900 mb-6 tracking-tight">
                                        {dateHeader}
                                    </h3>

                                    <div className="space-y-6">
                                        {groupedBookings[dateHeader].map(b => (
                                            <BookingCard key={b._id} b={b} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BookingCard = ({ b }) => {
    // Helper to format time (e.g. 10:00 AM)
    const formatTime = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Status Styles
    const statusStyle = {
        'UPCOMING': 'bg-orange-50 text-orange-600 border-orange-200',
        'COMPLETED': 'bg-green-50 text-green-700 border-green-200',
        'CANCELLED': 'bg-red-50 text-red-700 border-red-200'
    }[b.status] || 'bg-gray-50 text-gray-600 border-gray-200';

    return (
        <div className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-all duration-300 relative group w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-stone-500 bg-stone-50 border border-stone-100 px-3 py-1 rounded-xl">
                        <FaClock size={12} className="text-stone-400" />
                        {formatTime(b.bookingDate)}
                    </span>
                    <span className={`inline-block px-3 py-1 border rounded-xl text-[10px] font-black uppercase tracking-wider ${statusStyle}`}>
                        {b.status}
                    </span>
                </div>
            </div>

            <div className="mb-4">
                <h4 className="text-xl font-extrabold text-stone-900 tracking-tight mb-1 group-hover:text-orange-600 transition-colors">
                    {b.service?.name || "Service Appointment"}
                </h4>
                <p className="text-sm font-semibold text-stone-500 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-stone-400" size={14} />
                    {b.seller?.shopDetails?.shopName || "Unknown Shop"}
                </p>
                {b.notes && (
                    <p className="text-xs text-stone-400 mt-2 bg-stone-50 p-3 rounded-2xl border border-stone-100/50 italic">
                        "{b.notes}"
                    </p>
                )}
            </div>

            <div className="flex items-center gap-3 border-t border-stone-100/60 pt-4">
                <button className="text-xs font-black uppercase tracking-wider text-stone-700 hover:text-stone-900 transition-colors bg-stone-50 hover:bg-stone-100 px-4 py-2 rounded-xl border border-stone-200/50">
                    View Details
                </button>
                {b.status === 'UPCOMING' && (
                    <>
                        <button className="text-xs font-black uppercase tracking-wider text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button className="text-xs font-black uppercase tracking-wider text-stone-500 hover:text-stone-800 hover:bg-stone-50 px-4 py-2 rounded-xl transition-colors ml-auto">
                            Get Directions
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Bookings;
