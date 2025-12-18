import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaStore, FaSignOutAlt, FaUser } from 'react-icons/fa';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-indigo-600 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <FaStore className="h-8 w-8 text-white mr-2" />
                            <span className="font-bold text-xl text-white">ShopLens</span>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link to="/" className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                            Home
                        </Link>

                        {user ? (
                            <>
                                {user.role === 'seller' && (
                                    <Link to="/seller/dashboard" className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                                        My Shop
                                    </Link>
                                )}
                                {user.role === 'admin' && (
                                    <Link to="/admin" className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                                        Admin Panel
                                    </Link>
                                )}

                                <div className="flex items-center ml-4">
                                    <span className="text-gray-200 text-sm mr-2">Hello, {user.name}</span>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-indigo-700 hover:bg-indigo-800 text-white p-2 rounded-full"
                                        title="Logout"
                                    >
                                        <FaSignOutAlt />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-x-2">
                                <Link to="/login" className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium">
                                    Login
                                </Link>
                                <Link to="/register" className="bg-white text-indigo-600 hover:bg-gray-100 px-3 py-2 rounded-md text-sm font-medium">
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
