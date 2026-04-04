import React from 'react';
import {
    FiX, FiActivity, FiUser, FiGlobe, FiClock, FiShield, FiAlertTriangle, FiCheckCircle, FiInfo
} from 'react-icons/fi';

const ActivityLogInspector = ({ log, onClose }) => {
    if (!log) return null;

    const getSeverityStyles = (severity) => {
        switch (severity) {
            case 'Critical': return 'text-red-600 bg-red-50 border-red-100';
            case 'Warning': return 'text-orange-600 bg-orange-50 border-orange-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
            // Info is default
        }
    };

    const severityStyle = getSeverityStyles(log.severity);

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200 z-[60] flex flex-col transform transition-transform duration-300 ease-out h-full">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${severityStyle}`}>
                            {log.severity}
                        </span>
                        <span className="text-gray-400 text-xs font-mono">{log.id}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Log Details</h2>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                >
                    <FiX size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                {/* Main Action Card */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                            <FiActivity size={24} />
                        </div>
                        <div>
                            <p className="font-bold text-gray-800 text-lg">{log.action}</p>
                            <p className="text-sm text-gray-500 mt-1">{log.description}</p>
                        </div>
                    </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 border border-gray-100 rounded-xl bg-white">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                            <FiClock /> Timestamp
                        </p>
                        <p className="font-mono text-xs font-medium text-gray-700">{log.timestamp}</p>
                    </div>
                    <div className="p-3 border border-gray-100 rounded-xl bg-white">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1 flex items-center gap-1">
                            <FiGlobe /> IP Address
                        </p>
                        <p className="font-mono text-xs font-medium text-gray-700">{log.ip}</p>
                    </div>
                </div>

                {/* Actor Info */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">Actor (Performer)</h3>
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                            {log.actorName[0]}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">{log.actorName}</p>
                            <p className="text-xs text-gray-500">{log.actorType} • {log.actorId}</p>
                        </div>
                    </div>
                </div>

                {/* Target Info */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">Target Entity</h3>
                    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                            {log.targetName[0]}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">{log.targetName}</p>
                            <p className="text-xs text-gray-500">{log.targetType} • {log.targetId}</p>
                        </div>
                    </div>
                </div>

                {/* Raw Metadata */}
                {log.metadata && (
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            System Metadata
                        </h3>
                        <div className="bg-gray-900 rounded-xl p-4 overflow-hidden">
                            <pre className="text-[10px] font-mono text-green-400 overflow-x-auto custom-scrollbar">
                                {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

            </div>

            {/* Footer - Read Only */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
                    <FiShield /> This log is immutable and cannot be edited.
                </p>
            </div>

        </div>
    );
};

export default ActivityLogInspector;
