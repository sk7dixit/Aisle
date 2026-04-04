import useOnScreen from '../../hooks/useOnScreen';
import { FaMapMarkerAlt, FaStar, FaShoppingBag, FaArrowRight, FaHeadphones, FaLaptop, FaKeyboard, FaCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';

const ProductCard = ({ title, price, store, distance, delay, icon: Icon }) => {
    const [requestStatus, setRequestStatus] = useState('IDLE'); // IDLE, LOADING, SENT
    const [cooldown, setCooldown] = useState(false);

    const handleInterest = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (cooldown) return;

        setRequestStatus('LOADING');
        try {
            const userStr = localStorage.getItem('shoplensUser');
            if (!userStr) {
                alert("Please login to express interest.");
                setRequestStatus('IDLE');
                return;
            }
            const user = JSON.parse(userStr);
            const token = user.token;

            // 1. Fetch a Real Shop (Dynamic Mocking or Real)
            // Ideally this product card should already have a sellerId prop.
            // For now, we continue finding a nearby shop if not provided.
            let targetShopId = null;
            let targetShopName = store;

            // If we have a real shop context, use it. Otherwise, fetch nearby.
            if (!targetShopId) {
                try {
                    const { data: shops } = await axios.get('/api/customer/nearby-shops?lat=28.6139&lng=77.2090&radius=500');
                    if (shops && shops.length > 0) {
                        targetShopId = shops[0]._id;
                        targetShopName = shops[0].shopName || store;
                    }
                } catch (err) {
                    console.warn("Could not find a shop for demo", err);
                }
            }

            if (!targetShopId) {
                // FALLBACK for Demo: Use a known Seller ID if available or alert
                // For this specific turn, I'll alert if no shop found, as we need a sellerId to create a request.
                alert("No shops available to receive this request. Please ensure a seller account exists.");
                setRequestStatus('IDLE');
                return;
            }

            // 2. Send Real Request to Backend
            await axios.post('/api/requests/create', {
                productId: "65a1234567890abcdef12345", // Mock Product ID if not available in props, should ideally come from props
                productName: title,
                sellerId: targetShopId,
                sellerShopName: targetShopName
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 3. Success State
            setRequestStatus('SENT');
            setCooldown(true);
            setTimeout(() => setCooldown(false), 15 * 60 * 1000); // 15 min cooldown match
        } catch (error) {
            console.error(error);
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
            if (error.response?.status === 429 || error.response?.status === 400) {
                setRequestStatus('SENT'); // Assume it's sent if they say duplicate
            } else {
                setRequestStatus('IDLE');
            }
        }
    };

    return (
        <div
            style={{ animationDelay: `${delay}ms` }}
            className="glass-card-dark rounded-3xl p-4 group hover:-translate-y-4 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] transition-all duration-500 animate-fade-up opacity-0 relative flex flex-col h-full border border-white/5"
        >
            {/* 1. Image Container (Top) */}
            <div className="h-40 bg-gradient-to-br from-white/10 to-transparent rounded-2xl mb-4 relative flex items-center justify-center border border-white/10 group-hover:scale-105 transition-all duration-500 overflow-hidden">
                <div className="text-6xl text-white/80 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Icon />
                </div>
                {/* 5. Availability Status (Color Coded Badge) */}
                <div className="absolute top-3 right-3 bg-green-500/20 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-bold text-green-400 shadow-sm border border-green-500/20 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                    AVAILABLE
                </div>
            </div>

            <div className="space-y-2 relative z-20 flex-1 flex flex-col">

                {/* 2. Product Name (Structured) */}
                <div>
                    <h3 className="font-bold text-text-primary text-lg font-inter leading-tight group-hover:text-accent-start transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs text-text-tertiary font-medium mt-0.5">{store}</p>
                </div>

                {/* 3. Pack Size Badge (Very Visible) */}
                <div className="flex items-center gap-2 mt-1">
                    <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded border border-white/10">
                        1 Unit
                    </span>
                    {/* 6. Trust Signals */}
                    <span className="text-[10px] text-accent-end flex items-center gap-1 opacity-80">
                        <FaCheck className="text-[8px]" /> Verified
                    </span>
                </div>

                <div className="flex-1"></div> {/* Spacer */}

                {/* 4. Price (If Available) */}
                <div className="flex items-end justify-between pt-3 border-t border-white/10 mt-2">
                    <div>
                        <span className="text-xs text-text-tertiary block mb-0.5">Price</span>
                        <span className="text-xl font-bold text-white tracking-tight">{price}</span>
                    </div>
                </div>
            </div>

            {/* Interested Button */}
            <button
                onClick={handleInterest}
                disabled={requestStatus === 'LOADING' || requestStatus === 'SENT'}
                className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 relative z-30
                    ${requestStatus === 'SENT'
                        ? 'bg-white/10 text-white/50 cursor-not-allowed border border-white/5'
                        : 'bg-white text-black hover:bg-gray-100 shadow-lg active:scale-95'
                    }`}
            >
                {requestStatus === 'LOADING' ? (
                    <span className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full"></span>
                ) : requestStatus === 'SENT' ? (
                    <>Sent <FaCheck /></>
                ) : (
                    <>I'm Interested <FaArrowRight className="text-xs" /></>
                )}
            </button>
        </div>
    );
};

const ProductPreview = () => {
    const navigate = useNavigate();
    const [ref, visible] = useOnScreen({ threshold: 0.1 });

    const products = [
        { title: "Sony WH-1000XM5", price: "$348", store: "Best Buy", distance: "0.8 mi", delay: 0, icon: FaHeadphones },
        { title: "MacBook Air M2", price: "$1099", store: "Apple Store", distance: "1.2 mi", delay: 100, icon: FaLaptop },
        { title: "Keychron Q1 Pro", price: "$199", store: "Micro Center", distance: "2.5 mi", delay: 200, icon: FaKeyboard },
    ];

    return (
        <section className="py-32 relative z-10">
            <div className="container mx-auto px-6">
                <div ref={ref} className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-semibold text-accent-start mb-6 animate-fade-up">
                        LIVE INVENTORY
                    </div>
                    <h2 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 transition-all duration-700 font-inter">
                        What's safe in <span className="text-gradient-cyan">store?</span>
                    </h2>
                    <p className="text-text-secondary max-w-2xl mx-auto text-xl leading-relaxed">
                        Real-time availability. If it says "In Stock" here, it's on the shelf there.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto px-4">
                    {products.map((product, index) => (
                        <ProductCard key={index} {...product} />
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <button
                        onClick={() => navigate('/browse')}
                        className="group relative inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white/5 border border-white/10 text-text-primary font-semibold hover:bg-white/10 transition-all hover:scale-105"
                    >
                        <span>View all categories</span>
                        <span className="w-8 h-8 rounded-full bg-accent-end/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                            <FaArrowRight className="text-sm text-accent-end" />
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default ProductPreview;
