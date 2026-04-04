import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaMapMarkerAlt, FaCheckCircle, FaSearch } from 'react-icons/fa';
import MarketContextStrip from '../../components/customer/market/MarketContextStrip';
import DiscoveryEntryBlocks from '../../components/customer/market/DiscoveryEntryBlocks';
import { useSidebarState } from '../../context/SidebarStateContext';
import ConfidenceSignal from '../../components/customer/common/ConfidenceSignal';
import ShopCard from '../../components/customer/ShopCard';
import { ProductCard } from './CategoryProducts';

const CustomerSearchResults = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get('q');
    const { updateSignals, signalBrowsing, signalSearch } = useSidebarState();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentCity] = useState(localStorage.getItem('userCity') || "Vadodara");

    // 1. Signal Market Page to Hide Sidebar
    useEffect(() => {
        updateSignals({ pageType: 'market' });
    }, []);

    // 2. Handle Search
    useEffect(() => {
        if (query) {
            handleSearch(query);
            signalSearch(query);
        } else {
            setResults([]); // Reset if no query
        }
    }, [query]);

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
            const { data } = await axios.get(`/api/customer/search`, {
                params: { q: searchTerm, lat: 28.6139, lng: 77.2090 } // Mock Delhi
            });
            setResults(data);
        } catch (error) {
            console.error("Search failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDiscoverySignal = (type) => {
        // Map block clicks to searches or filters
        if (type === 'closest') navigate('/search?q=nearby&sort=distance');
        if (type === 'essentials') navigate('/search?q=grocery');
        if (type === 'pharmacy') navigate('/search?q=pharmacy');
        if (type === 'open_now') navigate('/search?q=open');
        signalBrowsing(type);
    };

    const formatDistance = (meters) => {
        if (!meters || meters > 99999) return 'Unknown';
        if (meters < 1000) return `${meters}m`;
        return `${(meters / 1000).toFixed(1)}km`;
    };

    return (
        <div className="pb-24 min-h-screen bg-gray-50 flex flex-col">
            {/* 1. Context Strip (Sticky) */}
            <MarketContextStrip />

            {/* 2. Content Area */}
            <div className="flex-1 max-w-5xl mx-auto w-full">

                {/* Case A: No Query -> Discovery Blocks (Market Entry) */}
                {!query && (
                    <div className="animate-fade-in-up">
                        <div className="px-4 pt-6 pb-2">
                            <h2 className="text-xl font-bold text-gray-900">Explore Nearby</h2>
                            <p className="text-gray-500 text-sm">What do you need right now?</p>
                        </div>
                        <DiscoveryEntryBlocks onSignal={handleDiscoverySignal} />

                        {/* Search Input Hero for No Query State */}
                        <div className="px-4 mt-2 mb-8">
                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-text hover:border-blue-300 transition-colors" onClick={() => document.getElementById('hero-search')?.focus()}>
                                <FaSearch className="text-gray-400" />
                                <input
                                    id="hero-search"
                                    type="text"
                                    placeholder="Search for 'Milk', 'Crocin', or 'Stationery'..."
                                    className="flex-1 bg-transparent outline-none font-medium text-gray-900 placeholder-gray-400"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') navigate(`/market/search?q=${e.target.value}`);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Case B: Loading */}
                {loading && (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400 font-medium animate-pulse">Scanning local shops...</p>
                    </div>
                )}

                {/* Case C: Results */}
                {query && !loading && (
                    <div className="p-4 space-y-4 animate-fade-in-up">
                        {/* Results Header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                {results.length} results found in {currentCity || "nearby"}
                            </p>
                        </div>

                        {results.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 dashed">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                    <FaSearch />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">No matches found</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                                    Try searching for a broader term or different shop type.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
                                {results.map(item => {
                                    if (item.type === 'shop') {
                                        return (
                                            <ShopCard
                                                key={item._id}
                                                {...item}
                                                image={item.shopImage}
                                            />
                                        );
                                    } else {
                                        return (
                                            <ProductCard
                                                key={item._id}
                                                product={item}
                                                navigate={navigate}
                                            />
                                        );
                                    }
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Guidance */}
            <div className="text-center py-8 text-xs text-gray-400">
                Results are based on real-time shop updates and your location.
            </div>
        </div>
    );
};

export default CustomerSearchResults;
