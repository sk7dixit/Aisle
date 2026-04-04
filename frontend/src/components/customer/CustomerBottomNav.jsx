import { NavLink } from 'react-router-dom';
import { FaHome, FaStore, FaTools, FaHeart, FaLayerGroup } from 'react-icons/fa';

const CustomerBottomNav = () => {
    const navItems = [
        { name: 'Home', path: '/home', icon: <FaHome /> },
        { name: 'Categories', path: '/browse', icon: <FaLayerGroup /> },
        { name: 'Shops', path: '/shops', icon: <FaStore /> },
        { name: 'Services', path: '/services', icon: <FaTools /> },
        { name: 'Interested', path: '/interested', icon: <FaHeart /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 glass-nav border-t border-black/5 z-[100] md:hidden">
            <div className="max-w-[1440px] mx-auto flex justify-around items-center h-[72px]">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) => `
                            flex flex-col items-center justify-center w-full h-full text-xs font-black uppercase tracking-widest transition-all duration-300 ease-out relative
                            ${isActive ? 'text-[var(--accent-terracotta)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <span className={`text-xl mb-1 transition-all duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                                <span className="text-[9px]">{item.name}</span>
                                {/* Active Indicator Dot */}
                                {isActive && (
                                    <div className="absolute top-1.5 w-1 h-1 rounded-full bg-[var(--accent-terracotta)] shadow-[0_0_10px_rgba(188,84,73,0.4)]"></div>
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default CustomerBottomNav;
