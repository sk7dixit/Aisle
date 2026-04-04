import React, { useState } from 'react';
import {
    FiX, FiFlag, FiCheckCircle, FiClock, FiAlertTriangle, FiUser, FiShoppingBag, FiPackage, FiMessageSquare, FiShield
} from 'react-icons/fi';

const ReportInspector = ({ report, onClose, onResolve, onEscalate, onBan }) => {
    const [adminNote, setAdminNote] = useState('');

    if (!report) return null;

    // Helper to determine SLA color
    const getSLAStatus = (priority, hoursOld) => {
        const slaLimit = priority === 'High' ? 24 : priority === 'Medium' ? 48 : 72;
        const isOverdue = hoursOld > slaLimit;

        return {
            isOverdue,
            text: isOverdue ? `Overdue by ${Math.round(hoursOld - slaLimit)}h` : `${Math.round(slaLimit - hoursOld)}h remaining`,
            color: isOverdue ? 'text-red-600 bg-red-50 border-red-100' : 'text-green-600 bg-green-50 border-green-100'
        };
    };

    const sla = getSLAStatus(report.priority, report.hoursSinceCreation);

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200 z-[60] flex flex-col transform transition-transform duration-300 ease-out h-full">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${report.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                report.priority === 'Medium' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    'bg-gray-50 text-gray-500 border-gray-100'
                            }`}>
                            {report.priority} Priority
                        </span>
                        <span className="text-gray-400 text-xs">#{report.id}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Report Details</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* SLA Status Card */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${sla.color}`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/50 rounded-lg">
                            <FiClock className="text-lg" />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase opacity-80">SLA Status</p>
                            <p className="font-bold">{sla.text}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] opacity-70">Created</p>
                        <p className="text-xs font-bold">{report.date}</p>
                    </div>
                </div>

                {/* Report Info */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <FiFlag className="text-blue-500" /> Reason for Report
                    </h3>
                    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                        <p className="font-semibold text-gray-800 mb-1">{report.reason}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            "{report.description || 'Customer provided no additional details.'}"
                        </p>
                    </div>
                </div>

                {/* Target Entity */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        {report.type === 'Shop' ? <FiShoppingBag className="text-purple-500" /> :
                            report.type === 'User' ? <FiUser className="text-green-500" /> :
                                <FiPackage className="text-orange-500" />}
                        Reported {report.type}
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                            {report.targetImage ? <img src={report.targetImage} className="w-full h-full object-cover rounded-lg" /> : <FiShield />}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800">{report.targetName}</p>
                            <p className="text-xs text-gray-500">ID: {report.targetId}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                    Total Reports: {report.targetTotalReports || 1}
                                </span>
                            </div>
                        </div>
                        <button className="text-xs font-bold text-blue-600 hover:underline">
                            View Profile
                        </button>
                    </div>
                </div>

                {/* Reporter Info */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <FiUser className="text-gray-500" /> Reported By
                    </h3>
                    <div className="flex items-center justify-between p-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                                {report.reporterName ? report.reporterName[0] : 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">{report.reporterName || 'Anonymous'}</p>
                                <p className="text-[10px] text-gray-400">Customer</p>
                            </div>
                        </div>
                        <button className="text-xs text-gray-400 hover:text-gray-600 underline">
                            History
                        </button>
                    </div>
                </div>

                {/* Admin Actions Log */}
                <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <FiMessageSquare className="text-gray-500" /> Internal Notes
                    </h3>
                    <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        placeholder="Add investigation notes..."
                        className="w-full text-sm p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 min-h-[80px]"
                    />
                </div>

            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <button
                        onClick={() => onEscalate(report.id)}
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-colors"
                    >
                        <FiAlertTriangle /> Escalate
                    </button>
                    <button
                        onClick={() => onBan(report.id)} // Specific action based on type
                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors"
                    >
                        <FiShield /> Sanction {report.type}
                    </button>
                </div>
                <button
                    onClick={() => onResolve(report.id)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                >
                    <FiCheckCircle /> Mark Resolved
                </button>
            </div>

        </div>
    );
};

export default ReportInspector;
