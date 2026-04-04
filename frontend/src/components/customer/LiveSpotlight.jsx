import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaBoxOpen, FaMapMarkerAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// Mock Data - In reality, you would pass this as props
const FEATURED_ITEMS = [
    {
        id: 'mock-tech',
        type: 'SHOP',
        title: 'Digital World Electronics',
        subtitle: 'Official Samsung & Sony Dealer',
        image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=800&q=80', // Electronics Store
        badge: 'Open Now',
        location: 'Manjalpur, Vadodara'
    },
    {
        id: 2,
        type: 'PRODUCT',
        title: 'Sony WH-1000XM5 Headphones',
        subtitle: 'Available at Digital World',
        image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80', // Headphones
        badge: 'In Stock',
        price: '₹24,990'
    },
    {
        id: 'mock-sharma',
        type: 'SHOP',
        title: 'Green Leaf Organic Grocers',
        subtitle: 'Fresh farm vegetables daily',
        image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', // Grocery
        badge: 'Fresh Arrival',
        location: 'Alkapuri, Vadodara'
    }
];

const LiveSpotlight = () => {
    const navigate = useNavigate();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    // Auto-Rotate Logic (Changes every 5 seconds)
    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true); // Start exit animation
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % FEATURED_ITEMS.length);
                setIsAnimating(false); // End animation (enter new slide)
            }, 500); // Wait for half a second fade out
        }, 5000); // 5 Seconds Timer

        return () => clearInterval(interval);
    }, []);

    const currentItem = FEATURED_ITEMS[currentIndex];

    return (
        <div className="w-full">
            {/* Section Header */}
            <div className="flex items-center space-x-3 mb-6 animate-fade-in delay-300">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E07A5F] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E07A5F]"></span>
                </span>
                <h2 className="text-[#3D405B]/50 font-black tracking-[0.2em] text-[10px] uppercase">
                    Live Now Nearby
                </h2>
            </div>

            {/* Layout Card - Solid White for Pop on Sand */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-white h-auto md:h-80 animate-fade-in delay-300 group shadow-sm border border-black/5">

                {/* The Content (Animated) */}
                <div
                    className={`relative w-full h-full flex flex-col md:flex-row items-center transition-all duration-500 ease-in-out ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                        }`}
                >

                    {/* Left: Image Side (Larger) */}
                    <div className="w-full md:w-[45%] h-56 md:h-full relative overflow-hidden">
                        <img
                            src={currentItem.image}
                            alt={currentItem.title}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                        {/* Tag Badge (Slide-in) */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentItem.id + "-type"}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                                className="absolute top-5 left-5 bg-black/60 backdrop-blur-md text-white text-[9px] font-black px-3.5 py-1.5 rounded-xl uppercase tracking-[0.2em] flex items-center gap-2 z-10"
                            >
                                {currentItem.type === 'SHOP' ? <><FaStore className="text-[#E07A5F]" /> Local Shop</> : <><FaBoxOpen className="text-[#E07A5F]" /> Hot Product</>}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right: Info Side */}
                    <div className="w-full md:w-[55%] p-8 md:p-12 flex flex-col justify-center text-left">

                        <div className="flex items-center justify-between mb-6 w-full">
                            <motion.span
                                key={currentItem.id + "-status"}
                                initial={{ boxShadow: "0 0 0px rgba(0,0,0,0)" }}
                                animate={{ boxShadow: "0 0 15px rgba(224, 122, 95, 0.2)" }}
                                transition={{ duration: 1.5, repeat: 1, repeatType: "reverse" }}
                                className={`text-[10px] font-black px-3.5 py-1.5 rounded-xl border uppercase tracking-widest ${currentItem.badge.includes('Open') || currentItem.badge === 'In Stock'
                                    ? 'text-[#81B29A] border-[#81B29A]/30 bg-[#81B29A]/5'
                                    : 'text-[#E07A5F] border-[#E07A5F]/30 bg-[#E07A5F]/5'
                                    }`}
                            >
                                {currentItem.badge}
                            </motion.span>
                            {currentItem.price && (
                                <span className="text-2xl font-black text-[#3D405B] tracking-tight">{currentItem.price}</span>
                            )}
                        </div>

                        <h3 className="text-2xl md:text-3xl font-black text-[#3D405B] mb-3 leading-tight uppercase tracking-tight line-clamp-2">
                            {currentItem.title}
                        </h3>

                        <p className="text-[#3D405B]/60 mb-8 text-[11px] md:text-xs font-bold uppercase tracking-widest leading-relaxed">
                            {currentItem.subtitle}
                            {currentItem.location && (
                                <span className="block mt-2 flex items-center gap-2 opacity-100 text-[#E07A5F]">
                                    <FaMapMarkerAlt className="opacity-70" /> {currentItem.location}
                                </span>
                            )}
                        </p>

                        <button
                            onClick={() => {
                                if (currentItem.type === 'SHOP') navigate(`/shop/${currentItem.id}`);
                            }}
                            className="relative group overflow-hidden w-full md:w-fit bg-[#E07A5F] text-white hover:bg-[#3D405B] px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] transition-all shadow-lg active:scale-95"
                        >
                            <span className="relative z-10">{currentItem.type === 'SHOP' ? 'Visit Store' : 'View Availability'}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-sweep duration-700" />
                        </button>
                    </div>

                </div>

                {/* Progress Bar */}
                <div className="absolute bottom-0 left-0 h-1 bg-[#E07A5F]/30 transition-all ease-linear w-full"
                    key={currentIndex} // Resets animation on change
                    style={{ width: '100%', animation: 'shrink 5s linear' }}
                />

            </div>
        </div>
    );
};

export default LiveSpotlight;
