import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'customer',
        shopName: '',
        address: '',
        phone: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const payload = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            ...(formData.role === 'seller' && {
                shopDetails: {
                    shopName: formData.shopName,
                    address: formData.address,
                    phone: formData.phone
                }
            })
        };

        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', payload);
            login(response.data);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Create a new account
                    </h2>
                </div>
                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    {error && <div className="text-red-500 text-center text-sm">{error}</div>}

                    <div className="rounded-md shadow-sm space-y-2">
                        <input name="name" type="text" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                        <input name="email" type="email" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Email address" value={formData.email} onChange={handleChange} />
                        <input name="password" type="password" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Password" value={formData.password} onChange={handleChange} />

                        <div className="py-2">
                            <label className="block text-sm font-medium text-gray-700">I am a:</label>
                            <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                <option value="customer">Customer</option>
                                <option value="seller">Shop Owner</option>
                            </select>
                        </div>

                        {formData.role === 'seller' && (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-2">
                                <h3 className="text-sm font-medium text-gray-900">Shop Details</h3>
                                <input name="shopName" type="text" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Shop Name" value={formData.shopName} onChange={handleChange} />
                                <input name="address" type="text" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Shop Address" value={formData.address} onChange={handleChange} />
                                <input name="phone" type="text" required className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Contact Phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Register
                    </button>
                </form>
                <div className="text-center">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-500">
                        Already have an account? Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
