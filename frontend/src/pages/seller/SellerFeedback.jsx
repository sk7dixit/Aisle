import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaPaperPlane, FaStar, FaExclamationCircle, FaLightbulb, FaCommentDots, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const SellerFeedback = () => {
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [feedbackList, setFeedbackList] = useState([]);
    const [customerReviews, setCustomerReviews] = useState({ reviews: [], summary: { averageRating: 0, totalReviews: 0 } });
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [formData, setFormData] = useState({
        feedbackType: 'suggestion',
        rating: null,
        message: ''
    });
    const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error'

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

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.message.trim()) return;

        setLoading(true);
        try {
            const res = await fetch('/api/seller/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSubmitStatus('success');
                setFormData({ feedbackType: 'suggestion', rating: 0, message: '' });
                fetchFeedback();
                setTimeout(() => setSubmitStatus(null), 3000);
            } else {
                setSubmitStatus('error');
            }
        } catch (error) {
            setSubmitStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black text-slate-800">Feedback & Ratings</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">Manage your feedback to admin and view customer reviews</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[0.45fr_0.55fr] gap-8">

                {/* LEFT SIDE: Send Feedback to Admin */}
                <div className="space-y-6">
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-fit">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Send Feedback</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">Help us improve ShopLens for you</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Feedback Type */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Feedback Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['bug', 'suggestion', 'general'].map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, feedbackType: type })}
                                            className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all flex flex-col items-center gap-2
                                                ${formData.feedbackType === type
                                                    ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                                                    : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}
                                            `}
                                        >
                                            {type === 'bug' && <FaExclamationCircle className="text-lg" />}
                                            {type === 'suggestion' && <FaLightbulb className="text-lg" />}
                                            {type === 'general' && <FaCommentDots className="text-lg" />}
                                            <span className="capitalize">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rating */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Rate your experience (Optional)</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, rating: formData.rating === star ? null : star })}
                                            className={`text-2xl transition-transform hover:scale-110 ${formData.rating >= star ? 'text-amber-400' : 'text-slate-200'}`}
                                        >
                                            <FaStar />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Message */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                                <textarea
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="Describe your issue or suggestion clearly..."
                                    className="w-full p-4 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-slate-200 min-h-[150px] resize-none font-medium placeholder:text-slate-400 text-sm"
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg
                                    ${submitStatus === 'success' ? 'bg-emerald-500 shadow-emerald-500/30' : 'bg-slate-900 shadow-slate-900/30 hover:shadow-xl hover:-translate-y-1'}
                                `}
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : submitStatus === 'success' ? <FaCheckCircle /> : <FaPaperPlane />}
                                {submitStatus === 'success' ? 'Sent! Our team will review shortly.' : 'Submit Feedback'}
                            </button>
                        </form>
                    </section>

                    {/* Admin Feedback History */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-slate-800 px-2 uppercase tracking-tight">Your Recent Feedback</h2>

                        {feedbackList.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <FaCommentDots className="text-4xl text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-400 font-medium">No feedback sent yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {feedbackList.map(item => (
                                    <div key={item._id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group hover:border-slate-200 transition-colors">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs
                                                    ${item.feedbackType === 'bug' ? 'bg-rose-50 text-rose-500' :
                                                        item.feedbackType === 'suggestion' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}
                                                `}>
                                                    {item.feedbackType === 'bug' && <FaExclamationCircle />}
                                                    {item.feedbackType === 'suggestion' && <FaLightbulb />}
                                                    {item.feedbackType === 'general' && <FaCommentDots />}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-800 capitalize text-sm">{item.feedbackType}</p>
                                                    <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide
                                                ${item.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' :
                                                    item.status === 'in_progress' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'}
                                            `}>
                                                {item.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <p className="text-slate-600 text-sm leading-relaxed mb-4 pl-11">
                                            {item.message}
                                        </p>

                                        {item.adminReply && (
                                            <div className="ml-11 bg-slate-50 p-4 rounded-xl border-l-4 border-slate-800">
                                                <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-slate-900 rounded-full"></span>
                                                    ShopLens Team
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {item.adminReply.message}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDE: Customer Feedback (Incoming) */}
                <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                    <div className="mb-6">
                        <h2 className="text-lg font-black text-slate-800">Customer Feedback</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">What customers are saying about your shop</p>
                    </div>

                    {/* Summary Bar */}
                    <div className="flex flex-wrap gap-4 mb-8">
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="text-amber-400 text-xl"><FaStar /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Avg Rating</p>
                                <p className="text-lg font-black text-slate-800 leading-none">{customerReviews.summary.averageRating.toFixed(1)}</p>
                            </div>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <div className="text-slate-400 text-xl"><FaCommentDots /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Total Ratings</p>
                                <p className="text-lg font-black text-slate-800 leading-none">{customerReviews.summary.totalReviews}</p>
                            </div>
                        </div>
                    </div>

                    {/* Reviews List */}
                    {reviewsLoading ? (
                        <div className="py-20 text-center">
                            <FaSpinner className="animate-spin text-4xl text-slate-200 mx-auto" />
                        </div>
                    ) : customerReviews.reviews.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-200">
                            <div className="text-4xl mb-4 grayscale opacity-40">⭐</div>
                            <h3 className="text-slate-800 font-bold">No customer feedback yet</h3>
                            <p className="text-slate-400 text-sm font-medium mt-1">Ratings will appear here once customers review your shop.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                            {customerReviews.reviews.map(review => (
                                <div key={review._id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 transition-all hover:shadow-md">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-xs font-black">
                                                <FaStar /> {review.rating.toFixed(1)}
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">
                                                {review.customerId?.name || "Anonymous Customer"}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {review.comment ? (
                                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2 italic">
                                            "{review.comment}"
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-[11px] font-medium tracking-wide flex items-center gap-1.5">
                                            <FaCheckCircle className="text-slate-200" /> Rated without comment
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SellerFeedback;
