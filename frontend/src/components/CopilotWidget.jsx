import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { 
    Sparkles, 
    MessageSquare, 
    Trash2, 
    Send, 
    X, 
    Bot, 
    User, 
    Loader2, 
    MapPin, 
    ShoppingBag, 
    HelpCircle 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CopilotWidget = ({ role = 'customer' }) => {
    const { token, user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Dynamic suggestions based on user role
    const getSuggestions = () => {
        if (role === 'seller') {
            return [
                "What should I stock?",
                "Why are requests decreasing?",
                "What is trending nearby?"
            ];
        }
        if (role === 'admin') {
            return [
                "What category is growing fastest?",
                "Which city has the biggest demand gap?",
                "What is happening in Aisle today?"
            ];
        }
        return [
            "Find snacks for party",
            "Healthy breakfast ideas",
            "Best shops nearby"
        ];
    };

    // Auto-scroll messages to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    // Send chat message
    const handleSendMessage = async (textToSend) => {
        const queryText = textToSend || input;
        if (!queryText.trim()) return;

        // Add user message to state
        const userMsg = { role: 'user', content: queryText, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInput('');
        setLoading(true);

        try {
            // Get location coordinates from localStorage if available
            let lat = 22.7196;
            let lng = 75.8577;
            try {
                const storedLoc = localStorage.getItem('aisleLocation');
                if (storedLoc) {
                    const parsed = JSON.parse(storedLoc);
                    if (parsed.coordinates) {
                        lng = parsed.coordinates[0];
                        lat = parsed.coordinates[1];
                    }
                }
            } catch (err) {}

            const response = await axios.post('/api/copilot/chat', 
                { message: queryText, lat, lng },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.success) {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response.data.answer,
                    timestamp: new Date()
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: 'Sorry, I failed to process your request. Please try again.',
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('[CopilotWidget] Send message error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Failed to connect to the Aisle Copilot Service.',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    // Clear session memory
    const handleClearHistory = async () => {
        if (window.confirm("Are you sure you want to clear your conversation history?")) {
            try {
                await axios.delete('/api/copilot/chat', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages([]);
                toast.success('Conversation memory reset successfully!');
            } catch (err) {
                toast.error('Failed to clear memory');
            }
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 font-sans">
            {/* FLOATING ACTION BUTTON */}
            <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl cursor-pointer ${
                    role === 'seller'
                        ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700 hover:shadow-indigo-500/20'
                        : role === 'admin'
                        ? 'bg-gradient-to-tr from-slate-800 to-slate-900 hover:shadow-slate-700/20'
                        : 'bg-gradient-to-tr from-[#E07A5F] to-orange-600 hover:shadow-orange-500/20'
                }`}
            >
                {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}
            </motion.button>

            {/* CHAT WINDOW PANELS */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ duration: 0.24, ease: 'easeOut' }}
                        className="absolute bottom-18 right-0 w-[360px] md:w-[400px] h-[520px] rounded-[32px] border border-white/10 backdrop-blur-xl bg-slate-900/90 text-white shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* HEADER */}
                        <div className="p-4.5 flex items-center justify-between border-b border-white/5 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 ${
                                    role === 'seller' ? 'bg-indigo-600' : role === 'admin' ? 'bg-slate-700' : 'bg-[#E07A5F]'
                                }`}>
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                                        Aisle AI Copilot
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                            role === 'seller' ? 'bg-indigo-500/20 text-indigo-300' : role === 'admin' ? 'bg-slate-500/20 text-slate-300' : 'bg-orange-500/20 text-orange-350'
                                        }`}>
                                            {role}
                                        </span>
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Real-time Local Intelligence Gateway</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button 
                                        onClick={handleClearHistory}
                                        title="Clear memory"
                                        className="p-2 text-slate-400 hover:text-rose-450 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        </div>

                        {/* MESSAGE AREA */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 pr-2">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4 opacity-80">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-slate-350">
                                        <HelpCircle size={28} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">Ask Aisle AI anything!</h4>
                                        <p className="text-xs text-slate-450 mt-1 max-w-[260px] mx-auto leading-relaxed">
                                            {role === 'seller' 
                                                ? "Stocking suggestions, business diagnostics, pricing optimizer queries." 
                                                : role === 'admin' 
                                                ? "Marketplace growth analytics, unfulfilled gaps, Command Center status."
                                                : "Local discovery, recipe shopping lists, budget party kit configurations."}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-white ${
                                                msg.role === 'user' 
                                                    ? 'bg-slate-700' 
                                                    : role === 'seller' 
                                                    ? 'bg-indigo-600' 
                                                    : role === 'admin' 
                                                    ? 'bg-slate-800' 
                                                    : 'bg-[#E07A5F]'
                                            }`}>
                                                {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                                            </div>
                                            <div className={`rounded-2xl px-3.5 py-2.5 text-xs font-semibold whitespace-pre-wrap leading-relaxed shadow-sm ${
                                                msg.role === 'user' 
                                                    ? 'bg-white/10 border border-white/5 text-white rounded-tr-none' 
                                                    : 'bg-white/5 border border-white/10 text-slate-100 rounded-tl-none'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="flex items-center gap-2 max-w-[85%]">
                                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                                            <Loader2 size={13} className="animate-spin" />
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs font-semibold text-slate-400 animate-pulse">
                                            Compiling marketplace intelligence...
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* SUGGESTED PROMPTS */}
                        <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5 bg-slate-950/20">
                            {getSuggestions().map((sug, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSendMessage(sug)}
                                    disabled={loading}
                                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                    {sug}
                                </button>
                            ))}
                        </div>

                        {/* INPUT FORM */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSendMessage();
                            }}
                            className="p-4 flex gap-2.5 border-t border-white/5 bg-slate-950/40"
                        >
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={`Ask Aisle AI...`}
                                disabled={loading}
                                className="flex-1 bg-slate-950/40 border border-white/5 focus:border-white/20 text-white text-xs font-semibold rounded-2xl px-4 py-3 outline-none transition-colors placeholder:text-slate-500"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className={`px-4.5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-lg shrink-0 cursor-pointer ${
                                    role === 'seller'
                                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-650/20'
                                        : role === 'admin'
                                        ? 'bg-slate-700 hover:bg-slate-800 shadow-slate-700/20'
                                        : 'bg-[#E07A5F] hover:bg-orange-600 shadow-orange-500/20'
                                }`}
                            >
                                <Send size={13} />
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CopilotWidget;
