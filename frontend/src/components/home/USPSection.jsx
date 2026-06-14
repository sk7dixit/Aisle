import { FaCheck, FaRupeeSign, FaBoxOpen, FaStoreAlt } from 'react-icons/fa';

const USPSection = () => {
    const features = [
        { icon: <FaRupeeSign />, text: "Zero Commission for Sellers" },
        { icon: <FaCheck />, text: "Real-time Local Availability" },
        { icon: <FaStoreAlt />, text: "Support Small & Home Businesses" },
        { icon: <FaBoxOpen />, text: "No Central Warehouse Dependency" },
    ];

    return (
        <section className="bg-background py-20 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">

                    {/* Left Content */}
                    <div className="mb-12 lg:mb-0">
                        <h2 className="text-3xl font-extrabold text-white mb-6">
                            Why Aisle?
                        </h2>
                        <p className="text-muted text-lg mb-8 leading-relaxed">
                            Most e-commerce platforms force small sellers to pay heavy commissions or compete with massive warehouses.
                            <br /><br />
                            Aisle is different. We don't sell products; we connect ready-to-buy customers with the inventory
                            sitting in the business right next to them.
                        </p>
                        <div className="space-y-4">
                            {features.map((feature, idx) => (
                                <div key={idx} className="flex items-center">
                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs">
                                        {feature.icon}
                                    </span>
                                    <span className="ml-4 text-gray-300 font-medium">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Visual (Abstract) */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-accent to-blue-600 opacity-20 blur-3xl rounded-full"></div>
                        <div className="relative bg-card border border-gray-800 rounded-2xl p-8 shadow-2xl">
                            <h3 className="text-xl font-bold text-white mb-6">Built for Local Markets</h3>
                            <div className="space-y-4">
                                <div className="bg-gray-800/50 p-4 rounded-lg flex items-center justify-between">
                                    <span className="text-gray-400 text-sm">Online Platforms</span>
                                    <span className="text-red-400 text-xs font-bold">2-3 Days Delivery</span>
                                </div>
                                <div className="bg-accent/10 p-4 rounded-lg flex items-center justify-between border border-accent/20">
                                    <span className="text-accent text-sm font-bold">Aisle</span>
                                    <span className="text-success text-xs font-bold">Available Now (0.5 km)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default USPSection;
