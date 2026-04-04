import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaMapMarkerAlt, FaArrowLeft, FaShoppingBasket, FaTag, FaClock, FaStoreSlash, FaHeart, FaRegHeart } from 'react-icons/fa';
import { getGenericImage } from '../../utils/GenericImages';
import { useSaved } from '../../context/SavedContext';

// Mock Product Generator
const getMockProductsForCategory = (category, shopName) => {
    // STRICT DATA MAP: Must match IDs in customerCategories.js
    const products = {
        'dairy': [ // Lowercase ID
            { name: 'Amul Gold Milk (500ml)', price: 32, status: 'Available' },
            { name: 'Amul Taaza (500ml)', price: 26, status: 'Limited' },
            { name: 'Paneer (200g)', price: 95, status: 'Available' },
            { name: 'Curd (400g)', price: 35, status: 'Sold Out' },
        ],
        'grocery': [ // Lowercase ID
            { name: 'Aashirvaad Atta (5kg)', price: 240, status: 'Available' },
            { name: 'Basmati Rice (1kg)', price: 110, status: 'Available' },
            { name: 'Toor Dal (1kg)', price: 145, status: 'Limited' },
            { name: 'Sugar (1kg)', price: 42, status: 'Available' },
        ],
        'mobile': [
            { name: 'USB-C Cable', price: 150, status: 'Available' },
            { name: 'Screen Guard', price: 200, status: 'Available' },
            { name: 'Phone Case', price: 350, status: 'Limited' },
        ],
        'medicine': [
            { name: 'Paracetamol', price: 30, status: 'Available' },
            { name: 'Bandages', price: 50, status: 'Available' },
            { name: 'Vitamin C', price: 120, status: 'Available' },
        ],
        'daily': [
            { name: 'Dettol Soap', price: 45, status: 'Available' },
            { name: 'Surf Excel', price: 85, status: 'Available' },
            { name: 'Colgate', price: 60, status: 'Limited' },
        ],
        // Default
        'default': [
            { name: 'Generic Item 1', price: 100, status: 'Available' },
            { name: 'Generic Item 2', price: 200, status: 'Limited' },
        ]
    };

    const list = products[category] || products['default'];
    return list.slice(0, Math.floor(Math.random() * 2) + 1).map(p => ({
        ...p,
        shopName,
        id: Math.random().toString(36).substr(2, 9)
    }));
};

const CustomerCategoryResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toggleSave, isSaved } = useSaved();
    const [aggregatedProducts, setAggregatedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchShopsAndAggregate();
    }, [id]);

    const fetchShopsAndAggregate = async () => {
        setLoading(true);
        try {
            const { data: shops } = await axios.get(`/api/customer/nearby-shops`, {
                params: {
                    category: id,
                    lat: 28.6139,
                    lng: 77.2090,
                    radius: 5
                }
            });

            const allProducts = shops.flatMap(shop => {
                const mockItems = getMockProductsForCategory(id, shop.name);
                return mockItems.map(item => ({
                    ...item,
                    shopId: shop._id,
                    shopDistance: shop.distance,
                    shopAddress: shop.address,
                    isOpen: shop.isOpen,
                    productId: item.id // Ensure we have a consistent ID
                }));
            });

            // Sort logic: Available > Limited > Closed > Sold Out
            allProducts.sort((a, b) => {
                if (a.isOpen && !b.isOpen) return -1;
                if (!a.isOpen && b.isOpen) return 1;
                if (a.status === 'Available' && b.status !== 'Available') return -1;
                return parseFloat(a.shopDistance || 0) - parseFloat(b.shopDistance || 0);
            });

            setAggregatedProducts(allProducts);

        } catch (error) {
            console.error("Failed to fetch category data", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusUI = (product) => {
        if (!product.isOpen) {
            return { color: 'text-slate-500 bg-slate-100 border-slate-200', text: 'Shop Closed', icon: <FaClock /> };
        }
        switch (product.status) {
            case 'Available': return { color: 'text-emerald-700 bg-emerald-50 border-emerald-100', text: 'Available', icon: <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> };
            case 'Limited': return { color: 'text-amber-700 bg-amber-50 border-amber-100', text: 'Limited Stock', icon: <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> };
            case 'Sold Out': return { color: 'text-slate-400 bg-slate-50 border-slate-100', text: 'Sold Out', icon: <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div> };
            default: return { color: 'text-blue-700 bg-blue-50 border-blue-100', text: product.status, icon: null };
        }
    };

    // Filter Logic
    const filteredProducts = aggregatedProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const [showToast, setShowToast] = useState(false);

    const handleSave = (e, product) => {
        e.stopPropagation();
        toggleSave({
            productId: product.productId,
            shopId: product.shopId,
            shopName: product.shopName,
            productName: product.name,
            price: product.price,
            category: id
        });

        // Show toast if not already saved (i.e., we just saved it)
        const currentlySaved = isSaved(product.shopId, product.productId);
        if (!currentlySaved) {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2000);
        }
    };

    // Edge Case Checks
    const allSoldOut = filteredProducts.length > 0 && filteredProducts.every(p => p.status === 'Sold Out');
    const noProducts = !loading && filteredProducts.length === 0;

    return (
        <div className="pb-24 min-h-screen bg-slate-50 motion-page-enter">
            {/* Header */}
            <div className="bg-white sticky top-0 z-20 shadow-sm border-b border-slate-100">
                <div className="px-4 py-3 pb-0 flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 mb-3">
                        <FaArrowLeft />
                    </button>
                    <div className="mb-3">
                        <h1 className="text-lg font-black text-slate-900 capitalize">{id}</h1>
                        <p className="text-xs font-bold text-slate-500">
                            {loading ? 'Finding items...' : `${filteredProducts.length} items near you`}
                        </p>
                    </div>
                </div>
                {/* Category-Scoped Search */}
                <div className="px-4 pb-3">
                    <input
                        type="text"
                        placeholder={`Search in ${id}...`}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 space-y-4 max-w-lg mx-auto md:max-w-4xl">

                {/* CASE C: Categories exist but No Products */}
                {noProducts && (
                    <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                            <FaShoppingBasket size={32} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-2">No {id} products found</h3>
                        <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
                            Try a different keyword or browse local shops directly.
                        </p>
                        <button
                            onClick={() => navigate('/shops')}
                            className="bg-white border border-slate-200 text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 motion-button"
                        >
                            <FaStore className="inline mr-2 mb-0.5" /> View Shops
                        </button>
                    </div>
                )}

                {/* CASE D: Products exist but ALL Sold Out */}
                {allSoldOut && !loading && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center mb-6">
                        <div className="text-amber-500 text-3xl mb-3 flex justify-center"><FaStoreSlash /></div>
                        <h3 className="font-bold text-amber-900 mb-1">Products currently unavailable</h3>
                        <p className="text-xs text-amber-700 font-medium mb-4">
                            Local shops usually stock these, but they seem to be out of stock right now.
                        </p>
                        <button
                            onClick={() => navigate('/shops')}
                            className="text-xs font-bold text-amber-800 bg-white border border-amber-200 px-4 py-2 rounded-lg hover:bg-amber-50 motion-button"
                        >
                            View Shops
                        </button>
                    </div>
                )}

                {/* Product List */}
                {!loading && filteredProducts.length > 0 && !noProducts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredProducts.map((product, index) => {
                            const ui = getStatusUI(product);
                            const saved = isSaved(product.shopId, product.productId);

                            return (
                                <div
                                    key={product.id}
                                    className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden group motion-card ${!product.isOpen ? 'opacity-75 grayscale-[0.5]' : ''}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                                            <FaShoppingBasket size={24} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 truncate">{product.name}</h3>
                                                <span className="font-black text-slate-900">₹{product.price}</span>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="mb-3">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 transition-colors duration-200 ${ui.color}`}>
                                                    {ui.icon} {ui.text}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between mt-auto gap-2">
                                                <div className="text-xs text-slate-500 truncate flex-1">
                                                    <div className="flex items-center gap-1 font-bold text-slate-700">
                                                        <FaStore className="text-slate-400" /> {product.shopName}
                                                        {product.planId === 'pro' && <span className="text-slate-400 font-bold"> · Verified</span>}
                                                    </div>
                                                    <span className="flex items-center gap-1 mt-0.5">
                                                        <FaMapMarkerAlt size={10} /> {product.shopDistance} km
                                                    </span>
                                                </div>

                                                {/* ACTIONS: Save & View Shop */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => handleSave(e, product)}
                                                        className={`w-9 h-9 rounded-lg flex items-center justify-center border motion-button ${saved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                                                        title="Save for later"
                                                    >
                                                        {saved ? <FaHeart className="animate-pulse" /> : <FaRegHeart />}
                                                    </button>

                                                    <button
                                                        onClick={() => navigate(`/shops/${product.shopId}`)}
                                                        className="px-4 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-black transition-colors whitespace-nowrap shadow-md shadow-slate-900/10 motion-button"
                                                    >
                                                        View Shop
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="text-center py-20 text-slate-400 text-sm font-bold animate-pulse">
                        Finding {id} products nearby...
                    </div>
                )}
            </div>

            {/* SAVE TOAST */}
            {showToast && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3 z-50 motion-toast">
                    <FaHeart className="text-red-500" />
                    <span className="text-sm font-bold">Saved for later</span>
                </div>
            )}
        </div>
    );
};

export default CustomerCategoryResults;
