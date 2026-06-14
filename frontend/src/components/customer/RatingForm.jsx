import React, { useState } from 'react';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';

const RatingForm = ({ shopId, onFinish, onCancel }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Please select a rating!");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const userStr = localStorage.getItem('aisleUser');
            const token = userStr ? JSON.parse(userStr).token : null;

            await axios.post(`/api/customer/shop/${shopId}/review`,
                { rating, comment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSubmitted(true);
            if (onFinish) onFinish();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit review.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center py-6 animate-fade-in">
                <div className="text-4xl mb-3">✨</div>
                <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Thank you!</h3>
                <p className="text-stone-500 font-medium">Your feedback helps the community shop better.</p>
                <button
                    onClick={onCancel}
                    className="mt-6 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-black transition-colors"
                >
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto p-2">
            <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight mb-2 text-center">Rate your visit</h3>
            <p className="text-stone-500 text-sm font-medium mb-6 text-center">How was your experience with this shop?</p>

            <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`text-3xl transition-all ${star <= (hover || rating) ? 'text-yellow-400 scale-125' : 'text-stone-300'}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                    >
                        <FaStar />
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a short review (optional)..."
                className="w-full bg-white border border-stone-100 rounded-2xl p-4 text-stone-800 text-sm focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all outline-none resize-none h-32 mb-4 shadow-inner"
                maxLength={300}
            />

            <div className="flex flex-col items-center">
                {error && <p className="text-red-500 text-xs font-bold mb-4 uppercase tracking-wider">{error}</p>}
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="px-8 py-4 text-stone-500 font-bold uppercase tracking-widest text-xs hover:text-stone-800"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || rating === 0}
                        className="px-12 py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-stone-200"
                    >
                        {loading ? 'Submitting...' : 'Post Review'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RatingForm;
