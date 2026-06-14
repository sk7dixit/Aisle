import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaMapMarkerAlt, FaDirections, FaRegClock, FaCircle, FaStar, FaHeart, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import { getGenericImage } from '../../utils/GenericImages';

const CustomerShopView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shopData, setShopData] = useState(null);
    const [activeCategory, setActiveCategory] = useState('');
    const [interestedItems, setInterestedItems] = useState({}); // { productId: true }
    const [imageLoaded, setImageLoaded] = useState(false);
    const categoryRefs = useRef({});

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const { data } = await axios.get(`/api/customer/shop/${id}`);
                setShopData(data);
                if (data.categories && data.categories.length > 0) {
                    setActiveCategory(data.categories[0].categoryName);
                }
            } catch (error) {
                console.error("Failed to fetch shop", error);
            }
        };
        fetchShop();
    }, [id]);

    const scrollToCategory = (catName) => {
        setActiveCategory(catName);
        const el = categoryRefs.current[catName];
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleDirections = () => {
        if (!shopData?.shop?.location) return;
        const query = `${shopData.shop.location.lat},${shopData.shop.location.lng}`;
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    };

    const handleProductInterest = async (productId, productName) => {
        if (interestedItems[productId]) return;

        try {
            const userStr = localStorage.getItem('aisleUser');
            if (!userStr) {
                // If not logged in, prompt or redirect. For now, simple alert or redirect to login.
                const proceed = window.confirm("You need to login to express interest. Go to login?");
                if (proceed) navigate('/login');
                return;
            }
            const token = JSON.parse(userStr).token;

            // 1. Optimistic UI Update
            setInterestedItems(prev => ({ ...prev, [productId]: true }));

            // 2. API Call
            await axios.post('/api/requests/create', {
                productId,
                productName,
                sellerId: shopData.shop._id,
                sellerShopName: shopData.shop.name
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

        } catch (error) {
            console.error("Failed to send request", error);
            // Revert optimistic update on error if needed
        }
    };

    if (!shopData) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="animate-pulse flex flex-col items-center">
                <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                <div className="h-3 w-48 bg-slate-200 rounded"></div>
            </div>
        </div>
    );

    const { shop, categories } = shopData;
    const shopImage = shop.shopImage || getGenericImage(shop.category || 'General');

    return (
        <div className="bg-[var(--bg-paper)] min-h-screen pb-20 font-sans">
            {/* 1. Shop Header */}
            <div className="relative w-full h-72 bg-[#181411]">
                <img
                    src={shopImage}
                    alt={shop.name}
                    className={`w-full h-full object-cover opacity-60 transition-opacity duration-500 ${imageLoaded ? 'opacity-60' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                />

                {/* Navbar Overlay */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-6 flex items-center justify-between z-20">
                    <button onClick={() => navigate(-1)} className="p-2.5 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/30 transition-colors">
                        <FaArrowLeft />
                    </button>
                    <div className="flex gap-3">
                        {/* Directions Btn */}
                        <button onClick={handleDirections} className="px-4 py-2 bg-emerald-500/90 backdrop-blur-md rounded-full text-white hover:bg-emerald-500 transition-colors text-xs font-bold flex items-center gap-2 shadow-lg">
                            <FaDirections /> Get Directions
                        </button>
                    </div>
                </div>

                {/* Shop Info Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#181411] via-[#181411]/40 to-transparent flex flex-col justify-end p-6">
                    <span className="text-blue-200 font-bold text-[10px] uppercase tracking-wider mb-2 bg-blue-900/50 self-start px-2 py-1 rounded backdrop-blur-sm border border-blue-500/30">
                        {shop.category}
                    </span>
                    <h1 className="text-3xl font-extrabold text-white leading-tight mb-2 shadow-sm">{shop.name}</h1>
                    <div className="flex items-center gap-4 text-slate-300 text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                            <FaMapMarkerAlt className="text-slate-400" /> {shop.address?.split(',')[0]}
                        </span>
                        <span>•</span>
                        {shop.isOpen ? (
                            <span className="text-emerald-400 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-900/30 border border-emerald-500/30">
                                <FaCircle className="text-[6px] animate-pulse" /> Open Now
                            </span>
                        ) : (
                            <span className="text-rose-400 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-900/30 border border-rose-500/30">
                                <FaCircle className="text-[6px]" /> Closed
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. Availability Disclaimer (Critical) */}
            <div className="bg-amber-50 border-b border-amber-100 px-6 py-3 flex gap-3 items-center">
                <FaInfoCircle className="text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-800 font-medium leading-tight">
                    Start an interest request. Availability is subject to shop confirmation. <span className="font-bold">No payment or commitment yet.</span>
                </p>
            </div>

            {/* 3. Category Navigation (Sticky) */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm py-3 px-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {categories.map((cat) => (
                    <button
                        key={cat.categoryName}
                        onClick={() => scrollToCategory(cat.categoryName)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border ${activeCategory === cat.categoryName
                            ? 'bg-[var(--text-primary-brown)] text-white border-[var(--text-primary-brown)] shadow-md'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {cat.categoryName}
                    </button>
                ))}
            </div>

            {/* 4. Product Lists by Category */}
            <div className="px-4 py-6 space-y-8 max-w-[1440px] mx-auto">
                {categories.map((cat) => (
                    <div key={cat.categoryName} ref={el => categoryRefs.current[cat.categoryName] = el}>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {cat.categoryName}
                            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {cat.items.length}
                            </span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {cat.items.map((item) => (
                                <div key={item._id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 hover:border-blue-100 transition-colors">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-900 text-sm leading-snug mb-1">{item.name}</h4>
                                        <p className="text-xs text-slate-500 font-medium mb-3">{item.packSize || "Standard Unit"}</p>

                                        {/* Status / Price (Optional, avoiding price if sensitive, but price is good for info) */}
                                        <p className="text-sm font-bold text-slate-900">₹{item.price}</p>
                                    </div>

                                    {/* INTEREST BUTTON */}
                                    <div className="shrink-0">
                                        {interestedItems[item._id] ? (
                                            <button disabled className="px-4 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold flex items-center gap-2 border border-green-100 cursor-default animate-in zoom-in">
                                                <FaCheckCircle /> Interested
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleProductInterest(item._id, item.name)}
                                                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:border-[#E35336] hover:text-[#E35336] transition-all flex items-center gap-2 active:scale-95"
                                            >
                                                <FaHeart className="text-slate-300 group-hover:text-[#E35336]" /> Add to Interested
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default CustomerShopView;
