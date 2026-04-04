import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBox, FaShieldAlt, FaExclamationTriangle, FaEdit, FaPlusCircle } from 'react-icons/fa';

const AdminProductActivity = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All | created | edited | reported | admin_action

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
                const res = await fetch(`/api/admin/products/${id}/activity`, {
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
        fetchActivity();
    }, [id]);

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Forensic Timeline...</div>;
    if (!data) return <div className="p-12 text-center text-gray-500">Product not found or access denied.</div>;

    const { product, seller, stats, timeline } = data;

    // Filter Logic
    const filteredTimeline = timeline.filter(item => {
        if (filter === 'All') return true;
        return item.type === filter;
    });

    const getIcon = (type) => {
        switch (type) {
            case 'admin_action': return <FaShieldAlt className="text-white" />;
            case 'created': return <FaPlusCircle className="text-white" />;
            case 'edited': return <FaEdit className="text-white" />;
            case 'reported': return <FaExclamationTriangle className="text-white" />;
            default: return <FaBox className="text-white" />;
        }
    };

    const getColor = (type) => {
        switch (type) {
            case 'admin_action': return 'bg-[#4D1717]'; // Red/Brown
            case 'created': return 'bg-[#174D38]'; // Green
            case 'edited': return 'bg-blue-600';
            case 'reported': return 'bg-red-600';
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
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Activity</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 font-mono">
                        <span className="font-sans font-bold text-gray-900 text-lg">{product.name}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span>{product.category}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${product.status === 'Active' ? 'bg-green-100 text-green-800' : product.status === 'Disabled' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
                            {product.status}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-mono">Product ID: PRD-{product.id.substring(product.id.length - 6).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">Seller: {seller.name}</p>
                    <p className="text-xs text-gray-400 font-mono">ID: SEL-{seller.id ? seller.id.substring(seller.id.length - 5).toUpperCase() : 'N/A'}</p>
                </div>
            </div>

            {/* 2️⃣ RISK SUMMARY STRIP */}
            <div className="grid grid-cols-3 bg-white border border-[#CBCBCB] rounded-xl divide-x divide-gray-100 shadow-sm max-w-3xl">
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Reports</p>
                    <p className={`text-lg font-bold ${stats.reports > 0 ? 'text-[#4D1717]' : 'text-gray-900'}`}>{stats.reports}</p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Flags</p>
                    <p className="text-lg font-bold text-gray-900">{stats.flags}</p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Last Admin Action</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                        {stats.lastAdminAction ? new Date(stats.lastAdminAction).toLocaleDateString() : 'None'}
                    </p>
                </div>
            </div>

            {/* 3️⃣ FILTERS */}
            <div className="flex gap-2 border-b border-gray-200 pb-4">
                {[
                    { label: 'All Events', value: 'All' },
                    { label: 'Created', value: 'created' },
                    { label: 'Edited', value: 'edited' },
                    { label: 'Reported', value: 'reported' },
                    { label: 'Admin Actions', value: 'admin_action' }
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

export default AdminProductActivity;
