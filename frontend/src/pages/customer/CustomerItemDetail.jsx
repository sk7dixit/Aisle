import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaMapMarkerAlt, FaStore, FaDirections, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSidebarState } from '../../context/SidebarStateContext';
import { useInterested } from '../../context/InterestedContext';
import ConfidenceSignal from '../../components/customer/common/ConfidenceSignal';
import AuthModal from '../../components/auth/AuthModal';
import { toast } from 'react-hot-toast';
import { useChat } from '../../context/ChatContext';


// Helper for image URLs
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path; // Base64
    if (path.startsWith('http')) return path; // External or full URL
    // Return relative path to utilize Vite proxy and avoid CORS/CORP issues
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const CustomerItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [isInterested, setIsInterested] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { user } = useAuth();
    const { signalItemClick } = useSidebarState();
    const { items, updateQuantity } = useInterested();
    const [activeImgIndex, setActiveImgIndex] = useState(0);

    // Creators and Creations Request Modal States
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requestQty, setRequestQty] = useState(1);
    const [pickupTime, setPickupTime] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [isRequested, setIsRequested] = useState(false);

    const { startConversation } = useChat();

    const handleChatWithCreator = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        const conv = await startConversation(shopId, 'creator', item._id);
        if (conv) {
            navigate(`/messages?conversationId=${conv._id}`);
        } else {
            toast.error("Failed to start chat with creator.");
        }
    };

    const handleAskAvailability = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }
        try {
            const conv = await startConversation(shopId, 'business', shopId);
            if (conv) {
                const text = `Hi! Is the product "${item.name}" available at your shop right now?`;
                const userStr = localStorage.getItem('aisleUser');
                const token = JSON.parse(userStr).token;
                await axios.post('/api/chat/messages', {
                    conversationId: conv._id,
                    text
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                toast.success("Availability query sent!");
                navigate(`/messages?conversationId=${conv._id}`);
            } else {
                toast.error("Failed to start chat.");
            }
        } catch (err) {
            console.error("Ask availability error:", err);
            toast.error("Failed to send query.");
        }
    };

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                // If it is a home business creation, fetch via creations API, otherwise fallback to products API
                const url = `/api/creations/${id}`;
                let res;
                try {
                    res = await axios.get(url);
                } catch (e) {
                    res = await axios.get(`/api/customer/product/${id}`);
                }
                setItem(res.data);
                signalItemClick(res.data);
            } catch (error) {
                console.error("Failed to load details", error);
            }
        };
        fetchDetail();
    }, [id]);

    // Check if already interested based on context items
    useEffect(() => {
        if (item && items.find(i => i.productId === item._id)) {
            setIsInterested(true);
        }
    }, [item, items]);

    const handleInterest = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        try {
            // STEP 1: Soft Reservation (API Call)
            const res = await axios.post('/api/requests/create', {
                productId: item._id,
                productName: item.name,
                sellerId: item.shop?._id || item.shopId || item.seller?._id,
                sellerShopName: item.shopName || item.shop?.name || item.seller?.shopDetails?.shopName,
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // STEP 2: Local Context Update (Visual feedback)
            updateQuantity({
                productId: item._id,
                name: item.name,
                productName: item.name,
                price: item.price,
                shopId: item.shop?._id || item.shopId || item.seller?._id,
                shopName: item.shopName || item.shop?.name || item.seller?.shopDetails?.shopName,
                imageUrl: item.imageUrl,
                requestId: res.data._id, // Track ID
                status: 'PENDING_CONFIRMATION',
                shopPhone: item.shopPhone || item.seller?.shopDetails?.phone || item.seller?.phone || "9876543210",
                shopAddress: item.shop?.address || item.seller?.shopDetails?.address || null,
                shopIsOpen: item.shop?.isOpen !== undefined ? item.shop.isOpen : true,
                shopHours: item.shop?.openingHours || "9:00 AM - 9:00 PM",
                shopLastActive: item.seller?.sellerStats?.lastActiveAt || item.seller?.shopDetails?.lastActiveAt || null,
                stockConfidence: item.stockConfidence || "MEDIUM"
            }, 1);

            setIsInterested(true);

        } catch (error) {
            console.error("Interest failed", error);
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        if (!pickupTime) {
            alert('Please enter your preferred pickup time.');
            return;
        }

        try {
            await axios.post('/api/creation-requests', {
                creationId: item._id,
                quantity: requestQty,
                preferredPickupTime: pickupTime,
                message: customMessage
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            toast.success('Creation request submitted successfully!');
            setIsRequested(true);
            setShowRequestModal(false);

            // Start conversation & post custom request inline
            const conv = await startConversation(shopId, 'creator', item._id);
            if (conv) {
                const text = `🎨 **Custom Request Submitted**\n\n**Creation:** ${item.name}\n**Quantity:** ${requestQty}\n**Preferred Pickup:** ${pickupTime}\n**Notes:** ${customMessage || 'None'}`;
                const userStr = localStorage.getItem('aisleUser');
                const token = JSON.parse(userStr).token;
                await axios.post('/api/chat/messages', {
                    conversationId: conv._id,
                    text
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                toast.success('Request submitted & chat thread started!');
                navigate(`/messages?conversationId=${conv._id}`);
            }
        } catch (error) {
            console.error('Request submission failed', error);
            alert(error.response?.data?.message || 'Failed to submit request.');
        }
    };

    if (!item) return <div className="p-8 text-center text-gray-400 font-sans">Loading creation details...</div>;


    const isHomeBusiness = item.homeBusinessType !== undefined;
    const imagesList = item.images && item.images.length > 0
        ? item.images
        : [item.imageUrl];

    const currentPrice = typeof item.sellingPrice === 'number' 
        ? item.sellingPrice 
        : (typeof item.price === 'string' && item.price.startsWith('₹') ? Number(item.price.replace('₹', '')) : Number(item.price || 0));

    const displayPrice = `₹${currentPrice}`;
    const displayMrp = item.mrp 
        ? (typeof item.mrp === 'string' && item.mrp.startsWith('₹') ? item.mrp : `₹${item.mrp}`) 
        : null;

    const shopName = item.shopName || item.shop?.name || item.seller?.shopDetails?.shopName || "Artisan Shop";
    const shopId = item.shopId || item.shop?._id || item.seller?._id;

    return (
        <div className="bg-slate-50 min-h-screen pb-24 font-sans">
            {/* Header Image Area / Multi-photo Gallery */}
            <div className="relative bg-white h-72 md:h-96 flex flex-col items-center justify-center border-b border-slate-100 overflow-hidden">
                <img
                    src={getImageUrl(imagesList[activeImgIndex])}
                    className="w-full h-full object-cover transition-all duration-300 animate-fade-in"
                    alt={item.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300'; }}
                />

                {/* Navigation Arrows for Gallery */}
                {imagesList.length > 1 && (
                    <>
                        <button
                            onClick={() => setActiveImgIndex(prev => (prev - 1 + imagesList.length) % imagesList.length)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center backdrop-blur z-10 transition-all font-bold text-lg"
                        >
                            ‹
                        </button>
                        <button
                            onClick={() => setActiveImgIndex(prev => (prev + 1) % imagesList.length)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center backdrop-blur z-10 transition-all font-bold text-lg"
                        >
                            ›
                        </button>
                    </>
                )}

                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 bg-white/80 p-3 rounded-full shadow-md backdrop-blur z-20 hover:scale-105 transition-all"
                >
                    <FaArrowLeft className="text-gray-800" />
                </button>
            </div>

            {/* Thumbnail Row (Only if multiple images) */}
            {imagesList.length > 1 && (
                <div className="bg-white px-5 py-3 flex gap-2 overflow-x-auto justify-center border-b border-slate-100 shrink-0">
                    {imagesList.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveImgIndex(i)}
                            className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === activeImgIndex ? 'border-indigo-600 scale-105' : 'border-slate-200 opacity-70'}`}
                        >
                            <img
                                src={getImageUrl(img)}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                            />
                        </button>
                    ))}
                </div>
            )}

            <div className="max-w-2xl mx-auto p-6 bg-white shadow-sm mt-4 rounded-3xl border border-slate-100">
                {/* Story/Story Details for Home Business */}
                {isHomeBusiness && (
                    <div className="flex items-center gap-2 mb-3">
                        {item.homeBusinessType === 'MADE_TO_ORDER' ? (
                            <span className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-sm">
                                🎂 Made To Order
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-black rounded-full uppercase tracking-wider shadow-sm">
                                📦 Ready Stock
                            </span>
                        )}
                        <span className="text-xs bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-full font-bold">
                            ✨ Artisan Creation
                        </span>
                    </div>
                )}

                {/* Product Title */}
                <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight">{item.name}</h1>
                
                {/* Category */}
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5">{item.category}</p>

                <div className="flex items-center gap-2 mt-4">
                    <span className="text-3xl font-black text-slate-900">{displayPrice}</span>
                    <span className="text-sm text-slate-400 font-bold">/ {item.unit || 'piece'}</span>
                </div>

                {/* Details list for Home Business */}
                {isHomeBusiness && (
                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {item.homeBusinessType === 'MADE_TO_ORDER' ? (
                            <div className="flex items-center gap-1.5">
                                <span>🧑‍🍳</span>
                                <span>Preparation Time: {item.preparationTime}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <span>📦</span>
                                <span>Stock Available: {item.quantity} {item.unit || 'pieces'}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Status Badge (Default retail confidence or sold out details) */}
                {!isHomeBusiness && (
                    <div className="mt-4 flex items-center gap-3">
                        {item.stockStatus === 'OUT_OF_STOCK' ? (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-lg uppercase tracking-wider">
                                Out of Stock
                            </span>
                        ) : (
                            <ConfidenceSignal
                                level={item.confidence?.level || 'medium'}
                                shopStatus={'OPEN'}
                                showTooltip={true}
                            />
                        )}

                        {item.stockStatus === 'LIMITED' && (
                            <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg uppercase tracking-wider animate-pulse">
                                Limited Stock
                            </span>
                        )}
                    </div>
                )}

                <hr className="my-6 border-slate-100" />

                {/* Story card for Home Business */}
                {isHomeBusiness && item.productStory && (
                    <div className="bg-gradient-to-br from-indigo-50/30 via-indigo-50/10 to-transparent border border-indigo-100/50 rounded-3xl p-6 mb-6 shadow-sm">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            ✨ Story Behind This Creation
                        </h3>
                        <p className="text-sm text-slate-600 italic font-semibold leading-relaxed">
                            "{item.productStory}"
                        </p>
                    </div>
                )}

                {/* Description (If any retail description is present) */}
                {item.description && (
                    <div className="mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{item.description}</p>
                    </div>
                )}

                {/* Creator or Shop Card */}
                {shopId && (
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 hover:border-indigo-300 transition-colors cursor-pointer"
                        onClick={() => navigate(isHomeBusiness ? `/creator/${shopId}` : `/shop/${shopId}`)}>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-lg">
                                {isHomeBusiness ? <FaPalette /> : <FaStore />}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-extrabold text-slate-900">{shopName}</h3>
                                <p className="text-xs text-slate-400 mt-0.5 max-w-[200px] truncate font-medium">
                                    {isHomeBusiness ? "View creator's story & creations" : "View shop products & location"}
                                </p>
                                <span className="text-xs font-bold text-emerald-600 mt-1 block">Open Now</span>
                            </div>
                            <button className="text-xs font-bold bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                                {isHomeBusiness ? 'View Creator' : 'View Shop'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="fixed bottom-0 left-0 right-0 z-20">
                    <div className="max-w-2xl mx-auto w-full p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex gap-3 shadow-lg">
                        {isHomeBusiness ? (
                            <>
                                <button
                                    disabled={item.stockStatus === 'OUT_OF_STOCK' || (item.homeBusinessType === 'READY_STOCK' && item.quantity <= 0)}
                                    onClick={() => isRequested ? null : setShowRequestModal(true)}
                                    className={`flex-2 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border text-sm cursor-pointer
                                        ${(item.stockStatus === 'OUT_OF_STOCK' || (item.homeBusinessType === 'READY_STOCK' && item.quantity <= 0))
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                            : isRequested
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-md active:scale-98'
                                        }
                                    `}
                                >
                                    {isRequested ? '✓ Request Submitted' : 'Request This Item'}
                                </button>
                                <button
                                    onClick={handleChatWithCreator}
                                    className="flex-1 py-4 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
                                >
                                    Chat with Creator
                                </button>
                                {shopId && (
                                    <button
                                        className="flex-1 py-4 bg-slate-150 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
                                        onClick={() => navigate(`/creator/${shopId}`)}
                                    >
                                        View Creator
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    disabled={item.stockStatus === 'OUT_OF_STOCK'}
                                    onClick={() => handleInterest()}
                                    className={`flex-1 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border text-sm cursor-pointer
                                        ${item.stockStatus === 'OUT_OF_STOCK'
                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                            : isInterested
                                                ? 'bg-rose-50 text-rose-500 border-rose-100'
                                                : 'bg-white border-slate-200 text-slate-800 shadow-sm hover:bg-slate-50'
                                        }
                                    `}
                                >
                                    {item.stockStatus === 'OUT_OF_STOCK' ? (
                                        <span>Unavailable</span>
                                    ) : (
                                        <>
                                            <FaRegHeart className={isInterested ? 'fill-current' : ''} />
                                            {isInterested ? 'Interested' : "I'm Interested"}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleAskAvailability}
                                    className="flex-1 py-4 bg-white hover:bg-slate-50 text-indigo-600 border border-indigo-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm cursor-pointer"
                                >
                                    Ask Availability
                                </button>
                                {shopId && (
                                    <button
                                        className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-98 transition-all text-sm cursor-pointer"
                                        onClick={() => navigate(`/shop/${shopId}`)}
                                    >
                                        <FaDirections /> Visit Shop
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Custom Request Negotiation Modal */}
            {showRequestModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Request Creation</h3>
                            <button onClick={() => setShowRequestModal(false)} className="text-slate-400 hover:text-slate-650 font-bold text-lg cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleRequestSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Quantity</label>
                                <div className="flex items-center gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setRequestQty(prev => Math.max(1, prev - 1))}
                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                                    >
                                        -
                                    </button>
                                    <span className="text-sm font-black text-slate-800 w-8 text-center">{requestQty}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setRequestQty(prev => (item.homeBusinessType === 'READY_STOCK' && prev >= item.quantity) ? prev : prev + 1)}
                                        className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Preferred Pickup Details</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Tomorrow morning, Friday 4 PM"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Custom Notes / Message</label>
                                <textarea
                                    placeholder="e.g. Less sugar, name Aarav written on card, customized colors"
                                    value={customMessage}
                                    onChange={(e) => setCustomMessage(e.target.value)}
                                    rows="3"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-600 font-medium text-slate-800 resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer"
                            >
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialView="register"
            />

        </div>
    );
};

export default CustomerItemDetail;
