import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaStore, FaUser, FaShieldAlt, FaMapMarkerAlt, FaCamera, FaSave,
    FaSearch, FaCheckCircle, FaTrash, FaPlus, FaClock, FaPhone,
    FaEnvelope, FaIdCard, FaCalendarAlt, FaPen, FaLock, FaExclamationCircle,
    FaUserShield, FaExclamationTriangle, FaCreditCard
} from 'react-icons/fa';
import { SHOP_TYPE_CONFIG } from '../../utils/shopTypeConfig';
import PaymentSetupModal from '../../components/seller/PaymentSetupModal';

const SellerProfile = () => {
    const { user, token, checkUserStatus } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('shop'); // shop, seller, security, payment

    // Payment Setup Modal State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentModalStep, setPaymentModalStep] = useState(1);

    // Face Status for Security Tab
    const [faceStatus, setFaceStatus] = useState(null);

    // Payment Settings from dedicated collection
    const [paymentSettings, setPaymentSettings] = useState(null);

    // Visual Asset Upload State
    const fileInputRef = useRef(null);
    const [activeAssetType, setActiveAssetType] = useState(null);

    // Form State
    const [form, setForm] = useState({
        // Shop Details
        shopName: user?.shopDetails?.shopName || '',
        shopType: user?.shopDetails?.shopType || 'Electronics & Tools',
        phone: user?.phone || '',
        openingTime: user?.shopDetails?.openingTime || '09:00',
        closingTime: user?.shopDetails?.closingTime || '20:00',
        address: user?.shopDetails?.address || '',
        lat: user?.shopDetails?.shopLocation?.coordinates?.[1] || null,
        lng: user?.shopDetails?.shopLocation?.coordinates?.[0] || null,
        visualAssets: user?.shopDetails?.visualAssets || [],

        // Seller Details
        ownerName: user?.name || '',
        email: user?.email || '',
        mobile: user?.phone || ''
    });

    useEffect(() => {
        if (token) {
            fetchFaceStatus();
            fetchPaymentSettings();
        }
    }, [token]);

    const fetchPaymentSettings = async () => {
        try {
            const res = await fetch('/api/seller/payment-settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPaymentSettings(data.settings);
            }
        } catch (error) {
            console.error("Failed to fetch payment settings");
        }
    };

    const fetchFaceStatus = async () => {
        try {
            const res = await fetch('/api/seller/face-update-status', {
                headers: {
                    'Authorization': 'Bearer ' + token
                }
            });
            if (res.ok) {
                const data = await res.json();
                setFaceStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch face status");
        }
    };

    const shopTypeKey = user?.shopDetails?.shopType || "GROCERY_KIRANA";
    const allowedCategories = SHOP_TYPE_CONFIG[shopTypeKey]?.categories || [];

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/seller/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
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
                alert("Profile changes saved!");
            } else {
                const data = await res.json();
                alert(data.message || "Update failed");
            }
        } catch (error) {
            console.error(error);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    const handleDetectLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setForm(prev => ({
                    ...prev,
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }));
            });
        }
    };

    // VISUAL ASSET HANDLERS
    const handleAssetClick = (type) => {
        setActiveAssetType(type);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleAssetUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !activeAssetType) return;

        // Reset input so same file selection triggers change again if needed
        e.target.value = '';

        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', activeAssetType);

        try {
            setLoading(true); // Reuse global loading or local
            const res = await fetch('/api/seller/visual-assets', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token
                },
                body: formData
            });

            if (res.ok) {
                alert("Image uploaded successfully!");
                await checkUserStatus(); // Refresh Context (which updates User object)
            } else {
                const data = await res.json();
                alert(data.message || "Upload failed");
            }
        } catch (error) {
            console.error("Asset Upload Error", error);
            alert("Upload failed due to network error.");
        } finally {
            setLoading(false);
            setActiveAssetType(null);
        }
    };

    // Helper to clean up image paths for frontend display
    const cleanUrl = (path) => {
        if (!path) return null;
        // Fix Windows backslashes
        let clean = path.replace(/\\/g, '/');
        // Ensure strictly relative paths (like "uploads/file.jpg") start with slash
        if (clean.startsWith('uploads/')) {
            clean = '/' + clean;
        }
        return clean;
    };

    const getShopBanner = () => {
        // Priority 1: Photos Array
        if (user?.shopDetails?.photos?.length > 0) {
            return cleanUrl(user.shopDetails.photos[0]);
        }
        // Priority 2: Visual Assets (Shop Front)
        const frontAsset = user?.shopDetails?.visualAssets?.find(a => a.type === 'SHOP_FRONT');
        if (frontAsset?.url) {
            return cleanUrl(frontAsset.url);
        }
        // Fallback
        return "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";
    };

    return (
        <div className="min-h-screen bg-[#FDFCF8] pb-20 font-sans">
            {/* 1. Header Banner */}
            <div className="max-w-7xl mx-auto px-4 pt-6">
                <div className="h-48 md:h-64 rounded-[40px] overflow-hidden relative shadow-lg">
                    <img
                        src={getShopBanner()}
                        className="w-full h-full object-cover"
                        alt="Shop Banner"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80";
                        }}
                    />
                    <div className="absolute inset-0 bg-black/10"></div>
                    {/* Banner Edit Hint (Optional, kept subtle) */}
                    <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/30">
                        Display Image
                    </div>
                </div>

                {/* 2. Overlapping Identity Card */}
                <div className="max-w-4xl mx-auto -mt-20 relative z-10">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-100 flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center border-4 border-white shadow-md overflow-hidden shrink-0">
                                {user?.faceData ? (
                                    <img src={cleanUrl(user.faceData)} className="w-full h-full object-cover scale-110" alt="Verified Face" />
                                ) : (
                                    <FaUser size={40} className="text-slate-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm" title="Identity Verified & Locked">
                                <FaLock size={10} />
                            </div>
                        </div>

                        <div className="flex-grow">
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-slate-800">{form.shopName || user?.name}</h1>
                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">
                                    VERIFIED SELLER
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-slate-400 text-xs font-bold">
                                <span className="bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">{form.shopType}</span>
                                <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-blue-500" /> {form.lat ? 'Location Set' : 'Location Pending'}</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Tab Navigation */}
                    <div className="flex items-center gap-8 mt-6 px-8">
                        <button
                            onClick={() => setActiveTab('shop')}
                            className={`flex items-center gap-2 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'shop' ? 'border-stone-800 text-stone-800' : 'border-transparent text-slate-400'}`}
                        >
                            <FaStore /> Shop Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('seller')}
                            className={`flex items-center gap-2 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'seller' ? 'border-stone-800 text-stone-800' : 'border-transparent text-slate-400'}`}
                        >
                            <FaUser /> Seller Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-2 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'security' ? 'border-stone-800 text-stone-800' : 'border-transparent text-slate-400'}`}
                        >
                            <FaShieldAlt /> Security
                        </button>
                        <button
                            onClick={() => setActiveTab('payment')}
                            className={`flex items-center gap-2 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'payment' ? 'border-stone-800 text-stone-800' : 'border-transparent text-slate-400'}`}
                        >
                            <FaCreditCard /> Payment Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Main Content Area */}
            <div className="max-w-4xl mx-auto px-4 mt-8">
                {/* Modals for reuse */}
                <PaymentSetupModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onRefresh={checkUserStatus}
                    initialStep={paymentModalStep}
                />

                {activeTab === 'shop' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Public Business Info</h2>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">This information is visible to customers.</p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-[#1e293b] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg"
                            >
                                <FaSave /> Save Shop Changes
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Name</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-stone-200 transition-all"
                                            value={form.shopName}
                                            onChange={e => setForm({ ...form, shopName: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Type <FaStore className="inline ml-1" /></label>
                                            <input
                                                type="text"
                                                readOnly
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 outline-none"
                                                value={form.shopType}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                value={form.phone}
                                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Hours</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="time"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                    value={form.openingTime}
                                                    onChange={e => setForm({ ...form, openingTime: e.target.value })}
                                                />
                                                <FaClock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            </div>
                                            <span className="text-slate-300">-</span>
                                            <div className="flex-1 relative">
                                                <input
                                                    type="time"
                                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                                    value={form.closingTime}
                                                    onChange={e => setForm({ ...form, closingTime: e.target.value })}
                                                />
                                                <FaClock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Address</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none h-24 resize-none"
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Shop Ops Location</span>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${form.lat ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                                            <FaMapMarkerAlt className={form.lat ? 'text-emerald-500' : 'text-red-500'} size={20} />
                                            <div>
                                                <p className={`text-xs font-black ${form.lat ? 'text-emerald-700' : 'text-red-700'}`}>
                                                    {form.lat ? 'Location Set ✓' : 'Location Not Set'}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 mt-1">
                                                    {form.lat ? `${form.lat.toFixed(6)}, ${form.lng.toFixed(6)}` : 'Set your location to be visible to customers.'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleDetectLocation}
                                            className="w-full bg-[#3b82f6] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-md active:scale-95"
                                        >
                                            <FaMapMarkerAlt /> Auto-Detect My Location
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visual Assets</span>
                                        <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Smart Analysis</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['SHOP FRONT', 'SHOP INTERIOR', 'PRODUCT SHELF', 'OWNER'].map((assetTitle) => {
                                            const assetType = assetTitle.replace(' ', '_');
                                            let assetData = user?.shopDetails?.visualAssets?.find(a => a.type === assetType);
                                            let imageUrl = assetData?.url ? cleanUrl(assetData.url) : null;
                                            if (assetType === 'SHOP_FRONT' && !imageUrl && user?.shopDetails?.photos?.length > 0) {
                                                imageUrl = cleanUrl(user.shopDetails.photos[0]);
                                            }
                                            return (
                                                <div
                                                    key={assetTitle}
                                                    onClick={() => handleAssetClick(assetType)}
                                                    className="aspect-square bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center p-2 hover:bg-white hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                                                >
                                                    {imageUrl ? (
                                                        <>
                                                            <img
                                                                src={imageUrl}
                                                                className="absolute inset-0 w-full h-full object-cover"
                                                                alt={assetTitle}
                                                                onError={(e) => { e.target.style.display = 'none'; }}
                                                            />
                                                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <FaCamera className="text-white mb-1" />
                                                                <span className="text-[8px] font-bold text-white uppercase">Change</span>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FaCamera size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors mb-2" />
                                                            <span className="text-[8px] font-black text-slate-400 group-hover:text-blue-600">{assetTitle}</span>
                                                        </>
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
                                        onChange={handleAssetUpload}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'seller' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account & Identity</h2>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Manage your professional identity.</p>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-[#1e293b] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg"
                            >
                                <FaSave /> Update Personal Profile
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl shadow-inner text-sm">
                                    <FaCalendarAlt />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Member Since</p>
                                    <p className="font-black text-slate-700 uppercase tracking-tight text-sm">Jan 2024</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl shadow-inner text-sm">
                                    <FaIdCard />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Seller ID</p>
                                    <p className="font-mono text-[10px] font-black text-slate-700 uppercase tracking-tight">SL-{user?._id?.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl shadow-inner text-sm">
                                    <FaCheckCircle />
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Status</p>
                                    <p className="font-black text-emerald-600 uppercase tracking-tight text-sm">Active</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-8 border border-stone-100 shadow-sm space-y-8">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Information</h3>
                            <div className="grid gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Owner Full Name</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-xl shadow-inner group">
                                            <FaUser />
                                        </div>
                                        <input
                                            value={form.ownerName}
                                            onChange={e => setForm({ ...form, ownerName: e.target.value })}
                                            className="grow p-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all uppercase text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-xl shadow-inner">
                                            <FaEnvelope />
                                        </div>
                                        <div className="grow relative text-sm font-black text-slate-400 py-4 bg-slate-50 border border-slate-100 rounded-2xl px-4 uppercase">
                                            {form.email}
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">
                                                <FaCheckCircle /> Verified
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mobile Number</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center text-xl shadow-inner">
                                            <FaPhone />
                                        </div>
                                        <input
                                            value={form.mobile}
                                            onChange={e => setForm({ ...form, mobile: e.target.value })}
                                            className="grow p-4 bg-slate-50/50 border border-slate-100 rounded-2xl font-black text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all uppercase text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account Security</h2>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Manage biometric security and access logs.</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide text-xs">
                                    <FaUserShield className="text-blue-500" /> Face Authentication
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border
                                    ${faceStatus?.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100'
                                        : faceStatus?.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'}
                                `}>
                                    {faceStatus?.status === 'PENDING' ? <><FaClock /> Pending Approval</>
                                        : faceStatus?.status === 'REJECTED' ? <><FaExclamationTriangle /> Request Rejected</>
                                            : <><FaCheckCircle /> Active (Verified)</>}
                                </span>
                            </div>

                            <div className="grid md:grid-cols-[1fr,2fr] gap-8 items-center bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden relative shadow-lg">
                                    <img
                                        src={user?.faceData || "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=80"}
                                        className="w-full h-full object-cover opacity-50 contrast-125"
                                        alt="Biometric"
                                    />
                                    <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
                                    <div className="absolute inset-0 border-[20px] border-slate-900/40"></div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                        Your face data is encrypted and used solely for secure login verification.
                                    </p>
                                    <button
                                        onClick={() => window.location.href = '/seller/settings'}
                                        className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-800 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                    >
                                        Update Biometric ID
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <FaLock className="text-slate-400" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Password</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold">Last changed: 3 months ago</p>
                                <button className="w-full py-3 bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Change Password</button>
                            </div>
                            <div className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm space-y-4">
                                <div className="flex items-center gap-3">
                                    <FaExclamationTriangle className="text-amber-500" />
                                    <h4 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Login Activity</h4>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold">Current session: Mumbai, India</p>
                                <button className="w-full py-3 bg-slate-50 text-slate-700 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">Manage Devices</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Account / Payment Settings</h2>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">Manage how you receive money from customers.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${paymentSettings?.acceptsOnlinePayment ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                    {paymentSettings?.acceptsOnlinePayment ? 'Online Payments Enabled' : 'Online Payments Disabled'}
                                </span>
                            </div>
                        </div>

                        {!paymentSettings?.acceptsOnlinePayment ? (
                            /* Case A: Not accepting online payments */
                            <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm flex flex-col items-center text-center space-y-6">
                                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center text-3xl">
                                    <FaCreditCard />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Online Payments</h3>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">Status: Not Participant</p>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto font-medium">
                                        Customers currently cannot pay you online. They will verify and pay on visit only.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setPaymentModalStep(1);
                                        setShowPaymentModal(true);
                                    }}
                                    className="px-8 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                >
                                    Enable Online Payments
                                </button>
                            </div>
                        ) : (
                            /* Case B: Accepting online payments */
                            <div className="space-y-6">
                                <div className="bg-white rounded-3xl p-8 border border-stone-100 shadow-sm space-y-8">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 flex items-center gap-2 uppercase tracking-wide text-xs">
                                            <FaCreditCard className="text-blue-500" /> Payment Details
                                        </h4>
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-100">
                                            <FaCheckCircle /> Status: Active
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Method</p>
                                                <p className="font-black text-slate-700 text-sm uppercase">UPI (Unified Payments Interface)</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Display Name</p>
                                                <p className="font-black text-slate-700 text-sm uppercase">{paymentSettings?.displayName || user?.shopDetails?.shopName}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">UPI ID</p>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-mono text-sm font-black text-slate-700 uppercase tracking-tight">
                                                        {paymentSettings?.upiId}
                                                    </p>
                                                    <FaShieldAlt className="text-slate-300" size={12} title="Masked for security" />
                                                </div>
                                            </div>
                                            <div className="pt-2">
                                                <button
                                                    onClick={() => {
                                                        setPaymentModalStep(2); // Skip Step 1 (Yes/No) and go to Step 2 (UPI Form)
                                                        setShowPaymentModal(true);
                                                    }}
                                                    className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-800 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                                                >
                                                    Edit Payment Settings
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <FaShieldAlt className="text-blue-500 mt-0.5" size={14} />
                                        <p className="text-[10px] text-blue-700/80 font-bold leading-relaxed">
                                            Your money flows directly to your bank account via your UPI ID. ShopLens does not hold your payments.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PaymentSetupModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                initialStep={paymentModalStep}
                onRefresh={() => {
                    checkUserStatus();
                    fetchPaymentSettings();
                }}
            />
        </div>
    );
};

export default SellerProfile;
