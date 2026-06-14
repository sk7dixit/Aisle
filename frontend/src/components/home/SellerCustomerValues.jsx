import useOnScreen from '../../hooks/useOnScreen';
import { FaStore, FaUser, FaCheckCircle } from 'react-icons/fa';

const SellerCustomerValues = () => {
    const [ref, visible] = useOnScreen({ threshold: 0.1 });

    return (
        <section className="py-24 relative z-10">
            <div className="container mx-auto px-6">
                <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* For Sellers */}
                    <div className={`glass-card-dark p-10 rounded-[2rem] shadow-lg hover:shadow-float transition-all duration-500 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <div className="w-16 h-16 rounded-2xl bg-accent-end/10 border border-accent-end/20 flex items-center justify-center text-4xl text-accent-end mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-accent-end/10">
                            <FaStore />
                        </div>
                        <h3 className="text-3xl font-bold text-text-primary mb-4">For Growing Businesses</h3>
                        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                            Compete with e-commerce giants without the tech or marketing headache.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-text-primary font-medium">
                                <FaCheckCircle className="text-accent-end" /> 0% Commission
                            </li>
                            <li className="flex items-center gap-3 text-text-primary font-medium">
                                <FaCheckCircle className="text-accent-end" /> Get Discovered Nearby
                            </li>
                            <li className="flex items-center gap-3 text-text-primary font-medium">
                                <FaCheckCircle className="text-accent-end" /> Easy Inventory Sync
                            </li>
                        </ul>
                    </div>

                    {/* For Customers */}
                    <div
                        className={`glass-card-dark p-10 rounded-[2rem] shadow-lg hover:shadow-float transition-all duration-500 delay-200 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-mint/10 border border-mint/20 flex items-center justify-center text-4xl text-mint mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-mint/10">
                            <FaUser />
                        </div>
                        <h3 className="text-3xl font-bold text-text-primary mb-4">For Shoppers</h3>
                        <p className="text-text-secondary text-lg mb-8 leading-relaxed">
                            Find exactly what you need, right where you stick a pin on the map.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-text-primary font-medium">
                                <FaCheckCircle className="text-mint" /> No Shipping Fees
                            </li>
                            <li className="flex items-center gap-3 text-text-primary font-medium">
                                <FaCheckCircle className="text-mint" /> Same-Day Pickup
                            </li>
                            <li className="flex items-center gap-3 text-text-primary font-medium">
                                <FaCheckCircle className="text-mint" /> Support Local Biz
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SellerCustomerValues;
