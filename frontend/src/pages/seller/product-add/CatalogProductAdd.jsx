import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaDatabase, FaSearch, FaCheck, FaShoppingCart } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const CatalogProductAdd = () => {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        fetchCatalog();
    }, []);

    const fetchCatalog = async () => {
        try {
            const { data } = await axios.get('/api/seller/catalog', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const cats = data.categories || [];
            setCategories(cats);
            if (cats.length > 0) {
                setActiveCategoryId('all');
            }
        } catch (error) {
            console.error('Fetch Catalog Error:', error);
        } finally {
            setLoading(false);
        }
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
                    brandName: product.brand,
                    imageUrl: product.image || 'https://via.placeholder.com/150',
                    indicativePrice: product.indicativePrice || 0,
                    packSize: '1 unit', // Default if missing from Excel
                    category: categoryName
                }];
            }
        });
    };

    const searchResults = useMemo(() => {
        if (!searchQuery) return null;
        const results = [];
        categories.forEach(cat => {
            const matches = cat.products.filter(p =>
                p.baseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.brand.toLowerCase().includes(searchQuery.toLowerCase())
            );
            if (matches.length > 0) {
                results.push({
                    categoryName: cat.categoryName,
                    products: matches
                });
            }
        });
        return results;
    }, [categories, searchQuery]);

    const activeCategory = useMemo(() => {
        if (activeCategoryId === 'all') {
            const allProducts = [];
            categories.forEach(cat => {
                cat.products.forEach(p => {
                    allProducts.push({ ...p, categoryName: cat.categoryName });
                });
            });
            return { categoryName: 'All Categories', products: allProducts };
        }
        return categories.find(c => c.categoryId === activeCategoryId);
    }, [categories, activeCategoryId]);

    const handleContinue = () => {
        navigate('/seller/product-add/catalog-review', { state: { selectedItems } });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-400 font-bold animate-pulse text-xs uppercase tracking-widest">Loading Catalog Pipeline...</p>
            </div>
        );
    }

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
                            Excel Data Sources Active
                        </p>
                    </div>
                </div>

                <div className="relative flex-1 max-w-sm">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 size-3" />
                    <input
                        type="text"
                        placeholder="Search across all categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex gap-8 items-start">
                {/* Center: Product Grid */}
                <div className="flex-1 min-w-0">
                    {searchQuery ? (
                        <div className="space-y-10">
                            {searchResults?.length === 0 ? (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <h3 className="text-slate-400 font-black">No matches for "{searchQuery}"</h3>
                                </div>
                            ) : (
                                searchResults?.map((res, idx) => (
                                    <div key={idx} className="animate-fade-in-up">
                                        <div className="flex items-center gap-3 mb-6">
                                            <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">{res.categoryName}</h2>
                                            <div className="h-px flex-1 bg-gradient-to-r from-amber-100 to-transparent"></div>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {res.products.map(p => (
                                                <ProductCard
                                                    key={p.variantId}
                                                    product={p}
                                                    isSelected={selectedItems.some(i => i.variantId === p.variantId)}
                                                    onToggle={() => toggleItem(p, res.categoryName)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{activeCategory?.categoryName}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                            </div>
                            {activeCategory?.products?.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {activeCategory.products.map(p => (
                                        <ProductCard
                                            key={p.variantId}
                                            product={p}
                                            isSelected={selectedItems.some(i => i.variantId === p.variantId)}
                                            onToggle={() => toggleItem(p, p.categoryName || activeCategory.categoryName)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                    <h3 className="text-slate-400 font-black">No products in this category</h3>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right: Category Sidebar */}
                <div className="w-64 shrink-0 sticky top-6 self-start">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-2">
                        <div className="px-4 py-3 border-b border-slate-50 mb-2">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Categories</h3>
                        </div>
                        <ul className="space-y-1">
                            <li
                                onClick={() => {
                                    setActiveCategoryId('all');
                                    setSearchQuery('');
                                }}
                                className={`px-4 py-3 rounded-2xl text-[11px] font-black cursor-pointer transition-all uppercase tracking-wider
                                    ${activeCategoryId === 'all' && !searchQuery ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50'}
                                `}
                            >
                                All Categories
                            </li>
                            {categories.map(cat => (
                                <li
                                    key={cat.categoryId}
                                    onClick={() => {
                                        setActiveCategoryId(cat.categoryId);
                                        setSearchQuery('');
                                    }}
                                    className={`px-4 py-3 rounded-2xl text-[11px] font-black cursor-pointer transition-all uppercase tracking-wider
                                        ${activeCategoryId === cat.categoryId && !searchQuery ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50'}
                                    `}
                                >
                                    {cat.categoryName}
                                </li>
                            ))}
                        </ul>
                    </div>
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
        </div>
    );
};

const ProductCard = ({ product, isSelected, onToggle }) => (
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
            <img
                src={product.image || 'https://via.placeholder.com/150'}
                alt={product.baseName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
            />
        </div>
        <div className="space-y-0.5">
            <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-none">
                {product.brand}
            </p>
            <h4 className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight h-[2.2rem]">
                {product.baseName}
            </h4>
            <div className="flex items-center justify-between pt-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Indicative</p>
                <p className="text-[11px] font-black text-slate-900">₹{product.indicativePrice || '??'}</p>
            </div>
        </div>
    </div>
);

export default CatalogProductAdd;


