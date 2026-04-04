import React, { useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaEnvelope, FaMobileAlt, FaGoogle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose, initialView = 'login' }) => {
    const [isLogin, setIsLogin] = useState(initialView === 'login'); // Toggle between Login form and "Continue" options
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const { login, register } = useAuth();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                // Simplified registration - just name, email, password, defaults to role='customer'
                await register({ name, email, password, role: 'customer' });
            }
            onClose(); // Close modal on success
            // Optional: User stays on same page, context updates state
        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed");
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md p-6 md:p-8 relative animate-fade-up shadow-2xl">
                {/* ... existing auth modal content ... */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <FaTimes size={20} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                    {isLogin ? 'Welcome Back' : 'Continue to Contact'}
                </h2>
                <p className="text-slate-400 text-sm text-center mb-6">
                    {isLogin ? 'Sign in to access your account' : 'No spam. Only used to connect you with the shop.'}
                </p>

                {error && (
                    <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg mb-4 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <input
                                type="text"
                                placeholder="Your Name"
                                className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div>
                        <input
                            type="email"
                            placeholder="Email Address"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="Password"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-xl transition-transform active:scale-95"
                    >
                        {isLogin ? 'Sign In' : 'Continue'}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-slate-400 text-sm">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-cyan-400 hover:text-white font-bold ml-2 transition-colors"
                        >
                            {isLogin ? 'Continue as Guest' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AuthModal;
