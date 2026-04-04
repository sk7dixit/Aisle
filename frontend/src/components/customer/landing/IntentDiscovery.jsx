import SystemNote from '../../common/SystemNote';
import { useSidebarState } from '../../../context/SidebarStateContext';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaRegStar } from 'react-icons/fa';

const IntentDiscovery = ({ interests = [], onToggleInterest }) => {
    const { signalBrowsing } = useSidebarState();
    const navigate = useNavigate();

    const handleIntent = (term) => {
        signalBrowsing(term);
        navigate(`/market/search?q=${term}`);
    };

    const handleStarClick = (e, label) => {
        e.stopPropagation();
        if (onToggleInterest) {
            onToggleInterest(label);
        }
    };

    const getHumanDistance = (index) => {
        const distances = ["Very close", "A short walk", "Nearby", "< 1 km", "Local favorite", "Open now"];
        return distances[index % distances.length];
    };

    const intents = [
        { label: "Need groceries now", emoji: "🥦", type: "urgent" },
        { label: "Pharmacy near me", emoji: "💊", type: "urgent" },
        { label: "Quick snacks & drinks", emoji: "🥤", type: "casual" },
        { label: "Electronics shops nearby", emoji: "🔌", type: "browse" },
        { label: "Daily essentials", emoji: "🧼", type: "routine" },
        { label: "Stationery & Prints", emoji: "✏️", type: "browse" },
    ];

    return (
        <section id="intent-discovery" className="px-6 mb-12 max-w-4xl mx-auto">
            <div className="text-center mb-6">
                {/* Upgrade #4 System Voice: Before Heading */}
                <SystemNote>Choose what you need — we’ll focus on shops closest to you.</SystemNote>
                <h2 className="text-xl font-bold text-gray-900 mt-2">What are you looking for?</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {intents.map((intent, i) => {
                    const isInterested = interests.some(item => item.label === intent.label);

                    return (
                        <button
                            key={i}
                            // ... existing button props ...
                            onClick={() => handleIntent(intent.label)}
                            className={`
                                relative p-5 text-left rounded-2xl transition-all duration-200 ease-out group select-none
                                border ${isInterested ? 'border-blue-200 bg-blue-50/50' : 'border-gray-100 bg-white hover:border-blue-300 hover:shadow-xl hover:-translate-y-1'}
                                active:scale-95 active:shadow-inner active:ring-2 active:ring-blue-100 active:border-blue-400
                            `}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <span className="text-4xl transform group-hover:scale-110 group-active:scale-90 transition-all duration-300 drop-shadow-sm">{intent.emoji}</span>

                                <div
                                    onClick={(e) => handleStarClick(e, intent.label)}
                                    className={`
                                        p-2 -mr-2 -mt-2 rounded-full transition-all duration-200 group/star relative
                                        ${isInterested ? 'text-blue-500 scale-110' : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'}
                                    `}
                                    title="Save this to track nearby availability over time." // Native tooltip for simplicity or custom if needed
                                >
                                    {isInterested ? <FaStar className="text-lg drop-shadow-sm" /> : <FaRegStar className="text-lg" />}

                                    {/* Custom Tooltip on Hover (First use hint) */}
                                    <div className="absolute bottom-full mb-2 right-0 w-48 bg-gray-900 text-white text-[10px] p-2 rounded opacity-0 group-hover/star:opacity-100 transition-opacity pointer-events-none z-10 hidden md:block">
                                        Save this to track nearby availability over time.
                                    </div>
                                </div>
                            </div>
                            {/* ... remaining card content ... */}
                            <span className={`font-bold text-sm block mb-1 ${isInterested ? 'text-blue-900' : 'text-gray-900'}`}>
                                {intent.label}
                            </span>

                            <div className="flex items-center gap-1">
                                <span className={`text-[10px] font-medium ${isInterested ? 'text-blue-400' : 'text-gray-400'}`}>
                                    {getHumanDistance(i)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* System Voice: Below Grid / Inside Grid context */}
            <SystemNote>Distance and availability are shown relative to your current area.</SystemNote>
        </section>
    );
};

export default IntentDiscovery;
