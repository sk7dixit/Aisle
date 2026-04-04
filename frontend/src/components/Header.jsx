import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ShopLensLogo from './ShopLensLogo';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const isExplorePage = location.pathname === '/explore';

    const navLinks = [
        { name: 'Explore', href: '/explore' },
        { name: 'How It Works', href: '/how-it-works' },
        { name: 'For Shops', href: '/for-shops' },
        { name: 'About', href: '/about' }
    ];

    const handleNavigation = (path) => {
        setIsMenuOpen(false);
        if (path.startsWith('/#')) {
            const element = document.getElementById(path.substring(2));
            if (element) { element.scrollIntoView({ behavior: 'smooth' }); }
        } else { navigate(path); }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">

                    {/* Logo Section - Increased Width for the Zoomed Image */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link
                            to="/"
                            // h-20 ensures the logo has vertical breathing room
                            className="w-48 h-20 flex items-center justify-center transform hover:scale-105 transition-transform duration-300"
                        >
                            <ShopLensLogo className="h-16 w-full" />
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => {
                            const isActive = location.pathname === link.href;
                            return (
                                <Link
                                    key={link.name}
                                    to={link.href}
                                    className={`${isActive ? 'text-teal-600 font-bold' : 'text-gray-700 hover:text-teal-600 font-medium'} transition-colors duration-300`}
                                >
                                    {link.name}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-4">
                        <Button variant="ghost" className="text-gray-700 font-semibold" onClick={() => navigate('/login')}>
                            Login
                        </Button>
                        <Button
                            className="bg-teal-600 text-white px-6 py-2 rounded-lg shadow-lg"
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
                <div className="md:hidden bg-white border-t border-gray-200 p-4">
                    <nav className="space-y-4">
                        {navLinks.map((link) => (
                            <button key={link.name} onClick={() => handleNavigation(link.href)} className="block w-full text-left font-medium">
                                {link.name}
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;