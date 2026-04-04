import React from 'react';
import Header from '../components/Header';
import Hero from '../components/home/Hero';
import Benefits from '../components/home/Benefits';
import InventoryShowcase from '../components/home/InventoryShowcase';
import HowItWorks from '../components/home/HowItWorks';
import BuiltForLocal from '../components/home/BuiltForLocal';
import CTA from '../components/home/CTA';
import Footer from '../components/Footer';

const Home = () => {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
                <Hero />
                <Benefits />
                <InventoryShowcase />
                <HowItWorks />
                <BuiltForLocal />
                <CTA />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
