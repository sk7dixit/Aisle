import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PageWrapper from '../components/common/PageWrapper';
import MobileHomeBusiness from '../components/mobile/MobileHomeBusiness';
import { useNavigate } from 'react-router-dom';
import { 
    Camera, FileText, MapPin, CheckCircle, ArrowRight, ChevronRight, 
    Star, MessageSquare, Gift, ChefHat, Palette, Scissors, 
    Award, TrendingUp, ShoppingBag, Plus, Home, Sparkles, 
    User, HelpCircle, ChevronDown, Check, DollarSign
} from 'lucide-react';

const HomeBusiness = () => {
    const navigate = useNavigate();
    const [activeFeatureTab, setActiveFeatureTab] = useState('dashboard');
    const [openFaqIndex, setOpenFaqIndex] = useState(null);

    const categories = [
        {
            icon: <ChefHat className="w-6 h-6 text-amber-600" />,
            title: "Homemade Food",
            items: ["Gourmet Pickles", "Crispy Papad", "Evening Snacks", "Fresh Chutneys"],
            color: "bg-amber-50 border-amber-100 text-amber-800"
        },
        {
            icon: <Sparkles className="w-6 h-6 text-pink-600" />,
            title: "Bakery & Sweets",
            items: ["Custom Cakes", "Choco Cookies", "Celebration Cupcakes", "Fudge Brownies"],
            color: "bg-pink-50 border-pink-100 text-pink-800"
        },
        {
            icon: <Palette className="w-6 h-6 text-teal-600" />,
            title: "Handmade Crafts",
            items: ["Festival Rakhi", "Acrylic/Canvas Art", "Crochet Bags", "Home Decor Items"],
            color: "bg-teal-50 border-teal-100 text-teal-800"
        },
        {
            icon: <Gift className="w-6 h-6 text-indigo-600" />,
            title: "Custom Gifts",
            items: ["Curated Gift Boxes", "Wedding Gift Favors", "Diwali Sweet Boxes", "Corporate Hampers"],
            color: "bg-indigo-50 border-indigo-100 text-indigo-800"
        },
        {
            icon: <Scissors className="w-6 h-6 text-rose-600" />,
            title: "Home Services",
            items: ["Custom Tailoring", "Daily Tiffin Service", "Bridal Beauty Services", "Tuition & Coaching"],
            color: "bg-rose-50 border-rose-100 text-rose-800"
        }
    ];

    const steps = [
        {
            number: "1",
            icon: <Camera className="w-6 h-6 text-emerald-600" />,
            title: "Create Your Product",
            desc: "Take fresh photos using Aisle's custom camera module or upload directly from your gallery. We guide you to capture the best angles.",
            badge: "Photography Guides"
        },
        {
            number: "2",
            icon: <FileText className="w-6 h-6 text-amber-600" />,
            title: "Add Details & Story",
            desc: "Specify your price, preparation time, and availability. Add a personal product story behind your recipe or creation to connect with buyers.",
            badge: "Story Builder"
        },
        {
            number: "3",
            icon: <MapPin className="w-6 h-6 text-indigo-600" />,
            title: "Get Discovered Nearby",
            desc: "Your page instantly goes live on Aisle's map view. Local customers searching for custom home creations in Vadodara or nearby can discover you.",
            badge: "Location Map"
        },
        {
            number: "4",
            icon: <ShoppingBag className="w-6 h-6 text-teal-600" />,
            title: "Receive & Manage Orders",
            desc: "Get notified when orders arrive. Track your order stages through New, Preparing, and Ready, and coordinate delivery details via built-in chats.",
            badge: "Simple Workflow"
        }
    ];

    const benefits = [
        {
            title: "No Store Needed",
            desc: "Start directly from your home kitchen, hobby desk, or studio. Zero commercial overhead costs.",
            icon: <Home className="w-5 h-5 text-teal-600" />
        },
        {
            title: "Free Product Listing",
            desc: "Create and publish up to 50 active home creations with zero upfront listing or listing renewal fees.",
            icon: <Gift className="w-5 h-5 text-teal-600" />
        },
        {
            title: "Local Customers First",
            desc: "Target high-intent local buyers within a 5-10 km radius. Minimize shipping complexity and costs.",
            icon: <MapPin className="w-5 h-5 text-teal-600" />
        },
        {
            title: "Custom Inquiries",
            desc: "Accept custom requests (like custom sizing, messages, or catering orders) via our interactive inbox.",
            icon: <MessageSquare className="w-5 h-5 text-teal-600" />
        },
        {
            title: "Super Easy Setup",
            desc: "No developer or coding skills required. Add creations, adjust pricing, and toggle drafts in seconds.",
            icon: <CheckCircle className="w-5 h-5 text-teal-600" />
        }
    ];

    const successStories = [
        {
            name: "Priya Sharma",
            business: "Homemade Pickles & Chutneys",
            location: "Vadodara, Gujarat",
            story: "I started with just 3 family recipes. By getting discovered on Aisle's local map, I have now served over 120+ households in my area. Custom requests for low-salt options helped me double my sales!",
            avatar: "/src/assets/images/female_seller_avatar.png",
            stat: "120+ Customers",
            tag: "Homemade Food"
        },
        {
            name: "Neha Goel",
            business: "Sweet Whisk Bakery",
            location: "Ahmedabad, Gujarat",
            story: "As a self-taught baker, getting custom orders used to be stressful over WhatsApp. Now, customer inquiries land directly in my Aisle Custom Requests dashboard, allowing me to coordinate and quote pricing instantly.",
            avatar: "/src/assets/images/female_avatar.png",
            stat: "12-15 Cakes/Week",
            tag: "Custom Cakes"
        }
    ];

    const faqs = [
        {
            q: "Do I need a commercial shop or shop license to list?",
            a: "No! Aisle is built specifically to support home entrepreneurs, hobby creators, and home cooks. You can register using your home address and start displaying your creations immediately. If local laws require basic registration (like FSSAI for home food in India), we guide you through adding those details."
        },
        {
            q: "Can I sell part-time or list items as 'Made-To-Order'?",
            a: "Absolutely. When adding a creation, you can toggle its mode between 'Ready Stock' (for items ready to buy now) or 'Made to Order' (for items requiring preparation). You can specify custom preparation times (e.g. 'Requires 2 days prep') so customers have clear expectations."
        },
        {
            q: "How do custom requests and order changes work?",
            a: "Customers can send a 'Custom Request Inquiry' explaining what they need (e.g., custom name embroidery, gluten-free, eggless). You receive this inquiry in your Special Inbox, where you can chat with the customer, agree on specifications, send a custom price quote, and convert it into a confirmed order once accepted."
        },
        {
            q: "How do I receive payments from buyers?",
            a: "Aisle supports both 'Prepaid' (online payments via UPI, card, or wallet) and 'Pay on Delivery'. The funds for prepaid orders are settled directly into your linked bank account upon order delivery confirmation, without high commission cuts."
        },
        {
            q: "Are there any listing fees or hidden charges?",
            a: "Listing creations on Aisle is completely free. We do not charge listing fees or monthly subscriptions for the basic seller tier. A small platform transaction fee is only applicable on processed digital sales, ensuring we only succeed when you do."
        }
    ];

    // CSS Collage Cards Data
    const collageCards = [
        {
            title: "Nani's Mango Pickle",
            category: "Homemade Pickles",
            price: "₹250",
            unit: "500g Jar",
            badge: "Low Salt",
            color: "from-amber-400 to-amber-600 animate-breathe delay-100",
            style: "top-4 left-6 z-10 scale-[0.95]"
        },
        {
            title: "Custom Anniversary Cake",
            category: "Custom Bakeries",
            price: "₹1,200",
            unit: "1.5 kg Eggless",
            badge: "Made-To-Order",
            color: "from-pink-500 to-rose-600 animate-breathe delay-200",
            style: "bottom-12 left-2 z-20 scale-100 hover:z-30"
        },
        {
            title: "Woven Crochet Shoulder Bag",
            category: "Handmade Crafts",
            price: "₹850",
            unit: "Custom Embroidery",
            badge: "2 Days Prep",
            color: "from-teal-400 to-teal-600 animate-breathe delay-300",
            style: "top-16 right-4 z-10 scale-[0.92]"
        },
        {
            title: "Premium Diwali Hamper",
            category: "Corporate Gift Boxes",
            price: "₹1,500",
            unit: "Assorted Delights",
            badge: "Custom Logo",
            color: "from-indigo-500 to-purple-600 animate-breathe delay-400",
            style: "bottom-4 right-10 z-20 scale-[0.97]"
        }
    ];

    return (
        <PageWrapper className="bg-[#FDFCF8] min-h-screen flex flex-col font-sans">
            {/* Desktop Experience (Frozen above 768px) */}
            <div className="hidden md:block">
                <Header />

            <main className="flex-grow pt-20 pb-20">
                
                {/* SECTION 1: HERO SECTION */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/50 via-[#FDFCF8] to-teal-50/30 py-20 px-6 sm:px-12 lg:px-20 border-b border-slate-100">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        
                        {/* Hero Text */}
                        <div className="lg:col-span-7 space-y-6 text-left">
                            <div className="inline-flex items-center gap-2 bg-amber-100/60 border border-amber-200/50 px-4 py-1.5 rounded-full text-xs font-bold text-amber-900 tracking-wide uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-amber-700 animate-spin" /> Newly Launched: Home Business Platform
                            </div>
                            
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-800 leading-tight tracking-tight text-balance">
                                Start Selling From Home.<br/>
                                <span className="text-teal-600">Reach Customers Nearby.</span>
                            </h1>
                            
                            <p className="text-base sm:text-lg text-slate-600 max-w-2xl font-medium leading-relaxed">
                                Whether you make pickles, cakes, handmade gifts, crochet products, custom rakhis, tiffin services, or anything unique, Aisle helps local customers discover and order directly from you.
                            </p>
                            
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <button 
                                    onClick={() => navigate('/seller/register')}
                                    className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-base py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    Start Your Home Business <ArrowRight className="w-5 h-5" />
                                </button>
                                <a 
                                    href="#success-stories"
                                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-base py-4 px-8 rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    See Success Stories
                                </a>
                            </div>
                        </div>

                        {/* Interactive Grid Collage */}
                        <div className="lg:col-span-5 relative h-[420px] w-full max-w-[450px] mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-tr from-teal-100/20 to-amber-100/20 rounded-full blur-3xl -z-10 transform scale-110"></div>
                            
                            {collageCards.map((card, idx) => (
                                <div 
                                    key={idx}
                                    className={`absolute w-[220px] rounded-2xl bg-white border border-slate-100 shadow-xl p-4 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:scale-105 hover:rotate-1 cursor-pointer ${card.style}`}
                                >
                                    <div className={`h-2.5 w-12 rounded-full mb-3 bg-gradient-to-r ${card.color}`}></div>
                                    <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block mb-1">{card.category}</span>
                                    <h4 className="font-bold text-slate-800 text-sm line-clamp-1 mb-2">{card.title}</h4>
                                    
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-2 mt-2">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Price</span>
                                            <span className="font-black text-slate-800 text-xs">{card.price}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Size</span>
                                            <span className="font-semibold text-slate-600 text-[10px]">{card.unit}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">{card.badge}</span>
                                        <div className="flex items-center gap-0.5 text-amber-500">
                                            <Star className="w-2.5 h-2.5 fill-current" />
                                            <span className="text-[10px] font-black text-slate-700">4.9</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* SECTION 2: WHAT CAN YOU SELL? */}
                <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">What Can You Sell From Home?</h2>
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Aisle supports multiple creative home categories</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {categories.map((cat, idx) => (
                            <div 
                                key={idx}
                                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-teal-500/30 flex flex-col justify-between h-full"
                            >
                                <div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mb-6 group-hover:bg-teal-50 group-hover:border-teal-100 transition-colors">
                                        {cat.icon}
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800 mb-4 tracking-tight">{cat.title}</h3>
                                    
                                    <ul className="space-y-2 mb-6">
                                        {cat.items.map((item, itemIdx) => (
                                            <li key={itemIdx} className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full text-center border ${cat.color} tracking-wide uppercase`}>
                                    Popular Local Choice
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 3: HOW IT WORKS */}
                <div className="py-20 bg-slate-900 text-slate-100 px-6 sm:px-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">How Aisle Works For Home Sellers</h2>
                            <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Four simple steps to launch your neighborhood storefront</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {steps.map((step, idx) => (
                                <div key={idx} className="relative group">
                                    <div className="w-14 h-14 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-6 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                                        {step.icon}
                                    </div>
                                    
                                    <div className="absolute top-0 right-0 text-7xl font-black text-slate-800/40 select-none pointer-events-none group-hover:text-teal-500/10 transition-colors">
                                        {step.number}
                                    </div>
                                    
                                    <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{step.desc}</p>
                                    
                                    <span className="inline-block text-[10px] font-bold bg-teal-900/50 border border-teal-800 text-teal-400 px-3 py-1 rounded-full tracking-wide uppercase">
                                        {step.badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* SECTION 4: WHY HOME BUSINESSES LOVE AISLE */}
                <div className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">Why Home Businesses Love Aisle</h2>
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Tailored for neighborhood creators and micro-entrepreneurs</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {benefits.map((benefit, idx) => (
                            <div 
                                key={idx}
                                className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow hover:border-slate-200/60"
                            >
                                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-5">
                                    {benefit.icon}
                                </div>
                                <h3 className="font-bold text-slate-800 text-base mb-2 tracking-tight">{benefit.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 5: BUILT ESPECIALLY FOR HOME CREATORS (Interactive Mockup Switcher) */}
                <div className="py-20 bg-teal-900/10 border-y border-teal-900/5 px-6 sm:px-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            
                            {/* Feature Selector info */}
                            <div className="lg:col-span-5 space-y-6 text-left">
                                <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight leading-tight text-balance">
                                    Built Especially For Home Creators
                                </h2>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    Forget generic spreadsheet listing interfaces. Aisle provides custom dashboards, photo wizards, and negotiation drawers designed specifically for home creators.
                                </p>
                                
                                <div className="space-y-3 pt-2">
                                    {[
                                        { id: 'dashboard', label: 'Home Business Dashboard', desc: 'Monitor creations, checkouts, and custom inquiries at a glance.' },
                                        { id: 'creations', label: 'Creations Manager', desc: 'Separate ready stock from made-to-order listings, check drafts.' },
                                        { id: 'requests', label: 'Custom Requests Inbox', desc: 'Accept custom requests, text details, and send price quotes.' },
                                        { id: 'growth', label: 'Local Growth Score', desc: 'Get suggestions (add photos, list stories) to reach local buyers.' }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveFeatureTab(tab.id)}
                                            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                                                activeFeatureTab === tab.id 
                                                    ? 'bg-white border-teal-500 shadow-md translate-x-1.5' 
                                                    : 'bg-transparent border-transparent hover:bg-white/40'
                                            }`}
                                        >
                                            <h3 className="font-bold text-slate-800 text-sm flex items-center justify-between">
                                                {tab.label}
                                                <ChevronRight className={`w-4 h-4 text-teal-600 transition-transform ${activeFeatureTab === tab.id ? 'translate-x-0.5' : 'opacity-0'}`} />
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 font-medium">{tab.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interactive Live-rendered Mockups */}
                            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 min-h-[380px] flex flex-col justify-between overflow-hidden">
                                
                                {activeFeatureTab === 'dashboard' && (
                                    <div className="space-y-6 animate-fade-in text-left">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">My Home Dashboard</h4>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Aisle Seller Hub</p>
                                            </div>
                                            <span className="text-[10px] bg-teal-50 border border-teal-100 text-teal-800 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Online</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Active Creations</span>
                                                <span className="text-2xl font-black text-slate-800">12</span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">In Preparation</span>
                                                <span className="text-2xl font-black text-slate-800">4</span>
                                            </div>
                                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Custom Inquiries</span>
                                                <span className="text-2xl font-black text-amber-600">3</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-teal-50/50 border border-teal-100/60 rounded-2xl p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                                                    <Award className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-800">Local Visibility: High</h5>
                                                    <p className="text-[10px] text-slate-500">Your kitchen is currently visible to 142 local buyers online.</p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-teal-700">92% Rating</span>
                                        </div>
                                    </div>
                                )}

                                {activeFeatureTab === 'creations' && (
                                    <div className="space-y-6 animate-fade-in text-left">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Creations Manager</h4>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Product Inventory</p>
                                            </div>
                                            <button className="bg-teal-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 shadow">
                                                <Plus className="w-3 h-3" /> Add Creation
                                            </button>
                                        </div>

                                        <div className="flex gap-2 border-b border-slate-100 pb-1">
                                            <span className="text-xs font-black text-teal-600 border-b-2 border-teal-600 pb-2 px-1">Ready Stock (4)</span>
                                            <span className="text-xs font-semibold text-slate-400 pb-2 px-1">Made-To-Order (8)</span>
                                            <span className="text-xs font-semibold text-slate-400 pb-2 px-1">Drafts (2)</span>
                                        </div>

                                        <div className="space-y-2">
                                            {[
                                                { name: "Homemade Mango Pickle (Glass Jar)", price: "₹250", info: "In Stock: 14 Jars", badge: "Ready Stock" },
                                                { name: "Eggless Chocolate Velvet Cake (1.5 kg)", price: "₹1,200", info: "Prep: 2 days required", badge: "Made-to-Order" }
                                            ].map((prod, idx) => (
                                                <div key={idx} className="flex items-center justify-between border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                                                    <div>
                                                        <h5 className="text-xs font-bold text-slate-800">{prod.name}</h5>
                                                        <span className="text-[10px] text-slate-400 font-semibold">{prod.info}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-slate-800 block">{prod.price}</span>
                                                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">{prod.badge}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeFeatureTab === 'requests' && (
                                    <div className="space-y-6 animate-fade-in text-left">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Custom Requests Inbox</h4>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Customer Pre-orders</p>
                                            </div>
                                            <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">3 Pending Inquiries</span>
                                        </div>

                                        <div className="border border-slate-150 rounded-2xl p-4 space-y-3 bg-slate-50">
                                            <div className="flex justify-between items-start border-b border-slate-200/50 pb-2">
                                                <div>
                                                    <h5 className="text-xs font-bold text-slate-800">Meera Sen (Corporate Order)</h5>
                                                    <p className="text-[10px] text-slate-400">Need 50 boxes of Homemade Laddoo by 20 October.</p>
                                                </div>
                                                <span className="text-[9px] bg-teal-500 text-white font-bold px-1.5 py-0.5 rounded-full">New Inq</span>
                                            </div>
                                            
                                            <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-white border border-slate-100 p-2 rounded-xl">
                                                <MessageSquare className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                                                <span className="truncate italic">"Can you pack in custom gold decorative boxes?"</span>
                                            </div>

                                            <div className="flex gap-2 justify-end pt-1">
                                                <button className="bg-slate-200 text-slate-700 font-bold text-[10px] px-3 py-1.5 rounded-lg">Decline</button>
                                                <button className="bg-teal-600 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1">
                                                    Accept & Quote Price
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeFeatureTab === 'growth' && (
                                    <div className="space-y-6 animate-fade-in text-left">
                                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-800">Neighborhood Growth Score</h4>
                                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Profile Performance</p>
                                            </div>
                                            <span className="text-xs font-bold text-teal-600">Level 3</span>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Circular Progress Display */}
                                            <div className="relative w-24 h-24 flex items-center justify-center border-8 border-teal-500 rounded-full bg-teal-50/20">
                                                <div className="text-center">
                                                    <span className="text-2xl font-black text-slate-800">94%</span>
                                                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Excellent</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 space-y-2">
                                                <h5 className="text-xs font-bold text-slate-800">Suggestions to boost ranking:</h5>
                                                <div className="space-y-1.5">
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                                        <Check className="w-3 h-3 text-teal-600" /> Wrote a product story behind Mango Pickle.
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                                                        <Check className="w-3 h-3 text-teal-600" /> Added 4 product photos for Crochets.
                                                    </p>
                                                    <p className="text-[10px] text-amber-600 flex items-center gap-1.5">
                                                        <TrendingUp className="w-3 h-3" /> Add 2 more photos of packaging to gain +6% reach.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="border-t border-slate-100 pt-4 text-center">
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-teal-600" /> Built for real-world home business environments
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* SECTION 6: SUCCESS STORIES */}
                <div id="success-stories" className="py-20 px-6 sm:px-12 max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">Creator Success Stories</h2>
                        <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Real stories from local home entrepreneurs on Aisle</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {successStories.map((story, idx) => (
                            <div 
                                key={idx}
                                className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-shadow relative"
                            >
                                <div className="absolute top-6 right-6 bg-teal-50 border border-teal-100 text-teal-800 text-[10px] font-bold px-3 py-1 rounded-full">
                                    {story.stat}
                                </div>

                                <div className="space-y-4">
                                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest block">{story.tag}</span>
                                    <p className="text-sm text-slate-600 italic leading-relaxed">
                                        "{story.story}"
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 border-t border-slate-100 pt-6 mt-6">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-50">
                                        {/* Since images might be relative or missing, we handle load failure gracefully */}
                                        <img 
                                            src={story.avatar} 
                                            alt={story.name} 
                                            className="w-full h-full object-cover" 
                                            onError={(e) => {
                                                e.target.src = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60";
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{story.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-medium">{story.business} • {story.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 7: FREQUENTLY ASKED QUESTIONS */}
                <div className="py-20 bg-slate-50 border-y border-slate-100 px-6 sm:px-12">
                    <div className="max-w-3xl mx-auto">
                        <div className="text-center mb-16 space-y-3">
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2">
                                <HelpCircle className="w-8 h-8 text-teal-600" /> Frequently Asked Questions
                            </h2>
                            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Everything you need to know about selling from home</p>
                        </div>

                        <div className="space-y-4">
                            {faqs.map((faq, idx) => {
                                const isOpen = openFaqIndex === idx;
                                return (
                                    <div 
                                        key={idx}
                                        className="bg-white border border-slate-150 rounded-2xl overflow-hidden transition-all duration-300 shadow-sm"
                                    >
                                        <button
                                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                                            className="w-full text-left p-5 flex items-center justify-between font-bold text-slate-800 hover:text-teal-600 transition-colors text-sm"
                                        >
                                            <span>{faq.q}</span>
                                            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
                                        </button>
                                        
                                        <div 
                                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                                                isOpen ? 'max-h-[300px] border-t border-slate-50' : 'max-h-0'
                                            }`}
                                        >
                                            <p className="p-5 text-xs text-slate-500 leading-relaxed font-medium bg-slate-50/50">
                                                {faq.a}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* SECTION 8: FINAL CTA */}
                <div className="max-w-5xl mx-auto mt-20 px-6 sm:px-12">
                    <div className="bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl p-8 sm:p-12 text-center text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.15),transparent)] pointer-events-none"></div>
                        
                        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                                Your Talent Deserves Customers.<br/>
                                Start Your Home Business Journey Today.
                            </h2>
                            <p className="text-sm text-teal-100 font-medium">
                                Join hundreds of women entrepreneurs, home chefs, and craft creators who are building a business right from their living room on Aisle.
                            </p>
                            
                            <div className="pt-4">
                                <button 
                                    onClick={() => navigate('/seller/register')}
                                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-base py-4 px-10 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 inline-flex items-center gap-2"
                                >
                                    Become a Home Business Seller
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </main>

            <Footer />
            </div>

            {/* Mobile Experience (Complete Redesign below 768px) */}
            <div className="block md:hidden">
                <MobileHomeBusiness />
            </div>
        </PageWrapper>
    );
};

export default HomeBusiness;
