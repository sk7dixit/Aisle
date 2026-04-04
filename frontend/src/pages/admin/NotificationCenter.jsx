import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FiSettings, FiBell, FiMail, FiSmartphone, FiActivity, FiSave, FiAlertCircle, FiCheck, FiRefreshCw, FiArrowLeft
} from 'react-icons/fi';
import { getNotificationConfig, updateNotificationConfig, getNotificationLogs, triggerTestNotification } from '../../api/notificationApi';

const NotificationCenter = () => {
    const navigate = useNavigate();
    const [config, setConfig] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'logs'
    const [message, setMessage] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [configData, logsData] = await Promise.all([
                getNotificationConfig(),
                getNotificationLogs()
            ]);
            setConfig(configData);
            setLogs(logsData);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    }, []);

    const fetchLogs = useCallback(async () => {
        try {
            const logsData = await getNotificationLogs();
            setLogs(logsData);
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchLogs, 10000); // Poll logs every 10s
        return () => clearInterval(interval);
    }, [fetchData, fetchLogs]);

    const handleChannelToggle = async (channel) => {
        if (!config) return;
        const newChannels = { ...config.channels, [channel]: !config.channels[channel] };
        setConfig({ ...config, channels: newChannels });
        // Auto-save logic could go here, or wait for explicit save
        // Let's do explicit save to reduce API calls, or optimistic UI with background save
    };

    const handleEventUpdate = (eventType, field, value) => {
        if (!config) return;

        let newEventConfig = { ...config.events[eventType] };

        if (field === 'channels') {
            // Toggle channel in array
            if (newEventConfig.channels.includes(value)) {
                newEventConfig.channels = newEventConfig.channels.filter(c => c !== value);
            } else {
                newEventConfig.channels = [...newEventConfig.channels, value];
            }
        } else {
            newEventConfig[field] = value;
        }

        setConfig({
            ...config,
            events: {
                ...config.events,
                [eventType]: newEventConfig
            }
        });
    };

    const saveConfig = async () => {
        try {
            await updateNotificationConfig({
                channels: config.channels,
                events: config.events
            });
            setMessage('Settings saved successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch {
            setMessage('Error saving settings.');
        }
    };

    const handleTestTrigger = async (event) => {
        try {
            await triggerTestNotification(event, null, 'test@example.com'); // Mock recipient
            fetchLogs(); // Refresh logs immediately
            setMessage(`Test ${event} triggering...`);
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-10 text-center text-gray-500">Loading Notification Center...</div>;

    return (
        <div className="h-full flex flex-col gap-6 relative">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="p-2 rounded-xl bg-white/60 border border-gray-200 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                        title="Back to Dashboard"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Notification Center</h1>
                        <p className="text-sm text-gray-500">Manage delivery infrastructure and view delivery logs.</p>
                    </div>
                </div>

                {message && (
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse">
                        <FiCheck /> {message}
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/50 text-gray-600 hover:bg-white'}`}
                    >
                        Delivery Settings
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/50 text-gray-600 hover:bg-white'}`}
                    >
                        Logs
                    </button>
                </div>
            </div>

            {activeTab === 'settings' ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">

                    {/* Channel Toggles */}
                    <div className="p-6 bg-white/60 rounded-3xl border border-white/60 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FiSettings className="text-blue-500" /> Global Channels
                        </h2>
                        {/* Fallback if config is null but not loading (error state) */}
                        {!config ? (
                            <div className="p-4 text-center text-red-500 bg-red-50 rounded-xl">
                                Unable to load configuration. Please check your permissions or try again.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Email */}
                                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.channels.email ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
                                    onClick={() => handleChannelToggle('email')}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.channels.email ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <FiMail />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700">Email</p>
                                            <p className="text-xs text-gray-500">Send to verified email</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.channels.email ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.channels.email ? 'translate-x-6' : ''}`} />
                                    </div>
                                </div>

                                {/* In-App */}
                                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${config.channels.inApp ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}
                                    onClick={() => handleChannelToggle('inApp')}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.channels.inApp ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <FiBell />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700">In-App</p>
                                            <p className="text-xs text-gray-500">Dashboard notifications</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.channels.inApp ? 'bg-purple-500' : 'bg-gray-300'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${config.channels.inApp ? 'translate-x-6' : ''}`} />
                                    </div>
                                </div>

                                {/* Push (Future) */}
                                <div className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between opacity-60 ${config.channels.push ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.channels.push ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <FiSmartphone />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-700">Push (Beta)</p>
                                            <p className="text-xs text-gray-500">Mobile push alerts</p>
                                        </div>
                                    </div>
                                    <div className="text-xs font-bold px-2 py-1 bg-gray-200 rounded text-gray-500">Soon</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Delivery Rules */}
                    {config && (
                        <div className="p-4 md:p-6 bg-white/60 rounded-3xl border border-white/60 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <FiActivity className="text-orange-500" /> Delivery Rules
                                </h2>
                                <button onClick={saveConfig} className="w-full md:w-auto justify-center bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-800 transition-colors shadow-lg">
                                    <FiSave /> Save Changes
                                </button>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                                {Object.entries(config.events).map(([key, rule]) => (
                                    <div key={key} className="p-4 bg-white/50 rounded-2xl border border-white/50 shadow-sm flex flex-col gap-4">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                            <span className="font-bold text-gray-800 capitalize">{key.replace('_', ' ')}</span>
                                            <button
                                                onClick={() => handleTestTrigger(key)}
                                                className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                                                title="Trigger Test Notification"
                                            >
                                                <FiWaitCircle />
                                            </button>
                                        </div>

                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-500">Channels</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEventUpdate(key, 'channels', 'email')}
                                                        className={`p-2 rounded-lg transition-all ${rule.channels.includes('email') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'}`}
                                                    >
                                                        <FiMail />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEventUpdate(key, 'channels', 'inApp')}
                                                        className={`p-2 rounded-lg transition-all ${rule.channels.includes('inApp') ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-300'}`}
                                                    >
                                                        <FiBell />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Priority</label>
                                                    <select
                                                        value={rule.priority}
                                                        onChange={(e) => handleEventUpdate(key, 'priority', e.target.value)}
                                                        className={`w-full bg-gray-50 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-gray-100 ${rule.priority === 'critical' ? 'text-red-500' : rule.priority === 'important' ? 'text-orange-500' : 'text-blue-500'}`}
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="important">Important</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Delay</label>
                                                    <select
                                                        value={rule.delay}
                                                        onChange={(e) => handleEventUpdate(key, 'delay', e.target.value)}
                                                        className="w-full bg-gray-50 px-3 py-2 rounded-lg text-xs font-bold outline-none border border-gray-100 text-gray-600"
                                                    >
                                                        <option value="instant">Instant</option>
                                                        <option value="batched">Batched</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200">
                                            <th className="py-3 px-4">Event Type</th>
                                            <th className="py-3 px-4">Active Channels</th>
                                            <th className="py-3 px-4">Priority</th>
                                            <th className="py-3 px-4">Delay</th>
                                            <th className="py-3 px-4 text-center">Test</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm font-medium text-gray-600">
                                        {Object.entries(config.events).map(([key, rule]) => (
                                            <tr key={key} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                                                <td className="py-4 px-4 font-bold text-gray-800 capitalize">
                                                    {key.replace('_', ' ')}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEventUpdate(key, 'channels', 'email')}
                                                            className={`p-2 rounded-lg transition-all ${rule.channels.includes('email') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-300'}`}
                                                            title="Email"
                                                        >
                                                            <FiMail />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEventUpdate(key, 'channels', 'inApp')}
                                                            className={`p-2 rounded-lg transition-all ${rule.channels.includes('inApp') ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-300'}`}
                                                            title="In-App"
                                                        >
                                                            <FiBell />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <select
                                                        value={rule.priority}
                                                        onChange={(e) => handleEventUpdate(key, 'priority', e.target.value)}
                                                        className={`bg-transparent font-bold outline-none cursor-pointer ${rule.priority === 'critical' ? 'text-red-500' :
                                                            rule.priority === 'important' ? 'text-orange-500' : 'text-blue-500'
                                                            }`}
                                                    >
                                                        <option value="normal">Normal</option>
                                                        <option value="important">Important</option>
                                                        <option value="critical">Critical</option>
                                                    </select>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <select
                                                        value={rule.delay}
                                                        onChange={(e) => handleEventUpdate(key, 'delay', e.target.value)}
                                                        className="bg-gray-100 px-3 py-1 rounded-lg text-xs font-bold outline-none cursor-pointer"
                                                    >
                                                        <option value="instant">Instant</option>
                                                        <option value="batched">Batched (Daily)</option>
                                                    </select>
                                                </td>
                                                <td className="py-4 px-4 text-center">
                                                    <button
                                                        onClick={() => handleTestTrigger(key)}
                                                        className="text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Trigger Test Notification"
                                                    >
                                                        <FiWaitCircle />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 bg-white/60 rounded-3xl border border-white/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/30">
                        <h3 className="font-bold text-gray-700">Recent Delivery Logs</h3>
                        <button onClick={fetchLogs} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors">
                            <FiRefreshCw />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                        {/* Mobile List View */}
                        <div className="md:hidden">
                            {logs.map((log) => (
                                <div key={log._id} className="p-4 border-b border-gray-100 hover:bg-white/30 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 capitalize mb-0.5">{log.event.replace('_', ' ')}</span>
                                            <span className="text-[10px] text-gray-400 font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'sent' ? 'bg-green-100 text-green-700' :
                                            log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-gray-500 truncate max-w-[150px]">
                                            {log.recipient?.email || 'N/A'}
                                        </div>
                                        <span className={`flex items-center gap-1 ${log.channel === 'email' ? 'text-blue-500' : 'text-purple-500'}`}>
                                            {log.channel === 'email' ? <FiMail /> : <FiBell />} {log.channel}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <table className="hidden md:table w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                                <tr className="text-xs font-bold text-gray-400 uppercase border-b border-gray-200">
                                    <th className="py-3 px-6">Time</th>
                                    <th className="py-3 px-6">Event</th>
                                    <th className="py-3 px-6">Recipient</th>
                                    <th className="py-3 px-6">Channel</th>
                                    <th className="py-3 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {logs.map((log) => (
                                    <tr key={log._id} className="border-b border-gray-100 hover:bg-white/50 transition-colors">
                                        <td className="py-3 px-6 text-gray-500 font-mono text-xs">
                                            {new Date(log.createdAt).toLocaleTimeString()}
                                        </td>
                                        <td className="py-3 px-6 font-bold text-gray-700 capitalize">
                                            {log.event.replace('_', ' ')}
                                        </td>
                                        <td className="py-3 px-6 text-gray-600">
                                            {log.recipient?.email || 'N/A'}
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`flex items-center gap-1 ${log.channel === 'email' ? 'text-blue-500' : 'text-purple-500'}`}>
                                                {log.channel === 'email' ? <FiMail /> : <FiBell />} {log.channel}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.status === 'sent' ? 'bg-green-100 text-green-700' :
                                                log.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {log.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {logs.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                No logs available.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Start Icon for test trigger button
const FiWaitCircle = () => (
    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export default NotificationCenter;
