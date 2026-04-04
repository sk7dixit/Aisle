import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaShieldAlt, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import AmbientBackground from '../../components/AmbientBackground';
import axios from 'axios';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await axios.post('/api/auth/login', { email, password });

            if (data.role === 'super_admin' || data.role === 'admin') { // Legacy support
                login(data);
                navigate('/admin');
            } else if (data.role === 'moderator') {
                login(data);
                navigate('/admin/moderator');
            } else {
                setError("Access Denied: You do not have admin privileges.");
                // Optionally logout immediately if the context auto-set something
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background font-sans">
            <AmbientBackground />

            <div className="w-full max-w-md z-10 animate-fade-up">
                <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">

                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400 text-3xl">
                            <FaShieldAlt />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                        <p className="text-text-secondary text-sm mt-2">Authorized Personnel Only</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="group relative">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-red-400 transition-colors z-10" />
                            <input
                                type="email"
                                placeholder="Admin Email"
                                className="w-full bg-slate-800/50 text-white pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-slate-800 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all placeholder-text-tertiary"
                                value={email} onChange={e => setEmail(e.target.value)} required
                            />
                        </div>

                        <div className="group relative">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-red-400 transition-colors z-10" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className="w-full bg-slate-800/50 text-white pl-12 pr-12 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-slate-800 focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all placeholder-text-tertiary"
                                value={password} onChange={e => setPassword(e.target.value)} required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-white transition-colors focus:outline-none"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Verifying...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
