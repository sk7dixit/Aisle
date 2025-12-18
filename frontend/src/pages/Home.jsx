import { useState } from 'react';

const Home = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // TODO: Implement search API call
        console.log('Searching for:', searchTerm);
    };

    return (
        <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                Find Local Products Instantly
            </h1>
            <p className="text-xl text-gray-500 mb-8">
                Search nearby shops for items you need right now.
            </p>

            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-lg border-gray-300 rounded-md p-3 border"
                        placeholder="Search for 'Maggi', 'Notebook', 'Hammer'..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                    >
                        Search
                    </button>
                </form>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {/* Placeholder for Product Cards */}
                <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-4 sm:p-6">
                    <div className="h-32 bg-gray-200 mb-4 rounded flex items-center justify-center">Product Image</div>
                    <h3 className="text-lg font-medium text-gray-900">Sample Product</h3>
                    <p className="text-sm text-gray-500">Available at: Shop Name</p>
                    <p className="mt-2 text-xl font-semibold text-indigo-600">₹100</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
