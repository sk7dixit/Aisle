import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaChevronLeft } from 'react-icons/fa';
import { useInterested } from '../../context/InterestedContext';
import { CATEGORIES } from '../../constants/categories';

// Helper for image URLs (Duplicated for safety/speed, or import if available)
const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('data:')) return path;
    if (path.startsWith('http')) return path;
    // Return relative path to utilize Vite proxy and avoid CORS/CORP issues
    return `${path.startsWith('/') ? '' : '/'}${path}`;
};

const CategoryProducts = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categoryInfo, setCategoryInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userLocation, setUserLocation] = useState(null);

    // Get Location from localStorage
    useEffect(() => {
        const storedLoc = localStorage.getItem('customerLocation');
        if (storedLoc) {
            setUserLocation(JSON.parse(storedLoc));
        }
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                // Find static info first
                const staticCat = CATEGORIES.find(c => c.id === slug);
                setCategoryInfo(staticCat || { label: 'Category', icon: '📦' });

                // Build query params
                const params = {};
                if (userLocation) {
                    params.lat = userLocation.lat;
                    params.lng = userLocation.lng;
                    params.radiusKm = 10; // Default radius
                    if (userLocation.city) params.city = userLocation.city;
                }

                const res = await axios.get(`/api/categories/${slug}/products`, { params });
                setProducts(res.data.products || []);
            } catch (err) {
                console.error("Error loading category:", err);
                setError("Could not load products. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchProducts();
    }, [slug, userLocation]);



    return (
        <div className="min-h-screen bg-transparent pb-20 pt-[80px]">
            {/* Header: Transparent Glass */}
            <div className="sticky top-[72px] z-30 transition-all duration-300">
                <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-md border border-white/40 hover:bg-white text-gray-700 transition-all shadow-sm hover:-translate-x-1"
                        >
                            <FaChevronLeft />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3 tracking-tight">
                                <span className="text-3xl filter drop-shadow-sm">{categoryInfo?.icon}</span>
                                {categoryInfo?.label}
                            </h1>
                            <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-widest mt-0.5 ml-1 opacity-70">
                                {products.length} products nearby
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid (Strict Layout per User Request) */}
            <div className="max-w-[1280px] mx-auto px-[24px] pt-[32px] pb-[80px]">
                {/* User's .products-page equivalent above */}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-[#ff7a00] rounded-full animate-spin"></div>
                    </div>
                ) : error ? (
                    <div className="text-center py-32">
                        <p className="text-gray-500 font-medium">{error}</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-32 flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                        {/* 9. EMPTY STATE (Strict) */}
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-3xl grayscale opacity-50">
                            🍃
                        </div>
                        <h3 className="text-[18px] font-bold text-[#1f2937] mb-1">No products available nearby.</h3>
                        <p className="text-[14px] text-[#6b7280]">Check other shops or try again later.</p>
                    </div>
                ) : (
                    /* Grid (Desktop 4 cols, responsive fallback implied) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[20px]">
                        {products.map(product => (
                            <ProductCard
                                key={product._id}
                                product={product}
                                navigate={navigate}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- 2. PRODUCT CARD COMPONENT (Strict Implementation) ---
export const ProductCard = ({ product, navigate }) => {
    // We need cart context here. Using inline hook or context if available.
    // Assuming useInterested is the cart context based on previous files.
    // However, I need to make sure I import it in the parent or pass it down.
    // I I'll define this component INSIDE CategoryProducts to access the hook easily for now, 
    // or better, I will export it if I had time, but for this specific "single step", 
    // I'll keep it collocated but clean.

    // Actually, let's keep it separate for cleanliness, but we need the hook.
    // I will assume the parent passes the handlers or I use the hook here.
    // Let's use the hook inside.
    const { updateQuantity, getQuantity } = useInterested();  // Need to import this hook at top of file

    // Logic
    const quantity = getQuantity(product.shop?._id || product.shop, product._id);
    const stockQty = product.quantity || 0;
    const isOutOfStock = stockQty <= 0;

    const handleAdd = (e) => {
        e.stopPropagation();
        updateQuantity({
            shopId: product.shop?._id || product.shop,
            productId: product._id,
            productName: product.name,
            price: product.sellingPrice || product.price || 0,
            image: product.imageUrl || product.image || 'https://via.placeholder.com/150',
            shopName: product.shop?.name || product.shop?.shopName || product.seller?.shopDetails?.shopName, // Pass shop name if needed
            shopPhone: product.shop?.contactPhone || product.seller?.phone || product.seller?.shopDetails?.phone || "9876543210",
            shopAddress: product.shop?.address || product.shop?.city || product.seller?.shopDetails?.address,
            shopIsOpen: product.shop?.isOpen !== undefined ? product.shop.isOpen : true,
            shopHours: product.shop?.openingHours || "9:00 AM - 9:00 PM",
            shopLastActive: product.seller?.sellerStats?.lastActiveAt || product.seller?.shopDetails?.lastActiveAt || null,
            stockConfidence: product.stockConfidence || "MEDIUM"
        }, 1);
    };

    const handleInc = (e) => {
        e.stopPropagation();
        updateQuantity({ shopId: product.shop?._id || product.shop, productId: product._id }, 1);
    };

    const handleDec = (e) => {
        e.stopPropagation();
        updateQuantity({ shopId: product.shop?._id || product.shop, productId: product._id }, -1);
    };

    // CSS Classes (Mapping User's CSS to Tailwind Arbitrary Values for Precision)
    return (
        <div
            className={`
                bg-white rounded-[16px] p-[14px] flex flex-col transition-all duration-250 ease-out
                shadow-[0_8px_24px_rgba(0,0,0,0.06)] 
                hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:-translate-y-1
                ${isOutOfStock ? 'opacity-50' : ''}
            `}
        >
            {/* 3. PRODUCT IMAGE */}
            <div className="w-full h-[160px] bg-[#fafafa] rounded-[12px] mb-[12px] overflow-hidden relative">
                <img
                    src={getImageUrl(product.imageUrl || product.image) || "https://placehold.co/400x300?text=No+Image"}
                    alt={product.name}
                    className="w-full h-full object-contain"
                />
                {/* STOCK BADGE (Explicit) */}
                {isOutOfStock && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">OUT OF STOCK</span>
                    </div>
                )}
            </div>

            {/* 4. PRODUCT DETAILS */}
            {/* Brand (Mocking brand if not in DB, using Category or Shop as fallback) */}
            <p className="text-[12px] text-[#6b7280] mb-[2px] leading-tight truncate">
                {product.brand || product.category || "Generic"}
            </p>

            {/* Name */}
            <h3 className="text-[14px] font-semibold text-[#1f2937] leading-[1.35] mb-[6px] line-clamp-2 min-h-[38px]">
                {product.name}
            </h3>

            {/* 5. PRICE + UNIT */}
            <div className="flex items-baseline mb-4">
                <span className="text-[16px] font-bold text-[#111827]">
                    {typeof product.price === 'string' && product.price.startsWith('₹') ? product.price : `₹${product.sellingPrice || product.price}`}
                </span>
                <span className="text-[12px] text-[#6b7280] ml-1">
                    {product.unit ? `/ ${product.unit}` : ''}
                </span>
            </div>

            {/* 6. ADD TO CART CONTROLS */}
            <div className="mt-auto">
                {isOutOfStock ? (
                    <button disabled className="w-full bg-gray-100 text-gray-400 rounded-full py-[8px] text-[14px] font-semibold cursor-not-allowed">
                        Unavailable
                    </button>
                ) : quantity === 0 ? (
                    <button
                        onClick={handleAdd}
                        className="w-full bg-[#ff7a00] text-white rounded-full py-[8px] text-[14px] font-semibold hover:bg-[#e06b00] transition-colors"
                    >
                        ADD
                    </button>
                ) : (
                    <div className="flex items-center justify-between bg-[#fff3e8] rounded-full px-[6px] py-[6px] animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={handleDec}
                            className="w-[28px] h-[28px] rounded-full bg-[#ff7a00] text-white font-bold flex items-center justify-center hover:bg-[#e06b00] active:scale-95 transition-all"
                        >
                            -
                        </button>
                        <span className="text-[14px] font-bold text-[#111827]">{quantity}</span>
                        <button
                            onClick={handleInc}
                            className="w-[28px] h-[28px] rounded-full bg-[#ff7a00] text-white font-bold flex items-center justify-center hover:bg-[#e06b00] active:scale-95 transition-all"
                        >
                            +
                        </button>
                    </div>
                )}
            </div>

            {/* 8. SELLER INFO (Subtle) */}
            <p className="text-[11px] text-[#9ca3af] mt-[8px] text-center truncate">
                Available at {product.shop?.name || product.shopName || "Nearby Business"}
                {product.planId === 'pro' && <span className="text-[#9ca3af] font-bold"> · Verified</span>}
            </p>

        </div>
    );
};

export default CategoryProducts;
