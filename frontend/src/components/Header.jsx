import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AisleLogo from './AisleLogo';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isExplorePage = location.pathname === '/explore';

    // Live counts cycling state
    const [liveTextIndex, setLiveTextIndex] = useState(0);
    const liveTicks = [
        "8 Businesses Active",
        "92 Products Today",
        "Vadodara Live"
    ];

    const navLinks = [
        { name: 'Explore', href: '/explore' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'For Businesses', href: '/for-shops' },
        { name: 'Home Businesses', href: '/home-business', isSpecial: true },
        { name: 'About', href: '/about' }
    ];

    const activeIndex = navLinks.findIndex(link => location.pathname === link.href);
    const linkRefs = useRef([]);
    const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setLiveTextIndex(prev => (prev + 1) % liveTicks.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const updateSlider = () => {
            if (activeIndex !== -1 && linkRefs.current[activeIndex]) {
                const element = linkRefs.current[activeIndex];
                setSliderStyle({
                    left: element.offsetLeft,
                    width: element.offsetWidth,
                    opacity: 1
                });
            } else {
                setSliderStyle(prev => ({ ...prev, opacity: 0 }));
            }
        };

        updateSlider();
        window.addEventListener('resize', updateSlider);
        // Small timeout for layout cycle
        const timer = setTimeout(updateSlider, 100);
        return () => {
            window.removeEventListener('resize', updateSlider);
            clearTimeout(timer);
        };
    }, [activeIndex, location.pathname]);

    const handleNavigation = (path) => {
        setIsMenuOpen(false);
        if (path.startsWith('/#')) {
            const element = document.getElementById(path.substring(2));
            if (element) { element.scrollIntoView({ behavior: 'smooth' }); }
        } else { navigate(path); }
    };

    return (
        <header 
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled 
                    ? 'bg-white/75 backdrop-blur-[20px] border-b border-white/40 shadow-lg py-3' 
                    : 'bg-transparent border-b border-transparent py-5 shadow-none'
            }`}
        >
            <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="flex items-center justify-between">

                    {/* Logo Section & Inline Live Badge */}
                    <div className="flex items-center gap-4">
                        <Link
                            to="/"
                            className="flex items-center transform hover:scale-102 transition-all duration-300"
                        >
                            <AisleLogo 
                                imgClassName={`w-auto object-contain transition-all duration-500 ${
                                    isScrolled ? 'h-[36px]' : 'h-[44px]'
                                }`} 
                            />
                        </Link>
                        
                        {/* Integrated Live Badge - Cycles dynamic count text */}
                        <div className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 uppercase tracking-wider shadow-sm select-none transition-all duration-500">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-emerald-800">Live Now</span>
                            <span className="text-emerald-400 font-normal">|</span>
                            <span className="text-slate-600 transition-all duration-500 inline-block min-w-[110px] text-left">
                                {liveTicks[liveTextIndex]}
                            </span>
                        </div>
                    </div>

                    {/* Desktop Navigation - Centered Floating Pill */}
                    <nav className="hidden md:flex items-center bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/40 p-1.5 rounded-full relative z-10 shadow-inner backdrop-blur-sm">
                        
                        {/* Apple-style Sliding pink-tinted background pill */}
                        <div 
                            className="absolute bg-rose-100/70 dark:bg-rose-950/40 rounded-full shadow-sm border border-rose-200/50 transition-all duration-500 ease-out -z-10"
                            style={{
                                left: `${sliderStyle.left}px`,
                                width: `${sliderStyle.width}px`,
                                opacity: sliderStyle.opacity,
                                height: 'calc(100% - 12px)',
                                top: '6px'
                            }}
                        />

                        {navLinks.map((link, idx) => {
                            const isActive = location.pathname === link.href;
                            
                            if (link.isSpecial) {
                                return (
                                    <Link
                                        key={link.name}
                                        to={link.href}
                                        ref={el => linkRefs.current[idx] = el}
                                        className={`px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all duration-300 flex items-center gap-1.5 relative z-10 ${
                                            isActive 
                                                ? 'text-teal-600 bg-amber-500/10 border border-amber-500/20' 
                                                : 'text-teal-700 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20/30 shadow-sm'
                                        }`}
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
                                        <span>Home Businesses</span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    ref={el => linkRefs.current[idx] = el}
                                    className={`px-4 py-2 rounded-full text-xs font-semibold relative z-10 transition-colors duration-300 flex items-center gap-1.5 ${
                                        isActive 
                                            ? 'text-teal-600 font-bold' 
                                            : 'text-slate-600 hover:text-teal-600'
                                    }`}
                                >
                                    {isActive && <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-fade-in"></span>}
                                    <span>{link.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            className="text-gray-700 font-semibold hover:text-teal-600 transition-colors duration-300" 
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </Button>
                        <Button
                            className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                            onClick={() => navigate('/register')}
                        >
                            {isExplorePage ? "Signup to Connect" : "Get Started"}
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-gray-700">
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 mt-3 p-4 animate-slide-down shadow-xl">
                    <nav className="space-y-3">
                        {navLinks.map((link) => (
                            <button 
                                key={link.name} 
                                onClick={() => handleNavigation(link.href)} 
                                className={`block w-full text-left font-semibold py-2 px-3 rounded-xl transition-all duration-300 ${
                                    location.pathname === link.href 
                                        ? 'bg-teal-50 text-teal-600' 
                                        : 'text-gray-700 hover:bg-slate-50'
                                }`}
                            >
                                {link.isSpecial ? "✨ Home Businesses" : link.name}
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;