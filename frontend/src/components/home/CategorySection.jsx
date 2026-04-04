import { FaShoppingBasket, FaLaptop, FaPencilAlt, FaHammer, FaFirstAid, FaHome } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const CategorySection = () => {
    // MARKETING ONLY: These categories are for the landing page visual appeal.
    // They do NOT map directly to the Customer App logic.
    const categories = [
        { name: "Grocery", icon: <FaShoppingBasket />, color: "bg-orange-500" },
        { name: "Electronics", icon: <FaLaptop />, color: "bg-blue-500" },
        { name: "Stationery", icon: <FaPencilAlt />, color: "bg-yellow-500" },
        { name: "Hardware", icon: <FaHammer />, color: "bg-gray-500" },
        { name: "Medical", icon: <FaFirstAid />, color: "bg-red-500" },
        { name: "Home & Local", icon: <FaHome />, color: "bg-green-500" },
    ];

    return (
        <section className="bg-background py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">
                    Explore Categories
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {categories.map((cat, idx) => (
                        <Link to={`/search?category=${cat.name}`} key={idx} className="group bg-card p-6 rounded-2xl flex flex-col items-center justify-center hover:bg-gray-800 transition-colors border border-gray-800 hover:border-gray-600">
                            <div className={`h-12 w-12 rounded-full ${cat.color} bg-opacity-20 flex items-center justify-center text-xl text-white group-hover:scale-110 transition-transform mb-3`}>
                                {cat.icon}
                            </div>
                            <span className="text-gray-300 font-medium group-hover:text-white transition-colors">
                                {cat.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategorySection;
