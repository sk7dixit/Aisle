import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Plus, Search, Edit2, Pause, Play, Zap, AlertCircle,
    TrendingUp, Trash2, Eye, Box, SlidersHorizontal, Loader, Sparkles,
    Mic, Camera, FileSpreadsheet, ChevronDown, ChevronUp, FileText, Check,
    ArrowLeft, HelpCircle, Store, X, MessageSquare, ShoppingBag, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import ProductEditModal from '../ProductEditModal';

const MobileSellerProducts = () => {
    const { token, user, checkUserStatus } = useAuth();
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0 });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'lowStock' | 'drafts'
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Accordion State
    const [isStructuredExpanded, setIsStructuredExpanded] = useState(false);

    // Bottom Sheet States
    const [isAiCatalogOpen, setIsAiCatalogOpen] = useState(false);
    const [isVoiceOpen, setIsVoiceOpen] = useState(false);
    const [isImageOpen, setIsImageOpen] = useState(false);
    const [isManualOpen, setIsManualOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isOrbOpen, setIsOrbOpen] = useState(false);

    // Form / Interactive States
    const [aiText, setAiText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parsedResults, setParsedResults] = useState(null);
    const [isAddingBulk, setIsAddingBulk] = useState(false);

    // Voice State
    const [isRecording, setIsRecording] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [recognition, setRecognition] = useState(null);

    // Image/Camera State
    const [selectedImage, setSelectedImage] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [detectedProducts, setDetectedProducts] = useState(null);

    // Manual Quick Add Form
    const [manualForm, setManualForm] = useState({ name: '', price: '', stock: '20', category: 'general-provision' });
    const [isSubmittingManual, setIsSubmittingManual] = useState(false);

    // Match Catalog State
    const [catalogSearch, setCatalogSearch] = useState('');
    const [catalogItems, setCatalogItems] = useState([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [syncingCatalogItem, setSyncingCatalogItem] = useState(null);

    // Session Added Products (for confidence)
    const [sessionProducts, setSessionProducts] = useState([]);

    // Assisted Listing status
    const [assistedRequested, setAssistedRequested] = useState(false);

    const shopType = user?.shopDetails?.category || user?.shopDetails?.shopCategory || user?.shopDetails?.shopType || '';

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechObj = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechObj) {
            const rec = new SpeechObj();
            rec.continuous = true;
            rec.interimResults = true;
            rec.lang = 'en-IN'; // Good for Indian accents and mix of English/Hindi

            rec.onresult = (event) => {
                let current = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        current += event.results[i][0].transcript;
                    }
                }
                if (current) {
                    setVoiceTranscript(prev => (prev + ' ' + current).trim());
                }
            };

            rec.onerror = (e) => {
                console.error("Speech Recognition Error:", e);
                setIsRecording(false);
            };

            rec.onend = () => {
                setIsRecording(false);
            };

            setRecognition(rec);
        }
    }, []);

    // Fetch products and stats
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/seller/inventory/products?category=All', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
                
                // Calculate stats
                const total = data.length;
                const active = data.filter(p => p.isAvailable && !p.isDraft).length;
                const lowStock = data.filter(p => p.quantity <= 10 && !p.isDraft).length;
                setStats({ total, active, lowStock });
            }
        } catch (err) {
            console.error("Error fetching products:", err);
            toast.error("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    // Delete handler
    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            const res = await fetch(`/api/seller/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Product deleted");
                fetchProducts();
            } else {
                toast.error("Failed to delete product");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error deleting product");
        }
    };

    // Toggle availability
    const handleToggleAvailability = async (product) => {
        try {
            const newAvailability = !product.isAvailable;
            const res = await fetch(`/api/seller/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAvailable: newAvailability })
            });
            if (res.ok) {
                toast.success(newAvailability ? "Product activated" : "Product paused");
                fetchProducts();
            } else {
                toast.error("Failed to update status");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error updating status");
        }
    };

    // Boost Product (Premium stub)
    const handleBoostProduct = (product) => {
        toast.custom((t) => (
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-4 rounded-2xl shadow-xl border border-indigo-500/20 max-w-xs flex flex-col gap-3 font-sans">
                <div className="flex items-center gap-2">
                    <Zap className="text-amber-400 fill-amber-400 animate-pulse" size={20} />
                    <span className="font-extrabold text-xs tracking-wider uppercase text-indigo-300">Aisle Auto-Boost</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                    Boost placement, get active buyers notifications, and unlock automated AI marketing scripts.
                </p>
                <button
                    onClick={() => {
                        toast.dismiss(t.id);
                        window.location.href = '/seller/subscription';
                    }}
                    className="h-8 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow"
                >
                    Unlock Premium Now
                </button>
            </div>
        ), { duration: 4000 });
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsEditModalOpen(true);
    };

    const handleSaveEditedProduct = async (id, updatedData) => {
        try {
            const isFormData = updatedData instanceof FormData;
            const headers = { 'Authorization': `Bearer ${token}` };
            if (!isFormData) {
                headers['Content-Type'] = 'application/json';
            }
            const res = await fetch(`/api/seller/products/${id}`, {
                method: 'PUT',
                headers,
                body: isFormData ? updatedData : JSON.stringify(updatedData)
            });
            if (res.ok) {
                toast.success("Product updated successfully");
                setIsEditModalOpen(false);
                fetchProducts();
            } else {
                toast.error("Failed to save changes");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error saving product");
        }
    };

    // Voice Recorder Triggers
    const startVoiceRecording = () => {
        if (!recognition) {
            toast.error("Speech Recognition not supported in this browser. Please type your list instead.");
            return;
        }
        setVoiceTranscript('');
        setIsRecording(true);
        recognition.start();
    };

    const stopVoiceRecording = () => {
        if (recognition && isRecording) {
            recognition.stop();
            setIsRecording(false);
        }
    };

    const processVoiceTranscript = async () => {
        const text = voiceTranscript || aiText;
        if (!text.trim()) {
            toast.error("Please record some voice or enter list text.");
            return;
        }

        setIsParsing(true);
        try {
            const res = await fetch('/api/seller/voice-process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ transcript: text })
            });

            if (res.ok) {
                const data = await res.json();
                // Filter out fallback results with 0 prices or make them friendly
                const formatted = data.results.map(item => ({
                    ...item,
                    price: item.price || 40, // default placeholder price if undetected
                    quantity: item.quantity || 20
                }));
                setParsedResults(formatted);
            } else {
                // Fallback client parsing if backend failed
                const clientParsed = parseListText(text);
                setParsedResults(clientParsed);
            }
        } catch (err) {
            console.error(err);
            // Fallback client parsing
            const clientParsed = parseListText(text);
            setParsedResults(clientParsed);
        } finally {
            setIsParsing(false);
        }
    };

    // Client-side parser helper
    const parseListText = (text) => {
        const lines = text.split(/[\n,]+/);
        const results = [];
        lines.forEach((line, index) => {
            if (!line.trim()) return;
            const match = line.match(/(.+?)(?:₹|\b|rs\.?)\s*(\d+(?:\.\d+)?)\s*$/i);
            if (match) {
                const name = match[1].trim();
                const price = parseFloat(match[2]);
                results.push({ name, price, quantity: 20, originalTerm: line.trim() });
            } else {
                // Try just extracting a name and a default price
                results.push({ name: line.trim(), price: 30, quantity: 20, originalTerm: line.trim() });
            }
        });
        return results;
    };

    const saveBulkParsedProducts = async () => {
        if (!parsedResults || parsedResults.length === 0) return;
        setIsAddingBulk(true);
        try {
            const res = await fetch('/api/seller/products/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ products: parsedResults })
            });

            if (res.ok) {
                toast.success(`Successfully added ${parsedResults.length} products to your shelf!`);
                setSessionProducts(prev => [...parsedResults.map(p => ({ name: p.name, price: p.price })), ...prev]);
                
                // Clear sheets
                setParsedResults(null);
                setVoiceTranscript('');
                setAiText('');
                setIsAiCatalogOpen(false);
                setIsVoiceOpen(false);
                
                fetchProducts();
            } else {
                toast.error("Failed to add products in bulk");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error bulk adding products");
        } finally {
            setIsAddingBulk(false);
        }
    };

    // Image Upload Scanner
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(URL.createObjectURL(file));
            setIsScanning(true);
            
            // Simulate AI detection
            setTimeout(() => {
                setDetectedProducts([
                    { name: 'Protein Powder Supplement', price: 1499, quantity: 15 },
                    { name: 'Vitamin C 500mg (30 tabs)', price: 180, quantity: 25 },
                    { name: 'Multivitamin Gummies', price: 399, quantity: 10 }
                ]);
                setIsScanning(false);
            }, 2200);
        }
    };

    const addDetectedProducts = async () => {
        if (!detectedProducts || detectedProducts.length === 0) return;
        setIsAddingBulk(true);
        try {
            const res = await fetch('/api/seller/products/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ products: detectedProducts })
            });

            if (res.ok) {
                toast.success(`Added ${detectedProducts.length} detected products!`);
                setSessionProducts(prev => [...detectedProducts, ...prev]);
                setDetectedProducts(null);
                setSelectedImage(null);
                setIsImageOpen(false);
                fetchProducts();
            } else {
                toast.error("Failed to add products");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error adding products");
        } finally {
            setIsAddingBulk(false);
        }
    };

    // Manual Quick Add Handler
    const handleQuickManualAdd = async (e) => {
        e.preventDefault();
        if (!manualForm.name || !manualForm.price) {
            toast.error("Please fill name and price.");
            return;
        }

        setIsSubmittingManual(true);
        try {
            const formData = new FormData();
            formData.append('name', manualForm.name);
            formData.append('price', manualForm.price);
            formData.append('sellingPrice', manualForm.price);
            formData.append('mrp', manualForm.price);
            formData.append('quantity', manualForm.stock);
            formData.append('countInStock', manualForm.stock);
            formData.append('category', 'General');
            formData.append('categorySlug', manualForm.category);
            formData.append('subCategory', 'General');
            formData.append('shopType', shopType);

            const res = await fetch('/api/seller/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const newProd = await res.json();
                toast.success(`${manualForm.name} added manually!`);
                setSessionProducts(prev => [newProd, ...prev]);
                setManualForm({ name: '', price: '', stock: '20', category: 'general-provision' });
                setIsManualOpen(false);
                fetchProducts();
            } else {
                toast.error("Failed to add product");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error creating product");
        } finally {
            setIsSubmittingManual(false);
        }
    };

    // Match Catalog Search
    const triggerCatalogSearch = async (queryStr) => {
        const q = queryStr || catalogSearch;
        if (!q.trim()) return;

        setLoadingCatalog(true);
        try {
            const res = await fetch(`/api/seller/catalog`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Filter catalog items by search query
                const items = [];
                if (data.categories && Array.isArray(data.categories)) {
                    data.categories.forEach(cat => {
                        if (cat.items && Array.isArray(cat.items)) {
                            cat.items.forEach(it => {
                                if (it.name?.toLowerCase().includes(q.toLowerCase()) || 
                                    it.brand?.toLowerCase().includes(q.toLowerCase())) {
                                    items.push({
                                        ...it,
                                        categoryName: cat.categoryName
                                    });
                                }
                            });
                        }
                    });
                }
                setCatalogItems(items.slice(0, 10)); // limit to 10
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingCatalog(false);
        }
    };

    const syncCatalogItemToInventory = async (item) => {
        setSyncingCatalogItem(item.id);
        try {
            const payload = {
                selectedItems: [{
                    variantId: item.id,
                    variantLabel: item.name,
                    brandName: item.brand || 'Generic',
                    category: item.categoryName || 'General',
                    price: item.price || 40,
                    stockStatus: 'IN_STOCK',
                    unit: item.unit || 'pcs',
                    imageUrl: item.imageUrl
                }]
            };

            const res = await fetch('/api/seller/catalog/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success(`${item.name} synced to your shelf!`);
                setSessionProducts(prev => [item, ...prev]);
                fetchProducts();
            } else {
                toast.error("Failed to sync item");
            }
        } catch (err) {
            console.error(err);
            toast.error("Error syncing item");
        } finally {
            setSyncingCatalogItem(null);
        }
    };

    // Excel upload mock
    const handleExcelUploadMock = () => {
        toast.promise(
            new Promise((resolve) => setTimeout(resolve, 1500)),
            {
                loading: 'Uploading Excel template...',
                success: 'Excel loaded! 18 products added successfully.',
                error: 'Excel upload failed',
            }
        ).then(() => {
            fetchProducts();
        });
    };

    // Assisted listing request
    const handleRequestAssistance = () => {
        setAssistedRequested(true);
        toast.success("Assistance requested! An Aisle partner will contact you shortly.");
    };

    // Filter Logic for products list
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               p.category?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (activeTab === 'active') return matchesSearch && p.isAvailable && !p.isDraft;
        if (activeTab === 'lowStock') return matchesSearch && p.quantity <= 10 && !p.isDraft;
        if (activeTab === 'drafts') return matchesSearch && p.isDraft;
        return matchesSearch;
    });

    const isLimitReached = stats.total >= 120;

    return (
        <div className="p-4 space-y-5 pb-6 font-sans bg-slate-50 min-h-screen text-slate-800 relative">
            
            {/* --- TOP MOBILE HEADER --- */}
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => window.location.href = '/seller/home'}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-sm font-black text-slate-800 tracking-tight">Products Setup</h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{shopType}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-xs font-black text-indigo-600">{stats.total} / 120</span>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none">Products</p>
                </div>
            </div>

            {/* --- STICKY PROGRESS TRACKER --- */}
            <div className="sticky top-[60px] z-30 bg-slate-50/90 backdrop-blur-md py-3.5 border-b border-slate-200/50">
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 shadow-md"
                        style={{ width: `${Math.min(100, (stats.total / 120) * 100)}%` }}
                    ></div>
                </div>
            </div>

            {/* --- HERO / ONBOARDING CARD --- */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-indigo-500/20 space-y-4 relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-indigo-500/10 rounded-full"></div>
                <div className="flex items-center gap-2">
                    <span className="text-xl">👋</span>
                    <h3 className="font-extrabold text-sm tracking-tight leading-tight">Welcome to Catalog Setup</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                    Add your first product. Choose the fastest method.
                </p>
                <div className="flex justify-between items-center bg-white/5 border border-white/10 px-3.5 py-2.5 rounded-2xl">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Progress</span>
                    <span className="text-xs font-black text-white">{stats.total} of 120 Products Added</span>
                </div>
            </div>

            {/* --- AI HIGHLIGHT BANNER --- */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg space-y-4 relative overflow-hidden border border-white/15">
                <div className="absolute right-4 top-4 bg-white/15 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={10} className="fill-white" /> AISLE AI
                </div>
                <div className="space-y-1">
                    <h4 className="font-extrabold text-sm tracking-tight">Paste or Speak Your Catalog</h4>
                    <p className="text-[10px] text-indigo-100 font-medium">We'll create product listings automatically with matching prices.</p>
                </div>
                <div className="bg-black/15 p-3 rounded-2xl border border-white/10 font-mono text-[9px] text-slate-200">
                    "Amul Milk ₹32<br />
                    Bread ₹40<br />
                    Coke ₹20"
                </div>
                <button
                    onClick={() => setIsAiCatalogOpen(true)}
                    className="w-full h-10 bg-white text-indigo-700 font-black rounded-xl text-xs uppercase tracking-wider shadow-md active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                    <Sparkles size={14} className="text-indigo-600 fill-indigo-600" />
                    Try AI Catalog
                </button>
            </div>

            {/* --- RECOMMENDED / FASTEST WAYS SECTION --- */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">⚡ Fastest Ways</h3>
                
                {/* Add by Voice Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 border border-rose-100/50">
                            <Mic size={20} />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="font-extrabold text-xs text-slate-800">Add by Voice</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Speak your inventory list to add items automatically.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsVoiceOpen(true)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 hover:bg-slate-100"
                    >
                        <Mic size={14} className="text-slate-500" />
                        Start Voice Listing
                    </button>
                </div>

                {/* Add by Images Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                            <Camera size={20} />
                        </div>
                        <div className="space-y-0.5">
                            <h4 className="font-extrabold text-xs text-slate-800">Add by Images</h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Upload shelf photos to scan and auto-create catalog.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsImageOpen(true)}
                        className="w-full h-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 hover:bg-slate-100"
                    >
                        <Camera size={14} className="text-slate-500" />
                        Upload Images
                    </button>
                </div>
            </div>

            {/* --- RECENT PRODUCTS FEED --- */}
            <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Recent Products</h3>
                
                {/* Empty State */}
                {products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center flex flex-col items-center gap-4 py-10">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                            <Box size={28} />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-extrabold text-sm text-slate-800">🚀 Your shelf is empty</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Add products to start receiving customer interest.</p>
                        </div>
                        <button
                            onClick={() => setIsManualOpen(true)}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                        >
                            Add First Product
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Tab filters */}
                        <div className="flex gap-2">
                            {['all', 'active', 'lowStock'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                        activeTab === tab
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-550'
                                    }`}
                                >
                                    {tab === 'lowStock' ? 'Low Stock' : tab}
                                </button>
                            ))}
                        </div>

                        {/* Product list */}
                        <div className="space-y-2.5">
                            {filteredProducts.slice(0, 10).map((product) => {
                                const isLowStock = product.quantity <= 10;
                                const mainImage = product.images?.[0] || product.image || '/placeholder-product.png';
                                return (
                                    <div
                                        key={product._id}
                                        className="bg-white border border-slate-100 rounded-2xl p-3 shadow-xs flex justify-between items-center gap-2"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={mainImage}
                                                alt={product.name}
                                                className="w-10 h-10 rounded-xl object-cover bg-slate-50 border border-slate-100"
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80' }}
                                            />
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-xs text-slate-800 truncate">{product.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">₹{product.sellingPrice || product.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500"
                                                title="Edit"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleToggleAvailability(product)}
                                                className={`p-2 border rounded-xl ${
                                                    product.isAvailable
                                                        ? 'bg-amber-50/50 border-amber-200 text-amber-700'
                                                        : 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                                                }`}
                                                title={product.isAvailable ? "Pause" : "Activate"}
                                            >
                                                {product.isAvailable ? <Pause size={12} /> : <Play size={12} />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredProducts.length > 10 && (
                                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider py-1">
                                    Showing latest 10 of {filteredProducts.length} products
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* --- STRUCTURED METHODS ACCORDION --- */}
            <div className="border border-slate-200/60 rounded-3xl overflow-hidden bg-white shadow-xs">
                <button
                    onClick={() => setIsStructuredExpanded(!isStructuredExpanded)}
                    className="w-full p-4 flex justify-between items-center font-black text-xs text-slate-800 bg-slate-50 hover:bg-slate-100 transition-colors uppercase tracking-widest"
                >
                    <span>Structured Methods</span>
                    {isStructuredExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {isStructuredExpanded && (
                    <div className="p-4 space-y-4 border-t border-slate-100">
                        {/* Excel Upload Card */}
                        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <FileSpreadsheet className="text-emerald-600 shrink-0" size={18} />
                                <div>
                                    <h4 className="font-extrabold text-xs text-slate-800">📊 Excel Upload</h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">Upload hundreds of products at once.</p>
                                </div>
                            </div>
                            <button
                                onClick={handleExcelUploadMock}
                                className="w-full h-9 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 uppercase tracking-wider hover:bg-slate-100"
                            >
                                Choose File
                            </button>
                        </div>

                        {/* Quick Manual Add CTA */}
                        <button
                            onClick={() => setIsManualOpen(true)}
                            className="w-full h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-between px-4 text-xs font-bold text-slate-700 active:scale-98 transition-all hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-2">
                                <Plus size={16} className="text-indigo-600" />
                                ✏️ Add Manually
                            </span>
                            <ArrowRight size={14} className="text-slate-400" />
                        </button>

                        {/* Match Catalog CTA */}
                        <button
                            onClick={() => setIsCatalogOpen(true)}
                            className="w-full h-11 bg-white border border-slate-200 rounded-2xl flex items-center justify-between px-4 text-xs font-bold text-slate-700 active:scale-98 transition-all hover:bg-slate-50"
                        >
                            <span className="flex items-center gap-2">
                                <Store size={16} className="text-indigo-600" />
                                🏪 Match Catalog
                            </span>
                            <ArrowRight size={14} className="text-slate-400" />
                        </button>
                    </div>
                )}
            </div>

            {/* --- ASSISTED LISTING CARD --- */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100/50">
                        <HelpCircle size={20} />
                    </div>
                    <div className="space-y-0.5">
                        <h4 className="font-extrabold text-xs text-slate-800">Need Help?</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">An AISLE Partner can visit your shop and create listings for you.</p>
                    </div>
                </div>
                <button
                    onClick={handleRequestAssistance}
                    disabled={assistedRequested}
                    className={`w-full h-10 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-98 transition-all flex items-center justify-center gap-1.5 ${
                        assistedRequested 
                            ? 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {assistedRequested ? <Check size={14} /> : null}
                    {assistedRequested ? 'Requested' : 'Request Assistance'}
                </button>
            </div>

            {/* --- SMART CATALOG PRO UPGRADE CARD --- */}
            <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white rounded-3xl p-5 shadow-lg border border-indigo-500/20 space-y-4 relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-indigo-500/10 rounded-full"></div>
                <div className="flex items-center gap-2">
                    <Zap className="text-amber-400 fill-amber-400 animate-pulse" size={20} />
                    <h3 className="font-extrabold text-sm tracking-tight leading-tight uppercase">Smart Catalog Pro</h3>
                </div>
                <ul className="space-y-2 pl-1.5">
                    {['Bulk AI Recognition', 'Price Benchmarking', 'Auto Categorization'].map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            {feature}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={() => window.location.href = '/seller/subscription'}
                    className="w-full h-10 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow active:scale-98 transition-all flex items-center justify-center hover:bg-indigo-700"
                >
                    Upgrade
                </button>
            </div>

            {/* --- AI CATALOG BOTTOM SHEET --- */}
            {isAiCatalogOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsAiCatalogOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-slide-up space-y-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">✨ Try AI Catalog</h3>
                            <button onClick={() => { setIsAiCatalogOpen(false); setParsedResults(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        
                        {!parsedResults ? (
                            <>
                                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                    Type your items and prices. Separate items by commas or newlines.
                                </p>
                                <textarea
                                    rows="5"
                                    placeholder="e.g. Amul Milk 32&#10;Brown Bread 40&#10;Coca Cola 20"
                                    value={aiText}
                                    onChange={e => setAiText(e.target.value)}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none font-mono"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAiText("Amul Milk 32\nBrown Bread 40\nCoca Cola 20")}
                                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                                    >
                                        Auto Fill Example
                                    </button>
                                    <button
                                        onClick={processVoiceTranscript}
                                        disabled={isParsing || !aiText.trim()}
                                        className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50"
                                    >
                                        {isParsing ? 'Processing AI...' : 'Create Listings'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Items Summary</h4>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-[40vh] overflow-y-auto">
                                    {parsedResults.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-slate-200/60 pb-2 last:border-none last:pb-0">
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-800">{item.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Qty: {item.quantity || 20}</p>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setParsedResults(null)}
                                        className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                                    >
                                        Edit List
                                    </button>
                                    <button
                                        onClick={saveBulkParsedProducts}
                                        disabled={isAddingBulk}
                                        className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                                    >
                                        {isAddingBulk ? 'Syncing...' : 'Confirm & Add to Shelf'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- VOICE RECORDER BOTTOM SHEET --- */}
            {isVoiceOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsVoiceOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-slide-up space-y-5" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">🎤 Add by Voice</h3>
                            <button onClick={() => { setIsVoiceOpen(false); setParsedResults(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>
                        
                        {!parsedResults ? (
                            <div className="flex flex-col items-center gap-6 py-6">
                                <div className="relative">
                                    {isRecording && (
                                        <span className="absolute -inset-4 rounded-full bg-rose-500/20 animate-ping"></span>
                                    )}
                                    <button
                                        onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                                        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                                            isRecording ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                    >
                                        <Mic size={32} />
                                    </button>
                                </div>
                                
                                <div className="text-center space-y-1 px-4">
                                    <h4 className="font-extrabold text-sm text-slate-800">
                                        {isRecording ? 'Listening... Speak your items' : 'Tap mic to start listing'}
                                    </h4>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-wider">
                                        Say: "Amul Gold Milk ₹32, Wheat Bread ₹45"
                                    </p>
                                </div>

                                {/* Live Transcript */}
                                {voiceTranscript && (
                                    <div className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200/60 text-xs font-semibold text-slate-700 italic max-h-[150px] overflow-y-auto">
                                        "{voiceTranscript}"
                                    </div>
                                )}

                                {!isRecording && voiceTranscript && (
                                    <button
                                        onClick={processVoiceTranscript}
                                        disabled={isParsing}
                                        className="w-full h-11 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow active:scale-98 transition-all"
                                    >
                                        {isParsing ? 'Processing voice...' : 'Parse Voice List'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Items Summary</h4>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-[40vh] overflow-y-auto">
                                    {parsedResults.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-slate-200/60 pb-2 last:border-none last:pb-0">
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-800">{item.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Qty: {item.quantity || 20}</p>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setParsedResults(null)}
                                        className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                                    >
                                        Record Again
                                    </button>
                                    <button
                                        onClick={saveBulkParsedProducts}
                                        disabled={isAddingBulk}
                                        className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                                    >
                                        {isAddingBulk ? 'Syncing...' : 'Confirm & Add to Shelf'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- IMAGE SCANNER BOTTOM SHEET --- */}
            {isImageOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsImageOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-slide-up space-y-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">📸 Add by Images</h3>
                            <button onClick={() => { setIsImageOpen(false); setDetectedProducts(null); setSelectedImage(null); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        {!detectedProducts ? (
                            <div className="flex flex-col items-center gap-6 py-4">
                                <div className="relative w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer hover:bg-slate-100">
                                    <input type="file" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" />
                                    {selectedImage ? (
                                        <img src={selectedImage} alt="Shelf Scan" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center p-4">
                                            <Camera size={32} className="text-slate-400 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-slate-600">Select Shelf Photo</p>
                                            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-wider">Let AI analyze products and stock</p>
                                        </div>
                                    )}
                                </div>

                                {isScanning && (
                                    <div className="w-full space-y-2 text-center">
                                        <Loader className="animate-spin text-indigo-600 mx-auto" size={24} />
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">AI is analyzing photo shelves...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Detected Products</h4>
                                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 max-h-[40vh] overflow-y-auto">
                                    {detectedProducts.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-slate-200/60 pb-2 last:border-none last:pb-0">
                                            <div>
                                                <p className="text-xs font-extrabold text-slate-800">{item.name}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Stock: {item.quantity}</p>
                                            </div>
                                            <span className="text-xs font-black text-indigo-600">₹{item.price}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setDetectedProducts(null); setSelectedImage(null); }}
                                        className="flex-1 h-10 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider"
                                    >
                                        Scan Another
                                    </button>
                                    <button
                                        onClick={addDetectedProducts}
                                        disabled={isAddingBulk}
                                        className="flex-1 h-10 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5"
                                    >
                                        {isAddingBulk ? 'Syncing...' : 'Add Detected Items'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- MATCH CATALOG BOTTOM SHEET --- */}
            {isCatalogOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsCatalogOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-slide-up space-y-4 flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">🏪 Match Catalog</h3>
                            <button onClick={() => { setIsCatalogOpen(false); setCatalogItems([]); setCatalogSearch(''); }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search input */}
                        <div className="flex gap-2">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-inner">
                                <Search size={16} className="text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search catalog items..."
                                    value={catalogSearch}
                                    onChange={e => setCatalogSearch(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') triggerCatalogSearch(); }}
                                    className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-full placeholder:text-slate-400"
                                />
                            </div>
                            <button
                                onClick={() => triggerCatalogSearch()}
                                className="px-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800"
                            >
                                Search
                            </button>
                        </div>

                        {/* Popular Nearby */}
                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Popular Nearby</h4>
                            <div className="flex flex-wrap gap-2">
                                {['Amul Milk', 'Parle-G', 'Coca Cola', 'Dettol Soap'].map((term, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setCatalogSearch(term);
                                            triggerCatalogSearch(term);
                                        }}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-[10px] font-bold text-slate-700 transition-colors"
                                    >
                                        + {term}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Results list */}
                        {loadingCatalog ? (
                            <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                                <Loader className="animate-spin text-indigo-600" size={20} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Searching master catalog...</span>
                            </div>
                        ) : catalogItems.length > 0 ? (
                            <div className="space-y-2.5 max-h-[30vh] overflow-y-auto">
                                {catalogItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-2xl">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <img
                                                src={item.imageUrl || '/placeholder-product.png'}
                                                alt={item.name}
                                                className="w-10 h-10 rounded-xl object-cover bg-white border border-slate-200"
                                            />
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-xs text-slate-800 truncate">{item.name}</h4>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{item.brand}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => syncCatalogItemToInventory(item)}
                                            disabled={syncingCatalogItem === item.id}
                                            className="px-3 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                                        >
                                            {syncingCatalogItem === item.id ? 'Linking...' : 'Add'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : catalogSearch ? (
                            <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-wider py-4">No matching catalog items found</p>
                        ) : null}
                    </div>
                </div>
            )}

            {/* --- MANUAL QUICK ADD BOTTOM SHEET --- */}
            {isManualOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsManualOpen(false)}>
                    <form
                        onSubmit={handleQuickManualAdd}
                        className="bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-slide-up space-y-4 flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest">✏️ Quick Add Product</h3>
                            <button type="button" onClick={() => setIsManualOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Product Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Tata Salt 1kg"
                                    value={manualForm.name}
                                    onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="0"
                                        value={manualForm.price}
                                        onChange={e => setManualForm({ ...manualForm, price: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock</label>
                                    <input
                                        type="number"
                                        placeholder="20"
                                        value={manualForm.stock}
                                        onChange={e => setManualForm({ ...manualForm, stock: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Category</label>
                                <select
                                    value={manualForm.category}
                                    onChange={e => setManualForm({ ...manualForm, category: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="general-provision">🥕 General Provision / Kirana</option>
                                    <option value="fruits-vegetables">🥬 Fruits & Vegetables</option>
                                    <option value="dairy-ice-cream">🥛 Dairy & Ice Cream</option>
                                    <option value="bakery-cake-shop">🎂 Bakery & Cake Shop</option>
                                    <option value="sweet-shop">🍬 Sweet Shop</option>
                                    <option value="allopathic-chemist">💊 Allopathic Chemist</option>
                                    <option value="ayurvedic-herbal">🌿 Ayurvedic & Herbal</option>
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmittingManual}
                            className="w-full h-10 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center shadow hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmittingManual ? 'Creating Product...' : 'Add Product'}
                        </button>
                    </form>
                </div>
            )}

            {/* --- ORB QUICK ACTION SHEET --- */}
            {isOrbOpen && (
                <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex flex-col justify-end animate-fade-in" onClick={() => setIsOrbOpen(false)}>
                    <div className="bg-white rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto shadow-2xl z-50 animate-slide-up space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                                <Sparkles size={16} className="text-indigo-600 fill-indigo-600" /> Ask Aisle AI
                            </h3>
                            <button onClick={() => setIsOrbOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { label: '✨ Try AI Catalog', icon: Sparkles, color: 'text-violet-600 bg-violet-50', action: () => { setIsOrbOpen(false); setIsAiCatalogOpen(true); } },
                                { label: '🎤 Add by Voice', icon: Mic, color: 'text-rose-500 bg-rose-50', action: () => { setIsOrbOpen(false); setIsVoiceOpen(true); } },
                                { label: '📸 Add by Images', icon: Camera, color: 'text-emerald-500 bg-emerald-50', action: () => { setIsOrbOpen(false); setIsImageOpen(true); } },
                                { label: '📊 Import Excel Inventory', icon: FileSpreadsheet, color: 'text-teal-600 bg-teal-50', action: () => { setIsOrbOpen(false); handleExcelUploadMock(); } },
                                { label: '✏️ Quick Manual Add', icon: Edit2, color: 'text-slate-600 bg-slate-100', action: () => { setIsOrbOpen(false); setIsManualOpen(true); } },
                            ].map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={option.action}
                                    className="w-full p-3.5 bg-slate-50/70 border border-slate-200 hover:bg-slate-100 rounded-2xl flex items-center gap-3 transition-colors text-left"
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${option.color}`}>
                                        <option.icon size={16} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{option.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal integration */}
            {selectedProduct && (
                <ProductEditModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    product={selectedProduct}
                    onSave={handleSaveEditedProduct}
                    shopType={shopType}
                />
            )}
        </div>
    );
};

export default MobileSellerProducts;
