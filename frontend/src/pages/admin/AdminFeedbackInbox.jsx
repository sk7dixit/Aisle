import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaSearch, FaFilter, FaInbox, FaExclamationCircle, FaLightbulb,
    FaCommentDots, FaReply, FaCheckCircle, FaSpinner, FaPaperPlane, FaMagic
} from 'react-icons/fa';

const AdminFeedbackInbox = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [feedbackList, setFeedbackList] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [replyMessage, setReplyMessage] = useState('');
    const [replying, setReplying] = useState(false);

    // Fetch All Feedback
    const fetchFeedback = async () => {
        try {
            const res = await fetch('/api/admin/feedback', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbackList(data);
            }
        } catch (error) {
            console.error("Failed to fetch feedback", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    // Handle Admin Reply
    const handleReply = async () => {
        if (!replyMessage.trim() || !selectedFeedback) return;

        setReplying(true);
        try {
            const res = await fetch(`/api/admin/feedback/${selectedFeedback._id}/reply`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    message: replyMessage,
                    status: 'resolved' // Auto-resolve on reply
                })
            });

            if (res.ok) {
                // Update local list
                const updatedFeedback = await res.json();
                setFeedbackList(prev => prev.map(f => f._id === updatedFeedback._id ? updatedFeedback : f));
                setSelectedFeedback(null); // Close detail view
                setReplyMessage('');
                // alert('Reply sent successfully!');
            }
        } catch (error) {
            console.error("Reply failed", error);
        } finally {
            setReplying(false);
        }
    };

    // AI Tone Suggestion Helper (Mock Logic)
    const generateToneSuggestion = () => {
        const toneTemplates = [
            "Thank you for bringing this to our attention. We're investigating and will fix it shortly.",
            "We appreciate your suggestion! I've passed this to our product team for consideration.",
            "Thanks for the feedback. Could you provide more details so we can help better?"
        ];
        // Pick one based on type
        if (selectedFeedback.feedbackType === 'bug') return toneTemplates[0];
        if (selectedFeedback.feedbackType === 'suggestion') return toneTemplates[1];
        return toneTemplates[2];
    };

    const applySuggestion = () => {
        setReplyMessage(generateToneSuggestion());
    };

    // Filter Logic
    const filteredFeedback = feedbackList.filter(item =>
        filterStatus === 'all' ? true : item.status === filterStatus
    );

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Inbox...</div>;

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            {/* LEFT: Inbox List */}
            <div className={`w-full md:w-1/3 lg:w-1/4 bg-white border-r border-slate-200 flex flex-col ${selectedFeedback ? 'hidden md:flex' : 'flex'}`}>
                {/* Header & Filter */}
                <div className="p-4 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 px-2">Feedback Inbox</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {['all', 'open', 'resolved'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap transition-colors
                                    ${filterStatus === status
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                                `}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredFeedback.map(item => (
                        <div
                            key={item._id}
                            onClick={() => setSelectedFeedback(item)}
                            className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors
                                ${selectedFeedback?._id === item._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded
                                    ${item.feedbackType === 'bug' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}
                                `}>
                                    {item.feedbackType}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h4 className="font-bold text-slate-800 text-sm mb-1 truncate">{item.sellerName}</h4>
                            <p className="text-xs text-slate-500 truncate">{item.message}</p>
                            {item.status === 'open' && <span className="inline-block mt-2 w-2 h-2 rounded-full bg-blue-500"></span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Detail View */}
            <div className={`flex-1 bg-slate-50 flex-col ${selectedFeedback ? 'flex' : 'hidden md:flex'}`}>
                {selectedFeedback ? (
                    <>
                        {/* Detail Header */}
                        <div className="bg-white p-6 border-b border-slate-200 flex justify-between items-start shadow-sm">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-black text-slate-800">{selectedFeedback.feedbackType === 'bug' ? 'Bug Report' : 'Feedback'}</h2>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                        ${selectedFeedback.status === 'open' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}
                                    `}>
                                        {selectedFeedback.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><FaInbox className="text-slate-400" /> {selectedFeedback.shopName || selectedFeedback.sellerName}</span>
                                    <span>•</span>
                                    <span>{selectedFeedback.city || 'Unknown City'}</span>
                                    <span>•</span>
                                    <span>{selectedFeedback.shopType}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFeedback(null)} className="md:hidden text-slate-400 hover:text-slate-600">
                                Close
                            </button>
                        </div>

                        {/* Content Scroll */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">

                            {/* AI Summary Card (Internal) */}
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 relative overflow-hidden">
                                <FaMagic className="absolute top-2 right-2 text-indigo-200 text-4xl opacity-50" />
                                <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <FaMagic /> AI Summary (Internal)
                                </h4>
                                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                                    {selectedFeedback.aiSummary || "No summary generated."}
                                </p>
                            </div>

                            {/* Full Message */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Original Message</h4>
                                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-lg">
                                    {selectedFeedback.message}
                                </p>
                            </div>

                            {/* Reply Section */}
                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FaReply /> Reply to Seller
                                    </h4>
                                    <button
                                        onClick={applySuggestion}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                                    >
                                        <FaMagic /> Generate Tone Suggestion
                                    </button>
                                </div>
                                <textarea
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    placeholder="Write your response here..."
                                    className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-100 min-h-[120px] resize-none mb-4"
                                />
                                <div className="flex justify-end gap-3">
                                    {selectedFeedback.status === 'open' && (
                                        <button
                                            onClick={handleReply}
                                            disabled={replying || !replyMessage.trim()}
                                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-shadow shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {replying ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                                            Send & Resolve
                                        </button>
                                    )}
                                    {selectedFeedback.status === 'resolved' && (
                                        <div className="text-emerald-600 font-bold flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-lg">
                                            <FaCheckCircle /> Resolved
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FaInbox className="text-3xl text-slate-300" />
                        </div>
                        <p className="font-bold">Select a feedback item to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminFeedbackInbox;
