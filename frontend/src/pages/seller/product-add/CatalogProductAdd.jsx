import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDatabase, FaSearch, FaCheck, FaShoppingCart, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import debounce from 'lodash/debounce';
import RequestCatalogModal from './RequestCatalogModal';

const DEFAULT_PLACEHOLDER = '/placeholder-product.png';

const CatalogProductAdd = () => {
    const { token, user, checkUserStatus } = useAuth();
    const navigate = useNavigate();
    
    // Custom Category Add States
    const [isAddingCat, setIsAddingCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [submittingCat, setSubmittingCat] = useState(false);
    const [catError, setCatError] = useState('');

    const handleAddCategorySubmit = async () => {
        if (!newCatName || newCatName.trim() === '') {
            setCatError('Category name required');
            return;
        }
        setSubmittingCat(true);
        setCatError('');
        try {
            await axios.post('/api/seller/categories', { name: newCatName.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await checkUserStatus(); // sync profile locally
            setIsAddingCat(false);
            setNewCatName('');
        } catch (err) {
            setCatError(err.response?.data?.message || 'Failed to add category');
        } finally {
            setSubmittingCat(false);
        }
    };
    const [activeCategoryId, setActiveCategoryId] = useState('all');
    const [categoryProducts, setCategoryProducts] = useState([]);
    const [fetchingCategory, setFetchingCategory] = useState(false);
    const [searchInputValue, setSearchInputValue] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);
    const [openFoodResults, setOpenFoodResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    
    // Autocomplete Suggestions
    const [autocompleteSuggestions, setAutocompleteSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Cross-sell Recommendations
    const [recommendedProducts, setRecommendedProducts] = useState([]);
    const [fetchingRecommendations, setFetchingRecommendations] = useState(false);

    // Pagination states
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Resolve active seller shopType case-insensitively
    const shopType = user?.shopDetails?.shopType || user?.shopType || 'GROCERY_KIRANA';

    const categoryKey = useMemo(() => {
        if (!shopType) return 'grocery';
        const type = shopType.toLowerCase();
        if (type.includes('grocery') || type.includes('kirana')) return 'grocery';
        if (type.includes('electrical') || type.includes('hardware') || type.includes('auto') || type.includes('electronics_tools') || type === 'electronics_tools') return 'electrical_hardware_auto';
        if (type.includes('tech') || type.includes('electronic') || type.includes('accessories')) return 'electronics';
        if (type.includes('pharmacy') || type.includes('medical')) return 'pharmacy';
        if (type.includes('student') || type.includes('office') || type.includes('stationery')) return 'stationery';
        if (type.includes('home') || type.includes('lifestyle') || type.includes('life')) return 'lifestyle';
        if (type.includes('seasonal') || type.includes('festive')) return 'festive';
        return 'grocery';
    }, [shopType]);

    const categoriesList = useMemo(() => {
        const config = {
            grocery: [
                'General Provision / Kirana',
                'Fruits & Vegetables',
                'Dairy & Ice Cream',
                'Bakery & Cake Shop',
                'Sweet Shop',
                'Dry Fruits & Spices',
                'Wholesale / Grain Mart',
                'Organic / Gourmet'
            ],
            electrical_hardware_auto: [
                'Electrical Shop',
                'Hardware & Sanitary',
                'Paints & Decor',
                'Automobile Spares',
                'Industrial / Power Tools'
            ],
            electronics: [
                'Mobiles, Audio & Wearables',
                'Computers, Gaming & Office',
                'TV & Home Appliances',
                'Spares & Repair Components'
            ],
            pharmacy: [
                'Allopathic Chemist',
                'Ayurvedic & Herbal',
                'Surgical & Equipment'
            ],
            stationery: [
                'School & Writing Supplies',
                'Office & Desk Accessories',
                'Art & Craft Materials',
                'Books & Paper Products'
            ],
            lifestyle: [
                'Kitchenware & Cookware',
                'Plastics, Cleaning & Storage',
                'Beauty, Cosmetics & Personal Care',
                'Toys, Sports & Gifts',
                'Furnishing & Home Decor',
                'Bags & Luggage',
                'Footwear',
                'Clothing & Garments'
            ],
            festive: [
                'Festival Specific',
                'Crackers & Fireworks',
                'Winter / Rain Gear'
            ]
        };

        const baseList = config[categoryKey] || config.grocery;
        const customCategories = user?.shopDetails?.shopCategories || [];
        return Array.from(new Set([...baseList, ...customCategories]));
    }, [categoryKey, user?.shopDetails?.shopCategories]);

    const extractSize = (name) => {
        const match = name.match(/(\d+\s?(g|kg|ml|l))/i);
        return match ? match[0] : '';
    };

    const fetchProducts = async (queryStr, categoryId, pageNum, append = false) => {
        if (queryStr && queryStr.trim().length >= 2) {
            setSearching(true);
            try {
                const { data } = await axios.get(`/api/catalog/search?q=${encodeURIComponent(queryStr)}&page=${pageNum}&limit=12`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const mappedResults = data.map(item => ({
                    variantId: item._id,
                    barcode: item.barcode,
                    baseName: item.name,
                    brand: item.brand,
                    image: item.imageUrl || DEFAULT_PLACEHOLDER,
                    size: item.size || extractSize(item.name || ''),
                    category: item.category,
                    source: item.source || 'provider',
                    externalId: item.externalId
                }));

                if (append) {
                    setOpenFoodResults(prev => [...prev, ...mappedResults]);
                } else {
                    setOpenFoodResults(mappedResults);
                }

                if (mappedResults.length < 12) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } catch (err) {
                console.error("Catalog search error:", err);
            } finally {
                setSearching(false);
            }
        } else {
            setFetchingCategory(true);
            try {
                const categoryParam = categoryId === 'all' ? 'all' : categoryId;
                const endpoint = categoryParam === 'all'
                    ? `/api/catalog/trending?page=${pageNum}&limit=12`
                    : `/api/catalog/category/${encodeURIComponent(categoryParam)}?page=${pageNum}&limit=12`;

                const { data } = await axios.get(endpoint, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const mappedProducts = data.map(item => ({
                    variantId: item._id,
                    barcode: item.barcode,
                    baseName: item.name,
                    brand: item.brand,
                    image: item.imageUrl || DEFAULT_PLACEHOLDER,
                    size: item.size || extractSize(item.name || ''),
                    category: item.category,
                    source: item.source || 'provider',
                    externalId: item.externalId
                }));
                
                if (append) {
                    setCategoryProducts(prev => [...prev, ...mappedProducts]);
                } else {
                    setCategoryProducts(mappedProducts);
                }

                if (mappedProducts.length < 12) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            } catch (error) {
                console.error("Fetch Category Products Error:", error);
            } finally {
                setFetchingCategory(false);
            }
        }
    };

    // Debounced query search
    const debouncedSearch = useMemo(() => debounce((val, catId) => {
        setPage(1);
        if (val.trim().length >= 2) {
            setOpenFoodResults([]);
            fetchProducts(val, catId, 1, false);
        } else {
            setOpenFoodResults([]);
            setPage(1);
            fetchProducts('', catId, 1, false);
        }
    }, 300), [token]);

    // Fetch instant autocomplete
    const fetchAutocomplete = async (val) => {
        if (!val || val.trim().length < 1) {
            setAutocompleteSuggestions([]);
            return;
        }
        try {
            const { data } = await axios.get(`/api/catalog/autocomplete?q=${encodeURIComponent(val)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAutocompleteSuggestions(data);
            setShowSuggestions(true);
        } catch (err) {
            console.error("Autocomplete error:", err);
        }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchInputValue(val);
        fetchAutocomplete(val);
        debouncedSearch(val, activeCategoryId);
    };

    const selectCategory = (catId) => {
        setActiveCategoryId(catId);
        setSearchInputValue('');
        setPage(1);
        setCategoryProducts([]);
        setOpenFoodResults([]);
        fetchProducts('', catId, 1, false);
    };

    const handleSuggestionClick = (suggestion) => {
        setSearchInputValue(suggestion.name);
        setShowSuggestions(false);
        setPage(1);
        setOpenFoodResults([]);
        fetchProducts(suggestion.name, activeCategoryId, 1, false);
    };

    useEffect(() => {
        if (token) {
            selectCategory('all');
        }
    }, [token, categoryKey]);

    // Close suggestions dropdown on click outside
    useEffect(() => {
        const handleClickOutside = () => setShowSuggestions(false);
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, []);

    // Dynamically fetch recommendations when user selects/unselects items
    useEffect(() => {
        if (selectedItems.length === 0) {
            setRecommendedProducts([]);
            return;
        }

        const fetchRecommendations = async () => {
            setFetchingRecommendations(true);
            try {
                const lastItem = selectedItems[selectedItems.length - 1];
                const { data } = await axios.get(`/api/catalog/recommendations/${lastItem.variantId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const mappedRecs = data.map(item => ({
                    variantId: item._id,
                    barcode: item.barcode,
                    baseName: item.name,
                    brand: item.brand,
                    image: item.imageUrl || DEFAULT_PLACEHOLDER,
                    size: item.size || extractSize(item.name || ''),
                    category: item.category,
                    source: item.source || 'provider',
                    externalId: item.externalId
                }));

                // Exclude items already in selection
                setRecommendedProducts(mappedRecs.filter(r => 
                    !selectedItems.some(i => i.variantId === r.variantId)
                ));
            } catch (err) {
                console.error("Fetch recommendations error:", err);
            } finally {
                setFetchingRecommendations(false);
            }
        };

        const timeoutId = setTimeout(fetchRecommendations, 300);
        return () => clearTimeout(timeoutId);

    }, [selectedItems, token]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProducts(searchInputValue, activeCategoryId, nextPage, true);
    };

    const toggleItem = (product, categoryName) => {
        setSelectedItems(prev => {
            const exists = prev.find(item => item.variantId === product.variantId);
            if (exists) {
                return prev.filter(item => item.variantId !== product.variantId);
            } else {
                return [...prev, {
                    variantId: product.variantId,
                    variantLabel: product.baseName,
                    brandName: product.brand || 'General',
                    imageUrl: product.image || DEFAULT_PLACEHOLDER,
                    indicativePrice: 50, // Fallback for the customization table default
                    packSize: product.size || '1 unit',
                    category: categoryName || 'general',
                    barcode: product.barcode || product.variantId,
                    source: product.source || 'provider',
                    externalId: product.externalId || product.variantId
                }];
            }
        });
    };

    const handleContinue = () => {
        navigate('/seller/product-add/catalog-review', { state: { selectedItems } });
    };

    return (
        <div className="max-w-7xl mx-auto pb-24 px-4 animate-fade-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pt-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/seller/products')} className="p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-slate-800 transition-all hover:scale-105">
                        <FaArrowLeft size={14} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Match Catalog</h1>
                        <p className="text-slate-500 text-[10px] font-bold flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            Universal Engine active ({categoryKey})
                        </p>
                    </div>
                </div>

                <div className="relative flex-1 max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-3" />
                    <input
                        type="text"
                        placeholder="Search across all categories..."
                        value={searchInputValue}
                        onChange={handleSearchChange}
                        onFocus={() => { if (autocompleteSuggestions.length > 0) setShowSuggestions(true); }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-400"
                    />

                    {/* Autocomplete Popup Dropdown */}
                    {showSuggestions && autocompleteSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in-up">
                            {autocompleteSuggestions.map(s => (
                                <div
                                    key={s._id}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer transition-colors"
                                >
                                    <div className="w-7 h-7 bg-slate-50 border border-slate-50 rounded-lg overflow-hidden shrink-0">
                                        <img src={s.imageUrl || DEFAULT_PLACEHOLDER} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[11px] font-black text-slate-800 truncate">{s.name}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider leading-none mt-0.5">{s.brand || 'General'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-8 items-start">
                {/* Center: Product Grid */}
                <div className="flex-1 min-w-0">
                    {searchInputValue.trim().length >= 2 ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{categoryKey === 'grocery' ? 'OpenFoodFacts' : 'Provider'} Matches</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-amber-100 to-transparent"></div>
                            </div>
                            
                            {searching && page === 1 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                                    {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : openFoodResults.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center gap-4">
                                    <h3 className="text-slate-400 font-black">No matches for "{searchInputValue}"</h3>
                                    <div className="h-px w-20 bg-slate-200"></div>
                                    <p className="text-xs text-slate-500 font-bold max-w-sm">Can't find your product in the master catalog? Submit a custom request to add it!</p>
                                    <button
                                        onClick={() => setIsRequestModalOpen(true)}
                                        className="bg-slate-900 text-white hover:bg-amber-500 hover:text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 shadow-md border-0"
                                    >
                                        Request Catalog Addition
                                    </button>
                                </div>
                            ) : (
                                <div className="animate-fade-in-up space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {openFoodResults.map(p => (
                                            <ProductCard
                                                key={p.barcode || p.variantId}
                                                product={p}
                                                isSelected={selectedItems.some(i => i.variantId === p.variantId)}
                                                onToggle={() => toggleItem(p, p.category)}
                                            />
                                        ))}
                                    </div>
                                    {searching && page > 1 && (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                                            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    )}
                                    {hasMore && !searching && (
                                        <div className="text-center pt-4">
                                            <button
                                                onClick={handleLoadMore}
                                                className="bg-white border border-slate-200 text-slate-800 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:border-slate-400 active:scale-95 shadow-sm"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center gap-3">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeCategoryId === 'all' ? 'Popular / Trending Products' : activeCategoryId}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                            </div>
                            
                            {fetchingCategory && page === 1 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                                    {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                                </div>
                            ) : categoryProducts.length > 0 ? (
                                <div className="animate-fade-in-up space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                        {categoryProducts.map(p => (
                                            <ProductCard
                                                key={p.barcode || p.variantId}
                                                product={p}
                                                isSelected={selectedItems.some(i => i.variantId === p.variantId)}
                                                onToggle={() => toggleItem(p, p.category)}
                                            />
                                        ))}
                                    </div>
                                    {fetchingCategory && page > 1 && (
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
                                            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
                                        </div>
                                    )}
                                    {hasMore && !fetchingCategory && (
                                        <div className="text-center pt-4">
                                            <button
                                                onClick={handleLoadMore}
                                                className="bg-white border border-slate-200 text-slate-800 px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all hover:border-slate-400 active:scale-95 shadow-sm"
                                            >
                                                Load More
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <h3 className="text-slate-400 font-black">No products in this category</h3>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Category Sidebar & Seller Recommendations Drawer */}
                <div className="w-64 shrink-0 sticky top-6 self-start">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-2">
                        <div className="px-4 py-3 border-b border-slate-50 mb-2">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categories</h3>
                        </div>
                        <ul className="space-y-1">
                            <li
                                onClick={() => selectCategory('all')}
                                className={`px-4 py-3 rounded-2xl text-[11px] font-black cursor-pointer transition-all uppercase tracking-wider
                                    ${activeCategoryId === 'all' && !searchInputValue ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50'}
                                `}
                            >
                                All Categories
                            </li>
                            {categoriesList.map(cat => (
                                <li
                                    key={cat}
                                    onClick={() => selectCategory(cat)}
                                    className={`px-4 py-3 rounded-2xl text-[11px] font-black cursor-pointer transition-all uppercase tracking-wider
                                        ${activeCategoryId === cat && !searchInputValue ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50'}
                                    `}
                                >
                                    {cat}
                                </li>
                            ))}
                        </ul>

                        {/* Add Custom Category Form (Only for Seasonal & Festive) */}
                        {categoryKey === 'festive' && (
                            <div className="mt-4 p-3 border-t border-slate-100">
                                {isAddingCat ? (
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            placeholder="Category name..."
                                            value={newCatName}
                                            onChange={(e) => setNewCatName(e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:border-amber-500 outline-none transition-all"
                                        />
                                        {catError && <p className="text-[10px] text-red-500 font-bold">{catError}</p>}
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddCategorySubmit}
                                                disabled={submittingCat}
                                                className="flex-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider py-2 rounded-lg hover:bg-amber-600 transition-colors"
                                            >
                                                {submittingCat ? 'Adding...' : 'Add'}
                                            </button>
                                            <button
                                                onClick={() => { setIsAddingCat(false); setNewCatName(''); setCatError(''); }}
                                                className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-wider rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingCat(true)}
                                        className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest py-2 rounded-xl border border-dashed border-slate-200 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        + Add Category
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recommendations Panel */}
                    {selectedItems.length > 0 && (
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 mt-6 animate-fade-in space-y-4">
                            <div className="border-b border-slate-50 pb-2">
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Recommended Items</h3>
                                <p className="text-[7.5px] font-bold text-slate-400 mt-0.5 uppercase tracking-wide">Based on your selection</p>
                            </div>
                            {fetchingRecommendations ? (
                                <div className="flex justify-center py-4">
                                    <FaSpinner className="animate-spin text-amber-500" size={14} />
                                </div>
                            ) : recommendedProducts.length === 0 ? (
                                <p className="text-[9px] font-bold text-slate-400 text-center py-2">No related recommendations</p>
                            ) : (
                                <div className="space-y-3">
                                    {recommendedProducts.map(rec => (
                                        <div 
                                            key={rec.barcode || rec.variantId} 
                                            onClick={() => toggleItem(rec, rec.category)}
                                            className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100 group"
                                        >
                                            <div className="w-8 h-8 bg-slate-50 border border-slate-50 rounded-xl overflow-hidden shrink-0">
                                                <img src={rec.image} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[9px] font-black text-slate-700 truncate group-hover:text-amber-500 transition-colors">{rec.baseName}</h4>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{rec.brand || 'General'}</p>
                                            </div>
                                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[10px] font-black group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                                                +
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Action Bar */}
            {selectedItems.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md z-50 px-4">
                    <div className="bg-slate-900 text-white p-3.5 rounded-[1.5rem] shadow-2xl flex items-center justify-between animate-fade-in-up border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3 pl-2">
                            <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-slate-900 shadow-md">
                                <FaShoppingCart size={14} />
                            </div>
                            <div>
                                <h4 className="font-black text-sm leading-none">{selectedItems.length} Products</h4>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Selection Saved</p>
                            </div>
                        </div>
                        <button
                            onClick={handleContinue}
                            className="bg-white hover:bg-amber-500 hover:text-white text-slate-900 px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                        >
                            Review & Add
                        </button>
                    </div>
                </div>
            )}
            {isRequestModalOpen && (
                <RequestCatalogModal
                    isOpen={isRequestModalOpen}
                    onClose={() => setIsRequestModalOpen(false)}
                    initialName={searchInputValue}
                />
            )}
        </div>
    );
};

const ProductCard = ({ product, isSelected, onToggle }) => {
    const hasNoImage = !product.image || 
                       product.image === DEFAULT_PLACEHOLDER || 
                       product.image.includes('photo-1542838132-92c53300491e');
    return (
        <div
            onClick={onToggle}
            className={`group relative bg-white rounded-2xl p-3 border transition-all cursor-pointer select-none
                ${isSelected ? 'border-amber-500 ring-4 ring-amber-500/5 shadow-lg scale-[1.02]' : 'border-slate-50 hover:border-slate-200 hover:shadow-md'}
            `}
        >
            <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10
                ${isSelected ? 'bg-amber-500 text-white scale-110' : 'bg-slate-50 text-transparent group-hover:bg-slate-100'}
            `}>
                <FaCheck size={9} />
            </div>
            <div className="aspect-square bg-slate-50 rounded-xl mb-3 overflow-hidden flex items-center justify-center border border-slate-50/50">
                {hasNoImage ? (
                    <div className="w-full h-full p-3.5 flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/5 to-slate-100/50 text-slate-800 border border-slate-100 rounded-xl text-center group-hover:scale-105 transition-transform duration-500">
                        <span className="text-[7.5px] font-black uppercase tracking-[0.15em] text-amber-500 mb-1 leading-none">{product.brand || 'Product'}</span>
                        <h5 className="text-[10px] font-black text-slate-700 line-clamp-3 leading-snug px-1">{product.baseName}</h5>
                    </div>
                ) : (
                    <img
                        src={product.image}
                        alt={product.baseName}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = DEFAULT_PLACEHOLDER; 
                        }}
                    />
                )}
            </div>
            <div className="space-y-0.5">
                <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none">
                    {product.brand}
                </p>
                <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight h-[2.2rem]">
                    {product.baseName}
                </h4>
                {product.size && (
                    <div className="pt-1.5 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                            {product.size}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const SkeletonCard = () => (
    <div className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm space-y-3 animate-pulse">
        <div className="aspect-square bg-slate-100 rounded-xl w-full"></div>
        <div className="space-y-2">
            <div className="h-2 bg-slate-100 rounded-md w-1/3"></div>
            <div className="h-3.5 bg-slate-100 rounded-md w-3/4"></div>
            <div className="h-3.5 bg-slate-100 rounded-md w-full"></div>
            <div className="pt-1.5">
                <div className="h-4 bg-slate-100 rounded-md w-1/3"></div>
            </div>
        </div>
    </div>
);

export default CatalogProductAdd;
