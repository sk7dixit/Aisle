import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserInspector from '../../components/admin/UserInspector';

/* 
  STEP 14 - USERS WIREFRAME EXECUTION
  Strict layout adherence.
  Account Enforcement Context.
*/

const Users = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All'); // All | Active | Blocked | Under Review
    const [searchTerm, setSearchTerm] = useState('');

    // Selection & Actions
    const [selectedUserId, setSelectedUserId] = useState(null); // For Drawer
    const [modalAction, setModalAction] = useState(null); // { type: 'block' | 'unblock', user: {} }
    const [blockReason, setBlockReason] = useState('');
    const [internalNote, setInternalNote] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                const mapped = data.map(u => ({
                    id: u._id,
                    displayId: u._id.substring(u._id.length - 8).toUpperCase(),
                    name: u.name,
                    email: u.email,
                    type: u.role.charAt(0).toUpperCase() + u.role.slice(1), // Customer | Seller | Admin
                    status: u.accountStatus.charAt(0).toUpperCase() + u.accountStatus.slice(1),
                    reportsCount: 0, // Mock, needs backend aggregation
                    lastActivity: '3 days ago', // Mock
                    fullData: u
                }));
                // Filter logic handled client-side for now
                setUsers(mapped);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const executeAction = async () => {
        if (!modalAction) return;

        if (modalAction.type === 'block' && !blockReason.trim()) {
            alert('Blocking reason is required.');
            return;
        }

        setActionLoading(true);
        try {
            const token = JSON.parse(localStorage.getItem('shoplensUser'))?.token;
            const endpoint = modalAction.type === 'block' ? 'block' : 'unblock';
            const body = modalAction.type === 'block'
                ? JSON.stringify({ reason: blockReason, note: internalNote })
                : null;

            const res = await fetch(`/api/admin/users/${modalAction.user.id}/${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body
            });

            if (res.ok) {
                fetchUsers();
                closeModal();
            } else {
                alert('Action failed');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setActionLoading(false);
        }
    };

    const closeModal = () => {
        setModalAction(null);
        setBlockReason('');
        setInternalNote('');
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.id.includes(searchTerm);

        if (filter === 'All') return matchesSearch;
        return matchesSearch && user.status === filter;
    });

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading User Registry...</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto space-y-8 bg-[#F2F2F2]">

            {/* 2️⃣ PAGE HEADER */}
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Users</h1>
                <p className="text-sm text-gray-500 mt-1">Manage user access and enforce platform rules</p>
            </div>

            {/* 3️⃣ PRIMARY ACTION ZONE */}
            <div className="bg-white border border-[#CBCBCB] rounded-xl overflow-hidden shadow-sm">

                {/* 4️⃣ FILTER & SEARCH */}
                <div className="p-4 border-b border-[#CBCBCB] flex justify-between items-center bg-white">
                    <div className="flex gap-2">
                        {['All', 'Active', 'Blocked', 'Under Review'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors border ${filter === f
                                    ? 'bg-gray-100 text-gray-900 border-gray-300'
                                    : 'bg-white text-gray-500 border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by Name / Email / ID"
                        className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 outline-none focus:border-gray-400 text-gray-700"
                    />
                </div>

                {/* 5️⃣ TABLE STRUCTURE */}
                <div className="overflow-x-auto">
                    {filteredUsers.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white border-b border-[#CBCBCB]">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/4">User Identity</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/6">User Type</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/6">Status</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider w-1/5">Risk Context</th>
                                    <th className="p-6 text-xs font-bold text-gray-900 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-gray-50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedUserId(user.id)}
                                    >
                                        {/* COL 1: User Identity */}
                                        <td className="p-6 align-top">
                                            <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                                            <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                                            <div className="text-[10px] text-gray-400 mt-1 font-mono">ID: USR-{user.displayId}</div>
                                        </td>

                                        {/* COL 2: User Type */}
                                        <td className="p-6 align-top">
                                            {user.type === 'Admin' || user.type === 'Super Admin' ? (
                                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider border border-gray-200 px-2 py-0.5 rounded bg-gray-50">Admin</span>
                                            ) : (
                                                <span className="text-sm text-gray-700">{user.type}</span>
                                            )}
                                        </td>

                                        {/* COL 3: Status */}
                                        <td className="p-6 align-top">
                                            {user.status === 'Blocked' ? (
                                                <span className="text-xs font-bold text-[#4D1717] bg-[#4D1717]/5 px-2 py-1 rounded">Blocked</span>
                                            ) : (
                                                <span className="text-sm text-gray-900">{user.status}</span>
                                            )}
                                        </td>

                                        {/* COL 4: Risk Context */}
                                        <td className="p-6 align-top">
                                            <div className="space-y-1 text-xs text-gray-600">
                                                <p>Reports: <span className="text-gray-900 font-medium">{user.reportsCount}</span></p>
                                                <p>Last activity: <span className="text-gray-900 font-medium">{user.lastActivity}</span></p>
                                            </div>
                                        </td>

                                        {/* COL 5: Actions */}
                                        <td className="p-6 align-top text-right" onClick={(e) => e.stopPropagation()}>
                                            {(user.type !== 'Admin' && user.type !== 'Super Admin') && (
                                                <div className="flex justify-end gap-3 items-center">
                                                    <button
                                                        onClick={() => navigate(`/admin/users/${user.id}/activity`)}
                                                        className="text-xs text-gray-400 hover:text-gray-900 hover:underline px-2 transition-colors"
                                                    >
                                                        View Activity
                                                    </button>

                                                    {user.status === 'Active' && (
                                                        <button
                                                            onClick={() => setModalAction({ type: 'block', user })}
                                                            className="px-4 py-2 bg-white border border-[#4D1717]/30 text-[#4D1717] hover:bg-[#4D1717]/5 text-xs font-bold rounded shadow-sm transition-colors"
                                                        >
                                                            Block User
                                                        </button>
                                                    )}
                                                    {user.status === 'Blocked' && (
                                                        <button
                                                            onClick={() => setModalAction({ type: 'unblock', user })}
                                                            className="px-4 py-2 bg-[#174D38] text-white hover:bg-[#123d2c] text-xs font-bold rounded shadow-sm transition-colors"
                                                        >
                                                            Unblock User
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        /* 9️⃣ EMPTY STATE */
                        <div className="py-24 text-center">
                            <h3 className="text-gray-900 font-bold mb-1">No users available.</h3>
                            <p className="text-sm text-gray-500">System registry is empty for this view.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 6️⃣ INSPECTOR DRAWER */}
            {selectedUserId && Boolean(users.find(u => u.id === selectedUserId)) && (
                <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm flex justify-end">
                    <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-gray-200 animate-slide-left">
                        <UserInspector
                            user={users.find(u => u.id === selectedUserId).fullData}
                            onClose={() => setSelectedUserId(null)}
                            readOnly={true}
                        />
                    </div>
                </div>
            )}

            {/* 7️⃣ & 8️⃣ MODALS */}
            {modalAction && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden border border-gray-200">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100">
                            <h3 className={`text-lg font-bold ${modalAction.type === 'block' ? 'text-[#4D1717]' : 'text-[#174D38]'}`}>
                                {modalAction.type === 'block' ? 'Block User' : 'Unblock User'}
                            </h3>
                            <div className="text-sm text-gray-500 mt-1">User: <span className="text-gray-900 font-medium">{modalAction.user.name}</span></div>
                        </div>

                        <div className="p-6">
                            {modalAction.type === 'block' ? (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Reason for blocking (required)</label>
                                        <textarea
                                            value={blockReason}
                                            onChange={(e) => setBlockReason(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-3 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none h-24 resize-none"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Internal note (optional)</label>
                                        <textarea
                                            value={internalNote}
                                            onChange={(e) => setInternalNote(e.target.value)}
                                            className="w-full border border-gray-300 rounded p-3 text-sm focus:border-gray-900 outline-none h-16 resize-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Blocking will prevent this user from accessing ShopLens.</p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-600 mb-6">
                                    Unblocking will restore access to ShopLens.
                                </p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeAction}
                                    disabled={actionLoading || (modalAction.type === 'block' && !blockReason.trim())}
                                    className={`px-5 py-2.5 text-sm font-bold text-white rounded shadow-sm transition-colors ${modalAction.type === 'block'
                                        ? 'bg-[#4D1717] hover:bg-[#3d1212] disabled:opacity-50'
                                        : 'bg-[#174D38] hover:bg-[#123d2c] disabled:opacity-50'
                                        }`}
                                >
                                    {actionLoading ? 'Processing...' : (modalAction.type === 'block' ? 'Confirm Block' : 'Unblock User')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Users;
