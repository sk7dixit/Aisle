import { FaMapMarkerAlt } from 'react-icons/fa';

const TrendingSection = () => {
    const products = [
        { id: 1, name: "Dove Shampoo", shop: "Apollo Pharmacy", dist: "0.5 km", price: "₹180", img: "https://via.placeholder.com/150/FF6B6B/0B0F14?text=Dove" },
        { id: 2, name: "Tata Salt", shop: "Gupta Kirana", dist: "1.2 km", price: "₹28", img: "https://via.placeholder.com/150/4ECDC4/0B0F14?text=Salt" },
        { id: 3, name: "Cello Bottle", shop: "Gift Corner", dist: "2.0 km", price: "₹120", img: "https://via.placeholder.com/150/FFE66D/0B0F14?text=Bottle" },
        { id: 4, name: "Dolo 650", shop: "City Medicos", dist: "0.3 km", price: "₹30", img: "https://via.placeholder.com/150/1A535C/FFF?text=Meds" },
    ];

    return (
        <section className="bg-section py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 flex items-center">
                    <span className="w-2 h-8 bg-accent rounded-full mr-3"></span>
                    Trending Near You
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div key={product.id} className="group bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-glow transition-all duration-300 border border-transparent hover:border-gray-700">
                            <div className="h-40 bg-gray-800 relative overflow-hidden">
                                <img src={product.img} alt={product.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                                <span className="absolute top-2 right-2 bg-success text-black textxs font-bold px-2 py-0.5 rounded shadow-sm">
                                    In Stock
                                </span>
                            </div>
                            <div className="p-4">
                                <h3 className="text-white font-semibold text-lg truncate">{product.name}</h3>
                                <p className="text-muted text-sm mb-2">{product.shop}</p>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-accent font-bold">{product.price}</span>
                                    <span className="flex items-center text-gray-500 text-xs">
                                        <FaMapMarkerAlt className="mr-1" /> {product.dist}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrendingSection;
