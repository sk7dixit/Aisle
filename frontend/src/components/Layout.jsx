import Navbar from './Navbar';
import Footer from './Footer';
import AmbientBackground from './AmbientBackground';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-text font-sans relative overflow-x-hidden selection:bg-accent-start selection:text-white">
            <AmbientBackground />
            <Navbar />
            <main className="relative z-10">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
