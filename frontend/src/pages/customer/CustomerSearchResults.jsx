import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaMapMarkerAlt, FaCheckCircle, FaSearch, FaRobot, FaBoxOpen, FaSync } from 'react-icons/fa';
import MarketContextStrip from '../../components/customer/market/MarketContextStrip';
import DiscoveryEntryBlocks from '../../components/customer/market/DiscoveryEntryBlocks';
import { useSidebarState } from '../../context/SidebarStateContext';
import { useLocation as useGeoLocation } from '../../context/LocationContext';
import ConfidenceSignal from '../../components/customer/common/ConfidenceSignal';
import ShopCard from '../../components/customer/ShopCard';
import { ProductCard } from './CategoryProducts';
import { toast } from 'react-hot-toast';

const CustomerSearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('q');
    const { updateSignals, signalBrowsing, signalSearch } = useSidebarState();
    const { userLocation } = useGeoLocation();

    // Data states
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentCity] = useState(localStorage.getItem('userCity') || "Vadodara");
    const [groupedResults, setGroupedResults] = useState({});
    const [responsiveCount, setResponsiveCount] = useState(0);

    // AI Search specific states
    const [aiData, setAiData] = useState(null);
    const [isManualFallback, setIsManualFallback] = useState(false);

    // Coordinate parsing
    const lat = userLocation?.coordinates?.[1] || 28.6139; // Delhi fallback
    const lng = userLocation?.coordinates?.[0] || 77.2090;

    // 1. Signal Market Page to Hide Sidebar
    useEffect(() => {
        updateSignals({ pageType: 'market' });
    }, []);

    // 2. Handle Search Trigger
    useEffect(() => {
        if (query) {
            handleSearch(query);
            signalSearch(query);
        } else {
            setResults([]);
            setAiData(null);
        }
    }, [query, isManualFallback]);

    useEffect(() => {
        const groups = {};
        results.forEach(item => {
            const shopId = item.shopId || 'unknown';
            if (!groups[shopId]) {
                groups[shopId] = {
                    shopId: shopId,
                    shopName: item.shopName,
                    distance: item.distance,
                    items: []
                };
            }
            groups[shopId].items.push(item);
        });
        setGroupedResults(groups);
        updateSignals({ openShopsCount: Object.keys(groups).length });

        const responsive = Object.values(groups).filter(g =>
            g.items[0]?.confidence?.level === 'high' || g.items[0]?.confidence?.level === 'medium'
        ).length;
        setResponsiveCount(responsive);
    }, [results]);

    const handleSearch = async (searchTerm) => {
        setLoading(true);
        try {
            if (isManualFallback) {
                // Execute standard keyword search directly
                const { data } = await axios.get(`/api/customer/search`, {
                    params: { q: searchTerm, lat, lng }
                });
                setResults(data);
                setAiData({
                    fallback: true,
                    intent: 'keyword_fallback',
                    products: data,
                    shops: [],
                    bundleRecommendations: []
                });
            } else {
                // Execute AI Search
                const { data } = await axios.post(`/api/ai/search`, {
                    query: searchTerm,
                    lat,
                    lng,
                    radius: 5
                });
                setAiData(data);
                setResults(data.products || []);
            }
        } catch (error) {
            console.error("Search failed", error);
            toast.error("AI Search failed. Falling back to keyword search.");
            setIsManualFallback(true);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscoverySignal = (type) => {
        if (type === 'closest') navigate('/search?q=nearby&sort=distance');
        if (type === 'essentials') navigate('/search?q=grocery');
        if (type === 'pharmacy') navigate('/search?q=pharmacy');
        if (type === 'open_now') navigate('/search?q=open');
        signalBrowsing(type);
    };

    const handleAddBundleToCart = (bundle) => {
        // Track conversion in learning loop
        if (aiData?.searchIntentId) {
            axios.post('/api/ai/search/conversion', {
                searchIntentId: aiData.searchIntentId
            }).catch(e => console.warn(e));
        }

        // Simulate bundle add
        toast.success(`🎉 Added all ${bundle.products.length} items from "${bundle.name}" to cart with 10% Bundle Discount!`, {
            duration: 4000,
            icon: '📦'
        });
    };

    const handleItemClick = async (itemId, itemType) => {
        if (aiData?.searchIntentId) {
            try {
                await axios.post('/api/ai/search/click', {
                    searchIntentId: aiData.searchIntentId,
                    itemId,
                    itemType
                });
            } catch (e) {
                console.warn("Feedback click log failed:", e.message);
            }
        }
    };

    return (
        <div className="pb-24 min-h-screen bg-gray-50 flex flex-col">
            {/* 1. Context Strip (Sticky) */}
            <MarketContextStrip />

            {/* 2. Content Area */}
            <div className="flex-1 max-w-5xl mx-auto w-full px-4">

                {/* Case A: No Query -> Discovery Blocks */}
                {!query && (
                    <div className="animate-fade-in-up">
                        <div className="pt-6 pb-2">
                            <h2 className="text-xl font-bold text-gray-900">Explore Nearby</h2>
                            <p className="text-gray-500 text-sm">What do you need right now?</p>
                        </div>
                        <DiscoveryEntryBlocks onSignal={handleDiscoverySignal} />

                        <div className="mt-2 mb-8">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-text hover:border-[#E07A5F]/40 transition-colors" onClick={() => document.getElementById('hero-search')?.focus()}>
                                <FaSearch className="text-gray-400" />
                                <input
                                    id="hero-search"
                                    type="text"
                                    placeholder="Search for 'Need snacks for birthday party', 'Need breakfast items', or 'Paneer butter masala'..."
                                    className="flex-1 bg-transparent outline-none font-medium text-gray-900 placeholder-gray-400 text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') navigate(`/search?q=${encodeURIComponent(e.target.value)}`);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Case B: Loading */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-[#E07A5F]/20 border-t-[#E07A5F] rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium animate-pulse">Aisle AI is understanding your query...</p>
                    </div>
                )}

                {/* Case C: Results */}
                {query && !loading && aiData && (
                    <div className="space-y-6 animate-fade-in-up py-4">

                        {/* AI Intent & Confidence Banner */}
                        {!aiData.fallback && (
                            <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-500/10 to-indigo-500/10 border border-[#E07A5F]/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-scale-up">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#E07A5F] to-indigo-500 text-white flex items-center justify-center shadow-md shrink-0">
                                        <FaRobot size={20} className="animate-bounce" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-[#E07A5F]">Aisle AI Intent Engine</span>
                                            <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-full text-[8px] font-black uppercase tracking-wider">
                                                Confidence: {aiData.confidence}%
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight mt-1">
                                            Understood Intent: <span className="text-indigo-600 capitalize">"{aiData.intent.split('_').join(' ')}"</span>
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {aiData.extractedEntities.map((entity, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-650 text-[9px] font-bold rounded-lg shadow-2xs">
                                                    ✓ {entity}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsManualFallback(true);
                                        toast.success("Switched to manual keyword search");
                                    }}
                                    className="px-3.5 py-2 bg-white/80 hover:bg-white border border-slate-200 hover:border-[#E07A5F] text-[#E07A5F] rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs hover:shadow-sm self-start md:self-center cursor-pointer"
                                >
                                    <FaSync size={10} /> Keyword Search
                                </button>
                            </div>
                        )}

                        {aiData.fallback && (
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs font-semibold flex items-center gap-2.5 shadow-2xs">
                                <span>ℹ️</span> No natural intent matched. Showing standard keyword matches for "{query}".
                            </div>
                        )}

                        {/* Bundle Recommendations Card */}
                        {aiData.bundleRecommendations?.length > 0 && (
                            <div className="space-y-3 animate-scale-up">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">📦 Recommended Custom Bundle</h3>
                                {aiData.bundleRecommendations.map((bundle, index) => (
                                    <div key={index} className="p-6 rounded-[2rem] bg-white border border-slate-150 shadow-lg shadow-slate-100/40 space-y-4">
                                        <div className="flex justify-between items-start flex-wrap gap-3">
                                            <div>
                                                <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest block bg-emerald-500/10 px-2 py-0.5 rounded-full w-max">Bundle Discount Applied</span>
                                                <h4 className="text-base font-black text-slate-800 tracking-tight mt-1">{bundle.name}</h4>
                                                <p className="text-xs text-slate-500 font-semibold mt-1">Get all components locally in one go and save 10%.</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-emerald-500">₹{bundle.bundlePrice}</div>
                                                <div className="text-[10px] text-slate-400 font-semibold line-through">₹{bundle.originalPrice}</div>
                                                <div className="text-[9px] text-emerald-500 font-black mt-0.5 uppercase tracking-wider">Save ₹{bundle.estimatedSavings}!</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {bundle.products.map((bp, i) => (
                                                <div key={i} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center text-center space-y-1.5 shadow-2xs">
                                                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                                        <img src={bp.imageUrl || "/placeholder-product.png"} alt={bp.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = "/placeholder-product.png" }} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-[10px] font-black text-slate-800 line-clamp-1">{bp.name}</div>
                                                        <div className="text-[9px] text-[#E07A5F] font-bold mt-0.5">₹{bp.price}</div>
                                                    </div>
                                                    <div className="text-[7px] text-slate-400 font-bold uppercase truncate w-full">{bp.shopName}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handleAddBundleToCart(bundle)}
                                            className="w-full py-3 bg-[#E07A5F] hover:bg-[#d0694e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                                        >
                                            Add Whole Bundle to Cart
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Nearby Shops */}
                        {aiData.shops?.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">🏢 Recommended Nearby Shops</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {aiData.shops.map(shop => (
                                        <div key={shop._id} onClick={() => handleItemClick(shop._id, 'shop')}>
                                            <ShopCard
                                                _id={shop._id}
                                                name={shop.name}
                                                category={shop.category}
                                                distance={shop.distance}
                                                rating={shop.rating}
                                                shopImage={shop.shopImage}
                                                isOpen={shop.isOpen}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Ranked Products */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between pl-1">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
                                    {aiData.fallback ? "🛒 Matching Products" : "🛒 Ranked Products by AI Relevance"}
                                </h3>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    Radius: 5km
                                </span>
                            </div>

                            {results.length === 0 ? (
                                <div className="bg-white rounded-2xl p-12 text-center border border-gray-150 dashed">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <FaBoxOpen size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-gray-900">No products matching intent found in your area</h3>
                                    <p className="text-gray-500 text-[11px] mt-1 max-w-sm mx-auto font-medium">
                                        Try widening your radius or using manual keyword search for other term matches.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {results.map(item => (
                                        <div key={item._id} onClick={() => handleItemClick(item._id, 'product')}>
                                            <ProductCard
                                                product={item}
                                                navigate={navigate}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Guidance */}
            <div className="text-center py-10 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                Powered by Aisle AI • Results calibrated on local proximity
            </div>
        </div>
    );
};

export default CustomerSearchResults;
