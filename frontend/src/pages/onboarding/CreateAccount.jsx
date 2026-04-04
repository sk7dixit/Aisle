import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FaArrowLeft, FaLock, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import AmbientBackground from '../../components/AmbientBackground';

const CreateAccount = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { register } = useAuth(); // Defined correctly via hook now

    // Combine all previous steps data
    const prevData = location.state || {}; // Needs ownerName, shopName, mobile, shopCategory, area, city

    // Redirect if direct access without data
    if (!prevData.shopName) {
        // ideally use useEffect for navigation side effects, but for simple render guard:
        // return <Navigate to="/seller/onboarding" /> 
        // Keeping it simple with just empty render and effect elsewhere or just handle nulls
    }

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        // Construct final payload
        const finalPayload = {
            name: prevData.ownerName,
            email: formData.email,
            password: formData.password,
            phone: prevData.mobile,
            role: 'seller',
            shopDetails: {
                shopName: prevData.shopName,
                shopCategory: prevData.shopCategory,
                address: `${prevData.area}, ${prevData.city}`,
                city: prevData.city,
                area: prevData.area,
                phone: prevData.mobile
            }
        };

        try {
            await register(finalPayload);
            // Success! Redirect to Verification Pending
            navigate('/verification-pending');
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background font-sans">
            <AmbientBackground />

            <div className="w-full max-w-[500px] z-10">
                <div className="animate-fade-in mb-8">
                    <Link to="/seller/onboarding/basics" className="inline-flex items-center text-text-tertiary hover:text-text-primary transition-colors mb-4 group">
                        <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </Link>
                    <h1 className="text-3xl font-bold text-white mb-2">Secure your shop account</h1>
                    <p className="text-text-secondary">Used to manage your shop after approval.</p>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-soft p-8 md:p-10 animate-fade-up">

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                            <FaExclamationTriangle />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary z-10" />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    className="w-full bg-white/5 text-text-primary pl-12 pr-4 py-3.5 rounded-xl border border-white/10 outline-none focus:bg-white/10 focus:border-accent-end/50 transition-all placeholder-text-tertiary"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-accent-start to-accent-end text-white font-bold py-4 rounded-xl shadow-lg shadow-accent-end/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-wait"
                        >
                            {isLoading ? 'Creating Account...' : 'Submit for Verification'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateAccount;
