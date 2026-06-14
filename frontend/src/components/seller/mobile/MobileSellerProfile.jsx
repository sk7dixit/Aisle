import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { 
    User, Store, Mail, Phone, MapPin, Save, ShieldCheck, 
    ArrowLeft, Camera, Clock, Lock, Shield, Calendar, 
    ChevronDown, ChevronRight, Eye, RefreshCw, AlertTriangle, 
    Award, Check, Sparkles, TrendingUp, BarChart2, Star 
} from 'lucide-react';
import toast from 'react-hot-toast';

const MobileSellerProfile = () => {
    const { user, token, checkUserStatus } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // activeTab: 'shop' | 'seller' | 'security' | 'payments'
    const [activeTab, setActiveTab] = useState('shop');
    
    // UI drawers
    const [showMissingDrawer, setShowMissingDrawer] = useState(false);
    const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
    const [paymentStep, setPaymentStep] = useState(1); // 1: preference choice, 2: UPI details

    // Loading states
    const [loading, setLoading] = useState(false);
    const [uploadingAsset, setUploadingAsset] = useState(null); // type of asset uploading

    // API retrieved states
    const [faceStatus, setFaceStatus] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState(null);

    // Forms fields
    const [form, setForm] = useState({
        shopName: '',
        phone: '',
        address: '',
        openingTime: '09:00',
        closingTime: '20:00',
        lat: null,
        lng: null,
        ownerName: '',
        mobile: ''
    });

    // UPI forms fields
    const [upiId, setUpiId] = useState('');
    const [upiDisplayName, setUpiDisplayName] = useState('');
    const [upiError, setUpiError] = useState('');

    // Load user data into form
    useEffect(() => {
        if (user) {
            setForm({
                shopName: user.shopDetails?.shopName || user.shopDetails?.name || '',
                phone: user.phone || user.shopDetails?.phone || '',
                address: user.shopDetails?.address || '',
                openingTime: user.shopDetails?.openingTime || '09:00',
                closingTime: user.shopDetails?.closingTime || '20:00',
                lat: user.shopDetails?.shopLocation?.coordinates?.[1] || null,
                lng: user.shopDetails?.shopLocation?.coordinates?.[0] || null,
                ownerName: user.name || '',
                mobile: user.phone || ''
            });
        }
    }, [user]);

    // Fetch API states
    useEffect(() => {
        if (token) {
            fetchFaceStatus();
            fetchPaymentSettings();
            checkUserStatus();
        }
    }, [token]);

    const fetchPaymentSettings = async () => {
        try {
            const res = await fetch('/api/seller/payment-settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.settings) {
                setPaymentSettings(data.settings);
                setUpiId(data.settings.upiId || '');
                setUpiDisplayName(data.settings.displayName || user?.shopDetails?.shopName || '');
            }
        } catch (error) {
            console.error("Failed to fetch payment settings:", error);
        }
    };

    const fetchFaceStatus = async () => {
        try {
            const res = await fetch('/api/seller/face-update-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFaceStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch face status:", error);
        }
    };

    // Save Changes API
    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seller/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    shopName: form.shopName,
                    shopPhone: form.phone,
                    shopAddress: form.address,
                    openingTime: form.openingTime,
                    closingTime: form.closingTime,
                    lat: form.lat,
                    lng: form.lng,
                    name: form.ownerName,
                    phone: form.mobile
                })
            });

            if (res.ok) {
                await checkUserStatus();
                toast.success("Profile saved successfully!");
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update profile.");
            }
        } catch (error) {
            console.error("Profile save error:", error);
            toast.error("Network error saving profile.");
        } finally {
            setLoading(false);
        }
    };

    // Geolocation detection
    const handleDetectLocation = () => {
        if (navigator.geolocation) {
            toast.loading("Detecting current coordinates...", { id: 'geo' });
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setForm(prev => ({
                        ...prev,
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    }));
                    toast.success("GPS Location detected!", { id: 'geo' });
                },
                (err) => {
                    console.error("Geo error:", err);
                    toast.error("Failed to get location. Ensure GPS is enabled.", { id: 'geo' });
                }
            );
        } else {
            toast.error("Geolocation is not supported by your browser.");
        }
    };

    // Asset uploads
    const handleAssetUploadClick = (type) => {
        setUploadingAsset(type);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAssetFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !uploadingAsset) return;

        e.target.value = ''; // Reset uploader input
        const targetType = uploadingAsset;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', targetType);

        toast.loading(`Uploading ${targetType.replace('_', ' ')}...`, { id: 'upload' });
        try {
            const res = await fetch('/api/seller/visual-assets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                toast.success("Image uploaded successfully!", { id: 'upload' });
                await checkUserStatus();
            } else {
                const data = await res.json();
                toast.error(data.message || "Upload failed.", { id: 'upload' });
            }
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Upload failed due to network issues.", { id: 'upload' });
        } finally {
            setUploadingAsset(null);
        }
    };

    // Save payments settings
    const handleSavePaymentSettings = async (accepts) => {
        if (accepts && (!upiId || !upiId.includes('@'))) {
            setUpiError("Please enter a valid UPI ID (e.g. name@upi)");
            return;
        }

        setLoading(true);
        setUpiError('');

        try {
            const res = await fetch('/api/seller/payment-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    acceptsOnlinePayment: accepts,
                    paymentSetupCompleted: true,
                    upiId: accepts ? upiId : undefined,
                    paymentDisplayName: accepts ? upiDisplayName : undefined
                })
            });

            if (res.ok) {
                toast.success("Payment preferences updated!");
                await checkUserStatus();
                await fetchPaymentSettings();
                setShowPaymentDrawer(false);
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to update payments setup.");
            }
        } catch (error) {
            console.error("Payment save error:", error);
            toast.error("Connection error saving settings.");
        } finally {
            setLoading(false);
        }
    };

    // Helper: clean Windows paths or prepend / to relative uploads paths
    const cleanUrl = (path) => {
        if (!path) return null;
        let clean = path.replace(/\\/g, '/');
        if (clean.startsWith('uploads/')) {
            clean = '/' + clean;
        }
        return clean;
    };

    const getShopBanner = () => {
        if (user?.shopDetails?.photos?.length > 0) {
            return cleanUrl(user.shopDetails.photos[0]);
        }
        const frontAsset = user?.shopDetails?.visualAssets?.find(a => a.type === 'SHOP_FRONT');
        if (frontAsset?.url) {
            return cleanUrl(frontAsset.url);
        }
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
    };

    // Completeness ring computation
    const missingItems = [];
    if (!form.shopName) missingItems.push({ name: 'Shop Name', tab: 'shop', field: 'shopName' });
    if (!form.phone) missingItems.push({ name: 'Shop Phone', tab: 'shop', field: 'phone' });
    if (!form.address) missingItems.push({ name: 'Store Address', tab: 'shop', field: 'address' });
    if (!form.lat) missingItems.push({ name: 'GPS Location coordinates', tab: 'shop', field: 'gps' });
    
    // Check visual assets uploaded
    const visualAssets = user?.shopDetails?.visualAssets || [];
    const hasFront = visualAssets.some(a => a.type === 'SHOP_FRONT');
    const hasInterior = visualAssets.some(a => a.type === 'SHOP_INTERIOR');
    const hasShelf = visualAssets.some(a => a.type === 'PRODUCT_SHELF');
    const hasOwner = visualAssets.some(a => a.type === 'OWNER');
    
    if (!hasFront) missingItems.push({ name: 'Shop Front Photo', tab: 'shop', field: 'asset_front' });
    if (!hasInterior) missingItems.push({ name: 'Shop Interior Photo', tab: 'shop', field: 'asset_interior' });
    if (!hasShelf) missingItems.push({ name: 'Product Shelf Photo', tab: 'shop', field: 'asset_shelf' });
    if (!hasOwner) missingItems.push({ name: 'Owner Identity Photo', tab: 'shop', field: 'asset_owner' });

    if (!paymentSettings?.acceptsOnlinePayment) {
        missingItems.push({ name: 'UPI Online Payments Settings', tab: 'payments', field: 'upi' });
    }

    const totalCheckpoints = 9;
    const completedCheckpoints = totalCheckpoints - missingItems.length;
    const completenessPercentage = Math.round((completedCheckpoints / totalCheckpoints) * 100);

    const handleScrollToMissing = (item) => {
        setActiveTab(item.tab);
        setShowMissingDrawer(false);
        toast(`Scroll and fill in ${item.name}!`, { icon: '📝' });
    };

    // Check if form has modified changes
    const isFormChanged = () => {
        if (!user) return false;
        return (
            form.shopName !== (user.shopDetails?.shopName || user.shopDetails?.name || '') ||
            form.phone !== (user.phone || user.shopDetails?.phone || '') ||
            form.address !== (user.shopDetails?.address || '') ||
            form.openingTime !== (user.shopDetails?.openingTime || '09:00') ||
            form.closingTime !== (user.shopDetails?.closingTime || '20:00') ||
            form.lat !== (user.shopDetails?.shopLocation?.coordinates?.[1] || null) ||
            form.ownerName !== (user.name || '') ||
            form.mobile !== (user.phone || '')
        );
    };

    return (
        <div className="p-4 space-y-6 pb-40 font-sans text-left bg-slate-50 min-h-screen relative select-none">
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                @keyframes scaleUp {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.25s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-scale-up {
                    animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>

            {/* Header Back Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => navigate('/seller/home')}
                        className="p-2 -ml-2 rounded-xl hover:bg-slate-100 text-slate-700 transition-all active:scale-90 cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            Profile
                        </h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                            Manage shop parameters
                        </p>
                    </div>
                </div>

                {/* Top Right Floating Profile Completion Ring */}
                <button
                    onClick={() => setShowMissingDrawer(true)}
                    className="relative w-12 h-12 flex items-center justify-center bg-white rounded-full border border-slate-150 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                    <svg className="w-12 h-12 transform -rotate-90">
                        <circle
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="transparent"
                            r="20"
                            cx="24"
                            cy="24"
                        />
                        <circle
                            className={completenessPercentage >= 90 ? "text-emerald-500" : completenessPercentage >= 50 ? "text-indigo-600" : "text-amber-500"}
                            strokeWidth="3.5"
                            strokeDasharray={2 * Math.PI * 20}
                            strokeDashoffset={2 * Math.PI * 20 - (completenessPercentage / 100) * (2 * Math.PI * 20)}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="20"
                            cx="24"
                            cy="24"
                            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                        />
                    </svg>
                    <span className="absolute text-[9px] font-black text-slate-800">{completenessPercentage}%</span>
                </button>
            </div>

            {/* Profile Hero Cover Card */}
            <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm relative">
                {/* Cover Image Banner */}
                <div className="h-28 bg-slate-200 relative">
                    <img 
                        src={getShopBanner()} 
                        alt="Shop Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/10"></div>
                    <button 
                        onClick={() => handleAssetUploadClick('SHOP_FRONT')}
                        className="absolute bottom-2.5 right-3.5 bg-black/35 backdrop-blur-md text-white p-2 rounded-full border border-white/20 active:scale-90 transition-transform cursor-pointer"
                    >
                        <Camera size={12} />
                    </button>
                </div>

                {/* Overlapping Identity Section */}
                <div className="px-4 pb-4 pt-1 flex flex-col items-start text-left relative">
                    {/* Circle Profile image */}
                    <div className="w-24 h-24 rounded-2xl border-4 border-white bg-slate-100 shadow-md -mt-12 overflow-hidden relative group shrink-0">
                        {user?.faceData ? (
                            <img src={cleanUrl(user.faceData)} className="w-full h-full object-cover" alt="Verified Face" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-305 bg-indigo-50 text-indigo-600 font-extrabold text-lg">
                                {form.ownerName ? form.ownerName[0].toUpperCase() : 'S'}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <Lock size={8} />
                        </div>
                    </div>

                    <div className="mt-3.5 space-y-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-black text-slate-900 leading-tight">
                                {form.shopName || user?.name || 'Kirana Shop'}
                            </h2>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black bg-indigo-50 text-indigo-700 border border-indigo-150 uppercase tracking-widest">
                                Verified
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-450 font-bold uppercase tracking-wider">
                            <MapPin size={10} className="text-indigo-600" />
                            <span>{user?.shopDetails?.city || 'Vadodara'}, Gujarat</span>
                        </div>
                    </div>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-3 gap-2 w-full mt-4 border-t border-slate-50 pt-3 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Seller ID</span>
                            <span className="block font-mono text-[9px] font-black text-slate-805 mt-0.5">SL-{user?._id?.slice(-6).toUpperCase() || '759FA5'}</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Member Since</span>
                            <span className="block text-[10px] font-black text-slate-805 mt-0.5">Jan 2024</span>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Shop Type</span>
                            <span className="block text-[9px] font-black text-slate-805 mt-0.5 truncate uppercase">{user?.shopDetails?.shopType?.replace('_', ' ') || 'Kirana'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Navigation Chips */}
            <div className="sticky top-[60px] z-20 bg-slate-50/90 backdrop-blur-md py-3 -mx-4 px-4 border-b border-slate-200/50">
                <div 
                    className="flex overflow-x-auto gap-2 pb-1 scrollbar-none"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {[
                        { id: 'shop', label: 'Shop Details' },
                        { id: 'seller', label: 'Owner Details' },
                        { id: 'security', label: 'Security' },
                        { id: 'payments', label: 'Payments' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4.5 py-2 rounded-xl text-xs font-black transition-all duration-300 shrink-0 cursor-pointer border ${
                                activeTab === tab.id
                                    ? 'bg-slate-900 text-white border-transparent shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-150/70 hover:text-slate-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Tabs Panels */}
            <div className="space-y-6">
                
                {/* TAB 1: SHOP DETAILS */}
                {activeTab === 'shop' && (
                    <div className="space-y-5">
                        
                        {/* Business Information */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Business Information
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Shop Name</label>
                                    <input 
                                        type="text" 
                                        value={form.shopName}
                                        onChange={e => setForm({ ...form, shopName: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-150/70 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Shop Type</label>
                                        <input 
                                            type="text" 
                                            readOnly
                                            value={form.shopType || user?.shopDetails?.shopType || 'GROCERY_KIRANA'}
                                            className="w-full bg-slate-100 border border-slate-150/50 rounded-2xl px-4 py-3 text-xs font-bold text-slate-400 outline-none uppercase"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Phone</label>
                                        <input 
                                            type="text" 
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-150/70 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operating Hours */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Operating Hours
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center gap-3">
                                <div className="flex-1 space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Open Time</label>
                                    <div className="relative">
                                        <input 
                                            type="time" 
                                            value={form.openingTime}
                                            onChange={e => setForm({ ...form, openingTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-150/70 rounded-2xl pl-4 pr-9 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all"
                                        />
                                        <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-350" />
                                    </div>
                                </div>
                                <span className="text-slate-300 font-bold">-</span>
                                <div className="flex-1 space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Close Time</label>
                                    <div className="relative">
                                        <input 
                                            type="time" 
                                            value={form.closingTime}
                                            onChange={e => setForm({ ...form, closingTime: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-150/70 rounded-2xl pl-4 pr-9 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white transition-all"
                                        />
                                        <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-350" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Shop Location
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className={`p-4 rounded-2xl border flex items-start gap-3 ${form.lat ? 'bg-emerald-50 border-emerald-150' : 'bg-rose-50 border-rose-150'}`}>
                                    <MapPin size={20} className={form.lat ? 'text-emerald-500 mt-0.5' : 'text-rose-500 mt-0.5'} />
                                    <div>
                                        <span className={`text-xs font-black uppercase tracking-wider block ${form.lat ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {form.lat ? 'Location Coordinates Verified' : 'GPS Coordinates Pending'}
                                        </span>
                                        <span className="text-[10px] text-slate-450 font-bold block mt-1 leading-normal">
                                            {form.lat ? `${form.lat.toFixed(6)}, ${form.lng.toFixed(6)}` : 'Auto-detect coordinates to verify shop radius for nearby clients.'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Physical Address</label>
                                    <textarea 
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-150/70 rounded-2xl px-4 py-3 text-xs font-bold text-slate-700 outline-none h-20 resize-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all leading-relaxed"
                                    />
                                </div>

                                <button 
                                    onClick={handleDetectLocation}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                    <MapPin size={12} /> Update GPS Location
                                </button>
                            </div>
                        </div>

                        {/* Visual Assets Horizontal Swipe Gallery */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Visual Assets
                            </h3>
                            <div 
                                className="flex overflow-x-auto gap-4 pb-2 scrollbar-none -mx-4 px-4"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {[
                                    { id: 'SHOP_FRONT', title: 'Shop Front', hasAsset: hasFront, asset: visualAssets.find(a => a.type === 'SHOP_FRONT') },
                                    { id: 'SHOP_INTERIOR', title: 'Interior', hasAsset: hasInterior, asset: visualAssets.find(a => a.type === 'SHOP_INTERIOR') },
                                    { id: 'PRODUCT_SHELF', title: 'Product Shelf', hasAsset: hasShelf, asset: visualAssets.find(a => a.type === 'PRODUCT_SHELF') },
                                    { id: 'OWNER', title: 'Owner Identity', hasAsset: hasOwner, asset: visualAssets.find(a => a.type === 'OWNER') }
                                ].map((slot) => {
                                    const assetUrl = slot.asset?.url ? cleanUrl(slot.asset.url) : null;
                                    return (
                                        <div 
                                            key={slot.id}
                                            onClick={() => handleAssetUploadClick(slot.id)}
                                            className="w-[120px] aspect-square shrink-0 rounded-2xl bg-white border border-slate-150/70 shadow-xs relative overflow-hidden flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:border-indigo-400 active:scale-95 transition-all"
                                        >
                                            {assetUrl ? (
                                                <>
                                                    <img src={assetUrl} alt={slot.title} className="absolute inset-0 w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <Camera size={16} className="text-white" />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5">
                                                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                        <Camera size={14} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-600 leading-tight block">{slot.title}</span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">Upload</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleAssetFileChange}
                            />
                        </div>

                        {/* Smart AI Completeness Score & Reputation card */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* AI Profile Completeness */}
                            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden space-y-4">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl pointer-events-none"></div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={14} className="text-indigo-400 animate-pulse" />
                                    <span className="text-[9px] font-black uppercase text-indigo-400 tracking-widest">✨ AI Profile Score</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <span className="block text-2xl font-black text-white">{completenessPercentage}%</span>
                                        <span className="block text-[8px] font-black text-indigo-300 uppercase tracking-widest mt-0.5">Profile Completeness</span>
                                    </div>
                                    {missingItems.length > 0 ? (
                                        <button 
                                            onClick={() => setShowMissingDrawer(true)}
                                            className="bg-white hover:bg-slate-50 text-slate-900 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider transition-all"
                                        >
                                            Complete Profile
                                        </button>
                                    ) : (
                                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">EXCELLENT</span>
                                    )}
                                </div>
                                {missingItems.length > 0 && (
                                    <div className="text-[10px] text-slate-400 leading-normal border-t border-slate-850 pt-3 space-y-1">
                                        <span className="font-extrabold uppercase text-indigo-300 tracking-wider block">Missing items:</span>
                                        <ul className="list-disc pl-3 font-semibold space-y-0.5">
                                            {missingItems.slice(0, 2).map((item, idx) => (
                                                <li key={idx}>Needs {item.name}</li>
                                            ))}
                                            {missingItems.length > 2 && (
                                                <li>and {missingItems.length - 2} more item{missingItems.length > 3 ? 's' : ''}</li>
                                            )}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Seller Reputation Card */}
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className="flex items-center gap-2">
                                    <Award size={16} className="text-amber-500" />
                                    <h4 className="text-xs font-black text-slate-805 uppercase tracking-wider">🏆 Seller Reputation</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-[8px] font-black text-slate-450 uppercase tracking-widest">Trust Index</span>
                                        <span className="block text-xl font-black text-slate-800 mt-0.5">87/100</span>
                                        <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black rounded-md border border-emerald-150 mt-1 uppercase tracking-wide">
                                            High Trust
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-[8px] font-black text-slate-455 uppercase tracking-widest">Local Visibility</span>
                                        <span className="block text-xl font-black text-indigo-650 mt-0.5">+22% Boost</span>
                                        <span className="block text-[9px] text-slate-400 font-semibold mt-1.5 leading-tight">
                                            Completing profile updates rank priority.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* TAB 2: OWNER DETAILS */}
                {activeTab === 'seller' && (
                    <div className="space-y-5">
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Owner Information
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={form.ownerName}
                                            onChange={e => setForm({ ...form, ownerName: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-150/70 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all uppercase"
                                        />
                                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            readOnly
                                            value={form.email}
                                            className="w-full pl-10 pr-20 py-3 text-xs font-bold text-slate-400 bg-slate-100 border border-slate-150/50 rounded-2xl outline-none"
                                        />
                                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-150 uppercase tracking-wider">
                                            Verified
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">Contact Mobile</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={form.mobile}
                                            onChange={e => setForm({ ...form, mobile: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-150/70 rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                        />
                                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seller Identity & Verification Card */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Verification Status
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-xs font-black text-slate-800 uppercase tracking-wider">🟢 Verified Merchant</span>
                                        <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Trust Clearance Approved</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-50 text-xs">
                                    <div>
                                        <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest block">Member Since</span>
                                        <span className="font-extrabold text-slate-700 block mt-0.5">January 2024</span>
                                    </div>
                                    <div>
                                        <span className="text-[8px] font-black text-slate-455 uppercase tracking-widest block">Seller ID Ref</span>
                                        <span className="font-mono font-extrabold text-slate-750 block mt-0.5">SL-{user?._id?.slice(-6).toUpperCase() || '759FA5'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: SECURITY */}
                {activeTab === 'security' && (
                    <div className="space-y-5">
                        
                        {/* Security Score Card */}
                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3 flex items-center justify-between">
                            <div className="space-y-1">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">🛡️ Security Score</h4>
                                <span className="block text-3xl font-black text-slate-900">92/100</span>
                                <div className="flex flex-wrap gap-1.5 pt-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                    <span className="text-emerald-600">✓ Biometrics</span>
                                    <span>•</span>
                                    <span className="text-emerald-600">✓ Device Verified</span>
                                    <span>•</span>
                                    <span className="text-emerald-600">✓ Secure Hash</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                                92
                            </div>
                        </div>

                        {/* Face Authentication */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Face Authentication
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-900 overflow-hidden relative shadow-md shrink-0">
                                        <img 
                                            src={user?.faceData || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=200&q=80"} 
                                            alt="Face ID" 
                                            className="w-full h-full object-cover opacity-60 contrast-125"
                                        />
                                        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
                                        <div className="absolute inset-0 border-[6px] border-slate-900/30"></div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-150 uppercase tracking-wider">
                                            Verified
                                        </span>
                                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                                            Biometric face profile is locked. Used for secure identity checkpoints.
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toast.success("Biometrics ID is verified and locked.", { icon: '🛡️' })}
                                    className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-805 hover:bg-slate-100 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                                >
                                    Update Face ID
                                </button>
                            </div>
                        </div>

                        {/* Password card */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Password
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex items-center justify-between">
                                <div>
                                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Credentials</span>
                                    <span className="block font-mono text-sm font-black text-slate-700 mt-1">••••••••••</span>
                                </div>
                                <button 
                                    onClick={() => toast.success("Password reset link sent to registered email.", { icon: '✉️' })}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 rounded-xl py-2 px-3 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>

                        {/* Login Activity timeline */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Recent Logins
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
                                <div className="relative pl-6 space-y-5 border-l border-slate-100">
                                    {[
                                        { day: 'Today', loc: 'Vadodara, Gujarat (Current Session)', time: '07:18 PM' },
                                        { day: 'Yesterday', loc: 'Vadodara, Gujarat', time: '09:12 AM' },
                                        { day: '3 Days Ago', loc: 'Ahmedabad, Gujarat', time: '11:45 AM' }
                                    ].map((log, idx) => (
                                        <div key={idx} className="relative">
                                            <span className="absolute -left-[30px] top-1 w-2 h-2 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-50/50"></span>
                                            <span className="block text-[10px] font-black text-slate-800 uppercase tracking-wider">{log.day}</span>
                                            <span className="block text-[10px] text-slate-500 font-semibold mt-0.5">{log.loc}</span>
                                            <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* TAB 4: PAYMENT SETTINGS */}
                {activeTab === 'payments' && (
                    <div className="space-y-5">
                        
                        {/* Payment Status Hero */}
                        {paymentSettings?.acceptsOnlinePayment ? (
                            <div className="bg-white rounded-3xl p-5 border border-emerald-150 bg-emerald-50/20 shadow-xs space-y-4 text-left">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200 uppercase tracking-wider">
                                        Active
                                    </span>
                                    <span className="text-[8px] font-black text-slate-450 uppercase tracking-widest">Online Payments Enabled</span>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Accepting UPI Payments</h4>
                                    <span className="block text-xl font-black text-slate-800">{paymentSettings.upiId}</span>
                                    <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        Display Name: {paymentSettings.displayName || form.shopName}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => {
                                        setPaymentStep(2);
                                        setShowPaymentDrawer(true);
                                    }}
                                    className="w-full py-3 bg-white border border-slate-200 text-slate-805 hover:bg-slate-50 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                                >
                                    Edit UPI Configuration
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center shrink-0">
                                    <Star size={20} className="text-slate-350" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Online Payments Disabled</h3>
                                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-widest">Status: Cash On Visit Only</p>
                                    <p className="text-xs text-slate-500 font-semibold max-w-[240px] mx-auto leading-relaxed mt-2">
                                        Enable online payments to receive digital prepaid customer orders and verify transactions seamlessly.
                                    </p>
                                </div>
                                <button 
                                    onClick={() => {
                                        setPaymentStep(1);
                                        setShowPaymentDrawer(true);
                                    }}
                                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                                >
                                    Enable Payments Setup
                                </button>
                            </div>
                        )}

                        {/* Supported Methods */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Supported Methods
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { name: "UPI App Payments", desc: "Instant transfer" },
                                    { name: "Bank Transfer", desc: "IMPS / NEFT settlement" },
                                    { name: "Digital Wallets", desc: "Paytm & PhonePe" },
                                    { name: "Debit / Credit Cards", desc: "Visa, Master, RuPay" }
                                ].map((meth, idx) => (
                                    <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-2">
                                        <Check size={14} className="text-emerald-500 shrink-0" />
                                        <div>
                                            <span className="block text-[10px] font-extrabold text-slate-800">{meth.name}</span>
                                            <span className="block text-[8px] text-slate-450 font-semibold mt-0.5">{meth.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Settlement Details */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                Settlement Details
                            </h3>
                            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3.5 text-xs">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-450 font-bold uppercase tracking-wider">Settlement Method</span>
                                    <span className="font-extrabold text-slate-800">T+1 Day Rollout</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-450 font-bold uppercase tracking-wider">Settlement Bank</span>
                                    <span className="font-extrabold text-slate-800">STATE BANK OF INDIA</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-450 font-bold uppercase tracking-wider">Destination Account</span>
                                    <span className="font-mono font-extrabold text-slate-800">********1234</span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* Sticky Save Changes CTA Bar */}
            {isFormChanged() && (
                <div className="fixed bottom-[64px] left-0 right-0 p-3 bg-white border-t border-slate-150/60 flex items-center justify-between z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.04)] px-4">
                    <div className="text-left">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block animate-pulse">Unsaved Profile Changes</span>
                        <span className="text-xs font-bold text-slate-500 mt-0.5 block">Tap Save to sync updates.</span>
                    </div>
                    
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-slate-900 hover:bg-slate-850 text-white rounded-xl py-2.5 px-5 text-xs font-black uppercase tracking-wider shadow-md active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                        {loading ? (
                            <RefreshCw className="animate-spin" size={12} />
                        ) : (
                            <>
                                <Save size={12} /> Save Changes
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Bottom Sheet Drawer: Missing items list */}
            {showMissingDrawer && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center transition-opacity duration-300 animate-fade-in" onClick={() => setShowMissingDrawer(false)}>
                    <div 
                        className="w-full bg-white rounded-t-[2rem] max-h-[80vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden pb-6"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0"></div>
                        
                        <div className="px-6 pb-4 border-b border-slate-100 text-center">
                            <h2 className="text-base font-black text-slate-900 flex items-center justify-center gap-1.5">
                                <Sparkles size={16} className="text-indigo-600 animate-pulse" /> Complete Profile Details
                            </h2>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                Complete missing steps to unlock higher priority visibility +22%
                            </p>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto px-6 py-4 space-y-2">
                            {missingItems.length === 0 ? (
                                <div className="text-center py-8 text-emerald-600 font-extrabold text-sm flex flex-col items-center gap-2">
                                    <Check size={28} className="bg-emerald-50 p-1 rounded-full border border-emerald-100 shadow-xs" />
                                    <span>Profile is 100% complete!</span>
                                </div>
                            ) : (
                                missingItems.map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleScrollToMissing(item)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 hover:border-indigo-400 rounded-2xl flex items-center justify-between text-left transition-all active:scale-[0.99] cursor-pointer"
                                    >
                                        <div className="space-y-0.5">
                                            <span className="block text-xs font-black text-slate-805">{item.name}</span>
                                            <span className="block text-[8px] text-slate-400 uppercase tracking-widest font-black">Needs completion</span>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400" />
                                    </button>
                                ))
                            )}
                        </div>
                        
                        <div className="px-6 pt-2">
                            <button
                                onClick={() => setShowMissingDrawer(false)}
                                className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-wider shadow"
                            >
                                Close List
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Sheet Drawer: UPI Payments Config Sheet */}
            {showPaymentDrawer && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center transition-opacity duration-300 animate-fade-in" onClick={() => setShowPaymentDrawer(false)}>
                    <div 
                        className="w-full bg-white rounded-t-[2rem] max-h-[80vh] flex flex-col shadow-2xl animate-slide-up overflow-hidden pb-6"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag Handle */}
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0"></div>
                        
                        <div className="px-6 pb-4 border-b border-slate-100 text-center">
                            <h2 className="text-base font-black text-slate-900">Configure Online Payments</h2>
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                Receive direct digital checkouts from Indore/Vadodara clients.
                            </p>
                        </div>
                        
                        <div className="flex-grow overflow-y-auto px-6 py-4">
                            {paymentStep === 1 ? (
                                <div className="space-y-5 py-2">
                                    <h3 className="text-xs font-black text-slate-800 text-center leading-normal">
                                        Do you want to accept online UPI/prepaid payments from customers?
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3.5">
                                        <button
                                            onClick={() => setPaymentStep(2)}
                                            className="p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all cursor-pointer active:scale-95"
                                        >
                                            <span className="block font-black text-slate-800 text-xs">Yes, Enable</span>
                                            <span className="block text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">Prepaid Orders</span>
                                        </button>
                                        <button
                                            onClick={() => handleSavePaymentSettings(false)}
                                            disabled={loading}
                                            className="p-4 rounded-2xl border-2 border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-left transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                                        >
                                            <span className="block font-black text-slate-805 text-xs">No, Keep Cash</span>
                                            <span className="block text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">Visit Only</span>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 py-2">
                                    <div className="space-y-1.5 text-left">
                                        <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">
                                            UPI ID <span className="text-red-500 font-bold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={upiId}
                                            onChange={e => setUpiId(e.target.value)}
                                            placeholder="example@upi"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all placeholder:text-slate-300"
                                        />
                                        {upiError && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{upiError}</p>}
                                    </div>

                                    <div className="space-y-1.5 text-left">
                                        <label className="block text-[8px] font-black text-slate-450 uppercase tracking-widest ml-1">
                                            Merchant Display Name <span className="text-slate-400 font-normal uppercase font-bold text-[8px]">(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={upiDisplayName}
                                            onChange={e => setUpiDisplayName(e.target.value)}
                                            placeholder={form.shopName || "Green Valley Grocers"}
                                            className="w-full bg-slate-50 border border-slate-205 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-650 transition-all placeholder:text-slate-300"
                                        />
                                        <p className="text-[9px] text-slate-400 font-semibold leading-relaxed ml-1">
                                            Shown to nearby clients during checkout verification.
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleSavePaymentSettings(true)}
                                        disabled={loading}
                                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 mt-4"
                                    >
                                        {loading ? <RefreshCw className="animate-spin inline" size={14} /> : "Save Payment Details"}
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 pt-2">
                            <button
                                onClick={() => setShowPaymentDrawer(false)}
                                className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-500 font-black text-xs uppercase tracking-wider"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileSellerProfile;
