import React, { useState } from 'react';
import {
    FiSpeaker, FiPlus, FiFilter, FiSearch, FiMoreVertical, FiEdit2, FiArchive, FiEye, FiZap, FiFileText, FiTarget
} from 'react-icons/fi';
import AnnouncementInspector from '../../components/admin/AnnouncementInspector';

// Mock Data
// Mock Data Removed - Now using Real API

const Announcements = () => {
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [isInspectorOpen, setIsInspectorOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/announcements', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                const mapped = data.map(a => ({
                    id: a._id,
                    title: a.title,
                    message: a.message,
                    target: a.target,
                    priority: a.priority,
                    status: a.status,
                    date: new Date(a.createdAt).toLocaleDateString(),
                    author: a.author?.name || 'Unknown'
                }));
                setAnnouncements(mapped);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAnnouncements();
    }, []);

    const filteredList = announcements.filter(item => {
        const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const handleCreate = () => {
        setSelectedAnnouncement(null);
        setIsInspectorOpen(true);
    };

    const handleEdit = (announcement) => {
        setSelectedAnnouncement(announcement);
        setIsInspectorOpen(true);
    };

    const handleSave = async (data) => {
        try {
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            let res;
            if (selectedAnnouncement) {
                // Update
                res = await fetch(`/api/admin/announcements/${selectedAnnouncement.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
            } else {
                // Create
                res = await fetch(`/api/admin/announcements`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(data)
                });
            }

            if (res.ok) {
                fetchAnnouncements(); // Refresh
                setIsInspectorOpen(false);
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 relative">

            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-green-600 text-xs font-bold uppercase">
                        <FiZap /> Active
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {announcements.filter(a => a.status === 'Published').length}
                    </p>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase">
                        <FiFileText /> Drafts
                    </div>
                    <p className="text-2xl font-bold text-gray-600">
                        {announcements.filter(a => a.status === 'Draft').length}
                    </p>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase">
                        <FiSpeaker /> Critical
                    </div>
                    <p className="text-2xl font-bold text-red-600">
                        {announcements.filter(a => a.priority === 'Critical' && a.status === 'Published').length}
                    </p>
                </div>
                <div className="p-4 bg-white/50 rounded-2xl border border-white/60 shadow-sm flex items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors group" onClick={handleCreate}>
                    <div className="flex flex-col items-center gap-1 text-blue-600">
                        <FiPlus size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase">New Announcement</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-white/40 rounded-3xl border border-white/60 backdrop-blur-md shadow-lg p-0">

                {/* Visual Header / Controls */}
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4 items-center">
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar">
                        {['All', 'Published', 'Draft', 'Expired'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${filterStatus === status
                                    ? 'bg-gray-800 text-white shadow-lg'
                                    : 'bg-white/50 text-gray-500 hover:bg-white'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="relative group w-full md:w-80">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/50 pl-10 pr-4 py-2 rounded-xl border border-gray-200 outline-none focus:border-blue-500 transition-all font-medium text-gray-700 text-sm"
                        />
                    </div>
                </div>

                {/* List View */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    <div className="space-y-4">
                        {filteredList.map(announcement => (
                            <div
                                key={announcement.id}
                                className="bg-white/60 p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center group"
                            >
                                {/* Icon & Priority Line */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${announcement.priority === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' :
                                    announcement.priority === 'Important' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                    <FiSpeaker size={20} />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-bold text-gray-800 text-lg truncate">{announcement.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${announcement.status === 'Published' ? 'bg-green-100 text-green-700' :
                                            announcement.status === 'Draft' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {announcement.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1 mb-2">{announcement.message}</p>
                                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                                        <span className="flex items-center gap-1"><FiTarget /> {announcement.target}</span>
                                        <span>•</span>
                                        <span>{announcement.date}</span>
                                        <span>•</span>
                                        <span>By {announcement.author}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100">
                                    <button
                                        onClick={() => handleEdit(announcement)}
                                        className="flex-1 md:flex-none py-2 px-4 rounded-lg bg-white border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FiEdit2 /> Edit
                                    </button>
                                </div>
                            </div>
                        ))}

                        {filteredList.length === 0 && (
                            <div className="text-center py-20 text-gray-400">
                                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FiSpeaker size={24} />
                                </div>
                                <p>No announcements found.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Inspector */}
            {isInspectorOpen && (
                <AnnouncementInspector
                    announcement={selectedAnnouncement}
                    onClose={() => setIsInspectorOpen(false)}
                    onSave={handleSave}
                    onPublish={handleSave}
                />
            )}

        </div>
    );
};

export default Announcements;
