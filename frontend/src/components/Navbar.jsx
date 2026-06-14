import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaSignOutAlt, FaUserCircle, FaBars, FaTimes, FaUser, FaCompass, FaChevronRight } from 'react-icons/fa';
import AisleLogo from './AisleLogo';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setIsMobileMenuOpen(false);
    };

    const navLinks = [
        { name: 'Explore', path: '/explore', icon: <FaCompass /> },
    ];

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--bg-main)] border-b border-[var(--border-soft)] px-8 h-[72px] flex items-center">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                {/* Left: Brand */}
                <div className="flex-shrink-0">
                    <Link to="/" className="h-14 w-40 flex items-center justify-center">
                        <AisleLogo className="h-12 w-full hover:opacity-90 transition-opacity" />
                    </Link>
                </div>

                {/* Right: Navigation & Actions */}
                <div className="flex items-center gap-6">
                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-[15px] font-medium transition-colors ${location.pathname === link.path
                                    ? 'text-[var(--text-primary)] font-semibold'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden lg:flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    to={user.role === 'seller' ? '/seller/home' : '/profile'}
                                    className="flex items-center gap-2 group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center text-[var(--accent-primary)] border border-[var(--border-soft)]">
                                        <FaUserCircle size={20} />
                                    </div>
                                    <span className="text-sm text-[var(--text-primary)] font-medium max-w-[120px] truncate group-hover:text-[var(--accent-primary)] transition-colors">
                                        {user.name}
                                    </span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="text-[var(--text-secondary)] hover:text-[var(--accent-dark)] transition-colors"
                                    title="Logout"
                                >
                                    <FaSignOutAlt size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-[15px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                    Login
                                </Link>
                                <Link to="/register" className="cta-button bg-[var(--accent-primary)] text-white rounded-xl px-[18px] py-[10px] font-semibold hover:bg-[var(--accent-dark)] transition-colors border-none">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button
                        className="lg:hidden p-2 text-[var(--text-primary)]"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        {user ? (
                            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white">
                                <FaUser size={16} />
                            </div>
                        ) : (
                            <FaBars className="text-xl" />
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Drawer */}
            <div
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={() => setIsMobileMenuOpen(false)}
            >
                <div
                    className={`absolute bottom-0 left-0 w-full bg-[var(--bg-main)] border-t border-[var(--border-soft)] rounded-t-[2.5rem] p-8 transition-transform duration-300 transform ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-12 h-1.5 bg-[var(--border-soft)] rounded-full mx-auto mb-8"></div>

                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">Menu</h3>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                            <FaTimes className="text-xl" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {user && (
                            <div className="flex items-center gap-4 p-5 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-soft)] mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-main)] flex items-center justify-center text-[var(--accent-primary)] text-2xl border border-[var(--border-soft)]">
                                    <FaUserCircle />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[var(--text-primary)] font-bold text-lg truncate">{user.name}</p>
                                    <p className="text-[var(--text-secondary)] text-sm font-medium uppercase tracking-wider">{user.role}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            {navLinks.map(link => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="flex items-center justify-between p-5 rounded-3xl bg-[var(--bg-main)] hover:bg-[var(--bg-card)] transition-all text-[var(--text-primary)] border border-[var(--border-soft)] group"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center text-[var(--accent-primary)] border border-[var(--border-soft)]">
                                            {link.icon}
                                        </div>
                                        <span className="font-bold text-lg">{link.name}</span>
                                    </div>
                                    <FaChevronRight className="text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" size={14} />
                                </Link>
                            ))}
                        </div>

                        {!user && (
                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center p-5 rounded-3xl font-bold bg-[var(--bg-main)] text-[var(--text-primary)] border border-[var(--border-soft)]">
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center p-5 rounded-3xl font-bold bg-[var(--accent-primary)] text-white">
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {user && (
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-3 p-5 rounded-3xl font-bold text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border-soft)] mt-4 transition-colors hover:bg-[#d1d5db]"
                            >
                                <FaSignOutAlt size={18} />
                                <span>Logout</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
