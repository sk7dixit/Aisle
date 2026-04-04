import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProductInspector from '../../components/admin/ProductInspector';

/* 
  STEP 14 - PRODUCTS WIREFRAME EXECUTION
  Strict layout adherence.
  Marketplace Integrity Context.
*/

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('Active'); // Active | Disabled | Flagged
    const [searchTerm, setSearchTerm] = useState('');

    // Selection & Actions
    const [selectedProductId, setSelectedProductId] = useState(null); // For Drawer


    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            // Fetch all for enforcement view
            const res = await fetch('/api/admin/products', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                const mapped = data.map(p => ({
                    id: p._id,
                    displayId: p._id.substring(p._id.length - 6).toUpperCase(),
                    name: p.name,
                    category: p.category,
                    sellerName: p.seller?.name || 'Unknown',
                    sellerId: p.seller?._id ? `SEL-${p.seller._id.substring(0, 5).toUpperCase()}` : 'N/A',
                    status: p.adminStatus || 'Active',
                    reportsCount: 0, // Mock
                    lastReport: '2 days ago', // Mock
                    image: p.imageUrl,
                    fullData: p
                }));
                setProducts(mapped);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Filter Logic
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.id.includes(searchTerm);

        if (filter === 'All') return matchesSearch;
        return matchesSearch && p.status === filter;
    });

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading Product Registry...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto space-y-8 bg-[#F2F2F2]">

            {/* 2️⃣ PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Products</h1>
                <p className="text-sm text-gray-500 mt-1">Monitor and enforce product compliance on ShopLens</p>
            </div>

            {/* 3️⃣ PRIMARY ACTION ZONE */}
            <div className="bg-white border border-[#CBCBCB] rounded-xl overflow-hidden shadow-sm">

                {/* 4️⃣ FILTER & SEARCH */}
                <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        {['Active', 'Disabled', 'Flagged'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filter === f
                                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Product / Seller / ID"
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-gray-400 text-gray-700"
                    />
                </div>

                {/* 5️⃣ TABLE STRUCTURE */}
                <div className="overflow-x-auto">
                    {filteredProducts.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-[#CBCBCB]">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/3">Product Identity</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/5">Seller</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/6">Status</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/6">Risk Context</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedProductId(product.id)}
                                    >
                                        {/* COL 1: Product Identity */}
                                        <td className="p-6 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">Category: {product.category}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: PRD-{product.displayId}</div>
                                        </td>

                                        {/* COL 2: Seller */}
                                        <td className="p-6 align-top">
                                            <div className="text-sm text-gray-900 font-medium">{product.sellerName}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: {product.sellerId}</div>
                                        </td>

                                        {/* COL 3: Status */}
                                        <td className="p-6 align-top">
                                            {product.status === 'Disabled' ? (
                                                <span className="text-xs font-bold text-[#4D1717] bg-[#4D1717]/5 px-2 py-1 rounded">Disabled</span>
                                            ) : product.status === 'Flagged' ? (
                                                <span className="text-xs font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded">Flagged</span>
                                            ) : (
                                                <span className="text-sm text-gray-900">{product.status}</span>
                                            )}
                                        </td>

                                        {/* COL 4: Risk Context */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Reports: <span className="text-gray-900 font-medium">{product.reportsCount}</span></p>
                                                <p>Last report: <span className="text-gray-900 font-medium">{product.lastReport}</span></p>
                                            </div>
                                        </td>

                                        {/* COL 5: Actions */}
                                        <td className="p-6 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end gap-3 items-center">
                                                <button
                                                    onClick={() => navigate(`/admin/products/${product.id}/activity`)}
                                                    className="text-xs text-gray-400 hover:text-gray-900 hover:underline px-2 transition-colors"
                                                >
                                                    View Activity
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 9️⃣ EMPTY STATE */
                        <div className="py-24 text-center">
                            <h3 className="text-gray-900 font-bold mb-1">No products available.</h3>
                            <p className="text-sm text-gray-500">Signals system issue, not success.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 6️⃣ INSPECTOR DRAWER */}
            {selectedProductId && Boolean(products.find(p => p.id === selectedProductId)) && (
                <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 animate-slide-left">
                        <ProductInspector
                            product={products.find(p => p.id === selectedProductId).fullData}
                            onClose={() => setSelectedProductId(null)}
                            readOnly={true}
                        />
                    </div>
                </div>
            )}


        </div>
    );
};

export default Products;
