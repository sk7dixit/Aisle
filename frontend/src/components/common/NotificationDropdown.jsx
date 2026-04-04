import { useNavigate } from 'react-router-dom';
import { FaCircle, FaInfoCircle, FaExclamationTriangle, FaTimes, FaBellSlash } from 'react-icons/fa';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const NotificationDropdown = ({ onClose }) => {
    const { notifications, markAsRead, loading } = useNotifications();
    const { user } = useAuth();
    const navigate = useNavigate();

    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'CRITICAL':
                return <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600"><FaExclamationTriangle size={14} /></div>;
            case 'IMPORTANT':
                return <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><FaExclamationTriangle size={14} /></div>;
            case 'INFO':
                return <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><FaInfoCircle size={14} /></div>;
            default:
                return <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><FaInfoCircle size={14} /></div>;
        }
    };

    const formatTimeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(date).toLocaleDateString();
    };

    const handleItemClick = async (notif) => {
        if (!notif.isRead) {
            await markAsRead(notif._id);
        }
        if (notif.actionLink) {
            navigate(notif.actionLink);
            onClose();
        }
    };

    return (
        <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden flex flex-col font-inter animate-fade-in-up">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Notifications</h3>
                <button onClick={onClose} className="p-1 hover:bg-slate-50 rounded-full transition-colors">
                    <FaTimes size={14} className="text-slate-400" />
                </button>
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-10 text-center text-slate-400 text-sm">Loading...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                            <FaBellSlash className="text-slate-300" />
                        </div>
                        <p className="text-slate-600 font-bold text-sm">🎉 You’re all caught up.</p>
                        <p className="text-slate-400 text-xs mt-1 text-center">Important updates will appear here.</p>
                    </div>
                ) : (
                    <div className="py-2">
                        {notifications.map((notif) => (
                            <div
                                key={notif._id}
                                onClick={() => handleItemClick(notif)}
                                className={`px-5 py-4 flex gap-4 cursor-pointer transition-all hover:bg-slate-50 relative group ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
                            >
                                <div className="flex-shrink-0">
                                    {getPriorityIcon(notif.priority)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-0.5">
                                        <h4 className={`text-sm leading-tight pr-4 ${!notif.isRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                                            {notif.title}
                                        </h4>
                                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mt-0.5">
                                            {formatTimeAgo(notif.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>
                                {!notif.isRead && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <FaCircle className="text-blue-500 w-2 h-2" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-50">
                <button
                    onClick={() => {
                        const target = user?.role === 'seller' ? '/seller/notifications' : '/notifications';
                        navigate(target);
                        onClose();
                    }}
                    className="w-full py-3.5 text-xs font-black text-slate-800 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                    View All Notifications
                </button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
