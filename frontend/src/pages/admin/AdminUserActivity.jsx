import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaStore, FaExclamationTriangle, FaShieldAlt, FaBoxOpen, FaClock } from 'react-icons/fa';

const AdminUserActivity = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All | listing | admin_action | report_filed | report_against

    const [accountDetails, setAccountDetails] = useState(null);
    const [accountLoading, setAccountLoading] = useState(false);

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
                const res = await fetch(`/api/admin/users/${id}/activity`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                } else {
                    console.error('Failed to fetch activity');
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const fetchAccountDetails = async () => {
            if (!id) return;
            setAccountLoading(true);
            try {
                const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
                const res = await fetch(`/api/admin/users/${id}/account-details`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const result = await res.json();
                    setAccountDetails(result);
                }
            } catch (error) {
                console.error('Failed to fetch account details', error);
            } finally {
                setAccountLoading(false);
            }
        };

        fetchActivity();
        fetchAccountDetails();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Forensic Timeline...</div>;
    if (!data) return <div className="p-12 text-center text-gray-500">User not found or access denied.</div>;

    const { user, stats, timeline } = data;

    // Filter Logic
    const filteredTimeline = timeline.filter(item => {
        if (filter === 'All') return true;
        return item.type === filter;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'admin_action': return <FaShieldAlt className="text-white" />;
            case 'listing': return <FaBoxOpen className="text-white" />;
            case 'report_filed': return <FaExclamationTriangle className="text-white" />;
            case 'report_against': return <FaExclamationTriangle className="text-white" />;
            default: return <FaClock className="text-white" />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'admin_action': return 'bg-[#4D1717]'; // Red/Brown
            case 'listing': return 'bg-[#174D38]'; // Green
            case 'report_filed': return 'bg-yellow-500';
            case 'report_against': return 'bg-red-600';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="min-h-full p-8 md:p-12 max-w-5xl mx-auto space-y-8 bg-[#F2F2F2]">

            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
                <FaArrowLeft />
                <span className="text-sm font-medium">Back</span>
            </button>

            {/* 1️⃣ PAGE HEADER */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Activity</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-mono">
                        <span className="font-sans font-bold text-gray-900 text-lg">{user.name}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{user.role}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">User ID: USR-{user.id.substring(user.id.length - 8).toUpperCase()}</p>
                </div>
            </div>

            {/* 2️⃣ ACTIVITY SUMMARY STRIP */}
            <div className="grid grid-cols-4 bg-white border border-[#CBCBCB] rounded-xl divide-x divide-gray-100 shadow-sm">
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Last Active</p>
                    <p className="text-sm font-bold text-gray-900 truncate">
                        {stats.lastActive ? new Date(stats.lastActive).toLocaleDateString() : 'Never'}
                    </p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Reports Filed</p>
                    <p className="text-lg font-bold text-gray-900">{stats.reportsFiled}</p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Reports Against</p>
                    <p className={`text-lg font-bold ${stats.reportsAgainst > 0 ? 'text-[#4D1717]' : 'text-gray-900'}`}>
                        {stats.reportsAgainst}
                    </p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Shops Owned</p>
                    <p className="text-lg font-bold text-gray-900">{user.shopName ? 1 : 0}</p>
                </div>
            </div>

            {/* 3️⃣ SELLER ACCOUNT DETAILS (Read-Only) */}
            {user.role === 'seller' && (
                <div className="p-6 bg-white border border-[#CBCBCB] rounded-xl shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                        <FaShieldAlt className="text-slate-400" />
                        <h2 className="text-xs font-black uppercase tracking-widest text-slate-800">Seller Account / Payment Details</h2>
                    </div>

                    {accountLoading ? (
                        <div className="animate-pulse space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                        </div>
                    ) : accountDetails ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Online Payments</p>
                                    <p className={`text-sm font-bold ${accountDetails.acceptsOnlinePayment ? 'text-emerald-600' : 'text-gray-400'}`}>
                                        {accountDetails.acceptsOnlinePayment ? 'Enabled' : 'Disabled'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Payment Method</p>
                                    <p className="text-sm font-bold text-gray-900">{accountDetails.paymentMethod}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">UPI ID</p>
                                    <p className="text-sm font-mono font-bold text-gray-900">{accountDetails.upiIdMasked}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Last Updated</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {accountDetails.lastUpdated ? new Date(accountDetails.lastUpdated).toLocaleDateString('en-GB', { day: 'prev-segment', month: 'short', year: 'numeric' }).replace('prev-segment', new Date(accountDetails.lastUpdated).getDate()) : '—'}
                                    </p>
                                </div>
                            </div>
                            {!accountDetails.paymentSetupCompleted && (
                                <div className="md:col-span-2 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2">
                                    <FaExclamationTriangle className="text-amber-500" size={12} />
                                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Seller does not receive online payments (Setup Incomplete)</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 italic">Payment setup not completed</p>
                    )}
                </div>
            )}

            {/* 3️⃣ FILTERS */}
            <div className="flex gap-2 border-b border-gray-200 pb-4">
                {[
                    { label: 'All Events', value: 'All' },
                    { label: 'Admin Actions', value: 'admin_action' },
                    { label: 'Listings', value: 'listing' },
                    { label: 'Reports Filed', value: 'report_filed' },
                    { label: 'Reports Against', value: 'report_against' }
                ].map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filter === f.value
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* 4️⃣ ACTIVITY TIMELINE */}
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {filteredTimeline.length > 0 ? filteredTimeline.map((item) => (
                    <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#F2F2F2] ${getColor(item.type)} shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10`}>
                            {getIcon(item.type)}
                        </div>

                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between space-x-2 mb-1">
                                <span className="font-bold text-gray-900 text-sm">{item.title}</span>
                                <time className="font-mono text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</time>
                            </div>
                            <p className="text-gray-600 text-xs mb-2">{item.description}</p>
                            {item.metadata?.adminName && (
                                <div className="text-[10px] bg-gray-50 p-1 rounded inline-block text-gray-500">
                                    By Admin: <span className="font-medium">{item.metadata.adminName}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 text-gray-500 text-sm italic">
                        No activity found for this filter.
                    </div>
                )}
            </div>

            {/* 5️⃣ FOOTER NOTE */}
            <div className="text-center text-[10px] text-gray-400 mt-12">
                End of Forensic Timeline • This record is read-only.
            </div>

        </div>
    );
};

export default AdminUserActivity;
