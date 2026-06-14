import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import {
    ArrowLeft, Star, Sparkles, Upload, X, Bug, Lightbulb, MessageSquare,
    CheckCircle, Calendar, ChevronRight, Paperclip, Activity,
    AlertCircle, Trash2, Loader2, Share2, Copy, ShieldCheck, Heart, ThumbsUp
} from 'lucide-react';

const MobileSellerFeedback = () => {
    const { token, user } = useAuth();
    const navigate = useNavigate();
    
    // Page states
    const [activeTab, setActiveTab] = useState('feedback'); // 'feedback' | 'reviews'
    const [loading, setLoading] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [feedbackList, setFeedbackList] = useState([]);
    const [customerReviews, setCustomerReviews] = useState({ reviews: [], summary: { averageRating: 0, totalReviews: 0 } });
    
    // Form states
    const [feedbackType, setFeedbackType] = useState('suggestion'); // 'bug' | 'suggestion' | 'general'
    const [rating, setRating] = useState(null);
    const [message, setMessage] = useState('');
    const [attachedFile, setAttachedFile] = useState(null);
    const [attachedPreview, setAttachedPreview] = useState('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'
    
    // UI states
    const [toastMessage, setToastMessage] = useState(null);
    const [selectedFeedbackDetails, setSelectedFeedbackDetails] = useState(null);
    
    const fileInputRef = useRef(null);
    const messageInputRef = useRef(null);

    // Show custom toast notification
    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    // Copy Shop Link to Clipboard
    const handleShareShop = () => {
        const shopUrl = `${window.location.origin}/shop/${user?._id || ''}`;
        navigator.clipboard.writeText(shopUrl)
            .then(() => {
                showToast('📋 Shop link copied to clipboard!');
            })
            .catch(() => {
                showToast('Failed to copy link. Please try again.');
            });
    };

    // Fetch Seller-to-Admin Feedback
    const fetchFeedback = async () => {
        try {
            const res = await fetch('/api/seller/feedback', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFeedbackList(data);
            }
        } catch (error) {
            console.error("Failed to fetch feedback history", error);
        }
    };

    // Fetch Customer Reviews
    const fetchCustomerReviews = async () => {
        setReviewsLoading(true);
        try {
            const res = await fetch('/api/seller/reviews', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCustomerReviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch customer reviews", error);
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
        fetchCustomerReviews();
    }, []);

    // Handle File Attachment
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingFile(true);
        
        // Simulate a minor file upload progress latency
        setTimeout(() => {
            setAttachedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setUploadingFile(false);
            showToast('📎 Screenshot attached successfully!');
        }, 600);
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleRemoveAttachment = () => {
        setAttachedFile(null);
        setAttachedPreview('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        showToast('Attachment removed');
    };

    // Handle Form Submit
    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!message.trim()) {
            showToast('⚠️ Please write a message.');
            return;
        }

        if (message.trim().length < 10) {
            showToast('⚠️ Message must be at least 10 characters.');
            return;
        }

        setLoading(true);
        
        // Append attachment description text if an attachment exists, to represent it inside backend message
        let finalMessage = message;
        if (attachedFile) {
            finalMessage += `\n\n[Attachment: ${attachedFile.name} (Simulated Upload)]`;
        }

        try {
            const res = await fetch('/api/seller/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    feedbackType,
                    rating,
                    message: finalMessage
                })
            });

            if (res.ok) {
                setSubmitStatus('success');
                setMessage('');
                setRating(null);
                setAttachedFile(null);
                setAttachedPreview('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                
                showToast('🚀 Feedback submitted successfully!');
                fetchFeedback();
                setTimeout(() => setSubmitStatus(null), 3000);
            } else {
                setSubmitStatus('error');
                showToast('❌ Failed to submit feedback.');
            }
        } catch (error) {
            setSubmitStatus('error');
            showToast('❌ Network error submitting feedback.');
        } finally {
            setLoading(false);
        }
    };

    // Pre-fill feedback from AI suggestion topics
    const handlePrefillSuggestion = (topic) => {
        let text = '';
        if (topic === 'Inventory workflow') {
            text = 'I have a suggestion for the inventory workflow: It would be very helpful if we could bulk update stock levels directly from the list page instead of clicking on each item.';
            setFeedbackType('suggestion');
        } else if (topic === 'Product upload speed') {
            text = 'I noticed that the product upload process is slow when uploading images. Is there a way to compress images on the client side to speed it up?';
            setFeedbackType('bug');
        } else if (topic === 'Catalog matching') {
            text = 'The catalog search matching could be improved. When I search for a brand name, it does not always list the exact matching items first.';
            setFeedbackType('suggestion');
        } else if (topic === 'Customer messaging') {
            text = 'It would be great to have quick reply templates in the customer chat so we can answer frequent questions about delivery or stock faster.';
            setFeedbackType('general');
        }

        setMessage(text);
        showToast('✨ Suggestion pre-filled. Scroll up to submit!');
        
        // Scroll and focus
        if (messageInputRef.current) {
            messageInputRef.current.focus();
            messageInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    // Icon helper for feedback types
    const getTypeIcon = (type) => {
        switch (type) {
            case 'bug':
                return <Bug className="w-4 h-4 text-rose-500" />;
            case 'suggestion':
                return <Lightbulb className="w-4 h-4 text-amber-500" />;
            case 'general':
            default:
                return <MessageSquare className="w-4 h-4 text-blue-500" />;
        }
    };

    // Status helper
    const getStatusStyle = (status) => {
        switch (status) {
            case 'resolved':
                return {
                    bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    dot: 'bg-emerald-500',
                    label: 'Resolved'
                };
            case 'in_progress':
                return {
                    bg: 'bg-amber-50 text-amber-700 border-amber-100',
                    dot: 'bg-amber-500',
                    label: 'Under Review'
                };
            case 'open':
            default:
                return {
                    bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
                    dot: 'bg-indigo-500',
                    label: 'Planned'
                };
        }
    };

    return (
        <div className="w-full min-h-screen bg-slate-50 flex flex-col pb-44 relative">
            
            {/* TOAST NOTIFICATION */}
            {toastMessage && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in border border-slate-800">
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* HEADER */}
            <div className="bg-white border-b border-slate-100 px-4 py-4 flex items-center gap-3">
                <button
                    onClick={() => navigate('/seller/home')}
                    className="p-1.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-all active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight leading-tight">Feedback & Ratings</h1>
                    <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Help us improve Aisle</p>
                </div>
            </div>

            {/* CONTENT INNER CONTAINER */}
            <div className="p-4 space-y-6">

                {/* AIRBNB STYLE RATING SCORE CARD */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full tracking-wider">
                                Shop Rating
                            </span>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className="text-3xl font-black text-slate-800">
                                    {customerReviews.summary.averageRating > 0 
                                        ? customerReviews.summary.averageRating.toFixed(1) 
                                        : '0.0'}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">Rating</span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold mt-1">
                                {customerReviews.summary.totalReviews > 0
                                    ? `Based on ${customerReviews.summary.totalReviews} customer reviews`
                                    : 'No customer reviews yet'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex gap-0.5 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <Star 
                                        key={s} 
                                        size={14} 
                                        fill={s <= Math.round(customerReviews.summary.averageRating) ? "currentColor" : "none"} 
                                        className={s <= Math.round(customerReviews.summary.averageRating) ? "text-amber-400" : "text-slate-200"}
                                    />
                                ))}
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                Customer Reviews
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 font-semibold leading-tight">
                            {customerReviews.summary.totalReviews > 0
                                ? 'Your shop has premium reputation in this city.'
                                : 'Build your shop rating by sharing with customers.'}
                        </p>
                        <button
                            onClick={handleShareShop}
                            className="flex items-center gap-1.5 bg-slate-905 hover:bg-slate-900 text-white text-[11px] font-black px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
                        >
                            <Share2 size={12} /> Share Shop
                        </button>
                    </div>
                </div>

                {/* SEGMENTED NAVIGATION TABS */}
                <div className="bg-slate-100/80 p-1 rounded-2xl flex gap-1 border border-slate-200/50">
                    <button
                        onClick={() => setActiveTab('feedback')}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'feedback'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 bg-transparent'
                        }`}
                    >
                        <MessageSquare size={14} /> Send Feedback
                    </button>
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            activeTab === 'reviews'
                                ? 'bg-white text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 bg-transparent'
                        }`}
                    >
                        <Star size={14} /> Customer Reviews
                        {customerReviews.summary.totalReviews > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[9px] font-bold">
                                {customerReviews.summary.totalReviews}
                            </span>
                        )}
                    </button>
                </div>

                {/* TAB CONTENT: FEEDBACK (SELLER TO AISLE ADMIN) */}
                {activeTab === 'feedback' && (
                    <div className="space-y-6">
                        
                        {/* FEEDBACK FORM CARD */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-5">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                                <span className="p-1.5 bg-slate-50 rounded-lg text-slate-700">📝</span>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Send Feedback</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Type selector pills */}
                                <div>
                                    <span className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">
                                        Feedback Type
                                    </span>
                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
                                        {[
                                            { id: 'bug', label: '🐞 Bug', text: 'Bug' },
                                            { id: 'suggestion', label: '💡 Suggestion', text: 'Suggestion' },
                                            { id: 'general', label: '💬 General', text: 'General' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setFeedbackType(t.id)}
                                                className={`px-4 py-2.5 rounded-full text-xs font-black transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                                    feedbackType === t.id
                                                        ? 'bg-slate-800 text-white border-slate-800 shadow-sm scale-105'
                                                        : 'bg-slate-55 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span>{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Experience Stars (Larger tap targets) */}
                                <div>
                                    <span className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">
                                        Rate Experience (Optional)
                                    </span>
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map((starValue) => (
                                            <button
                                                key={starValue}
                                                type="button"
                                                onClick={() => setRating(rating === starValue ? null : starValue)}
                                                className="transition-transform active:scale-125 cursor-pointer"
                                                title={`Rate ${starValue} Stars`}
                                            >
                                                <Star
                                                    size={32}
                                                    fill={rating >= starValue ? "#fbbf24" : "none"}
                                                    className={`transition-colors ${rating >= starValue ? 'text-amber-400' : 'text-slate-200'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Message Input */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label htmlFor="feedback-message" className="text-xs font-black text-slate-500 uppercase tracking-wider">
                                            Message
                                        </label>
                                        <span className={`text-[10px] font-bold ${message.length >= 10 ? 'text-slate-400' : 'text-rose-400'}`}>
                                            {message.length}/10 min chars
                                        </span>
                                    </div>
                                    <textarea
                                        id="feedback-message"
                                        ref={messageInputRef}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Tell us what's on your mind..."
                                        className="w-full min-h-[120px] p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-200 font-semibold placeholder:text-slate-400 text-xs text-slate-700 leading-relaxed resize-none"
                                        required
                                    />
                                </div>

                                {/* Attachment Option */}
                                <div>
                                    <span className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">
                                        Add Screenshot
                                    </span>
                                    
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept="image/*"
                                        className="hidden"
                                    />

                                    {attachedFile ? (
                                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {attachedPreview && (
                                                    <img
                                                        src={attachedPreview}
                                                        alt="attached thumbnail"
                                                        className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                                                    />
                                                )}
                                                <div className="max-w-[150px]">
                                                    <p className="text-xs font-bold text-slate-700 truncate">{attachedFile.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-semibold">
                                                        {(attachedFile.size / 1024).toFixed(1)} KB
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveAttachment}
                                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                                                title="Remove Attachment"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={triggerFileInput}
                                            disabled={uploadingFile}
                                            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-slate-50/50 hover:border-slate-300 transition-all cursor-pointer"
                                        >
                                            {uploadingFile ? (
                                                <>
                                                    <Loader2 size={18} className="text-slate-400 animate-spin" />
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Paperclip size={18} className="text-slate-400" />
                                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Attach Screenshot</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>

                        {/* PIPELINE STATUS TRACKER PANEL */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                            <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                                <span className="p-1.5 bg-slate-50 rounded-lg text-slate-700">🕒</span>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Your Requests</h2>
                            </div>

                            <div className="space-y-3.5">
                                {/* MOCK STATUS PROGRESS LISTS FOR PIPELINE VISUALIZATION */}
                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800">Dark Mode Bug</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Resolved</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Today</span>
                                </div>

                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs animate-pulse"></span>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800">Inventory Filter Issue</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Under Review</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">Yesterday</span>
                                </div>

                                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs"></span>
                                        <div>
                                            <h4 className="text-xs font-black text-slate-800">Bulk Upload Suggestion</h4>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Planned</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-semibold">3 days ago</span>
                                </div>
                            </div>
                        </div>

                        {/* RECENT FEEDBACK LIST */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">🕒 Recent Feedback History</h3>
                                <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">{feedbackList.length} submitted</span>
                            </div>

                            {feedbackList.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200">
                                    <MessageSquare className="text-3xl text-slate-300 mx-auto mb-2.5 opacity-60" />
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-wider">No feedback submitted</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {feedbackList.map((item) => {
                                        const statusInfo = getStatusStyle(item.status);
                                        return (
                                            <div
                                                key={item._id}
                                                onClick={() => setSelectedFeedbackDetails(item)}
                                                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs active:border-slate-300 transition-all flex justify-between items-start cursor-pointer active:scale-[0.99]"
                                            >
                                                <div className="space-y-1.5 flex-1 pr-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="p-1 bg-slate-50 rounded-md">
                                                            {getTypeIcon(item.feedbackType)}
                                                        </span>
                                                        <span className="text-xs font-black text-slate-800 capitalize">
                                                            {item.feedbackType}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold">
                                                            {new Date(item.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed pl-7">
                                                        {item.message}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider flex items-center gap-1 ${statusInfo.bg}`}>
                                                        <span className={`w-1 h-1 rounded-full ${statusInfo.dot}`}></span>
                                                        {statusInfo.label}
                                                    </span>
                                                    <span className="text-[10px] text-indigo-600 font-black flex items-center gap-0.5">
                                                        View <ChevronRight size={10} />
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* AI SUGGESTED TOPICS */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                            <div className="flex items-center gap-1.5">
                                <Sparkles size={16} className="text-violet-600" />
                                <h3 className="text-sm font-black text-slate-800 tracking-tight">✨ Suggested Feedback Topics</h3>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold leading-normal">
                                Select a topic below to automatically draft a detailed feedback template:
                            </p>

                            <div className="grid grid-cols-2 gap-2.5">
                                {[
                                    { topic: 'Inventory workflow', desc: 'Manage stock easily' },
                                    { topic: 'Product upload speed', desc: 'Optimize photo speed' },
                                    { topic: 'Catalog matching', desc: 'Better brand searches' },
                                    { topic: 'Customer messaging', desc: 'Quick templates setup' }
                                ].map((t) => (
                                    <div
                                        key={t.topic}
                                        onClick={() => handlePrefillSuggestion(t.topic)}
                                        className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-2xl border border-slate-100 cursor-pointer active:scale-95 transition-all text-left flex flex-col justify-between h-20"
                                    >
                                        <span className="text-xs font-black text-slate-700 leading-tight">• {t.topic}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{t.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* STICKY SUBMIT FOOTER */}
                        <div className="fixed bottom-[64px] left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-10">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all ${
                                    submitStatus === 'success'
                                        ? 'bg-emerald-500 shadow-emerald-500/20'
                                        : 'bg-slate-900 shadow-slate-900/20 hover:bg-black'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Submitting...
                                    </>
                                ) : submitStatus === 'success' ? (
                                    <>
                                        <CheckCircle size={16} />
                                        Submitted Successfully
                                    </>
                                ) : (
                                    'Submit Feedback'
                                )}
                            </button>
                        </div>

                    </div>
                )}

                {/* TAB CONTENT: REVIEWS (CUSTOMER TO SELLER) */}
                {activeTab === 'reviews' && (
                    <div className="space-y-6">
                        
                        {/* CUSTOMER REVIEWS FEED */}
                        {reviewsLoading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-2 bg-white rounded-3xl border border-slate-100">
                                <Loader2 size={24} className="animate-spin text-indigo-600" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading reviews...</p>
                            </div>
                        ) : customerReviews.reviews.length === 0 ? (
                            <div className="space-y-5">
                                {/* Standard header */}
                                <div className="flex items-center gap-2 px-1">
                                    <span className="text-lg">⭐</span>
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Customer Reviews</h3>
                                </div>
                                
                                {/* Upgraded Empty state container */}
                                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs text-center space-y-4">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-xl grayscale opacity-60">
                                        ⭐
                                    </div>
                                    <div className="space-y-1.5">
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">No reviews yet</h4>
                                        <p className="text-xs text-slate-400 font-semibold leading-relaxed max-w-[200px] mx-auto">
                                            Once customers review your shop, ratings will appear here.
                                        </p>
                                    </div>
                                </div>

                                {/* Actionable "Build Trust Faster" Card */}
                                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 shadow-md text-center space-y-5 relative overflow-hidden">
                                    <div className="absolute -top-10 -left-10 w-24 h-24 bg-indigo-500/10 rounded-full"></div>
                                    <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full"></div>
                                    
                                    <div className="text-2xl text-amber-400 animate-bounce">⭐</div>
                                    
                                    <div className="space-y-2 relative z-2">
                                        <h4 className="font-extrabold text-sm tracking-tight">Build Trust Faster</h4>
                                        <p className="text-[11px] text-slate-400 leading-relaxed font-semibold max-w-[220px] mx-auto">
                                            Ask customers to review their shopping experience. Ratings boost your storefront search presence.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleShareShop}
                                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 relative z-2"
                                    >
                                        <Share2 size={12} /> Share Shop
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">⭐ Customer Reviews</h3>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        {customerReviews.reviews.length} total
                                    </span>
                                </div>

                                <div className="space-y-3.5">
                                    {customerReviews.reviews.map((review) => (
                                        <div
                                            key={review._id}
                                            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs space-y-3"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] font-black">
                                                        <Star size={10} fill="currentColor" /> {review.rating.toFixed(1)}
                                                    </div>
                                                    <span className="text-xs font-black text-slate-800">
                                                        {review.customerId?.name || "Anonymous Customer"}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            {review.comment ? (
                                                <p className="text-slate-600 text-xs leading-relaxed italic pl-1 border-l-2 border-slate-100">
                                                    "{review.comment}"
                                                </p>
                                            ) : (
                                                <p className="text-slate-400 text-[10px] font-bold tracking-wide flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                                    Rated without comment
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>

            {/* DETAILS DRAWER MODAL */}
            {selectedFeedbackDetails && (
                <div
                    className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-end justify-center animate-fade-in"
                    onClick={() => setSelectedFeedbackDetails(null)}
                >
                    <div
                        className="bg-white w-full rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6 animate-slide-in-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-slate-50 rounded-lg">
                                    {getTypeIcon(selectedFeedbackDetails.feedbackType)}
                                </span>
                                <div>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                                        Feedback Details
                                    </h4>
                                    <h3 className="text-sm font-black text-slate-800 capitalize leading-tight">
                                        {selectedFeedbackDetails.feedbackType} Ticket
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedFeedbackDetails(null)}
                                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                                title="Close Panel"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Status timeline */}
                        <div className="space-y-4">
                            <span className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                                Status Pipeline
                            </span>
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className={`w-2.5 h-2.5 rounded-full ${getStatusStyle(selectedFeedbackDetails.status).dot}`}></span>
                                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                                        {getStatusStyle(selectedFeedbackDetails.status).label}
                                    </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-semibold">
                                    Submitted {new Date(selectedFeedbackDetails.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        {/* Message */}
                        <div className="space-y-2">
                            <span className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                                Your Message
                            </span>
                            <p className="text-slate-650 text-xs leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100 break-words">
                                {selectedFeedbackDetails.message}
                            </p>
                        </div>

                        {/* Admin reply */}
                        {selectedFeedbackDetails.adminReply ? (
                            <div className="space-y-2 border-l-4 border-slate-800 pl-4 py-1">
                                <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                    Aisle Support Reply
                                </span>
                                <p className="text-slate-800 text-xs leading-relaxed font-bold">
                                    {selectedFeedbackDetails.adminReply.message}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                    Replied on {new Date(selectedFeedbackDetails.adminReply.repliedAt).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 flex items-start gap-3">
                                <AlertCircle size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                    <h5 className="text-xs font-bold text-slate-700">Awaiting Aisle Team Review</h5>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal">
                                        Our moderators review all submitted feedback reports within 24-48 hours. You will receive a notification once resolved.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setSelectedFeedbackDetails(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-black shadow-md cursor-pointer"
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default MobileSellerFeedback;
