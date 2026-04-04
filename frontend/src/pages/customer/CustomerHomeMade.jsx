import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CustomerHomeMade = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to Shops with homemade filter
        navigate('/shops?filter=homemade', { replace: true });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <p className="text-slate-400 font-medium">Redirecting to HomeMade Sellers...</p>
        </div>
    );
};

export default CustomerHomeMade;
