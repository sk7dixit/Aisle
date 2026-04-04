import React, { useState, useEffect, useRef } from 'react';
import {
    X,
    Send,
    MessageSquare,
    ShoppingBag,
    Truck,
    Wrench,
    Store,
    Smartphone,
    HelpCircle,
    User,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
// import { useNotification } from '../../context/NotificationContext'; // Only if needed later

const SupportPanel = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [escalationStep, setEscalationStep] = useState('idle');
    const messagesEndRef = useRef(null);

    // Initial Greeting & RESET on Open
    useEffect(() => {
        if (isOpen) {
            setMessages([
                {
                    id: 1,
                    text: `Hi ${user?.name ? user.name.split(' ')[0] : 'there'}! 👋\nHow can we help you today?`,
                    sender: 'bot',
                    timestamp: new Date()
                }
            ]);
            setInputValue("");
            setActiveCategory(null);
            setIsTyping(false);
            setEscalationStep('idle');
        }
    }, [isOpen, user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // QUICK ACTION CHIPS
    const quickActions = [
        { id: 'order', label: 'Order Issue', icon: <ShoppingBag size={14} />, category: 'Shopping' },
        { id: 'booking', label: 'Booking Issue', icon: <Wrench size={14} />, category: 'Services' },
        { id: 'seller', label: 'Seller Issue', icon: <Store size={14} />, category: 'Seller' },
        { id: 'app', label: 'App Issue', icon: <Smartphone size={14} />, category: 'App' },
        { id: 'other', label: 'Other', icon: <HelpCircle size={14} />, category: 'Other' },
    ];

    const handleChipClick = (action) => {
        setActiveCategory(action.category);
        addMessage(`I have an issue with ${action.label}`, 'user');

        // Slight delay for "AI" thinking
        setIsTyping(true);
        setTimeout(() => {
            const response = getAutoResponse(action.category, null);
            addMessage(response, 'bot');
            setIsTyping(false);
        }, 600);
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userText = inputValue.trim();
        addMessage(userText, 'user');
        setInputValue("");
        setIsTyping(true);

        // --- ESCALATION FLOW ---
        if (escalationStep === 'awaiting-phone') {
            // Validate Phone
            const phoneRegex = /^[6-9]\d{9}$/;
            if (phoneRegex.test(userText)) {

                try {
                    // CALL BACKEND
                    const payload = {
                        userId: user?._id || null,
                        phone: userText,
                        category: activeCategory || 'Other',
                        summary: "User requested human assistance via chat.",
                        logs: messages.map(m => ({ sender: m.sender, text: m.text, timestamp: m.timestamp }))
                    };

                    const res = await fetch('http://localhost:5000/api/support/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (res.ok) {
                        setTimeout(() => {
                            addMessage("Thank you.\nOur support team will contact you within 24 hours.", 'bot');
                            setEscalationStep('done');
                            setIsTyping(false);
                        }, 800);
                    } else {
                        throw new Error("API Failed");
                    }
                } catch (err) {
                    setTimeout(() => {
                        addMessage("I couldn't save your request right now. Please try again later.", 'bot');
                        setIsTyping(false);
                    }, 800);
                }
            } else {
                setTimeout(() => {
                    addMessage("That doesn't look like a valid 10-digit mobile number. Please try again.", 'bot');
                    setIsTyping(false);
                }, 600);
            }
            return;
        }

        // --- NORMAL AI FLOW ---
        setTimeout(() => {
            const response = ruleBasedAI(userText, activeCategory);
            addMessage(response, 'bot');

            // Check if response was an escalation trigger
            if (response.includes("personal assistance")) {
                setEscalationStep('awaiting-phone');
            }

            setIsTyping(false);
        }, 800);
    };

    // Helper to add message
    const addMessage = (text, sender) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text,
            sender, // 'user' | 'bot'
            timestamp: new Date()
        }]);
    };

    // --- INTELLIGENCE CORE ---

    const getAutoResponse = (category, context) => {
        // 1. Acknowledge | 2. Guide | 3. Next Action
        switch (category) {
            case 'Shopping': return "I understand you have a question about shopping or products. Could you please specify if you're looking for a product or have an issue with availability?";
            case 'Services': return "I can help with bookings and service providers. Is this about a current booking or finding a new service?";
            case 'Seller': return "I can assist with shop-related queries. Is the shop information incorrect or are they not responding?";
            case 'App': return "I understand you're facing a technical issue. Is the app crashing, or is a specific feature not working?";
            case 'Other': return "I'm here to help with shopping, bookings, or app-related issues. Please briefly describe the problem.";
            default: return "How can I assist you specifically?";
        }
    };

    const ruleBasedAI = (input, category) => {
        const lower = input.toLowerCase();

        // 1. NONSENSE FILTERS (STRICT)
        // Includes greetings, random words, emojis
        if (["hi", "hello", "hey", "yo", "test", "call me govlaw"].includes(lower) || /^[^\w\s]+$/.test(lower)) {
            return "Hi! 👋\nI’m here to help with shopping, bookings, or app-related issues.\nPlease choose a topic or describe the problem you’re facing.";
        }

        // 2. ABUSIVE / OFFENSIVE LANGUAGE
        if (lower.match(/(stupid|idiot|fuck|useless|shit|bitch)/)) {
            return "I’m here to help with support-related issues.\nPlease describe the problem you’re facing so I can assist you.";
        }

        if (lower.length < 3) {
            return "Please describe your issue in a bit more detail.";
        }

        // 3. ESCALATION TRIGGERS (Strict Conditions)
        if (lower.includes("not resolved") ||
            lower.includes("didn't help") ||
            lower.includes("talk to someone") ||
            lower.includes("human") ||
            input.includes("Payment") || // Payment usually needs human
            lower.includes("refund")) {
            return createEscalationPrompt();
        }

        // 4. FORBIDDEN TOPICS (Legal, Gov, etc)
        const forbidden = ["legal", "court", "government", "police", "suicide", "architecture", "model", "system"];
        if (forbidden.some(word => lower.includes(word))) {
            return "I can help with shopping, services, or app-related issues.\nFor other concerns, please contact our support team.";
        }

        // 5. VALID DOMAINS
        // Shopping
        if (lower.includes("price") || lower.includes("cost") || lower.includes("expensive")) {
            return "I understand the price concern. Prices are set directly by local sellers.\nIf you see a significant mismatch, please check with the shop directly or refresh the availability.";
        }
        if (lower.includes("stock") || lower.includes("available") || lower.includes("out of stock")) {
            return "Availability is updated by shop owners in real-time.\nIf a product is shown as available but isn't, it might have just sold out. Refreshing the page may help.";
        }

        // Services
        if (lower.includes("booking") || lower.includes("appointment")) {
            return "For booking status (Upcoming/Completed), please check the 'Bookings' tab in your profile.\nIf a booking is missing, the provider may not have confirmed it yet.";
        }

        // App
        if (lower.includes("load") || lower.includes("crash") || lower.includes("bug") || lower.includes("slow")) {
            return "I understand this is frustrating. Please try clearing your cache or refreshing the app.\nIf the issue persists, select 'App Issue' above so I can escalate it.";
        }

        // Addresses
        if (lower.includes("address") || lower.includes("location") || lower.includes("gps")) {
            return "You can manage your delivery addresses in your Profile settings.\nWould you like guidance on how to update your current location?";
        }

        // Default Fallback (Redirect)
        return "I can help with shopping, services, or app-related issues.\nFor other concerns, please contact our support team.";
    };

    const createEscalationPrompt = () => {
        return "I understand this needs personal assistance.\nPlease share your phone number and our support team will contact you shortly.";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 1. BACKDROP (Blur) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/5 backdrop-blur-sm z-[2000] cursor-pointer"
                    />

                    {/* 2. PANEL */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-0 right-0 h-full w-full md:w-[400px] bg-white z-[2001] shadow-2xl flex flex-col border-l border-gray-100"
                    >
                        {/* HEADER */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-orange-50 rounded-full flex items-center justify-center text-[#E07A5F] relative">
                                    <MessageSquare size={20} className="fill-current" />
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">ShopLens Support</h3>
                                    <p className="text-xs text-gray-500 font-medium">We usually reply instantly</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <X size={20} />
                            </button>
                        </div>

                        {/* MESSAGES AREA */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 scroll-smooth">

                            {/* Quick Actions (Only show if no messages or just greeting) */}
                            {messages.length <= 1 && (
                                <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Select a topic</p>
                                    <div className="flex flex-wrap gap-2">
                                        {quickActions.map(action => (
                                            <button
                                                key={action.id}
                                                onClick={() => handleChipClick(action)}
                                                className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-[#E07A5F] hover:text-[#E07A5F] transition-all shadow-sm"
                                            >
                                                {action.icon}
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chat Bubbles */}
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm
                                            ${msg.sender === 'user'
                                                    ? 'bg-[#1f2937] text-white rounded-tr-sm'
                                                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* INPUT AREA */}
                        <div className="p-4 border-t border-gray-100 bg-white">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                    placeholder="Describe your issue..."
                                    className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:bg-white transition-all text-sm font-medium placeholder-gray-400"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#E07A5F] text-white rounded-lg hover:bg-[#d0684f] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                Support ID: {user?._id?.slice(-6) || 'Guest'} • AI-Assistant Active
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SupportPanel;
