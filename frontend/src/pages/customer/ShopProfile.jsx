import React, { useState, useEffect } from 'react';
import { getGenericImage } from '../../utils/GenericImages';
import { useParams, useNavigate } from "react-router-dom";
import axios from 'axios';
import { FaMapMarkerAlt, FaStar, FaSearch, FaChevronLeft, FaExclamationCircle } from 'react-icons/fa';
import { useInterested } from '../../context/InterestedContext';
import { useActivity } from '../../context/ActivityContext';
import CertaintyBadge from '../../components/common/CertaintyBadge';
import RatingForm from '../../components/customer/RatingForm';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { toast } from 'react-hot-toast';

import io from 'socket.io-client'; // Real-time sync

// Helper for image URLs
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path; // Base64
    if (path.startsWith('http')) return path; // External or full URL
    // Return relative path to utilize Vite proxy and avoid CORS/CORP issues
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const ShopProfile = () => {
    const { shopId } = useParams();
    const navigate = useNavigate();
    const { hasActiveVisit, trustScore } = useActivity();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const { user } = useAuth();
    const { startConversation } = useChat();

    const handleChatWithShop = async () => {
        if (!user) {
            toast.error("Please login to chat with this shop.");
            navigate('/login');
            return;
        }
        const conv = await startConversation(shop._id, 'business', shop._id);
        if (conv) {
            navigate(`/messages?conversationId=${conv._id}`);
        } else {
            toast.error("Failed to start chat with the shop.");
        }
    };

    // States for Real Data
    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasVisited, setHasVisited] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);
    const [showRatingForm, setShowRatingForm] = useState(false);
    const isHomeBusiness = shop?.shopDetails?.shopType === 'HOME_BUSINESS' || shop?.shopDetails?.category === 'HOME_BUSINESS' || shop?.category === 'HOME_BUSINESS';

    useEffect(() => {
        const loadShopData = async () => {
            if (!shopId) return;
            setLoading(true);
            setError(null);
            console.log("Shop ID from URL:", shopId);

            try {
                // Determine if ID is mock or real for demonstration
                // For this step, we hit the real endpoint
                const response = await axios.get(`/api/customer/shop/${shopId}`);
                const data = response.data;

                setShop(data.shop);

                // Flatten products from categories
                const allItems = [];
                const catList = ['All'];

                if (data.categories) {
                    data.categories.forEach(cat => {
                        catList.push(cat.categoryName);
                        cat.items.forEach(item => {
                            // Fix: validation for price field existence
                            const rawPrice = item.sellingPrice !== undefined ? item.sellingPrice : item.price;

                            allItems.push({
                                ...item,
                                id: item._id, // Ensure ID consistency
                                price: typeof rawPrice === 'string' && rawPrice.startsWith('₹') ? rawPrice : `₹${rawPrice || 0}`,
                                mrp: item.mrp ? (typeof item.mrp === 'string' && item.mrp.startsWith('₹') ? item.mrp : `₹${item.mrp}`) : null,
                                status: item.stockStatus, // AVAILABLE, LIMITED, OUT_STOCK
                                image: item.imageUrl || item.image, // Fix: Map backend imageUrl to frontend image prop
                                fallbackImage: getGenericImage(item.categorySlug || item.category) // Robust Fallback
                            });
                        });
                    });
                }

                setProducts(allItems);
                setCategories(catList);
            } catch (err) {
                console.error("Error fetching shop data:", err);
                setError(err.response?.data?.message || "Failed to load shop details.");
            } finally {
                setLoading(false);
            }
        };

        loadShopData();
    }, [shopId]);

    // Real-Time Socket Sync (Step 8 Improvement)
    useEffect(() => {
        if (!shopId) return;

        const socket = io('http://localhost:5000'); // Use env if available in real prod

        socket.emit('customer:join_shop', shopId);
        console.log(`🔌 Joining socket room: shop_${shopId}`);

        socket.on('shop_status_updated', (data) => {
            console.log("⚡ Real-time Shop Update:", data);
            setShop(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    shopDetails: {
                        ...prev.shopDetails,
                        operatingMode: data.operatingMode
                    }
                };
            });
            // Optional: Re-fetch products to get updated stockConfidence if needed
            // For now, strict UI rules handle most visuals instantly.
        });

        return () => {
            socket.disconnect();
        };
    }, [shopId]);

    // Simple Visit Logging & Check
    useEffect(() => {
        const handleVisitAndCheck = async () => {
            const userStr = localStorage.getItem('aisleUser');
            const token = userStr ? JSON.parse(userStr).token : null;
            if (!token || !shopId) return;

            try {
                // 1. Log Visit
                await axios.post(`/api/customer/shop/${shopId}/visit`, {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // 2. Check Status
                const res = await axios.get(`/api/customer/shop/${shopId}/has-visited`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setHasVisited(res.data.visited);
                setHasReviewed(res.data.reviewed);
            } catch (err) {
                console.error("Visit check failed", err);
            }
        };

        if (shop && !loading) {
            handleVisitAndCheck();
        }
    }, [shopId, shop, loading]);

    // Filter Logic
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
                    <div className="text-stone-500 font-bold animate-pulse">Loading amazing deals...</div>
                </div>
            </div>
        );
    }

    if (error || !shop) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
                <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center border border-red-50">
                    <FaExclamationCircle className="text-5xl text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-stone-900 mb-2">Shop Not Found</h1>
                    <p className="text-stone-500 mb-8">{error || "We couldn't find the shop you're looking for. It might be temporarily closed or moved."}</p>
                    <button
                        onClick={() => navigate('/shops')}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg"
                    >
                        Browse Other Shops
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full mt-3 text-stone-500 font-medium hover:text-stone-800"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent pb-20 pt-2 shop-profile-page motion-page-enter">
            <div className="max-w-[1280px] mx-auto px-6 pt-0 pb-6 sm:px-8">

                {/* --- 1. HERO SECTION (Shop Identity) --- */}

                {/* STEP 5: High Rush Banner */}
                {shop.shopDetails?.operatingMode === 'RUSH' && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
                        <FaExclamationCircle className="text-amber-600 mt-1 shrink-0" />
                        <div>
                            <h3 className="font-bold text-amber-800 text-sm uppercase tracking-wide">Check Before Visit</h3>
                            <p className="text-amber-700 text-xs mt-1">
                                Availability may change. Contact seller for confirmation.
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-all motion-button"
                    >
                        <FaChevronLeft />
                    </button>

                    {/* Banner Image */}
                    <div className="h-48 md:h-64 w-full overflow-hidden relative rounded-b-[32px] md:rounded-b-[48px] shadow-sm">
                        <img
                            src={getImageUrl(shop.shopImage) || "https://images.unsplash.com/photo-1604719312566-b7e677c66235?auto=format&fit=crop&w=1600&q=80"}
                            alt="Cover"
                            className="w-full h-full object-cover animate-fade-in"
                            loading="eager"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1604719312566-b7e677c66235?auto=format&fit=crop&w=1600&q=80" }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent animate-fade-in delay-100"></div>
                    </div>

                    {/* Shop Info Overlay */}
                    <div className="absolute bottom-0 left-0 w-full p-6 md:p-10 flex items-end justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/90 backdrop-blur-md rounded-3xl p-3 shadow-lg flex items-center justify-center overflow-hidden motion-card border border-white/50">
                                <img
                                    src={getImageUrl(shop.logo) || "https://cdn-icons-png.flaticon.com/512/2953/2953363.png"}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => { e.target.src = "https://cdn-icons-png.flaticon.com/512/2953/2953363.png" }}
                                />
                            </div>
                            <div className="text-white mb-2 motion-page-enter" style={{ animationDelay: '100ms' }}>
                                <h1 className="text-3xl md:text-4xl font-black leading-tight drop-shadow-md tracking-tight">{shop.name}</h1>
                                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 text-white/90 text-sm mt-2 font-medium">
                                    <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-orange-400" /> {shop.address || "Nearby Business"}</span>
                                    {shop.rating > 0 && (
                                        <>
                                            <span className="hidden md:inline text-white/40">•</span>
                                            <span className="flex items-center gap-1.5"><FaStar className="text-yellow-400" /> {shop.rating.toFixed(1)}</span>
                                        </>
                                    )}
                                </div>

                                {/* Certainty Badges - NEW LOCATION */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {hasVisited && <CertaintyBadge type="AVAILABILITY" />}
                                    {shop.isOpen && trustScore >= 60 && <CertaintyBadge type="PAY_ON_VISIT" />}
                                    {shop.isOpen && <CertaintyBadge type="SELLER_ACTIVE" />}
                                    {/* Online Payment badge is always relevant if the platform supports it, showing it for all now as per user request */}
                                    <CertaintyBadge type="ONLINE_PAY" />
                                </div>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md ${shop.isOpen ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-red-500/20 text-red-300 border border-red-500/50'}`}>
                            {shop.isOpen ? 'Open Now' : 'Closed'}
                        </span>

                        {/* Step 4: Shop Level Stock Indicator */}
                        {shop.shopDetails?.operatingMode === 'GUARANTEED' && (
                            <span className="ml-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md bg-emerald-500/25 text-emerald-100 border border-emerald-500/50">
                                🟢 Live Inventory
                            </span>
                        )}
                        {shop.shopDetails?.operatingMode === 'BEST_EFFORT' && (
                            <span className="ml-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md bg-blue-500/25 text-blue-100 border border-blue-500/50">
                                🔵 Verified Availability
                            </span>
                        )}
                        {shop.shopDetails?.operatingMode === 'RUSH' && (
                            <span className="ml-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md bg-amber-500/25 text-amber-100 border border-amber-500/50">
                                🟡 Check Before Visit
                            </span>
                        )}
                    </div>
                </div>


                {/* --- 2. CONTROLS BAR (Search, Directions, Rate) --- */}
                <div className="sticky top-16 z-40 px-4 py-4 bg-transparent backdrop-blur-sm sticky-search-smooth transition-all">
                    <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

                        {/* 2.1 Small Search Bar */}
                        <div className="relative flex-grow max-w-[200px] md:max-w-xs transition-all duration-300">
                            <input
                                type="text"
                                placeholder="Search items..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white/90 backdrop-blur-md border border-white/50 text-gray-800 rounded-xl py-2.5 pl-9 pr-4 focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none shadow-sm text-sm font-medium"
                            />
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        </div>

                        {/* 2.2 Action Buttons */}
                        <div className="flex items-center gap-2">
                            {/* Chat with Shop Button */}
                            <button
                                onClick={handleChatWithShop}
                                className="bg-white hover:bg-stone-100 text-stone-900 border border-stone-200 font-black uppercase tracking-widest py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg text-[10px] cursor-pointer"
                            >
                                💬
                                <span className="hidden sm:inline">Chat with Shop</span>
                                <span className="sm:hidden">Chat</span>
                            </button>
                            {/* Get Directions Button */}
                            {shop.shopLocation?.coordinates && (
                                <button
                                    onClick={() => {
                                        const [lng, lat] = shop.shopLocation.coordinates;
                                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
                                    }}
                                    className="bg-[var(--accent-terracotta)] hover:bg-black text-white font-black uppercase tracking-widest py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg text-[10px]"
                                >
                                    <FaMapMarkerAlt />
                                    <span className="hidden sm:inline">Directions</span>
                                    <span className="sm:hidden">Route</span>
                                </button>
                            )}

                            {/* Rate Button */}
                            {hasVisited && !hasReviewed && (
                                <button
                                    onClick={() => setShowRatingForm(!showRatingForm)}
                                    className={`font-black uppercase tracking-widest py-2.5 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md hover:shadow-lg text-[10px]
                                        ${showRatingForm
                                            ? 'bg-stone-800 text-white'
                                            : 'bg-white text-stone-900 border border-stone-100 hover:bg-stone-50'}
                                    `}
                                >
                                    <FaStar className={showRatingForm ? 'text-yellow-400' : 'text-stone-400'} />
                                    {showRatingForm ? 'Close' : 'Rate'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- 2.5 CONDITIONAL RATING FORM --- */}
                {showRatingForm && hasVisited && !hasReviewed && (
                    <div className="max-w-4xl mx-auto px-4 mb-8 -mt-2 animate-slide-down">
                        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-stone-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200"></div>
                            <RatingForm
                                shopId={shopId}
                                onFinish={() => {
                                    setHasReviewed(true);
                                    setShowRatingForm(false);
                                }}
                                onCancel={() => setShowRatingForm(false)}
                            />
                        </div>
                    </div>
                )}

                {hasVisited && hasReviewed && (
                    <div className="max-w-4xl mx-auto px-4 mt-8">
                        <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center justify-center gap-3">
                            <span className="text-emerald-500 text-xl font-bold">✨</span>
                            <p className="text-emerald-800 font-black uppercase tracking-widest text-[10px]">Thanks for rating this shop!</p>
                        </div>
                    </div>
                )}

                {/* --- 3. CATEGORY FILTERS --- */}
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 ease-out ${activeCategory === cat
                                ? 'bg-black text-white shadow-md scale-105'
                                : 'bg-white/60 text-gray-600 hover:bg-white border border-white/40'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                {/* --- 4. PRODUCT GRID --- */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-stone-900 text-lg font-black uppercase tracking-tight">
                            {isHomeBusiness ? 'Creations' : 'Products'} ({filteredProducts.length})
                        </h2>
                        <div className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                            {isHomeBusiness ? 'Handcrafted Catalog' : 'Live Inventory'}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                        {filteredProducts.map((product, idx) => (
                            <div key={product.id} className="motion-card" style={{ animationDelay: `${idx * 50}ms` }}>
                                <ProductCard
                                    product={product}
                                    shop={{
                                        id: shopId,
                                        name: shop.name,
                                        phone: shop.phone || shop.shopDetails?.phone,
                                        address: shop.address || shop.shopDetails?.address,
                                        isOpen: shop.isOpen,
                                        openingHours: shop.shopDetails?.openingHours || "9:00 AM - 9:00 PM",
                                        lastActiveAt: shop.shopDetails?.lastActiveAt || shop.sellerStats?.lastActiveAt
                                    }}
                                    operatingMode={shop.shopDetails?.operatingMode}
                                    isHomeBusiness={isHomeBusiness}
                                />
                            </div>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="py-20 text-center animate-fade-in">
                            <div className="text-4xl mb-4 text-stone-200">🔍</div>
                            <h3 className="text-stone-800 font-bold">No items found</h3>
                            <p className="text-stone-500 text-sm">Try adjusting your search or category filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



// --- SUB-COMPONENT: The Product Card (Handles Stock Logic) ---
const ProductCard = ({ product, shop, operatingMode, isHomeBusiness }) => {
    const navigate = useNavigate();
    const { updateQuantity, getQuantity } = useInterested();
    const [currentImgIndex, setCurrentImgIndex] = useState(0);

    const { user } = useAuth();
    const { startConversation } = useChat();

    const handleAskAvailability = async (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error("Please login to ask about availability.");
            navigate('/login');
            return;
        }
        
        try {
            const conv = await startConversation(shop.id, 'business', shop.id);
            if (conv) {
                const text = `Hi! Is the product "${product.name}" available at your shop right now?`;
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

    const imagesList = product.images && product.images.length > 0
        ? product.images
        : [product.image || product.fallbackImage];

    // Use quantity-based stock status
    const stockQuantity = product.quantity || 0;
    const isOutOfStock = !isHomeBusiness
        ? stockQuantity <= 0
        : (product.homeBusinessType === 'READY_STOCK' && stockQuantity <= 0);
    const isLimited = !isOutOfStock && stockQuantity > 0 && stockQuantity <= 5;

    // Get current cart quantity
    const quantity = getQuantity(shop.id, product.id);

    const handleAdd = (e) => {
        e.stopPropagation();
        updateQuantity({
            shopId: shop.id,
            shopName: shop.name,
            productId: product.id,
            productName: product.name,
            price: product.price,
            image: product.image,
            shopPhone: shop.phone || "9876543210",
            shopAddress: shop.address,
            shopIsOpen: shop.isOpen,
            shopHours: shop.openingHours,
            shopLastActive: shop.lastActiveAt,
            stockConfidence: product.stockConfidence || "MEDIUM"
        }, 1);
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        updateQuantity({ shopId: shop.id, productId: product.id }, 1);
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        updateQuantity({ shopId: shop.id, productId: product.id }, -1);
    };

    const handleCardClick = () => {
        navigate(`/product/${product.id}`);
    };

    const handlePrevImg = (e) => {
        e.stopPropagation();
        setCurrentImgIndex(prev => (prev - 1 + imagesList.length) % imagesList.length);
    };

    const handleNextImg = (e) => {
        e.stopPropagation();
        setCurrentImgIndex(prev => (prev + 1) % imagesList.length);
    };

    return (
        <div 
            onClick={handleCardClick}
            className={`group relative bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden cursor-pointer ${isOutOfStock ? 'opacity-60' : ''}`}
        >
            {/* 1. Image Area / Carousel */}
            <div className="relative h-48 w-full bg-slate-50 flex items-center justify-center overflow-hidden">
                {(!imagesList[currentImgIndex] || 
                  imagesList[currentImgIndex].includes('photo-1542838132-92c53300491e') || 
                  imagesList[currentImgIndex] === "/placeholder-product.png") ? (
                    <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/5 to-slate-100 text-slate-800 text-center font-bold">
                        <span className="text-[8px] font-black uppercase tracking-[0.15em] text-amber-500 mb-1 leading-none">{product.brand || 'Product'}</span>
                        <span className="text-[11px] font-black text-slate-700 line-clamp-3 leading-snug px-2">{product.name}</span>
                    </div>
                ) : (
                    <img
                        src={getImageUrl(imagesList[currentImgIndex]) || product.fallbackImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = product.fallbackImage || "https://via.placeholder.com/150"; }}
                    />
                )}

                {/* Carousel Controls (Only if multiple images) */}
                {imagesList.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={handlePrevImg}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs font-bold"
                        >
                            ‹
                        </button>
                        <button
                            type="button"
                            onClick={handleNextImg}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs font-bold"
                        >
                            ›
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                            {imagesList.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImgIndex ? 'bg-indigo-600 scale-125' : 'bg-slate-300'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* STOCK STATUS BADGE - Top Right */}
                <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-10">
                    {isHomeBusiness ? (
                        <>
                            {product.homeBusinessType === 'MADE_TO_ORDER' ? (
                                <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    🎂 Made To Order
                                </span>
                            ) : isOutOfStock ? (
                                <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    Sold Out
                                </span>
                            ) : (
                                <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                                    📦 Ready Stock
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Step 6: Inventory Type Badges */}
                            {product.inventoryType === 'LOOSE' && (
                                <span className="bg-stone-100/90 text-stone-600 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-stone-200">
                                    Loose Item
                                </span>
                            )}
                            {product.inventoryType === 'DAILY' && (
                                <span className="bg-emerald-50/90 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm border border-emerald-200">
                                    Fresh Today
                                </span>
                            )}

                            {isOutOfStock ? (
                                <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                    Out of Stock
                                </span>
                            ) : (
                                (() => {
                                    if (operatingMode === 'GUARANTEED') {
                                        return (
                                            <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                Available Today
                                            </span>
                                        );
                                    } else if (operatingMode === 'BEST_EFFORT') {
                                        return product.stockConfidence === 'MEDIUM' ? (
                                            <span className="flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                                                Limited Availability
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                                Available
                                            </span>
                                        );
                                    } else {
                                        return (
                                            <span className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                                                Availability Not Guaranteed
                                            </span>
                                        );
                                    }
                                })()
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                    <h3 className="text-sm font-black text-slate-800 leading-tight mb-1 line-clamp-1">
                        {product.name}
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</p>
                    
                    {/* Story snippet for Home Business */}
                    {isHomeBusiness && product.productStory && (
                        <p className="text-[11px] text-slate-500 italic mt-2 line-clamp-2 leading-snug border-l-2 border-indigo-100 pl-2">
                            "{product.productStory}"
                        </p>
                    )}
                </div>

                {/* Subtext info (Prep time / Qty left) */}
                {isHomeBusiness && (
                    <div className="mt-3 text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                        {product.homeBusinessType === 'MADE_TO_ORDER' ? (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">🧑‍🍳 Prep: {product.preparationTime}</span>
                        ) : (
                            <span className={`px-2 py-0.5 rounded ${stockQuantity <= 5 ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'}`}>
                                📦 Stock: {stockQuantity} {product.unit || 'pieces'}
                            </span>
                        )}
                    </div>
                )}

                {/* 3. Price & Action */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-base font-black text-stone-900 leading-none">{product.price}</span>
                        {product.mrp && !isHomeBusiness && (
                            <span className="text-[10px] text-stone-400 line-through mt-0.5">{product.mrp}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Ask Availability Button */}
                        <button
                            onClick={handleAskAvailability}
                            title="Ask Availability"
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-100 hover:bg-indigo-50 text-slate-750 hover:text-indigo-600 transition-all border border-stone-200/60 shadow-sm cursor-pointer"
                        >
                            💬
                        </button>

                        {/* QUANTITY CONTROLLER */}
                        {isOutOfStock ? (
                            <button
                                disabled
                                onClick={(e) => e.stopPropagation()}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-stone-200 text-stone-400 cursor-not-allowed"
                            >
                                ✕
                            </button>
                        ) : quantity === 0 ? (
                            <button
                                onClick={handleAdd}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-indigo-200 transition-all shadow-sm font-black"
                            >
                                +
                            </button>
                        ) : (
                            <div 
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center bg-slate-900 text-white rounded-xl shadow-md h-9 overflow-hidden"
                            >
                                <button
                                    onClick={handleDecrement}
                                    className="w-8 h-full flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors font-black"
                                >
                                    -
                                </button>
                                <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                                <button
                                    onClick={handleIncrement}
                                    className="w-8 h-full flex items-center justify-center hover:bg-slate-700 active:bg-slate-600 transition-colors font-black"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopProfile;
