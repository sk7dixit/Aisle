import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiSearch, FiAlertCircle } from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

/* 
  STEP 14 - REPORTS WIREFRAME EXECUTION
  Strict layout adherence.
  Trust & Safety Focus.
*/

const Reports = () => {
    const [filterType, setFilterType] = useState('Unresolved'); // Unresolved | Escalated | Resolved
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [actionModal, setActionModal] = useState(null); // { type: 'resolve' | 'escalate', report: {} }
    const [reasonInput, setReasonInput] = useState('');
    const [severityInput, setSeverityInput] = useState('Medium');

    const user = JSON.parse(localStorage.getItem('shoplensUser') || '{}');
    const role = user.role?.toLowerCase() || 'visitor';

    const fetchReports = async () => {
        try {
            const token = user.token;
            const res = await fetch('/api/admin/reports', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const mapped = data.map(r => ({
                    id: r._id,
                    displayId: r._id.substring(r._id.length - 6).toUpperCase(),
                    type: 'Product', // Defaulting for now
                    category: r.category,
                    reason: r.reason, // Context
                    description: r.description,
                    priority: r.priority,
                    status: r.status === 'Open' ? 'Unresolved' : r.status, // Map 'Open' to 'Unresolved' wireframe state
                    reporterType: 'Customer', // Mock for now
                    prevReports: 1, // Mock
                    targetName: r.targetName || 'Green Valley Grocers', // Fallback
                    targetId: r.target,
                    date: new Date(r.createdAt).toLocaleDateString()
                }));
                setReports(mapped);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const executeAction = async () => {
        if (!actionModal) return;

        try {
            const token = user.token;
            const isResolve = actionModal.type === 'resolve';

            const body = isResolve
                ? { status: 'Resolved', resolution: reasonInput }
                : { status: 'Escalated', escalationReason: reasonInput, priority: severityInput };

            const res = await fetch(`/api/admin/reports/${actionModal.report.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                fetchReports();
                setActionModal(null);
                setReasonInput('');
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Filter Logic
    const filteredReports = reports.filter(r => {
        if (filterType === 'Unresolved') return r.status === 'Unresolved' || r.status === 'Open';
        return r.status === filterType;
    });

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Reports...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto space-y-8 bg-[#F2F2F2]">

            {/* 2️⃣ PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">Review and resolve issues reported by users</p>
            </div>

            {/* 3️⃣ PRIMARY ACTION ZONE */}
            <div className="bg-white border border-[#CBCBCB] rounded-xl overflow-hidden shadow-sm">

                {/* 4️⃣ FILTER & SEARCH */}
                <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        {['Unresolved', 'Escalated', 'Resolved'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilterType(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filterType === f
                                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Report ID / Target"
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-gray-400 text-gray-700"
                    />
                </div>

                {/* 5️⃣ TABLE STRUCTURE */}
                <div className="overflow-x-auto">
                    {filteredReports.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-[#CBCBCB]">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/3">Report Context</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/5">Reporter Signal</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">Target</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredReports.map((report) => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => {/* Detail Drawer Placeholder */ }}>
                                        {/* COL 1: Context */}
                                        <td className="p-6 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{report.category}</div>
                                            <div className="text-gray-500 text-xs mt-1">ID: {report.displayId} • {report.date}</div>
                                            <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-sm">{report.reason}</p>
                                        </td>

                                        {/* COL 2: Signal */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Reporter: <span className="text-gray-900 font-medium">{report.reporterType}</span></p>
                                                <p>History: <span className="text-gray-900 font-medium">{report.prevReports} reports</span></p>
                                            </div>
                                        </td>

                                        {/* COL 3: Target */}
                                        <td className="p-6 align-top">
                                            <div className="text-xs">
                                                <p className="text-gray-500 mb-1">{report.type}</p>
                                                <p className="font-bold text-gray-900">{report.targetName}</p>
                                            </div>
                                        </td>

                                        {/* COL 4: Actions */}
                                        <td className="p-6 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                            {(report.status === 'Unresolved' || report.status === 'Open') && (
                                                <div className="flex justify-end gap-3">
                                                    {/* HIDE RESOLVE FOR MODERATORS */}
                                                    {role !== 'moderator' && (
                                                        <button
                                                            onClick={() => setActionModal({ type: 'resolve', report })}
                                                            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-xs font-bold rounded shadow-sm transition-colors"
                                                        >
                                                            Resolve
                                                        </button>
                                                    )}

                                                    {/* ALL ROLES CAN ESCALATE */}
                                                    <button
                                                        onClick={() => setActionModal({ type: 'escalate', report })}
                                                        className="px-4 py-2 bg-white border border-[#4D1717]/30 text-[#4D1717] hover:bg-[#4D1717]/5 text-xs font-bold rounded shadow-sm transition-colors"
                                                    >
                                                        Escalate
                                                    </button>
                                                </div>
                                            )}
                                            {report.status !== 'Unresolved' && report.status !== 'Open' && (
                                                <span className={`text-xs font-bold px-3 py-1 rounded border ${report.status === 'Resolved'
                                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                                    : 'bg-[#4D1717]/5 text-[#4D1717] border-[#4D1717]/20'
                                                    }`}>
                                                    {report.status.toUpperCase()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 9️⃣ EMPTY STATE */
                        <div className="py-24 text-center">
                            <h3 className="text-gray-900 font-bold mb-1">
                                {filterType === 'Unresolved' ? 'No unresolved reports.' : 'No reports found.'}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {filterType === 'Unresolved' ? 'All reported issues have been reviewed.' : 'Adjust filters to see more.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {actionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
                        {/* 7️⃣ / 8️⃣ MODAL HEADER */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className={`text-lg font-bold ${actionModal.type === 'resolve' ? 'text-gray-900' : 'text-[#4D1717]'}`}>
                                {actionModal.type === 'resolve' ? 'Resolve Report' : 'Escalate Report'}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {actionModal.type === 'resolve'
                                    ? "This report will be marked as resolved and closed."
                                    : "Escalated reports may result in enforcement actions."
                                }
                            </p>
                        </div>

                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                    {actionModal.type === 'resolve' ? 'Resolution Reason (Required)' : 'Escalation Reason (Required)'}
                                </label>
                                <textarea
                                    value={reasonInput}
                                    onChange={(e) => setReasonInput(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none h-32 resize-none"
                                    placeholder={actionModal.type === 'resolve' ? "Issue fixed, invalid report..." : "Severe violation, pattern detected..."}
                                />
                            </div>

                            {actionModal.type === 'escalate' && (
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Severity</label>
                                    <div className="flex gap-4">
                                        {['Low', 'Medium', 'High'].map(lev => (
                                            <label key={lev} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="severity"
                                                    value={lev}
                                                    checked={severityInput === lev}
                                                    onChange={(e) => setSeverityInput(e.target.value)}
                                                    className="accent-[#4D1717]"
                                                />
                                                <span className="text-sm text-gray-700">{lev}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ACTIONS */}
                            <div className="flex gap-3 justify-end mt-4">
                                <button
                                    onClick={() => { setActionModal(null); setReasonInput(''); }}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeAction}
                                    disabled={!reasonInput.trim()}
                                    className={`px-5 py-2.5 text-sm font-bold text-white rounded shadow-sm transition-colors ${actionModal.type === 'resolve'
                                        ? 'bg-gray-900 hover:bg-black'
                                        : 'bg-[#4D1717] hover:bg-[#3d1212] disabled:opacity-50'
                                        }`}
                                >
                                    {actionModal.type === 'resolve' ? 'Confirm Resolution' : 'Escalate'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
