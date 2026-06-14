import React, { useState, useEffect } from 'react';
import {
    FiX, FiEye, FiSave, FiSend, FiSmartphone, FiMonitor, FiCalendar, FiUsers, FiAward
} from 'react-icons/fi';
import ConfirmModal from '../common/ConfirmModal';

const AnnouncementInspector = ({ announcement, onClose, onSave, onPublish }) => {
    // State for form fields
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [target, setTarget] = useState('All Users'); // All Users, Sellers Only, Buyers Only, Admins Only
    const [priority, setPriority] = useState('Normal'); // Normal, Important, Critical
    const [previewMode, setPreviewMode] = useState('mobile'); // mobile, desktop

    // Quick Action State
    const [quickActionLabel, setQuickActionLabel] = useState('');
    const [quickActionRoute, setQuickActionRoute] = useState('');

    // Validation State
    const [error, setError] = useState('');

    // Load initial data if editing
    useEffect(() => {
        if (announcement) {
            setTitle(announcement.title);
            setMessage(announcement.message);
            setTarget(announcement.target);
            setPriority(announcement.priority);
            setQuickActionLabel(announcement.quickAction?.label || '');
            setQuickActionRoute(announcement.quickAction?.route || '');
        } else {
            // Reset for new announcement
            setTitle('');
            setMessage('');
            setTarget('All Users');
            setPriority('Normal');
            setQuickActionLabel('');
            setQuickActionRoute('');
        }
        setError('');
    }, [announcement]);

    const validate = () => {
        // Rule 1: Max 80 chars
        if (title.length > 80) {
            setError('Title must be 80 characters or less.');
            return false;
        }
        // Rule 2: No Emojis (Regex for common emojis ranges)
        const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
        if (emojiRegex.test(title)) {
            setError('Governance Rule: No emojis in the title. Keep it official.');
            return false;
        }
        if (!title.trim() || !message.trim()) {
            setError('Title and message are required.');
            return false;
        }
        return true;
    };

    const handleSave = () => {
        if (!validate()) return;
        const quickAction = quickActionLabel && quickActionRoute ? { label: quickActionLabel, route: quickActionRoute } : null;
        onSave({ title, message, target, priority, status: 'Draft', quickAction });
    };

    const [showConfirm, setShowConfirm] = useState(false);

    const handlePublish = () => {
        if (!validate()) return;
        setShowConfirm(true);
    };

    const confirmPublish = () => {
        const quickAction = quickActionLabel && quickActionRoute ? { label: quickActionLabel, route: quickActionRoute } : null;
        onPublish({ title, message, target, priority, status: 'Published', quickAction });
    };

    const isLocked = announcement?.status === 'Published';

    return (
        <div className="fixed inset-0 z-[60] flex justify-end pointer-events-none">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />

            {/* Drawer Container - Wider for Dual Pane */}
            <div className="relative w-full md:w-[900px] h-full bg-white/95 backdrop-blur-xl shadow-2xl border-l border-gray-200 pointer-events-auto flex flex-col md:flex-row transform transition-transform duration-300 ease-out">

                {/* LEFT PANE: EDITOR */}
                <div className="flex-1 flex flex-col border-r border-gray-200 h-full overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white/50">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {announcement ? 'Edit Announcement' : 'New Announcement'}
                            </h2>
                            <p className="text-xs text-gray-500">Create official platform communications</p>
                        </div>
                        <button onClick={onClose} className="md:hidden p-2 text-gray-500"><FiX /></button>
                    </div>

                    {isLocked && (
                        <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-3 text-blue-800 text-sm font-medium">
                            <FiAward />
                            <span>This announcement is PUBLISHED and LOCKED.</span>
                        </div>
                    )}

                    {/* Form Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">

                        {/* Title */}
                        <div>
                            <div className="flex justify-between">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Title</label>
                                <span className={`text-[10px] font-mono ${title.length > 80 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                    {title.length}/80
                                </span>
                            </div>
                            <input
                                type="text"
                                value={title}
                                disabled={isLocked}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (error) setError('');
                                }}
                                placeholder="e.g., Platform Maintenance Update"
                                className={`w-full p-3 rounded-xl bg-gray-50 border outline-none font-bold text-gray-800 transition-colors ${error && (title.length > 80 || /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu.test(title))
                                    ? 'border-red-300 bg-red-50'
                                    : 'border-gray-200 focus:border-blue-500'
                                    }`}
                            />
                            {error && <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>}
                        </div>

                        {/* Audience & Priority Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Target Audience</label>
                                <select
                                    value={target}
                                    disabled={isLocked}
                                    onChange={(e) => setTarget(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 text-sm font-medium disabled:opacity-50"
                                >
                                    <option value="All Users">All Users</option>
                                    <option value="Sellers Only">Sellers Only</option>
                                    <option value="Buyers Only">Buyers Only</option>
                                    <option value="Admins Only">Admins Only</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delivery Channels</label>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked readOnly className="rounded text-blue-600 focus:ring-blue-500" />
                                        In-App
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-bold text-gray-400 cursor-not-allowed">
                                        <input type="checkbox" disabled className="rounded text-gray-400" />
                                        Email (Coming Soon)
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Priority Level</label>
                                <select
                                    value={priority}
                                    disabled={isLocked}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 text-sm font-medium disabled:opacity-50"
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Important">Important</option>
                                    <option value="Critical">Critical Alert</option>
                                </select>
                            </div>
                        </div>

                        {/* Message Editor (Mocked Rich Text) */}
                        <div className="flex-1 flex flex-col">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Message Content</label>
                            <textarea
                                value={message}
                                disabled={isLocked}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your announcement details here..."
                                className="flex-1 min-h-[250px] w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-blue-500 text-sm leading-relaxed resize-none disabled:opacity-70 disabled:bg-gray-100"
                            />
                            <p className="text-[10px] text-gray-400 mt-2 text-right">Markdown supported (No HTML)</p>
                        </div>

                        {/* Quick Action Section */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                <span className="bg-gray-200 text-gray-600 px-1.5 rounded">Optional</span> Quick Action
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Action Label (Verb)</label>
                                    <input
                                        type="text"
                                        value={quickActionLabel}
                                        disabled={isLocked}
                                        onChange={(e) => setQuickActionLabel(e.target.value)}
                                        placeholder="e.g. Upload Docs"
                                        className="w-full p-2 rounded-lg bg-white border border-gray-200 text-sm font-bold placeholder-gray-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Route / Link</label>
                                    <input
                                        type="text"
                                        value={quickActionRoute}
                                        disabled={isLocked}
                                        onChange={(e) => setQuickActionRoute(e.target.value)}
                                        placeholder="e.g. /seller/verification"
                                        className="w-full p-2 rounded-lg bg-white border border-gray-200 text-sm font-mono placeholder-gray-300"
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2">
                                Only appears if both fields are filled. Use for explicit follow-up actions like "Verify Documents".
                            </p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                        {isLocked ? (
                            <button
                                onClick={onClose}
                                className="w-full py-3 rounded-xl bg-gray-200 text-gray-600 font-bold hover:bg-gray-300 transition-colors"
                            >
                                Close (Read Only)
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <FiSave /> Save Draft
                                </button>
                                {JSON.parse(localStorage.getItem('aisleUser') || '{}').role === 'moderator' ? (
                                    <button
                                        disabled
                                        className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-400 font-bold cursor-not-allowed flex items-center justify-center gap-2"
                                        title="Moderators can only save drafts. Ask Super Admin to publish."
                                    >
                                        <FiSend /> Publish Restricted
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePublish}
                                        className="flex-1 py-3 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-gray-200"
                                    >
                                        <FiSend /> Publish Now
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                </div>

                {/* RIGHT PANE: LIVE PREVIEW */}
                <div className="hidden md:flex flex-col w-[400px] bg-gray-100 border-l border-gray-200 h-full relative">

                    {/* Preview Toggle */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg p-1 flex gap-1 z-10 border border-gray-200">
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-2 rounded-full transition-colors ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FiSmartphone size={18} />
                        </button>
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-2 rounded-full transition-colors ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <FiMonitor size={18} />
                        </button>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 flex items-center justify-center p-8 overflow-hidden">

                        {/* Mobile Preview Frame */}
                        <div className={`transition-all duration-500 ease-in-out bg-white shadow-2xl border-4 border-gray-800 overflow-hidden flex flex-col ${previewMode === 'mobile'
                            ? 'w-[300px] h-[600px] rounded-[3rem]'
                            : 'w-full h-[250px] rounded-xl border-[1px] border-gray-200'
                            }`}>

                            {/* Fake Status Bar (Mobile only) */}
                            {previewMode === 'mobile' && (
                                <div className="h-6 bg-gray-800 w-full mb-2" />
                            )}

                            {/* Content Preview */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                                {/* Announcement Card Preview */}
                                <div className={`bg-white p-4 rounded-xl shadow-sm border border-gray-100 ${priority === 'Critical' ? 'border-l-4 border-l-red-500' :
                                    priority === 'Important' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-blue-500'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${priority === 'Critical' ? 'bg-red-100 text-red-600' :
                                            priority === 'Important' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                            }`}>
                                            {priority}
                                        </span>
                                        <span className="text-[10px] text-gray-400">Just Now</span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 leading-tight break-words">
                                        {title || 'Untitled Announcement'}
                                    </h3>
                                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                                        {message || 'Your message preview will appear here...'}
                                    </p>
                                    <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <FiUsers /> {target}
                                        </span>
                                        {quickActionLabel && quickActionRoute ? (
                                            <button className="px-3 py-1 bg-black text-white text-[10px] font-bold rounded-lg shadow-lg shadow-gray-200 flex items-center gap-1">
                                                {quickActionLabel} &rarr;
                                            </button>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">No action required</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>

                    <div className="p-4 text-center text-xs text-gray-400">
                        Live Preview Mode • {previewMode === 'mobile' ? 'Mobile View' : 'Web View'}
                    </div>

                    {/* Close Button (Desktop) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white text-gray-500 shadow hover:bg-gray-100"
                    >
                        <FiX />
                    </button>
                </div>

            </div>
            {/* Governance Confirmation Modal */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={confirmPublish}
                title="Governance Check"
                message="Publishing will lock this announcement and notify all selected users. This cannot be undone. Proceed?"
                confirmLabel="Confirm Publish"
                cancelLabel="Back to Editor"
                type="warning"
                confirmVariant="default"
            />
        </div>
    );
};

export default AnnouncementInspector;
