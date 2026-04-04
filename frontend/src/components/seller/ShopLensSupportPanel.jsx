import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaTimes, FaChevronRight, FaHeadset, FaCommentDots,
    FaBoxOpen, FaImage, FaChartLine, FaTags, FaStore, FaUnlock, FaMoneyBillWave, FaQuestionCircle, FaArrowLeft, FaPhone, FaPaperPlane, FaCheckCircle, FaSpinner, FaExclamationTriangle
} from 'react-icons/fa';

/**
 * SHOPLENS SUPPORT PANEL (AI ENHANCED)
 * Architecture:
 * 1. Base UI: Right-side slide-over panel
 * 2. State Machine: 'greeting' -> 'categories' -> 'questions' -> 'solution' -> 'other' -> 'escalation' | 'guidance'
 * 3. AI Logic: Genuine vs Non-Genuine Filter
 */

const SYLLABUS = [
    {
        id: 'product',
        label: 'Product & Catalog',
        subtext: 'Visibility, stock, and mandatory fields',
        icon: <FaBoxOpen />,
        questions: [
            { q: 'Product not visible to customers', a: 'Please check if the product is marked as "In Stock" and "Active". Go to Products → Edit → Availability.' },
            { q: 'Unable to add a product', a: 'Ensure all required fields are filled. Product name, category, and price are mandatory.' }
        ]
    },
    {
        id: 'image',
        label: 'Image & Uploads',
        subtext: 'AI verification, formats, and quality',
        icon: <FaImage />,
        questions: [
            { q: 'Image not uploading', a: 'Use JPG or PNG images under 5MB. clear images with good lighting work best.' },
            { q: 'Image looks blurred', a: 'Avoid screenshots or compressed images. Use a clear original photo from your camera.' }
        ]
    },
    {
        id: 'orders',
        label: 'Orders & Sales',
        subtext: 'Sales tracking and status updates',
        icon: <FaChartLine />,
        questions: [
            { q: 'Sales showing ₹0', a: 'Sales update after orders are completed. Please check completed orders in History.' }
        ]
    },
    {
        id: 'offers',
        label: 'Offers & Discounts',
        subtext: 'Active offers and date ranges',
        icon: <FaTags />,
        questions: [
            { q: 'Offer not visible', a: 'Check if the offer is active and within the valid date range in the "Offers" tab.' }
        ]
    },
    {
        id: 'settings',
        label: 'Shop Settings',
        subtext: 'Open/Closed status and hours',
        icon: <FaStore />,
        questions: [
            { q: 'Shop showing closed', a: 'Your shop may be in Auto mode or outside working hours. Check Shop Controls in the Dashboard header.' }
        ]
    },
    {
        id: 'login',
        label: 'Login Issues',
        subtext: 'Passwords, login emails, and 2FA',
        icon: <FaUnlock />,
        questions: [
            { q: 'Cannot login', a: 'Verify your email/number and password. Use "Forgot Password" on the login screen if needed.' }
        ]
    },
    {
        id: 'payments',
        label: 'Payments',
        subtext: 'Payout cycles and bank verification',
        icon: <FaMoneyBillWave />,
        questions: [
            { q: 'Payment not received', a: 'Payouts follow the weekly cycle. Please verify your bank details in Settings → Payments.' }
        ]
    }
];

// AI LOGIC HELPERS
const checkHardFilter = (text) => {
    const ignored = /^(hi|hello|hey|bye|ok|thanks|thank you|test|abc|asdf|\?|!+|🙂|👍)$/i;
    // Also ignore very short messages < 4 chars that are not numbers
    if (text.length < 4 && isNaN(text)) return true;
    return ignored.test(text.trim());
};

