import { Link } from 'react-router-dom';

const SellerCTA = () => {
    return (
        <section className="bg-background py-20 px-4 md:px-0">
            <div className="max-w-5xl mx-auto">
                <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center">

                    {/* Background Image & Overlay */}
                    <div className="absolute inset-0 z-0">
                        <img src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1950&q=80" alt="Shop Background" className="w-full h-full object-cover opacity-20" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                    </div>

                    {/* Glassmorphism Card Content */}
                    <div className="relative z-10 bg-card/60 backdrop-blur-lg border border-gray-700 rounded-2xl p-8 md:p-12 shadow-2xl max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                            Are you a business owner or creator?
                        </h2>
                        <p className="text-lg text-gray-300 mb-8">
                            Stop losing customers to online giants. Make your inventory visible to people searching nearby in minutes.
                        </p>
                        <Link
                            to="/register?role=seller"
                            className="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-colors shadow-lg transform hover:scale-105"
                        >
                            Grow With Aisle
                        </Link>
                    </div>

                </div>
            </div>
        </section>
    );
};

export default SellerCTA;
