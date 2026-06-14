import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaMapMarkerAlt, FaStar, FaStore, FaPalette, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';

// Helper for image URLs
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    // Return relative path to utilize Vite proxy and avoid CORS/CORP issues
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const CreatorProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [creator, setCreator] = useState(null);
    const [categories, setCategories] = useState([]);
    const [selectedTab, setSelectedTab] = useState('');
    const [loading, setLoading] = useState(true);

    const { startConversation } = useChat();
    const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
    const [customOrderText, setCustomOrderText] = useState('');
    const [submittingCustomOrder, setSubmittingCustomOrder] = useState(false);

    const handleMessageCreator = async () => {
        if (!user) {
            toast.error("Please login to message creators.");
            navigate('/login');
            return;
        }
        const conv = await startConversation(creator._id, 'creator', creator._id);
        if (conv) {
            navigate(`/messages?conversationId=${conv._id}`);
        } else {
            toast.error("Failed to start chat with creator.");
        }
    };

    const handleCustomOrderSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please login to request custom orders.");
            navigate('/login');
            return;
        }
        if (!customOrderText.trim()) {
            toast.error("Please describe your custom request details.");
            return;
        }
        setSubmittingCustomOrder(true);
        try {
            const conv = await startConversation(creator._id, 'creator', creator._id);
            if (conv) {
                const text = `🎨 **Custom Order Inquiry**\n\n${customOrderText}`;
                const userStr = localStorage.getItem('aisleUser');
                const token = JSON.parse(userStr).token;
                await axios.post('/api/chat/messages', {
                    conversationId: conv._id,
                    text
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                toast.success("Inquiry sent & chat thread started!");
                setShowCustomOrderModal(false);
                setCustomOrderText('');
                navigate(`/messages?conversationId=${conv._id}`);
            } else {
                toast.error("Failed to initiate chat.");
            }
        } catch (err) {
            console.error("Custom order submit error:", err);
            toast.error("Failed to submit custom inquiry.");
        } finally {
            setSubmittingCustomOrder(false);
        }
    };

    useEffect(() => {
        const fetchCreatorData = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/creators/${id}`);
                setCreator(res.data.creator);
                setCategories(res.data.creations);
                if (res.data.creations && res.data.creations.length > 0) {
                    setSelectedTab(res.data.creations[0].categoryName);
                }
            } catch (error) {
                console.error("Failed to fetch creator profile details", error);
                toast.error("Failed to load creator profile details.");
                navigate('/creators');
            } finally {
                setLoading(false);
            }
        };
        fetchCreatorData();
    }, [id]);

    if (loading) {
        return (
            <div className="py-32 text-center">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent mb-4"></div>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Loading profile...</p>
            </div>
        );
    }

    if (!creator) return null;

    // Filter creations by currently selected category tab
    const activeGroup = categories.find(c => c.categoryName === selectedTab) || { items: [] };

    return (
        <div className="bg-slate-50/50 min-h-screen pt-20 pb-24 font-sans">
            {/* Header Banner */}
            <div className="relative bg-slate-900 h-64 md:h-80 w-full overflow-hidden">
                {creator.shopImage ? (
                    <img
                        src={getImageUrl(creator.shopImage)}
                        alt={creator.name}
                        className="w-full h-full object-cover opacity-60"
                        onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80" }}
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                        <FaPalette className="text-6xl text-indigo-500/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/creators')}
                    className="absolute top-6 left-6 bg-white/95 p-3.5 rounded-full shadow-md hover:scale-105 transition-all text-slate-800 cursor-pointer border border-slate-100 z-10"
                >
                    <FaArrowLeft />
                </button>
            </div>

            {/* Profile Summary Card Overlay */}
            <div className="max-w-4xl mx-auto px-4 -mt-24 relative z-10 space-y-6">
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Creator Avatar */}
                    <div className="w-24 h-24 rounded-2xl bg-indigo-50 border border-slate-100 shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {creator.shopImage ? (
                            <img
                                src={getImageUrl(creator.shopImage)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80" }}
                            />
                        ) : (
                            <FaPalette className="text-3xl text-indigo-400" />
                        )}
                    </div>

                    {/* Meta information */}
                    <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
                                {creator.name}
                                <FaCheckCircle className="text-teal-500 text-sm flex-shrink-0" />
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-max mx-auto sm:mx-0
                                ${creator.isOpen 
                                    ? 'bg-teal-50 text-teal-700 border border-teal-200/55' 
                                    : 'bg-slate-100 text-slate-400 border border-slate-200/55'
                                }`}
                            >
                                {creator.isOpen ? '🟢 Accepting Requests' : '🔴 Fully Booked'}
                            </span>
                        </div>

                        {/* Location and rating */}
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1">
                                <FaMapMarkerAlt className="text-slate-400" />
                                {creator.address || 'Vadodara'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-700 font-black">
                                <FaStar className="text-amber-500" />
                                {creator.rating > 0 ? creator.rating.toFixed(1) : "5.0"}
                            </span>
                        </div>

                        {/* Story block */}
                        <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-4.5 text-slate-650 text-xs sm:text-sm font-semibold italic leading-relaxed text-left">
                            "{creator.story}"
                        </div>

                        {/* Creator Action Buttons */}
                        <div className="flex flex-wrap gap-3 pt-2 justify-center md:justify-start">
                            <button
                                onClick={handleMessageCreator}
                                className="bg-white hover:bg-slate-50 text-indigo-650 border border-indigo-200 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 cursor-pointer"
                            >
                                Message Creator
                            </button>
                            <button
                                onClick={() => setShowCustomOrderModal(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 cursor-pointer"
                            >
                                Request Custom Order
                            </button>
                        </div>
                    </div>
                </div>

                {/* Categories Tab Navigation */}
                {categories.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-4 border border-slate-100">
                            <FaStore size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">No creations listed yet</h3>
                        <p className="text-slate-500 text-sm mt-1">This creator hasn't published any creations to their profile catalog.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Tab header */}
                        <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
                            {categories.map((group) => (
                                <button
                                    key={group.categoryName}
                                    onClick={() => setSelectedTab(group.categoryName)}
                                    className={`px-5 py-3.5 rounded-xl text-xs font-black tracking-tight uppercase whitespace-nowrap transition-all border cursor-pointer
                                        ${selectedTab === group.categoryName
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/10'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                        }`}
                                >
                                    {group.categoryName}
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-black
                                        ${selectedTab === group.categoryName 
                                            ? 'bg-indigo-500 text-white' 
                                            : 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {group.items.length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Creations Grid */}
                        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
                            {activeGroup.items.map((item) => {
                                const price = item.sellingPrice || item.price || 0;
                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => navigate(`/product/${item._id}`)}
                                        className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer flex flex-col justify-between"
                                    >
                                        {/* Image Area */}
                                        <div className="relative aspect-square w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                                            {item.imageUrl ? (
                                                <img
                                                    src={getImageUrl(item.imageUrl)}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => { e.target.src = "https://via.placeholder.com/200"; }}
                                                />
                                            ) : (
                                                <FaPalette className="text-4xl text-slate-300" />
                                            )}

                                            {/* Type indicator */}
                                            <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide text-white shadow-sm
                                                ${item.homeBusinessType === 'MADE_TO_ORDER' 
                                                    ? 'bg-amber-500' 
                                                    : 'bg-emerald-500'
                                                }`}
                                            >
                                                {item.homeBusinessType === 'MADE_TO_ORDER' ? 'Made to Order' : 'Ready Stock'}
                                            </span>
                                        </div>

                                        {/* Content info */}
                                        <div className="p-4.5 space-y-3">
                                            <div>
                                                <h4 className="font-extrabold text-slate-800 text-sm truncate leading-tight">{item.name}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">₹{price} / {item.unit || 'piece'}</p>
                                            </div>

                                            {/* Prep time or availability */}
                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100/50">
                                                {item.homeBusinessType === 'MADE_TO_ORDER' ? (
                                                    <>
                                                        <FaClock className="text-slate-400" />
                                                        <span className="truncate">Prep: {item.preparationTime || '1 day'}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>📦</span>
                                                        <span className="truncate">Stock: {item.quantity} available</span>
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                className="w-full bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white font-black text-[10px] py-2 px-3 rounded-xl uppercase tracking-widest transition-all border border-slate-200/50 hover:border-indigo-600 shadow-sm cursor-pointer"
                                            >
                                                Request Creation
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Custom Order Request Modal */}
            {showCustomOrderModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Request Custom Order</h3>
                            <button onClick={() => setShowCustomOrderModal(false)} className="text-slate-400 hover:text-slate-650 font-bold text-lg cursor-pointer">✕</button>
                        </div>
                        <form onSubmit={handleCustomOrderSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Describe your requirements</label>
                                <textarea
                                    placeholder="Enter details like quantity, customization options, color preferences, delivery date expectations..."
                                    value={customOrderText}
                                    onChange={(e) => setCustomOrderText(e.target.value)}
                                    rows="5"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800 resize-none"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submittingCustomOrder}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submittingCustomOrder ? 'Submitting...' : 'Submit Inquiry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatorProfile;
