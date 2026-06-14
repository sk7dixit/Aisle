import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Hero from '../components/home/Hero';
import Benefits from '../components/home/Benefits';
import InventoryShowcase from '../components/home/InventoryShowcase';
import HowItWorks from '../components/home/HowItWorks';
import BuiltForLocal from '../components/home/BuiltForLocal';
import CTA from '../components/home/CTA';
import Footer from '../components/Footer';
import MobileHome from '../components/mobile/MobileHome';
import { Bell } from 'lucide-react';

const Home = () => {
    // 2. Floating Customer Activity Feed State
    const activities = [
        "🟢 Someone viewed Homemade Mango Pickle nearby (2 min ago)",
        "🟢 New creator joined: Sweet Whisk Bakery",
        "🟢 Customer ordered Crochet Shoulder Bag (10 min ago)",
        "🟢 14 people checked out Diwali Hampers today",
        "🟢 Someone ordered Tiffin Service from Priya's Kitchen (5 min ago)"
    ];
    const [activityIndex, setActivityIndex] = useState(0);
    const [showActivity, setShowActivity] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            // Smooth fade out transition
            setShowActivity(false);
            
            const timer = setTimeout(() => {
                setActivityIndex(prev => (prev + 1) % activities.length);
                setShowActivity(true);
            }, 600); // Wait for fade-out to complete

            return () => clearTimeout(timer);
        }, 6000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-[#FDFCF8] relative">
            {/* Desktop Experience (Freeze) */}
            <div className="hidden lg:block">
                <Header />
                
                <main className="pt-24">
                    <Hero />
                    <Benefits />
                    <InventoryShowcase />
                    <HowItWorks />
                    <BuiltForLocal />
                    <CTA />
                </main>
                
                <Footer />

                {/* Floating Customer Activity Feed (Social proof toast in bottom right) */}
                <div 
                    className={`fixed bottom-6 right-6 z-40 bg-slate-900/90 text-white text-[11px] font-bold py-3.5 px-5 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-md flex items-center gap-2 max-w-sm transition-all duration-500 transform ${
                        showActivity ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
                    }`}
                >
                    <Bell className="w-3.5 h-3.5 text-teal-400 animate-bounce flex-shrink-0" />
                    <span className="text-slate-100 tracking-wide font-medium">
                        {activities[activityIndex]}
                    </span>
                </div>
            </div>

            {/* Mobile Experience (Complete Redesign) */}
            <div className="block lg:hidden">
                <MobileHome />
            </div>
        </div>
    );
};

export default Home;
