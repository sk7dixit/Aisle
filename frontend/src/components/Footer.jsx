import React from 'react';
import { Store, Twitter, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShopLensLogo from './ShopLensLogo';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
            {/* Main Footer */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">

                    {/* Brand Column */}
                    <div className="lg:col-span-1">
                        <div className="mb-4">
                            <ShopLensLogo className="h-12 w-auto !justify-start" />
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">
                            Discover real-time inventory from nearby local shops.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-bold mb-4 text-sm">Quick Links</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/explore" className="text-gray-500 hover:text-teal-400 transition-colors">Explore</Link></li>
                            <li><Link to="/how-it-works" className="text-gray-500 hover:text-teal-400 transition-colors">How It Works</Link></li>
                            <li><Link to="/about" className="text-gray-500 hover:text-teal-400 transition-colors">About</Link></li>
                        </ul>
                    </div>

                    {/* For Shops */}
                    <div>
                        <h3 className="text-white font-bold mb-4 text-sm">For Shops</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/for-shops" className="text-gray-500 hover:text-teal-400 transition-colors">List Your Shop</Link></li>
                            <li><Link to="/login" className="text-gray-500 hover:text-teal-400 transition-colors">Seller Login</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h3 className="text-white font-bold mb-4 text-sm">Legal</h3>
                        <ul className="space-y-3 text-sm">
                            <li><Link to="/privacy-policy" className="text-gray-500 hover:text-teal-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link to="/terms-of-service" className="text-gray-500 hover:text-teal-400 transition-colors">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-bold mb-4 text-sm">Contact</h3>
                        <ul className="space-y-3 text-sm text-gray-500">
                            <li>shoplens017@gmail.com</li>
                            <li>Vadodara, India</li>
                        </ul>
                    </div>
                </div>

                {/* Subscribe Section (Interactive) */}
                <SubscribeSection />
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800 bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-xs">
                        © 2025 ShopLens. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="text-gray-600 hover:text-teal-500 transition-colors"><Twitter className="w-4 h-4" /></a>
                        <a href="#" className="text-gray-600 hover:text-teal-500 transition-colors"><Linkedin className="w-4 h-4" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

// Extracted for cleaner state management
const SubscribeSection = () => {
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState('idle'); // idle, loading, success, error
    const [errorMsg, setErrorMsg] = React.useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic Validation
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            setStatus('error');
            setErrorMsg('Please enter a valid email address.');
            return;
        }

        setStatus('loading');

        // Simulate API call (1.5s delay)
        setTimeout(() => {
            setStatus('success');
            setEmail(''); // Clear for security/state reset, though hidden
        }, 1500);
    };

    if (status === 'success') {
        return (
            <div className="mt-16 pt-8 border-t border-gray-800 animate-fade-in">
                <div className="flex items-center gap-2 text-teal-500 font-medium">
                    <span>✅</span>
                    <span className="text-sm">You’re subscribed. We’ll only email when it matters.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="w-full md:w-auto">
                <h3 className="text-white font-bold text-sm mb-1">Stay Updated</h3>
                <p className="text-gray-500 text-xs">Product updates only. No spam.</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full md:w-auto flex flex-col gap-1">
                <div className="flex gap-2 w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (status === 'error') setStatus('idle');
                        }}
                        disabled={status === 'loading'}
                        className={`bg-gray-800 border ${status === 'error' ? 'border-red-500/50' : 'border-gray-700'} text-white text-sm rounded-lg px-4 py-2 focus:outline-none focus:border-teal-600 w-full md:w-64 transition-all disabled:opacity-50`}
                    />
                    <button
                        type="submit"
                        disabled={!email || status === 'loading'}
                        className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                        {status === 'loading' ? '...' : 'Subscribe'}
                    </button>
                </div>
                {status === 'error' && (
                    <p className="text-red-400 text-xs pl-1">{errorMsg}</p>
                )}
            </form>
        </div>
    );
};

export default Footer;
