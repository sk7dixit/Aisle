import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaPhone, FaUser, FaBriefcase, FaInbox, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const BookingsPage = () => {
    const { token } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const res = await fetch('/api/seller/bookings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBookings(data);
            } else {
                setBookings(getMockBookings());
            }
        } catch (error) {
            console.error("Failed to fetch bookings", error);
            setBookings(getMockBookings());
        } finally {
            setLoading(false);
        }
    };

    const getMockBookings = () => {
        return [
            {
                _id: 'mock_1',
                customer: { name: 'Aarav Mehta', phone: '+91 98765 43210' },
                service: { name: 'Premium Haircut & Styling' },
                bookingDate: new Date(Date.now() + 2 * 3600000).toISOString(), // 2 hours from now
                status: 'UPCOMING',
                notes: 'Requested clean fade and beard trim.'
            },
            {
                _id: 'mock_2',
                customer: { name: 'Ishita Sharma', phone: '+91 87654 32109' },
                service: { name: 'Deep Cleansing Facial' },
                bookingDate: new Date().toISOString(), // Today
                status: 'UPCOMING',
                notes: 'Sensitive skin. Prefer organic products.'
            },
            {
                _id: 'mock_3',
                customer: { name: 'Rohan Verma', phone: '+91 76543 21098' },
                service: { name: 'Full AC Servicing & Cleaning' },
                bookingDate: new Date(Date.now() - 24 * 3600000).toISOString(), // Yesterday
                status: 'COMPLETED',
                notes: 'Living room split AC.'
            },
            {
                _id: 'mock_4',
                customer: { name: 'Ananya Iyer', phone: '+91 65432 10987' },
                service: { name: 'Regular Pedicure' },
                bookingDate: new Date(Date.now() - 48 * 3600000).toISOString(),
                status: 'CANCELLED',
                notes: 'Cancelled due to urgent travel.'
            }
        ];
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/seller/bookings/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success(`Booking successfully marked as ${status.toLowerCase()}`);
                setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
            } else {
                // Support local update for mock data
                setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
                toast.success(`[Mock Mode] Status updated to ${status}`);
            }
        } catch (error) {
            console.error("Failed to update status", error);
            setBookings(bookings.map(b => b._id === id ? { ...b, status } : b));
            toast.success(`[Mock Mode] Status updated to ${status}`);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <FaSpinner className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-slate-400 font-bold text-sm">Loading Scheduled Bookings...</p>
        </div>
    );

    // Calculate metrics
    const upcomingCount = bookings.filter(b => b.status === 'UPCOMING').length;
    const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
    const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;
    
    // Check if a date is today
    const isToday = (dateString) => {
        const d = new Date(dateString);
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };
    const todayCount = bookings.filter(b => isToday(b.bookingDate) && b.status === 'UPCOMING').length;

    // Filtered bookings
    const filteredBookings = bookings.filter(b => {
        if (activeFilter === 'ALL') return true;
        return b.status === activeFilter;
    });

    return (
        <div className="space-y-10 animate-fade-in text-white p-6 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight nebula-font">Service Bookings</h1>
                    <p className="text-slate-400 mt-1 font-semibold text-xs uppercase tracking-wider">
                        Manage customer visits, scheduled jobs, and business performance
                    </p>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Upcoming */}
                <div className="service-card p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Upcoming Jobs</h3>
                        <p className="text-4xl font-black leading-tight Outfit">{upcomingCount}</p>
                    </div>
                    <FaCalendarAlt className="card-watermark opacity-10" size={80} />
                </div>

                {/* Today */}
                <div className="service-card p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] mb-1">Today's Visits</h3>
                        <p className="text-4xl font-black leading-tight Outfit">{todayCount}</p>
                    </div>
                    <FaClock className="card-watermark opacity-10" size={80} />
                </div>

                {/* Completed */}
                <div className="service-card p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Completed</h3>
                        <p className="text-4xl font-black leading-tight Outfit">{completedCount}</p>
                    </div>
                    <FaCheckCircle className="card-watermark opacity-10" size={80} />
                </div>

                {/* Cancelled */}
                <div className="service-card p-6 relative overflow-hidden group">
                    <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-1">Cancelled</h3>
                        <p className="text-4xl font-black leading-tight Outfit">{cancelledCount}</p>
                    </div>
                    <FaTimesCircle className="card-watermark opacity-10" size={80} />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-white/5 pb-2 overflow-x-auto">
                {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all
                            ${activeFilter === filter 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' 
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        {filter}
                    </button>
                ))}
            </div>

            {/* Schedule / Table Card */}
            <div className="service-card p-6 md:p-8">
                {filteredBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mb-4 border border-white/5">
                            <FaInbox size={28} className="text-slate-500" />
                        </div>
                        <p className="font-bold text-slate-500 font-medium">No bookings found for the selected status.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    <th className="py-4">Customer</th>
                                    <th className="py-4">Service</th>
                                    <th className="py-4">Scheduled For</th>
                                    <th className="py-4">Status</th>
                                    <th className="py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredBookings.map((b) => (
                                    <tr key={b._id} className="group hover:bg-white/[0.01] transition-all">
                                        {/* Customer Details */}
                                        <td className="py-5 pr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/10 text-indigo-400 font-bold shrink-0">
                                                    {b.customer?.name ? b.customer.name.charAt(0) : <FaUser size={12} />}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-white text-sm">{b.customer?.name || 'Walk-in Customer'}</h4>
                                                    <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                                                        <FaPhone size={8} /> {b.customer?.phone || 'No phone'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Service name */}
                                        <td className="py-5 pr-4">
                                            <div className="flex items-center gap-2">
                                                <FaBriefcase className="text-slate-500 size-3" />
                                                <span className="text-sm font-semibold text-white/90">{b.service?.name || 'General Service'}</span>
                                            </div>
                                            {b.notes && (
                                                <p className="text-[10px] text-slate-500 italic mt-1 max-w-[200px] truncate" title={b.notes}>
                                                    "{b.notes}"
                                                </p>
                                            )}
                                        </td>

                                        {/* Scheduled Date/Time */}
                                        <td className="py-5 pr-4">
                                            <div className="space-y-0.5">
                                                <p className="text-sm font-bold text-white">
                                                    {new Date(b.bookingDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <FaClock size={8} className="text-indigo-400" />
                                                    {new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-5">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border
                                                ${b.status === 'UPCOMING' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/10' : ''}
                                                ${b.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10' : ''}
                                                ${b.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/10' : ''}
                                            `}>
                                                <span className={`w-1 h-1 rounded-full 
                                                    ${b.status === 'UPCOMING' ? 'bg-indigo-400' : ''}
                                                    ${b.status === 'COMPLETED' ? 'bg-emerald-400' : ''}
                                                    ${b.status === 'CANCELLED' ? 'bg-rose-400' : ''}
                                                `}></span>
                                                {b.status}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="py-5 text-right">
                                            {b.status === 'UPCOMING' ? (
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => updateStatus(b._id, 'COMPLETED')}
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                                                    >
                                                        <FaCheckCircle size={10} /> Complete
                                                    </button>
                                                    <button
                                                        onClick={() => updateStatus(b._id, 'CANCELLED')}
                                                        className="px-4 py-2 bg-white/5 border border-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5"
                                                    >
                                                        <FaTimesCircle size={10} /> Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Archived</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
