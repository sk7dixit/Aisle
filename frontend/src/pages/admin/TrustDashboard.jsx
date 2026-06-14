import React, { useState, useEffect } from 'react';
import {
    FiShield, FiAlertTriangle, FiUsers, FiActivity, FiCheckCircle, FiXCircle,
    FiTrendingUp, FiMapPin, FiCpu, FiRefreshCw, FiCheck, FiX, FiInfo, FiChevronRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import GlassCard from '../../components/ui/GlassCard';

const TrustDashboard = () => {
    const [data, setData] = useState({
        platformAverage: 85,
        activeAlerts: 0,
        spamSuppressed: 0,
        qualityVijayNagar: 92,
        qualityIndore: 91,
        qualityVadodara: 85,
        fraudEvents: [],
        sellers: [],
        customers: []
    });

    const [activeTab, setActiveTab] = useState('sellers'); // 'sellers', 'customers', 'fraud', 'quality'
    const [loading, setLoading] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Copilot Drawer State
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('');
    const [copilotReport, setCopilotReport] = useState('');
    const [loadingCopilot, setLoadingCopilot] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const fetchTrustStats = async () => {
        setLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/trust/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setData(result);
            } else {
                toast.error(result.message || 'Failed to fetch trust dashboard metrics.');
            }
        } catch (err) {
            console.error('Error fetching trust dashboard stats:', err);
            toast.error('Failed to load trust metrics. Server offline.');
        } finally {
            setLoading(false);
        }
    };

    const handleRecalculate = async () => {
        setRecalculating(true);
        const toastId = toast.loading('Recalculating trust parameters system-wide...');
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/trust/recalculate', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(result.message || 'Recalculation complete.', { id: toastId });
                fetchTrustStats();
            } else {
                toast.error(result.message || 'Recalculation failed.', { id: toastId });
            }
        } catch (err) {
            toast.error('Failed to contact recalculation endpoint.', { id: toastId });
        } finally {
            setRecalculating(false);
        }
    };

    const handleFraudAction = async (eventId, action) => {
        const confirmMsg = action === 'approve'
            ? '⚠️ WARNING: Approving containment will IMMEDIATELY SUSPEND this user account and drop trust scores. Proceed?'
            : 'Are you sure you want to dismiss this fraud alert?';
            
        if (!window.confirm(confirmMsg)) return;

        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch(`/api/admin/trust/fraud-event/${eventId}/respond`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success(result.message);
                fetchTrustStats();
                if (isDrawerOpen && selectedUserId) {
                    // Refresh copilot details if open
                    fetchCopilotAudit(selectedUserId, selectedUserName);
                }
            } else {
                toast.error(result.message || 'Failed to moderate fraud event.');
            }
        } catch (err) {
            toast.error('Failed to respond to fraud event.');
        }
    };

    const fetchCopilotAudit = async (userId, userName) => {
        setLoadingCopilot(true);
        setSelectedUserId(userId);
        setSelectedUserName(userName);
        setIsDrawerOpen(true);
        setCopilotReport('');
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch(`/api/admin/trust/copilot/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();
            if (res.ok && result.success) {
                setCopilotReport(result.explanation);
            } else {
                setCopilotReport('Failed to compile forensic audit report.');
            }
        } catch (err) {
            setCopilotReport('Connection error. Failed to retrieve AI report.');
        } finally {
            setLoadingCopilot(false);
        }
    };

    useEffect(() => {
        fetchTrustStats();
    }, []);

    const filteredSellers = data.sellers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredCustomers = data.customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTrustColorClass = (score) => {
        if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="h-full flex flex-col gap-6 relative p-6 bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-600/10 text-emerald-600 rounded-2xl border border-emerald-500/20">
                        <FiShield size={26} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800">Trust & Reputation Center</h1>
                        <p className="text-xs text-gray-500">Autonomous seller reputation scores, multi-account containment & AI fraud audits</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleRecalculate}
                        disabled={recalculating}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 rounded-xl text-xs font-bold shadow-sm transition-all"
                    >
                        <FiRefreshCw className={recalculating ? 'animate-spin' : ''} />
                        Recalculate Indices
                    </button>
                    <button
                        onClick={fetchTrustStats}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm hover:border-gray-300 transition-all"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        Sync Center
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiTrendingUp className="text-emerald-500" /> Platform Trust Average
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-600">{data.platformAverage} / 100</p>
                    <p className="text-[10px] text-gray-400 font-medium">Weighted seller & customer index</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiAlertTriangle className="text-red-500" /> Active Fraud Flags
                    </div>
                    <p className="text-3xl font-extrabold text-red-600">{data.activeAlerts}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Pending moderator containment action</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiActivity className="text-blue-500" /> Spam Requests Blocked
                    </div>
                    <p className="text-3xl font-extrabold text-blue-600">{data.spamSuppressed}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Bot velocity events blocked at gate</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiMapPin className="text-orange-500" /> Vijay Nagar Index
                    </div>
                    <p className="text-3xl font-extrabold text-orange-600">{data.qualityVijayNagar} / 100</p>
                    <p className="text-[10px] text-gray-400 font-medium">Area marketplace health score</p>
                </div>
            </div>

            {/* Main Content Workspace */}
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row justify-between gap-4 items-center">
                    <div className="flex flex-wrap gap-1">
                        {[
                            { key: 'sellers', label: 'Seller Reputation', count: data.sellers.length },
                            { key: 'customers', label: 'Customer Trust', count: data.customers.length },
                            { key: 'fraud', label: 'Fraud alerts', count: data.fraudEvents.length },
                            { key: 'quality', label: 'Marketplace Quality', count: 3 }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab.key
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-500'
                                }`}
                            >
                                {tab.label}
                                {tab.count !== null && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {activeTab !== 'quality' && (
                        <div className="relative group w-full xl:w-72">
                            <input
                                type="text"
                                placeholder={`Filter ${activeTab} details...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-emerald-500 transition-all font-medium text-gray-700 text-xs"
                            />
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    {/* View 1: Sellers */}
                    {activeTab === 'sellers' && (
                        <div className="space-y-3">
                            {filteredSellers.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-10 font-semibold">No seller trust profiles found.</p>
                            ) : (
                                <div className="hidden md:grid grid-cols-[2fr,1.2fr,1fr,1fr,1fr,1.2fr,1.2fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                    <div>Seller Details</div>
                                    <div className="text-center">Trust Score</div>
                                    <div className="text-center">Response</div>
                                    <div className="text-center">Stock Acc.</div>
                                    <div className="text-center">Completion</div>
                                    <div className="text-center">Account status</div>
                                    <div className="text-center">AI Audit</div>
                                </div>
                            )}

                            {filteredSellers.map(seller => (
                                <div key={seller._id} className="md:grid md:grid-cols-[2fr,1.2fr,1fr,1fr,1fr,1.2fr,1.2fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-gray-800 truncate">{seller.shopName}</h4>
                                        <p className="text-[10px] text-gray-400 truncate">{seller.name} • {seller.email}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] border ${getTrustColorClass(seller.trustScore)}`}>
                                            {seller.trustScore} / 100
                                        </span>
                                    </div>
                                    <div className="text-center font-bold text-gray-600 font-mono">{seller.responseTime}%</div>
                                    <div className="text-center font-bold text-gray-600 font-mono">{seller.stockAccuracy}%</div>
                                    <div className="text-center font-bold text-gray-600 font-mono">{seller.completionRate}%</div>
                                    <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            seller.accountStatus === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {seller.accountStatus.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => fetchCopilotAudit(seller.sellerId, seller.shopName)}
                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-lg flex items-center gap-1 transition-all"
                                        >
                                            <FiCpu size={12} /> Audit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View 2: Customers */}
                    {activeTab === 'customers' && (
                        <div className="space-y-3">
                            {filteredCustomers.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-10 font-semibold">No customer trust profiles found.</p>
                            ) : (
                                <div className="hidden md:grid grid-cols-[2.5fr,1.5fr,1.5fr,1.5fr,1.5fr,1.5fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                    <div>Customer</div>
                                    <div className="text-center">Trust Score</div>
                                    <div className="text-center">Spam Suppressed</div>
                                    <div className="text-center">Order Cancels</div>
                                    <div className="text-center">Account Status</div>
                                    <div className="text-center">AI Audit</div>
                                </div>
                            )}

                            {filteredCustomers.map(customer => (
                                <div key={customer._id} className="md:grid md:grid-cols-[2.5fr,1.5fr,1.5fr,1.5fr,1.5fr,1.5fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-gray-800 truncate">{customer.name}</h4>
                                        <p className="text-[10px] text-gray-400 truncate">{customer.email}</p>
                                    </div>
                                    <div className="flex justify-center">
                                        <span className={`px-2.5 py-1 rounded-full font-extrabold text-[11px] border ${getTrustColorClass(customer.trustScore)}`}>
                                            {customer.trustScore} / 100
                                        </span>
                                    </div>
                                    <div className="text-center font-bold text-gray-600 font-mono">{customer.spamRequests}</div>
                                    <div className="text-center font-bold text-gray-600 font-mono">{customer.cancellations}</div>
                                    <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            customer.accountStatus === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                        }`}>
                                            {customer.accountStatus.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => fetchCopilotAudit(customer.customerId, customer.name)}
                                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-lg flex items-center gap-1 transition-all"
                                        >
                                            <FiCpu size={12} /> Audit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View 3: Fraud Alerts & Moderation Queue */}
                    {activeTab === 'fraud' && (
                        <div className="space-y-3">
                            {data.fraudEvents.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-10 font-semibold">No active fraud alerts detected.</p>
                            ) : (
                                <div className="hidden md:grid grid-cols-[2fr,1.2fr,1fr,2.5fr,1.5fr,1.8fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                    <div>Target User</div>
                                    <div>Threat Type</div>
                                    <div className="text-center">Severity</div>
                                    <div>Forensic Details</div>
                                    <div className="text-center">Status</div>
                                    <div className="text-center">Actions</div>
                                </div>
                            )}

                            {data.fraudEvents.map(event => (
                                <div key={event._id} className="md:grid md:grid-cols-[2fr,1.2fr,1fr,2.5fr,1.5fr,1.8fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-gray-800 truncate">{event.userId?.name || 'Local Account'}</h4>
                                        <p className="text-[10px] text-gray-400 truncate">{event.userId?.email || 'N/A'} • Role: {event.userId?.role || 'User'}</p>
                                    </div>
                                    <div className="font-bold text-red-600 uppercase tracking-wide">
                                        {event.eventType.split('_').join(' ')}
                                    </div>
                                    <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                            event.severity === 'critical' ? 'bg-red-100 text-red-700 border border-red-200' :
                                            event.severity === 'high' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {event.severity}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded text-[10px] font-mono break-all max-h-16 overflow-y-auto">
                                        {event.details?.reason || JSON.stringify(event.details)}
                                    </div>
                                    <div className="flex justify-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                            event.status === 'pending_moderation' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                            event.status === 'approved' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {event.status.split('_').join(' ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-center gap-1">
                                        <button
                                            onClick={() => fetchCopilotAudit(event.userId?._id, event.userId?.name)}
                                            className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                                            title="Ask AI Copilot"
                                        >
                                            <FiCpu size={14} />
                                        </button>
                                        
                                        {event.status === 'pending_moderation' && (
                                            <>
                                                <button
                                                    onClick={() => handleFraudAction(event._id, 'approve')}
                                                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg"
                                                    title="Approve Containment"
                                                >
                                                    <FiCheck size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleFraudAction(event._id, 'dismiss')}
                                                    className="p-1.5 bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 rounded-lg"
                                                    title="Dismiss Alert"
                                                >
                                                    <FiX size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View 4: Marketplace Quality */}
                    {activeTab === 'quality' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-full">
                                    <FiMapPin size={24} />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-extrabold text-gray-800 text-sm">Vijay Nagar (Indore)</h4>
                                    <p className="text-xs text-gray-400 mt-1">High density commercial sector</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-3xl font-black text-orange-600">{data.qualityVijayNagar}</span>
                                    <span className="text-xs font-bold text-gray-400">/ 100</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                                    <div className="bg-orange-500 h-full" style={{ width: `${data.qualityVijayNagar}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    EXCELLENT INDEX
                                </span>
                            </div>

                            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                    <FiMapPin size={24} />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-extrabold text-gray-800 text-sm">Indore City Average</h4>
                                    <p className="text-xs text-gray-400 mt-1">Platform flagship territory</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-3xl font-black text-blue-600">{data.qualityIndore}</span>
                                    <span className="text-xs font-bold text-gray-400">/ 100</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                                    <div className="bg-blue-500 h-full" style={{ width: `${data.qualityIndore}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    EXCELLENT INDEX
                                </span>
                            </div>

                            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                                    <FiMapPin size={24} />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-extrabold text-gray-800 text-sm">Vadodara Rural</h4>
                                    <p className="text-xs text-gray-400 mt-1">Expanding regional sector</p>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-3xl font-black text-purple-600">{data.qualityVadodara}</span>
                                    <span className="text-xs font-bold text-gray-400">/ 100</span>
                                </div>
                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-1">
                                    <div className="bg-purple-500 h-full" style={{ width: `${data.qualityVadodara}%` }}></div>
                                </div>
                                <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded border border-yellow-100">
                                    HEALTHY INDEX
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- AI Moderation Copilot Sliding Drawer --- */}
            {isDrawerOpen && (
                <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-slate-900 text-slate-100 z-[999] shadow-2xl flex flex-col justify-between animate-slide-left border-l border-slate-800">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                                <FiCpu size={20} className="animate-spin" style={{ animationDuration: '6s' }} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">AI Moderation Copilot</h3>
                                <p className="text-[10px] text-slate-400">Security & credential anomaly check</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
                        >
                            <FiX size={18} />
                        </button>
                    </div>

                    {/* Content Console */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar font-mono text-xs leading-relaxed">
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                            <FiInfo /> Forensic timeline: {selectedUserName}
                        </div>

                        {loadingCopilot ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-20">
                                <FiRefreshCw className="animate-spin text-emerald-400 text-xl" />
                                <span className="text-slate-400">Compiling biometric and device metadata...</span>
                            </div>
                        ) : (
                            <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-xl space-y-4 whitespace-pre-wrap text-[11px] text-slate-300">
                                {copilotReport}
                            </div>
                        )}
                    </div>

                    {/* Actions Panel */}
                    <div className="p-5 border-t border-slate-800 bg-slate-950 flex gap-2">
                        <button
                            onClick={() => {
                                handleFraudAction(selectedUserId, 'approve');
                                setIsDrawerOpen(false);
                            }}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1"
                        >
                            <FiCheck /> Approve Containment
                        </button>
                        <button
                            onClick={() => {
                                handleFraudAction(selectedUserId, 'dismiss');
                                setIsDrawerOpen(false);
                            }}
                            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                            <FiX /> Dismiss Event
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TrustDashboard;
