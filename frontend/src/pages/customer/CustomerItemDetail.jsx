import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaMapMarkerAlt, FaStore, FaDirections, FaRegHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useSidebarState } from '../../context/SidebarStateContext';
import { useInterested } from '../../context/InterestedContext';
import ConfidenceSignal from '../../components/customer/common/ConfidenceSignal';
import AuthModal from '../../components/auth/AuthModal';

const CustomerItemDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [isInterested, setIsInterested] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const { user } = useAuth();
    const { signalItemClick } = useSidebarState();
    const { items, updateQuantity } = useInterested();

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const { data } = await axios.get(`/api/customer/product/${id}`);
                setItem(data);
                signalItemClick(data);
            } catch (error) {
                console.error("Failed", error);
            }
        };
        fetchDetail();
    }, [id]);



    // Check if already interested based on context items
    useEffect(() => {
        if (item && items.find(i => i.productId === item._id)) {
            setIsInterested(true);
        }
    }, [item, items]);

    const handleInterest = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        try {
            // STEP 1: Soft Reservation (API Call)
            const res = await axios.post('/api/requests/create', {
                productId: item._id,
                productName: item.name,
                sellerId: item.shop._id || item.shopId,
                sellerShopName: item.shop.name || item.shopName,
                // Valid for 2 mins by default
            }, {
                headers: { Authorization: `Bearer ${user.token}` }
            });

            // STEP 2: Local Context Update (Visual feedback)
            updateQuantity({
                productId: item._id,
                name: item.name,
                price: item.price,
                shopId: item.shop._id || item.shopId,
                shopName: item.shop.name || item.shopName,
                imageUrl: item.imageUrl,
                requestId: res.data._id, // Track ID
                status: 'PENDING_CONFIRMATION'
            }, 1);

            setIsInterested(true);

        } catch (error) {
            console.error("Interest failed", error);
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            }
        }
    };

    if (!item) return <div className="p-8 text-center text-gray-400">Loading...</div>;

    return (
        <div className="bg-white min-h-screen pb-24">
            {/* Header Image Area */}
            <div className="relative bg-gray-100 h-64 flex items-center justify-center">
                {item.imageUrl ? (
                    <img src={item.imageUrl} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-6xl text-gray-300 font-bold">{item.name[0]}</div>
                )}
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 bg-white/80 p-3 rounded-full shadow-sm backdrop-blur"
                >
                    <FaArrowLeft className="text-gray-800" />
                </button>
            </div>

            <div className="p-5 -mt-6 bg-white rounded-t-3xl relative z-10">
                {/* Product Title */}
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-2xl font-bold text-gray-900">₹{item.price}</span>
                    <span className="text-sm text-gray-500 font-medium">(approx)</span>
                </div>

                {/* Status Badge */}
                <div className="mt-4 flex items-center gap-3">
                    {item.stockStatus === 'OUT_OF_STOCK' ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-black rounded-lg uppercase tracking-wider">
                            Out of Stock
                        </span>
                    ) : (
                        <ConfidenceSignal
                            level={item.confidence?.level || 'medium'}
                            shopStatus={'OPEN'}
                            showTooltip={true}
                        />
                    )}

                    {item.stockStatus === 'LIMITED' && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-black rounded-lg uppercase tracking-wider animate-pulse">
                            Limited Stock
                        </span>
                    )}
                </div>

                <hr className="my-6 border-gray-100" />

                {/* Shop Card */}
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:border-black transition-colors cursor-pointer"
                    onClick={() => navigate(`/checkout/${item.shopId}`)}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center text-white">
                            <FaStore />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">{item.shopName}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">View shop location & details</p>
                            <span className="text-xs font-bold text-green-600 mt-1 block">Open Now</span>
                        </div>
                        <button className="text-xs font-bold bg-gray-100 px-3 py-2 rounded-lg">
                            View
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="fixed bottom-0 left-0 right-0 z-20">
                    <div className="max-w-2xl mx-auto w-full p-4 bg-white border-t border-gray-100 flex gap-3">
                        <button
                            disabled={item.stockStatus === 'OUT_OF_STOCK'}
                            onClick={() => handleInterest()}
                            className={`flex-1 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border
                                ${item.stockStatus === 'OUT_OF_STOCK'
                                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                                    : isInterested
                                        ? 'bg-red-50 text-red-500 border-red-100'
                                        : 'bg-white border-slate-200 text-slate-900 shadow-sm hover:bg-slate-50'
                                }
                            `}
                        >
                            {item.stockStatus === 'OUT_OF_STOCK' ? (
                                <span>Unavailble</span>
                            ) : (
                                <>
                                    <FaRegHeart className={isInterested ? 'fill-current' : ''} />
                                    {isInterested ? 'Interested' : 'Im Interested'}
                                </>
                            )}
                        </button>
                        <button
                            className="flex-[2] py-3.5 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                            onClick={() => navigate(`/checkout/${item.shopId}`)}
                        >
                            <FaDirections /> Visit Shop
                        </button>
                    </div>
                </div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialView="register"
            />
        </div>
    );
};

const formatStatus = (s) => s.charAt(0) + s.slice(1).toLowerCase();

export default CustomerItemDetail;
