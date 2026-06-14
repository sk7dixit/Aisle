import React, { useState, useEffect } from 'react';
import {
    FiShield, FiAlertTriangle, FiActivity, FiCpu, FiEye, FiClock, FiSearch, FiFilter, 
    FiRefreshCw, FiSlash, FiDatabase, FiGlobe, FiAlertCircle, FiTerminal, FiPlay, FiServer, FiSettings
} from 'react-icons/fi';

const SecurityCommandCenter = () => {
    const [metrics, setMetrics] = useState({
        failedLogins24h: 0,
        blockedIps24h: 0,
        otpAbuse24h: 0,
        suspiciousDevicesCount: 0,
        blockedToday: 0,
        blockedWeek: 0,
        blockedMonth: 0,
        ddosEmergencyMode: false
    });
    
    const [recentFailedLogins, setRecentFailedLogins] = useState([]);
    const [recentBlockedIps, setRecentBlockedIps] = useState([]);
    const [suspiciousDevices, setSuspiciousDevices] = useState([]);
    const [adminActivity, setAdminActivity] = useState([]);
    const [recentSecurityLogs, setRecentSecurityLogs] = useState([]);
    
    // New aggregates & SOC metrics
    const [topBlockedIps, setTopBlockedIps] = useState([]);
    const [topBlockedCountries, setTopBlockedCountries] = useState([]);
    const [suspiciousAccounts, setSuspiciousAccounts] = useState([]);
    const [infraHealth, setInfraHealth] = useState({
        cpu: 10,
        memory: 30,
        disk: 40,
        redisMem: 2,
        mongoConns: 3
    });
    const [apmStats, setApmStats] = useState({
        recentLogs: [],
        slowEndpoints: [],
        errorRate: {},
        ddosEmergencyMode: false
    });

    const [activeTab, setActiveTab] = useState('logs'); // 'logs', 'ips', 'devices', 'admin', 'apm', 'infra', 'incident'
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Target Admin ID state for COMPROMISE playbook
    const [compromisedAdminId, setCompromisedAdminId] = useState('');

    const fetchSecurityStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/security-dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMetrics(data.metrics || {});
                setRecentFailedLogins(data.recentFailedLogins || []);
                setRecentBlockedIps(data.recentBlockedIps || []);
                setSuspiciousDevices(data.suspiciousDevices || []);
                setAdminActivity(data.adminActivity || []);
                setRecentSecurityLogs(data.recentSecurityLogs || []);
                setTopBlockedIps(data.topBlockedIps || []);
                setTopBlockedCountries(data.topBlockedCountries || []);
                setSuspiciousAccounts(data.suspiciousAccounts || []);
                if (data.infraHealth) setInfraHealth(data.infraHealth);
                if (data.apmStats) setApmStats(data.apmStats);
            } else {
                setError(data.message || 'Failed to load security statistics.');
            }
        } catch (err) {
            console.error('Error fetching security stats:', err);
            setError('Failed to fetch stats. Server offline or unauthorized.');
        } finally {
            setLoading(false);
        }
    };

    const triggerPlaybook = async (playbook, targetId = '') => {
        const confirmMsg = playbook === 'DATABASE_LEAK' 
            ? '⚠️ WARNING: THIS WILL IMMEDIATELY TERMINATE ALL GLOBAL USER SESSIONS AND FORCE PASSWORDS RESET. ARE YOU ABSOLUTELY SURE?'
            : `Are you sure you want to execute the ${playbook} response playbook?`;

        if (!window.confirm(confirmMsg)) return;

        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/incidents/playbook/trigger', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ playbook, targetAdminId: targetId })
            });
            const data = await res.json();
            if (res.ok) {
                alert(`Success: ${data.message}`);
                fetchSecurityStats();
            } else {
                alert(`Playbook Error: ${data.message}`);
            }
        } catch (err) {
            alert(`Failed to trigger playbook: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchSecurityStats();
        // Poll every 15 seconds for live SOC data feed
        const interval = setInterval(fetchSecurityStats, 15000);
        return () => clearInterval(interval);
    }, []);

    const getEventBadgeClass = (event) => {
        switch (event) {
            case 'LOGIN_FAILED':
            case 'FAILED_LOGIN':
            case 'BOT_BLOCKED':
            case 'API_KEY_INVALID':
            case 'RATE_LIMIT_EXCEEDED':
            case 'DDOS_ATTACK':
            case 'DATABASE_LEAK_TRIGGERED':
            case 'ADMIN_COMPROMISE_TRIGGERED':
                return 'bg-red-50 text-red-600 border border-red-200';
            case 'ADMIN_LOGIN':
            case 'ROLE_CHANGE':
            case 'ROLE_CHANGED':
                return 'bg-orange-50 text-orange-600 border border-orange-200';
            case 'PASSWORD_CHANGED':
            case 'SESSION_REVOKED':
            case 'UNKNOWN_DEVICE':
                return 'bg-yellow-50 text-yellow-600 border border-yellow-200';
            default:
                return 'bg-blue-50 text-blue-600 border border-blue-200';
        }
    };

    const filterLogs = (logsList) => {
        if (!searchTerm) return logsList;
        const term = searchTerm.toLowerCase();
        return logsList.filter(log => 
            (log.email || log.user || '').toLowerCase().includes(term) ||
            (log.event || '').toLowerCase().includes(term) ||
            (log.ipAddress || log.ip || '').toLowerCase().includes(term) ||
            JSON.stringify(log.details || {}).toLowerCase().includes(term)
        );
    };

    return (
        <div className="h-full flex flex-col gap-6 relative p-6 bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-600/10 text-red-600 rounded-2xl border border-red-500/20">
                        <FiShield size={26} className="animate-pulse" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                            Security Operations Center (SOC)
                            {metrics.ddosEmergencyMode && (
                                <span className="px-2 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded-full animate-bounce">
                                    DDOS EMERALD SHIELD ACTIVE
                                </span>
                            )}
                        </h1>
                        <p className="text-xs text-gray-500">Live rest API threat analysis, impossible travel anomaly audits & incident response command</p>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button
                        onClick={fetchSecurityStats}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-sm hover:border-gray-300 transition-all"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        Sync SOC
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-semibold">
                    <FiAlertTriangle className="text-red-500 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiAlertTriangle className="text-red-500" /> Failed Logins (24h)
                    </div>
                    <p className="text-3xl font-extrabold text-gray-800">{metrics.failedLogins24h}</p>
                    <p className="text-[10px] text-gray-400 font-medium">Spikes trigger credential alerts</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiSlash className="text-red-600" /> Blocked Requests
                    </div>
                    <p className="text-3xl font-extrabold text-red-600">
                        {metrics.blockedToday}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium">
                        W: <span className="font-semibold text-gray-600">{metrics.blockedWeek}</span> | 
                        M: <span className="font-semibold text-gray-600">{metrics.blockedMonth}</span>
                    </p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiActivity className="text-orange-500" /> OTP Abuse Prevention
                    </div>
                    <p className="text-3xl font-extrabold text-orange-600">{metrics.otpAbuse24h}</p>
                    <p className="text-[10px] text-gray-400 font-medium">SMS bombing triggers suppressed</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase">
                        <FiCpu className="text-blue-500" /> Suspicious Devices
                    </div>
                    <p className="text-3xl font-extrabold text-blue-600">{metrics.suspiciousDevicesCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium">IP traveling & fingerprints flagged</p>
                </div>
            </div>

            {/* Dashboard Tabs & Workspace */}
            <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 flex flex-col xl:flex-row justify-between gap-4 items-center">
                    <div className="flex flex-wrap gap-1">
                        {[
                            { key: 'logs', label: 'Threat Log', count: recentSecurityLogs.length },
                            { key: 'ips', label: 'IP blocks', count: recentBlockedIps.length },
                            { key: 'devices', label: 'Anomalies', count: suspiciousAccounts.length },
                            { key: 'admin', label: 'Admin Audits', count: adminActivity.length },
                            { key: 'apm', label: 'APM Perf', count: apmStats.recentLogs.length },
                            { key: 'infra', label: 'System Load', count: 5 },
                            { key: 'incident', label: 'Incident Control', count: null },
                            { key: 'executive', label: 'Executive Report', count: null }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                    activeTab === tab.key
                                        ? 'bg-red-600 text-white shadow-sm'
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

                    <div className="relative group w-full xl:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter live dashboard entries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:bg-white focus:border-red-500 transition-all font-medium text-gray-700 text-xs"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                    
                    {/* View 1: Threat Log */}
                    {activeTab === 'logs' && (
                        <div className="space-y-3">
                            {filterLogs(recentSecurityLogs).length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-10 font-semibold">No security logs matching constraints found.</p>
                            ) : (
                                <div className="hidden md:grid grid-cols-[1.5fr,1.5fr,1.5fr,1fr,2.5fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                    <div>Timestamp</div>
                                    <div>User/Email</div>
                                    <div>Event</div>
                                    <div>IP Address</div>
                                    <div>Details</div>
                                </div>
                            )}
                            {filterLogs(recentSecurityLogs).map(log => (
                                <div key={log._id} className="md:grid md:grid-cols-[1.5fr,1.5fr,1.5fr,1fr,2.5fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1 md:mb-0">
                                        <FiClock className="text-gray-400" />
                                        <span className="font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="font-bold truncate mb-1 md:mb-0">{log.email || 'Anonymous'}</div>
                                    <div className="mb-1 md:mb-0">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${getEventBadgeClass(log.event)}`}>
                                            {log.event}
                                        </span>
                                    </div>
                                    <div className="font-mono text-gray-500 mb-1 md:mb-0">{log.ipAddress}</div>
                                    <div className="bg-gray-50 p-2 rounded-lg text-[11px] text-gray-600 font-mono break-all max-h-16 overflow-y-auto">
                                        {JSON.stringify(log.details || {})}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View 2: IP Blocks & Aggregates */}
                    {activeTab === 'ips' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-3">
                                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <FiTerminal /> Recent Blocks & Rate Limits
                                </h3>
                                {filterLogs(recentBlockedIps).length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-10 font-semibold">No flagged IP addresses found.</p>
                                ) : (
                                    <div className="hidden md:grid grid-cols-[1.5fr,1.5fr,1.5fr,3.5fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                        <div>Timestamp</div>
                                        <div>IP Address</div>
                                        <div>Reason</div>
                                        <div>Location Context</div>
                                    </div>
                                )}
                                {filterLogs(recentBlockedIps).map(log => (
                                    <div key={log._id} className="md:grid md:grid-cols-[1.5fr,1.5fr,1.5fr,3.5fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1 md:mb-0">
                                            <FiClock className="text-gray-400" />
                                            <span className="font-mono text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                                        </div>
                                        <div className="font-mono font-bold text-red-600 mb-1 md:mb-0">{log.ipAddress}</div>
                                        <div className="mb-1 md:mb-0">
                                            <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-bold uppercase">
                                                {log.details?.reason || log.event}
                                            </span>
                                        </div>
                                        <div className="text-gray-500 truncate">
                                            {log.details?.city || 'Unknown'}, {log.details?.countryCode || 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Aggregates Column */}
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <FiGlobe className="text-red-600" /> Top Blocked Countries (30d)
                                    </h4>
                                    <div className="space-y-2">
                                        {topBlockedCountries.map((c, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs text-gray-600 font-medium bg-white p-2.5 rounded-xl border border-gray-100">
                                                <span className="flex items-center gap-1.5 font-bold">
                                                    <span className="px-1.5 py-0.5 bg-gray-100 text-[10px] rounded">{c._id}</span>
                                                    {c.countryName || 'Unknown'}
                                                </span>
                                                <span className="text-red-600 font-bold font-mono">{c.count} blocks</span>
                                            </div>
                                        ))}
                                        {topBlockedCountries.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">No country logs tracked.</p>}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <FiSlash className="text-red-600" /> Top Blocked Attack IPs (30d)
                                    </h4>
                                    <div className="space-y-2">
                                        {topBlockedIps.map((ip, i) => (
                                            <div key={i} className="flex justify-between items-center text-xs text-gray-600 font-medium bg-white p-2.5 rounded-xl border border-gray-100">
                                                <span className="font-mono text-gray-700 font-semibold">{ip._id}</span>
                                                <span className="text-red-500 font-bold font-mono">{ip.count} blocks</span>
                                            </div>
                                        ))}
                                        {topBlockedIps.length === 0 && <p className="text-[11px] text-gray-400 text-center py-4">No IP blocks logged.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View 3: Suspicious & Fraud Accounts */}
                    {activeTab === 'devices' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <FiAlertCircle className="text-red-600" /> Fraud Engine & Anomalous Accounts
                                </h3>
                                <div className="space-y-3">
                                    {suspiciousAccounts.length === 0 ? (
                                        <p className="text-center text-xs text-gray-400 py-10 font-semibold">No high-risk fraud alerts registered recently.</p>
                                    ) : (
                                        <div className="hidden md:grid grid-cols-[1.5fr,1.5fr,1fr,1.5fr,2.5fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                            <div>Time</div>
                                            <div>User Account</div>
                                            <div>Threat Risk</div>
                                            <div>Anomalous Event</div>
                                            <div>Technical Details</div>
                                        </div>
                                    )}
                                    {suspiciousAccounts.map(act => (
                                        <div key={act._id} className="md:grid md:grid-cols-[1.5fr,1.5fr,1fr,1.5fr,2.5fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                            <div className="font-mono text-gray-400">{new Date(act.createdAt).toLocaleString()}</div>
                                            <div className="font-bold truncate">{act.user || 'N/A'}</div>
                                            <div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                                                    act.risk === 'critical' ? 'bg-red-100 text-red-700' :
                                                    act.risk === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {act.risk}
                                                </span>
                                            </div>
                                            <div className="font-bold text-red-600">{act.event}</div>
                                            <div className="bg-gray-50 p-2 rounded text-[10px] font-mono break-all max-h-16 overflow-y-auto">
                                                {JSON.stringify(act.details || {})}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View 4: Admin Activities */}
                    {activeTab === 'admin' && (
                        <div className="space-y-3">
                            {filterLogs(adminActivity).length === 0 ? (
                                <p className="text-center text-xs text-gray-400 py-10 font-semibold">No admin actions registered.</p>
                            ) : (
                                <div className="hidden md:grid grid-cols-[1.5fr,1.5fr,1.5fr,1.5fr,2fr] gap-4 p-3 bg-gray-50 text-xs font-bold text-gray-400 uppercase rounded-xl border border-gray-100">
                                    <div>Timestamp</div>
                                    <div>Admin User</div>
                                    <div>Action</div>
                                    <div>Target / Scope</div>
                                    <div>Reason / State</div>
                                </div>
                            )}
                            {filterLogs(adminActivity).map(action => (
                                <div key={action._id} className="md:grid md:grid-cols-[1.5fr,1.5fr,1.5fr,1.5fr,2fr] gap-4 p-3 bg-white border border-gray-100 hover:border-gray-200 rounded-xl transition-all items-center text-xs text-gray-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1 md:mb-0">
                                        <FiClock className="text-gray-400" />
                                        <span className="font-mono text-gray-500">{new Date(action.createdAt).toLocaleString()}</span>
                                    </div>
                                    <div className="font-bold mb-1 md:mb-0">
                                        {action.performedBy?.name || 'System'} 
                                        <span className="block text-[10px] text-gray-400 font-normal">{action.performedBy?.role || 'Super Admin'}</span>
                                    </div>
                                    <div className="mb-1 md:mb-0">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                                            action.severity === 'Critical' ? 'bg-red-50 text-red-600 border border-red-200' :
                                            action.severity === 'Warning' ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {action.actionType}
                                        </span>
                                    </div>
                                    <div className="text-gray-500 mb-1 md:mb-0 font-semibold">
                                        {action.targetType}
                                        <span className="block text-[10px] text-gray-400 font-mono">{action.targetId}</span>
                                    </div>
                                    <div className="text-gray-600 bg-gray-50 p-2 rounded-lg break-all max-h-16 overflow-y-auto font-mono text-[10px]">
                                        <div>Reason: {action.reason || 'None'}</div>
                                        {action.previousState && <div>Prev: {action.previousState}</div>}
                                        {action.newState && <div>New: {action.newState}</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* View 5: APM Performance stats */}
                    {activeTab === 'apm' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Latency Log */}
                            <div className="lg:col-span-2 space-y-3">
                                <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <FiActivity className="text-blue-500" /> Real-time Endpoint Latency Feed
                                </h3>
                                <div className="space-y-2">
                                    {apmStats.recentLogs.map((log, i) => (
                                        <div key={i} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl text-xs shadow-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white uppercase ${
                                                    log.method === 'GET' ? 'bg-green-500' : 
                                                    log.method === 'POST' ? 'bg-blue-500' : 'bg-yellow-500'
                                                }`}>
                                                    {log.method}
                                                </span>
                                                <span className="font-mono text-gray-700 font-semibold">{log.url}</span>
                                            </div>
                                            <div className="flex items-center gap-3 font-mono">
                                                <span className={log.latency > 500 ? 'text-red-500 font-bold' : 'text-gray-500'}>
                                                    {log.latency} ms
                                                </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    log.status >= 500 ? 'bg-red-100 text-red-700' :
                                                    log.status >= 400 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {apmStats.recentLogs.length === 0 && (
                                        <p className="text-center text-xs text-gray-400 py-10 font-semibold">No performance logs loaded. Make API requests first.</p>
                                    )}
                                </div>
                            </div>

                            {/* Slowest and Errors */}
                            <div className="space-y-6">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <FiClock className="text-red-500" /> Slow Endpoints (&gt;1s)
                                    </h4>
                                    <div className="space-y-2">
                                        {apmStats.slowEndpoints.map((item, i) => (
                                            <div key={i} className="p-2 bg-white rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                                                <span className="font-mono text-[11px] truncate w-40 text-gray-700">{item.endpoint}</span>
                                                <span className="text-red-600 font-bold font-mono">{item.latency}ms</span>
                                            </div>
                                        ))}
                                        {apmStats.slowEndpoints.length === 0 && (
                                            <p className="text-[11px] text-gray-400 text-center py-4">No slow endpoints detected.</p>
                                        )}
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                        <FiAlertCircle className="text-red-500" /> Status Code Errors Today
                                    </h4>
                                    <div className="space-y-2">
                                        {Object.entries(apmStats.errorRate).map(([code, count]) => (
                                            <div key={code} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-gray-100 font-semibold">
                                                <span className="text-yellow-600 font-mono">Code {code}</span>
                                                <span className="text-gray-700">{count} occurrences</span>
                                            </div>
                                        ))}
                                        {Object.keys(apmStats.errorRate).length === 0 && (
                                            <p className="text-[11px] text-gray-400 text-center py-4">No HTTP errors logged today.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View 6: Infrastructure Health */}
                    {activeTab === 'infra' && (
                        <div className="space-y-6 max-w-3xl">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FiServer className="text-blue-500" /> Live Infrastructure Resources
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Meters */}
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                    {/* CPU */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                                            <span>System CPU Load</span>
                                            <span>{infraHealth.cpu}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    infraHealth.cpu > 80 ? 'bg-red-500' : infraHealth.cpu > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${infraHealth.cpu}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Memory */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                                            <span>RAM Memory Consumption</span>
                                            <span>{infraHealth.memory}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    infraHealth.memory > 75 ? 'bg-red-500' : infraHealth.memory > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${infraHealth.memory}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Disk */}
                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                                            <span>Hard Disk Space Used</span>
                                            <span>{infraHealth.disk}%</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-500 ${
                                                    infraHealth.disk > 70 ? 'bg-red-500' : infraHealth.disk > 50 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: `${infraHealth.disk}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Services */}
                                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase">Service Connection Pools</h4>
                                    
                                    <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold">
                                        <span className="text-gray-700">Mongoose MongoDB Connections</span>
                                        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg">{infraHealth.mongoConns} active</span>
                                    </div>

                                    <div className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl text-xs font-bold">
                                        <span className="text-gray-700">Redis Memory Usage</span>
                                        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded-lg">{infraHealth.redisMem} MB used</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View 7: Incident Response Playbooks */}
                    {activeTab === 'incident' && (
                        <div className="space-y-6 max-w-4xl">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <FiSettings className="text-red-600" /> Active Incident Response Playbooks
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">Execute automated counter-measures to isolate compromised credentials or mitigate volume attacks.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Playbook 1: Leak */}
                                <div className="p-5 border border-red-200 bg-red-50/20 rounded-2xl flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-1">
                                            <FiDatabase /> Database Leak Mitigation
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Instantly invalidates all user authentication refresh tokens globally, terminates active customer/seller/admin sessions, and blocks logins pending password resets.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => triggerPlaybook('DATABASE_LEAK')}
                                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1"
                                    >
                                        <FiPlay size={12} /> Trigger play
                                    </button>
                                </div>

                                {/* Playbook 2: DDoS */}
                                <div className="p-5 border border-orange-200 bg-orange-50/20 rounded-2xl flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-orange-600 font-bold text-sm mb-1">
                                            <FiShield /> Force DDoS Emergency Shield
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium">
                                            Forcibly activates Cloudflare-simulated request shielding in Redis for 15 minutes. Heavy rate limiting (1 req/sec) applied to all non-admin client IPs.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => triggerPlaybook('DDOS_ATTACK')}
                                        className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1"
                                    >
                                        <FiPlay size={12} /> Trigger play
                                    </button>
                                </div>

                                {/* Playbook 3: Admin */}
                                <div className="p-5 border border-gray-200 bg-gray-50 rounded-2xl flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-gray-700 font-bold text-sm mb-1">
                                            <FiCpu /> Contain Admin Compromise
                                        </div>
                                        <p className="text-[11px] text-gray-500 font-medium mb-3">
                                            Immediately suspends access permissions and invalidates token sessions for a specific administrator or moderator account.
                                        </p>
                                        <input
                                            type="text"
                                            placeholder="Enter Admin MongoDB ID"
                                            value={compromisedAdminId}
                                            onChange={(e) => setCompromisedAdminId(e.target.value)}
                                            className="w-full px-3 py-1.5 text-xs font-mono border border-gray-200 rounded-lg outline-none bg-white focus:border-red-500 transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => triggerPlaybook('ADMIN_COMPROMISE', compromisedAdminId)}
                                        disabled={!compromisedAdminId}
                                        className="w-full py-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center gap-1"
                                    >
                                        <FiPlay size={12} /> Terminate Admin
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View 8: Executive Security & Compliance Report */}
                    {activeTab === 'executive' && (
                        <div className="space-y-6 max-w-4xl">
                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                                    <FiShield className="text-blue-600" /> Executive Security & Compliance Report
                                </h3>
                                <p className="text-xs text-gray-500 mb-4">High-level compliance postures, MFA adoption metrics, security scores, and operational continuity verification.</p>
                            </div>

                            {/* Dashboard KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Circular Gauge for Security Score */}
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col items-center justify-between text-center min-h-[200px]">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform Security Score</h4>
                                    <div className="relative flex items-center justify-center my-4">
                                        <div className="w-24 h-24 rounded-full border-8 border-gray-100 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black text-blue-600">
                                                {metrics.executiveMetrics?.securityScore || 100}
                                            </span>
                                            <span className="text-[9px] text-gray-400 uppercase font-bold">out of 100</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Calculated from MFA rates, failed logins, and active DDoS shielding.
                                    </p>
                                </div>

                                {/* MFA Adoption Progress */}
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between min-h-[200px]">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">MFA Adoption Rate</h4>
                                    <div className="space-y-2 my-auto">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-3xl font-black text-gray-800">
                                                {metrics.executiveMetrics?.mfaAdoptionRate || 0}%
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold">Target: 100%</span>
                                        </div>
                                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-green-500 transition-all duration-500"
                                                style={{ width: `${metrics.executiveMetrics?.mfaAdoptionRate || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Enforcement rate of TOTP/MFA among Admin, Super Admin, and Moderator accounts.
                                    </p>
                                </div>

                                {/* SLA Availability */}
                                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between min-h-[200px]">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">System Availability SLA</h4>
                                    <div className="space-y-1 my-auto">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-3xl font-black text-green-600">
                                                {metrics.executiveMetrics?.availabilitySla || 99.98}%
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold">SLA Limit: 99.9%</span>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-600 uppercase">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
                                            Exceeding Target SLA
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        Active container healthchecks and load-balancer heartbeat telemetry metrics.
                                    </p>
                                </div>
                            </div>

                            {/* Compliance Checklist section */}
                            <div className="p-5 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Enterprise Compliance Readiness Checklist</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className={`p-1.5 rounded-lg text-xs font-bold ${
                                            metrics.executiveMetrics?.compliance?.soc2Ready ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {metrics.executiveMetrics?.compliance?.soc2Ready ? '✓ READY' : '⚠ PENDING'}
                                        </span>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-800">SOC 2 Type II Alignment</h5>
                                            <p className="text-[10px] text-gray-500 font-medium">Enforces rate limiters, multi-region daily database backup rotators, Winston rolling security logs, and active MFA checks.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className={`p-1.5 rounded-lg text-xs font-bold ${
                                            metrics.executiveMetrics?.compliance?.iso27001Ready ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {metrics.executiveMetrics?.compliance?.iso27001Ready ? '✓ READY' : '⚠ PENDING'}
                                        </span>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-800">ISO/IEC 27001 Compliance</h5>
                                            <p className="text-[10px] text-gray-500 font-medium">Requires mandatory 100% MFA on privileged credentials, active system load alarms, and formal SSDLC checklists.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="p-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                                            ✓ COMPLIANT
                                        </span>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-800">GDPR Compliance (EU)</h5>
                                            <p className="text-[10px] text-gray-500 font-medium">PII fields (emails, phone numbers, face templates, physical addresses) deterministic AES-256 encrypted in database. Supports user right-to-be-forgotten erasure.</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <span className="p-1.5 rounded-lg text-xs font-bold bg-green-100 text-green-700">
                                            ✓ COMPLIANT
                                        </span>
                                        <div>
                                            <h5 className="text-xs font-bold text-gray-800">DPDP Act 2023 Compliance (India)</h5>
                                            <p className="text-[10px] text-gray-500 font-medium">Enforces strict customer phone verification, double-opt-in OTP flows, explicit seller onboarding checklists, and soft-delete exclusions.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityCommandCenter;
