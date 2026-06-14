import React, { useState } from 'react';
import {
    FiActivity, FiSearch, FiFilter, FiAlertCircle, FiCheckCircle, FiInfo, FiMoreVertical, FiEye, FiClock, FiShield
} from 'react-icons/fi';
// import GlassCard from '../../components/ui/GlassCard'; // Debug: Using divs first to ensure stability
import ActivityLogInspector from '../../components/admin/ActivityLogInspector';

// Mock Data
// Mock Data Removed - Now using Real API

const ActivityLogs = () => {
    const [filterSeverity, setFilterSeverity] = useState('All');
    const [filterRole, setFilterRole] = useState('All');
    const [filterAction, setFilterAction] = useState('All');
    const [selectedLog, setSelectedLog] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [logs, setLogs] = useState([]);
    const [stats, setStats] = useState({ last24h: 0, critical: 5, adminActions: 0 }); // Default or Loading State

    const fetchLogs = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const query = new URLSearchParams();
            if (filterSeverity !== 'All') query.append('severity', filterSeverity);

            const res = await fetch(`/api/admin/logs?${query.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                const mapped = data.logs.map(l => ({
                    id: l._id,
                    timestamp: new Date(l.createdAt).toLocaleString(),
                    actorName: l.performedBy?.name || 'System',
                    actorType: l.performedBy?.role || 'System',
                    action: l.actionType,
                    description: l.reason || 'No description provided',
                    targetName: l.metadata?.sellerName || l.metadata?.productName || l.metadata?.section || l.targetType, // Smart Fallback
                    targetType: l.targetType,
                    severity: l.severity,
                    ip: l.ipAddress
                }));
                setLogs(mapped);
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error(error);
        }
    };

    React.useEffect(() => {
        fetchLogs();
    }, [filterSeverity]); // Re-fetch on major filter change

    const user = JSON.parse(localStorage.getItem('aisleUser') || '{}');

    // Frontend filtering for search/role/action (since backend only does severity for now)
    const filteredLogs = logs.filter(log => {
        const matchesRole = filterRole === 'All' || log.actorType === filterRole;
        const matchesAction = filterAction === 'All' || log.action.includes(filterAction);
        const matchesSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.actorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.targetName?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesRole && matchesAction && matchesSearch;
    });

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'Critical': return <FiAlertCircle className="text-red-500" />;
            case 'Warning': return <FiInfo className="text-orange-500" />;
            default: return <FiCheckCircle className="text-blue-500" />;
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 relative">

            {/* KPI Cards */}
            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase">
                        <FiActivity /> 24h Activity
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.last24h}</p>
                    <p className="text-[10px] text-green-600 font-bold">Latest Actions</p>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase">
                        <FiAlertCircle /> Critical
                    </div>
                    <p className="text-2xl font-bold text-red-600">{stats.criticalCount || 0}</p>
                    <p className="text-[10px] text-gray-400 font-bold">Total Critical Events</p>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase">
                        <FiShield /> Admin Actions
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{stats.adminActions}</p>
                    <p className="text-[10px] text-gray-400 font-bold">In last 24h</p>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase">
                        <FiCheckCircle /> System Jobs
                    </div>
                    <p className="text-2xl font-bold text-gray-600">--</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white/40 rounded-3xl border border-white/60 backdrop-blur-md shadow-lg p-0">

                {/* Controls */}
                <div className="p-4 border-b border-gray-100 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Critical', 'Warning', 'Info'].map(sev => (
                                <button
                                    key={sev}
                                    onClick={() => setFilterSeverity(sev)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${filterSeverity === sev
                                        ? 'bg-gray-800 text-white shadow-lg'
                                        : 'bg-white/50 text-gray-500 hover:bg-white'
                                        }`}
                                >
                                    {sev}
                                </button>
                            ))}
                        </div>

                        {/* Export Hint */}
                        <button disabled className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-400 rounded-lg text-xs font-bold cursor-not-allowed opacity-60" title="Export available on Desktop only">
                            <FiCheckCircle /> Export CSV (Desktop Only)
                        </button>
                    </div>

                    {/* Advanced Filters Row */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <select className="bg-white/50 border border-gray-200 text-gray-600 text-xs rounded-lg p-2 outline-none font-bold"
                            value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="All">All Roles</option>
                            <option value="Admin">Super Admin</option>
                            <option value="Moderator">Moderator</option>
                            <option value="System">System</option>
                        </select>

                        <select className="bg-white/50 border border-gray-200 text-gray-600 text-xs rounded-lg p-2 outline-none font-bold"
                            value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                            <option value="All">All Actions</option>
                            <option value="Login">Login / Auth</option>
                            <option value="Report">Report Handling</option>
                            <option value="Settings">System Settings</option>
                        </select>

                        <div className="relative group flex-1">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/50 pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition-all font-medium text-gray-700 text-xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Table (Desktop) / Timeline (Mobile) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">

                    {/* Desktop Headers */}
                    <div className="hidden md:grid grid-cols-[1.5fr,1.5fr,2fr,1.5fr,1fr,1.5fr,0.5fr] gap-4 p-4 bg-gray-50/80 text-xs font-bold text-gray-400 uppercase sticky top-0 backdrop-blur z-10 border-b border-gray-200">
                        <div>Timestamp</div>
                        <div>Actor</div>
                        <div>Action</div>
                        <div>Target</div>
                        <div>Severity</div>
                        <div>IP Address</div>
                        <div className="text-right">View</div>
                    </div>

                    <div className="p-4 md:p-0 space-y-4 md:space-y-0">
                        {filteredLogs.map(log => (
                            <React.Fragment key={log.id}>
                                {/* Mobile Timeline Card */}
                                <div className="md:hidden flex gap-4 relative">
                                    {/* Timeline Line */}
                                    <div className="flex flex-col items-center">
                                        <div className={`w-3 h-3 rounded-full border-2 ${log.severity === 'Critical' ? 'border-red-500 bg-red-100' :
                                            log.severity === 'Warning' ? 'border-orange-500 bg-orange-100' : 'border-blue-500 bg-blue-100'
                                            }`} />
                                        <div className="w-0.5 flex-1 bg-gray-200 my-1" />
                                    </div>

                                    <div
                                        onClick={() => setSelectedLog(log)}
                                        className="flex-1 bg-white/60 p-4 rounded-xl border border-gray-100 mb-4 shadow-sm active:scale-[0.98] transition-transform"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 font-mono">{log.timestamp}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                                                }`}>{log.severity}</span>
                                        </div>
                                        <p className={`font-bold text-gray-800 ${log.action.match(/Oversee|Suspend|Delete|Critical/i) ? 'text-red-600' : ''}`}>
                                            {log.action}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-2">by <span className="font-semibold">{log.actorName}</span></p>
                                        <div className="text-xs bg-gray-50 p-2 rounded text-gray-600 truncate">
                                            Target: {log.targetName}
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Row */}
                                <div className="hidden md:grid grid-cols-[1.5fr,1.5fr,2fr,1.5fr,1fr,1.5fr,0.5fr] gap-4 p-4 border-b border-gray-100 hover:bg-white/60 transition-colors items-center text-sm">
                                    <div className="font-mono text-gray-500 text-xs">{log.timestamp}</div>

                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                            {log.actorName[0]}
                                        </div>
                                        <div className="truncate">
                                            <p className="font-bold text-gray-700 text-xs">{log.actorName}</p>
                                            <p className="text-[10px] text-gray-400">{log.actorType}</p>
                                        </div>
                                    </div>

                                    <div className={`font-medium ${log.action.match(/Override|Suspend|Delete|Critical/i) ? 'text-red-600 bg-red-50 px-2 py-1 rounded w-fit' : 'text-gray-800'}`}>
                                        {log.action}
                                    </div>

                                    <div className="truncate text-gray-600 text-xs">
                                        {log.targetName}
                                        <span className="block text-[10px] text-gray-400">{log.targetType}</span>
                                    </div>

                                    <div>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1 w-fit ${log.severity === 'Critical' ? 'bg-red-50 text-red-600' :
                                            log.severity === 'Warning' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {getSeverityIcon(log.severity)} {log.severity}
                                        </span>
                                    </div>

                                    <div className="font-mono text-gray-500 text-xs">{log.ip}</div>

                                    <div className="text-right">
                                        <button
                                            onClick={() => setSelectedLog(log)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <FiEye />
                                        </button>
                                    </div>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Inspector */}
            {selectedLog && (
                <>
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setSelectedLog(null)} />
                    <ActivityLogInspector log={selectedLog} onClose={() => setSelectedLog(null)} />
                </>
            )}

        </div>
    );
};

export default ActivityLogs;