const checkGenuineIntent = (text) => {
    const lower = text.toLowerCase();

    // Category A: Business Blocking
    if (lower.match(/(cannot|can't|unable|fail|broken|not working|not showing|missing|stopped)/)) return true;

    // Category B: Financial
    if (lower.match(/(money|payment|payout|rupee|paid|wallet|bank|account|fraud|scam)/)) return true;

    // Category C: System Error
    if (lower.match(/(error|bug|crash|stuck|loading|white screen|glitch|failed)/)) return true;

    // Category D: Repeated Failure (Keywords implying persistence)
    if (lower.match(/(tried|again|still|times|waiting|urgent|emergency|serious)/)) return true;

    // Explicit Product/Shop keywords
    if (lower.match(/(order|customer|delivery|stock|inventory|login|password|edit|save|update)/)) return true;

    return false;
};

const checkLazyIntent = (text) => {
    const lower = text.toLowerCase();
    // Demand for call without context
    if (lower.match(/^(call me|call|help|contact|support|talk to human)$/)) return true;
    return false;
};


const ShopLensSupportPanel = ({ isOpen, onClose }) => {
    const { user, token } = useAuth();
    const [viewState, setViewState] = useState('greeting'); // greeting, categories, questions, solution, other, escalation, success, guidance
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSolution, setSelectedSolution] = useState(null);
    const [otherText, setOtherText] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [messages, setMessages] = useState([]);
    const [abuseCount, setAbuseCount] = useState(0); // Track "bad" messages in session

    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // ESC Key Listener
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (isOpen && viewState === 'greeting') {
            // Initial Greeting
            setIsTyping(true);
            setTimeout(() => {
                setMessages([{
                    type: 'bot',
                    text: `Hi ${user?.name?.split(' ')[0] || 'Seller'} 👋\nHow can we help you today?`
                }]);
                setIsTyping(false);
                setTimeout(() => setViewState('categories'), 800);
            }, 1000);
        }
    }, [isOpen, viewState, user?.name]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, viewState]);

    const handleCategorySelect = (cat) => {
        setMessages(prev => [...prev, { type: 'user', text: cat.label }]);
        setSelectedCategory(cat);
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'bot', text: 'Please select your specific issue:' }]);
            setViewState('questions');
            setIsTyping(false);
        }, 1000);
    };

    const handleQuestionSelect = (q) => {
        setMessages(prev => [...prev, { type: 'user', text: q.q }]);
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'bot', text: q.a, isSolution: true }]);
            setViewState('solution');
            setIsTyping(false);
        }, 1200);
    };

    const handleOtherSelect = () => {
        setMessages(prev => [...prev, { type: 'user', text: 'Other Issue' }]);
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'bot', text: 'Please describe your issue broadly.' }]);
            setViewState('other');
            setIsTyping(false);
        }, 800);
    };

    const handleOtherSubmit = () => {
        if (!otherText.trim()) return;

        // 1. ADD USER MESSAGE
        const userMsg = otherText.trim();
        setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
        setOtherText('');

        // 2. RUN AI LOGIC
        setTimeout(() => {
            // A. Hard Filter (Spam/Greetings)
            if (checkHardFilter(userMsg)) {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: "Please describe your issue clearly so we can help you."
                }]);
                return; // Stay in 'other' state
            }

            // B. Lazy Intent (Call me)
            if (checkLazyIntent(userMsg)) {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: "I can help you right here! Please tell me what problem you are facing (e.g., 'Order not showing')."
                }]);
                return; // Stay in 'other' state
            }

            // C. Genuine Intent Check
            if (checkGenuineIntent(userMsg)) {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: "This looks like an issue that needs personal assistance.\n\nPlease share your phone number so our support team can contact you."
                }]);
                setViewState('escalation'); // Allow escalation
            } else {
                // Non-Genuine / Unknown -> Guidance Only
                setMessages(prev => [...prev, {
                    type: 'bot',
                    text: "I didn't quite catch that. Could you provide more details about the error or issue?"
                }]);
                // Stay in 'other' to allow retry
            }
        }, 800);
    };

    const handleEscalationSubmit = async () => {
        if (!phoneNumber) return;
        setLoading(true);
        try {
            const res = await fetch('/api/seller/support/ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    issueText: messages.slice(-2).find(m => m.type === 'user')?.text || 'Support Request', // Get last user text
                    phoneNumber
                })
            });

            if (res.ok) {
                setMessages(prev => [...prev, { type: 'bot', text: "Thank you. Our support team will contact you soon." }]);
                setViewState('success');
            }
        } catch (error) {
            console.error("Ticket creation failed", error);
        } finally {
            setLoading(false);
        }
    };

    const resetFlow = () => {
        setMessages([]);
        setViewState('greeting');
        setSelectedCategory(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end p-0 md:p-4 pointer-events-none">
            <div className="absolute inset-0 dashboard-overlay pointer-events-auto" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white h-full md:h-[calc(100vh-2rem)] shadow-2xl flex flex-col animate-slide-in-right pointer-events-auto md:rounded-[2rem] overflow-hidden">

                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-md z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                            <FaHeadset className="text-white text-xl" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-black text-xl leading-tight tracking-tight">Support</h2>
                                <span className="px-2 py-0.5 bg-indigo-500 text-[9px] font-black rounded-md uppercase tracking-widest text-white shadow-sm">SMART GUIDE</span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold opacity-80 mt-0.5">Step-by-step guidance</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Body (Conversation) */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6 custom-scrollbar">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`
                                max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm
                                ${msg.type === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}
                            `}>
                                <p className="whitespace-pre-wrap font-medium">{msg.text}</p>
                                {msg.isSolution && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                        <button onClick={onClose} className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl hover:bg-emerald-100 transition-colors uppercase tracking-wider">
                                            Fixed, thanks!
                                        </button>
                                        <button onClick={() => setViewState('other')} className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-black rounded-xl hover:bg-slate-200 transition-colors uppercase tracking-wider">
                                            Still stuck?
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex justify-start animate-fade-in">
                            <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 rounded-bl-none text-slate-400 flex items-center gap-1 shadow-sm">
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                                <span className="typing-dot"></span>
                            </div>
                        </div>
                    )}

                    {/* Interaction Zones */}
                    {viewState === 'categories' && !isTyping && (
                        <div className="grid grid-cols-1 gap-3 animate-fade-in mt-2">
                            {SYLLABUS.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleCategorySelect(cat)}
                                    className="p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group flex items-start gap-4"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 flex items-center justify-center text-xl transition-colors flex-shrink-0">
                                        {cat.icon}
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm font-black text-slate-800 block mb-0.5">{cat.label}</span>
                                        <span className="text-[10px] font-bold text-slate-400 leading-tight block">{cat.subtext}</span>
                                    </div>
                                    <FaChevronRight className="mt-2 text-slate-200 group-hover:text-indigo-300 transition-colors" size={12} />
                                </button>
                            ))}
                            <button onClick={handleOtherSelect} className="p-4 bg-slate-100/50 border border-dashed border-slate-300 rounded-2xl text-left hover:bg-slate-100 transition-all flex items-center gap-4 group">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 text-xl">
                                    <FaQuestionCircle />
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-black text-slate-600 block">Something else</span>
                                    <span className="text-[10px] font-bold text-slate-400 block">Reporting a unique bug or issue</span>
                                </div>
                            </button>
                        </div>
                    )}

                    {viewState === 'questions' && selectedCategory && !isTyping && (
                        <div className="flex flex-col gap-2 animate-fade-in mt-2">
                            <div className="px-2 py-3 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3 mb-2">
                                <div className="text-indigo-500">{selectedCategory.icon}</div>
                                <span className="text-xs font-black text-indigo-700 uppercase tracking-widest">{selectedCategory.label}</span>
                            </div>
                            {selectedCategory.questions.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuestionSelect(q)}
                                    className="p-4 bg-white border border-slate-200 rounded-2xl text-left text-sm font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all flex justify-between items-center group"
                                >
                                    <span className="flex-1">{q.q}</span>
                                    <FaChevronRight className="text-xs text-slate-200 group-hover:text-indigo-300" />
                                </button>
                            ))}
                            <button onClick={handleOtherSelect} className="text-xs text-slate-400 font-black hover:text-slate-600 p-4 text-center mt-2 uppercase tracking-widest">
                                None of these match
                            </button>
                        </div>
                    )}

                    {viewState === 'other' && (
                        <div className="mt-4 animate-fade-in p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <textarea
                                value={otherText}
                                onChange={(e) => setOtherText(e.target.value)}
                                placeholder="Describe your issue..."
                                className="w-full p-3 bg-slate-50 rounded-lg text-sm border-none focus:ring-2 focus:ring-indigo-100 min-h-[80px] mb-3"
                                autoFocus
                            />
                            <button
                                onClick={handleOtherSubmit}
                                disabled={!otherText.trim()}
                                className="w-full py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <FaPaperPlane /> Send
                            </button>
                        </div>
                    )}

                    {viewState === 'escalation' && (
                        <div className="mt-4 animate-fade-in p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
                                <FaExclamationTriangle className="text-amber-500 text-xl mt-0.5" />
                                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                    We need to connect you with an agent. Calls are limited to urgent issues only.
                                </p>
                            </div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase">Your Phone Number</label>
                            <div className="flex bg-slate-50 rounded-lg overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 mb-3">
                                <div className="px-3 py-3 bg-slate-100 text-slate-500 text-sm font-bold border-r border-slate-200 flex items-center gap-2">
                                    <FaPhone className="text-xs" /> +91
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="flex-1 p-3 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800"
                                    placeholder="Enter 10-digit number"
                                />
                            </div>
                            <button
                                onClick={handleEscalationSubmit}
                                disabled={loading || !phoneNumber || phoneNumber.length < 10}
                                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <FaSpinner className="animate-spin" /> : <FaCheckCircle />}
                                Request Callback
                            </button>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Footer (Reset) */}
                {viewState !== 'greeting' && (
                    <div className="p-3 bg-white border-t border-slate-100 flex justify-center">
                        <button onClick={resetFlow} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                            <FaArrowLeft /> Start Over
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopLensSupportPanel;
