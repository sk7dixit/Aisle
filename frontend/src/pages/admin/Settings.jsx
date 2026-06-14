import React, { useState, useEffect } from 'react';
import {
    FiSettings, FiShield, FiUsers, FiLayers, FiFlag, FiBell, FiCpu, FiFileText,
    FiToggleLeft, FiToggleRight, FiSave, FiAlertTriangle, FiInfo
} from 'react-icons/fi';
import GlassCard from '../../components/ui/GlassCard';

/* 
  STEP 14 - SETTINGS WIREFRAME EXECUTION
  Strict "Lawbook" Layout.
  Platform Policy Context.
*/

const Settings = () => {
    const [activeTab, setActiveTab] = useState('platformControl');
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            // Mocking structure if backend endpoint returns partial data, ensuring UI doesn't crash
            const res = await fetch('/api/admin/settings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                // Ensure all sections exist in state even if backend is partial
                setSettings({
                    platformControl: data.platformControl || { platformStatus: 'Live', sellerOnboardingEnabled: true },
                    sellerRules: data.sellerRules || { mandatoryVerification: true, maxRejectionAttempts: 3, reApplicationCooldownDays: 30 },
                    marketplaceStructure: data.marketplaceStructure || { maxProductsPerSeller: 500, categoriesEnabled: true, shopVisibility: 'immediate' },
                    moderationPolicy: data.moderationPolicy || { autoFlagThreshold: 3, suspensionDurationDays: 7 },
                    notificationPolicy: data.notificationPolicy || { notifySellerOnSuspension: true, notifyCustomerOnReportResolution: true },
                    securityPolicy: data.securityPolicy || { adminSessionTimeoutMinutes: 30, enforceMultiAdminVisibility: true },
                    auditPolicy: data.auditPolicy || { logRetentionDays: 365 },
                    lastUpdatedAt: data.lastUpdatedAt
                });
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setLoading(false);
        }
    };

    // Generic Update Handler (Local State)
    const updateLocalState = (section, key, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState(null); // { section, title }

    // Save Section Trigger
    const initiateSave = (section) => {
        setConfirmModal({
            section,
            title: `Save ${sections.find(s => s.id === section)?.label} Settings`
        });
    };

    const confirmSave = async () => {
        if (!confirmModal) return;
        const section = confirmModal.section;

        try {
            setSaving(true);
            const token = JSON.parse(localStorage.getItem('aisleUser'))?.token;
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    section: section,
                    settings: settings[section]
                })
            });

            if (res.ok) {
                // Success Modal or Toast could be better, but alert is acceptable for "System" feedback if consistent
                // Ideally, we just close the modal and maybe show a checkmark.
                fetchSettings();
                setConfirmModal(null);
            } else {
                alert('Failed to save settings.');
            }
        } catch (error) {
            console.error(error);
            alert('Error saving settings.');
        } finally {
            setSaving(false);
        }
    };

    // Sections Config (Strict 8 Sections)
    const sections = [
        { id: 'platformControl', label: 'Platform Control', icon: FiSettings, desc: 'Core operational switches' },
        { id: 'sellerRules', label: 'Seller Rules', icon: FiUsers, desc: 'Entry & retention conditions' },
        { id: 'marketplaceStructure', label: 'Market Structure', icon: FiLayers, desc: 'Organization & limits' },
        { id: 'moderationPolicy', label: 'Moderation & Safety', icon: FiFlag, desc: 'Enforcement strictness' },
        { id: 'notificationPolicy', label: 'Notifications', icon: FiBell, desc: 'System alerts' },
        { id: 'securityPolicy', label: 'Security', icon: FiShield, desc: 'Admin protection' },
        { id: 'auditPolicy', label: 'Audit & Compliance', icon: FiFileText, desc: 'Logging control' },
        { id: 'systemInfo', label: 'System Info', icon: FiCpu, desc: 'Read-only status' },
    ];

    // Helper Components - STRICT "LAWBOOK" STYLING
    const SectionHeader = ({ title, sub, onSave }) => (
        <div className="flex justify-between items-end mb-8 border-b border-[#CBCBCB] pb-6 sticky top-0 bg-[#F2F2F2] z-10 pt-2">
            <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h2>
                <p className="text-sm text-gray-500 mt-1">{sub}</p>
            </div>
            {onSave && (
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#174D38] text-white rounded shadow-sm text-sm font-bold disabled:opacity-50 hover:bg-[#123d2c] transition-colors"
                >
                    <FiSave /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
            )}
        </div>
    );

    const SettingsBlock = ({ label, sub, children, danger = false }) => (
        <div className="p-6 bg-white border border-[#CBCBCB] rounded-lg mb-4 shadow-sm">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className={`font-bold text-sm ${danger ? 'text-[#4D1717]' : 'text-gray-900'}`}>{label}</h4>
                    {sub && <p className="text-xs text-gray-500 mt-1 max-w-lg leading-relaxed">{sub}</p>}
                </div>
            </div>
            <div>{children}</div>
        </div>
    );

    const Toggle = ({ checked, onChange, onLabel = 'Enabled', offLabel = 'Disabled' }) => (
        <button
            onClick={onChange}
            className="flex items-center gap-3 group"
        >
            <div className={`text-4xl transition-colors ${checked ? 'text-[#174D38]' : 'text-gray-300'}`}>
                {checked ? <FiToggleRight /> : <FiToggleLeft />}
            </div>
            <span className={`text-sm font-bold ${checked ? 'text-gray-900' : 'text-gray-400'}`}>
                {checked ? onLabel : offLabel}
            </span>
        </button>
    );

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Loading System Configuration...</div>;
    if (!settings) return <div className="p-12 text-center text-[#4D1717] font-bold">System Configuration Load Failed.</div>;

    return (
        <div className="min-h-full p-8 md:p-12 max-w-[1600px] mx-auto bg-[#F2F2F2] flex flex-col md:flex-row gap-8 relative">

            {/* 3. SETTINGS LAYOUT STRUCTURE - LEFT NAV */}
            <div className="w-full md:w-64 shrink-0 space-y-1">
                <div className="mb-6 px-2">
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Define platform-wide rules.</p>
                </div>

                <div className="flex flex-col gap-1">
                    {sections.map((sec) => (
                        <button
                            key={sec.id}
                            onClick={() => setActiveTab(sec.id)}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-left transition-colors
                                ${activeTab === sec.id
                                    ? 'bg-white text-gray-900 shadow-sm border border-[#CBCBCB] font-bold'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'}
                            `}
                        >
                            <sec.icon size={16} className={activeTab === sec.id ? 'text-gray-900' : 'text-gray-400'} />
                            <div className="flex flex-col">
                                <span>{sec.label}</span>
                                <span className="text-[10px] font-normal opacity-70">{sec.desc}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. SETTINGS LAYOUT STRUCTURE - RIGHT CONTENT */}
            <div className="flex-1 min-w-0">

                {/* 4. PLATFORM CONTROL */}
                {activeTab === 'platformControl' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Platform Control" sub="Core operational switches for Aisle." onSave={() => initiateSave('platformControl')} />

                        <SettingsBlock label="Platform Status" sub="Impact: Customers cannot access Aisle during maintenance. Sellers cannot operate.">
                            <div className="flex gap-4">
                                <button
                                    onClick={() => updateLocalState('platformControl', 'platformStatus', 'Live')}
                                    className={`px-6 py-2 rounded border text-sm font-bold ${settings.platformControl.platformStatus === 'Live' ? 'bg-[#174D38] text-white border-[#174D38]' : 'bg-white text-gray-500 border-gray-300'}`}
                                >
                                    Live
                                </button>
                                <button
                                    onClick={() => updateLocalState('platformControl', 'platformStatus', 'Maintenance')}
                                    className={`px-6 py-2 rounded border text-sm font-bold ${settings.platformControl.platformStatus === 'Maintenance' ? 'bg-[#4D1717] text-white border-[#4D1717]' : 'bg-white text-gray-500 border-gray-300'}`}
                                >
                                    Maintenance
                                </button>
                            </div>
                        </SettingsBlock>

                        <SettingsBlock label="Seller Onboarding" sub="Impact: New sellers cannot apply when disabled.">
                            <Toggle
                                checked={settings.platformControl.sellerOnboardingEnabled}
                                onChange={() => updateLocalState('platformControl', 'sellerOnboardingEnabled', !settings.platformControl.sellerOnboardingEnabled)}
                            />
                        </SettingsBlock>
                    </div>
                )}

                {/* 5. SELLER RULES */}
                {activeTab === 'sellerRules' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Seller Rules" sub="Define seller entry and retention conditions." onSave={() => initiateSave('sellerRules')} />

                        <SettingsBlock label="Mandatory Verification Steps" sub="Applies to new seller applications only.">
                            <div className="space-y-3 mt-4">
                                <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.sellerRules.mandatoryVerification}
                                        onChange={() => updateLocalState('sellerRules', 'mandatoryVerification', !settings.sellerRules.mandatoryVerification)}
                                        className="w-4 h-4 text-gray-900 focus:ring-gray-900 border-gray-300 rounded"
                                    />
                                    <span className="font-bold">Document Verification</span>
                                </label>
                                <label className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" checked readOnly className="w-4 h-4 text-gray-300 border-gray-300 rounded bg-gray-100" />
                                    <span className="font-bold text-gray-400">Shop Details Review (Always On)</span>
                                </label>
                            </div>
                        </SettingsBlock>

                        <SettingsBlock label="Max Rejection Attempts" sub="Limit before cooldown applied.">
                            <input
                                type="number"
                                value={settings.sellerRules.maxRejectionAttempts}
                                onChange={(e) => updateLocalState('sellerRules', 'maxRejectionAttempts', parseInt(e.target.value))}
                                className="w-24 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>

                        <SettingsBlock label="Re-application Cooldown (Days)" sub="Days to wait after max rejections.">
                            <input
                                type="number"
                                value={settings.sellerRules.reApplicationCooldownDays}
                                onChange={(e) => updateLocalState('sellerRules', 'reApplicationCooldownDays', parseInt(e.target.value))}
                                className="w-24 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>
                    </div>
                )}

                {/* 6. MARKETPLACE STRUCTURE */}
                {activeTab === 'marketplaceStructure' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Marketplace Structure" sub="Define how the marketplace is organized." onSave={() => initiateSave('marketplaceStructure')} />

                        <SettingsBlock label="Enabled Categories" sub="Master category list.">
                            <button className="text-xs font-bold text-blue-600 hover:underline">View Categories (Read-only)</button>
                        </SettingsBlock>

                        <SettingsBlock label="Max Products per Seller" sub="Global limit per shop.">
                            <input
                                type="number"
                                value={settings.marketplaceStructure.maxProductsPerSeller}
                                onChange={(e) => updateLocalState('marketplaceStructure', 'maxProductsPerSeller', parseInt(e.target.value))}
                                className="w-32 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>

                        <SettingsBlock label="Shop Visibility Rule" sub="Default behavior for approved shops.">
                            <div className="space-y-2 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="shopVisibility"
                                        checked={settings.marketplaceStructure.shopVisibility === 'immediate'}
                                        onChange={() => updateLocalState('marketplaceStructure', 'shopVisibility', 'immediate')}
                                        className="text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="text-sm">Immediate after approval</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="shopVisibility"
                                        checked={settings.marketplaceStructure.shopVisibility === 'manual'}
                                        onChange={() => updateLocalState('marketplaceStructure', 'shopVisibility', 'manual')}
                                        className="text-gray-900 focus:ring-gray-900"
                                    />
                                    <span className="text-sm">Manual activation by admin</span>
                                </label>
                            </div>
                        </SettingsBlock>
                    </div>
                )}

                {/* 7. MODERATION & SAFETY */}
                {activeTab === 'moderationPolicy' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Moderation & Safety" sub="Define enforcement strictness." onSave={() => initiateSave('moderationPolicy')} />

                        <SettingsBlock label="Auto-Flag Threshold" sub="Reports required to auto-flag a product.">
                            <input
                                type="number"
                                value={settings.moderationPolicy.autoFlagThreshold}
                                onChange={(e) => updateLocalState('moderationPolicy', 'autoFlagThreshold', parseInt(e.target.value))}
                                className="w-24 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>

                        <SettingsBlock label="Default Suspension Duration (Days)" sub="Initial suspension period.">
                            <input
                                type="number"
                                value={settings.moderationPolicy.suspensionDurationDays}
                                onChange={(e) => updateLocalState('moderationPolicy', 'suspensionDurationDays', parseInt(e.target.value))}
                                className="w-24 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>
                    </div>
                )}

                {/* 8. NOTIFICATIONS */}
                {activeTab === 'notificationPolicy' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="System Notifications" sub="Define who gets notified and when." onSave={() => initiateSave('notificationPolicy')} />

                        <SettingsBlock label="Seller Notifications">
                            <div className="space-y-3 mt-2">
                                <label className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={settings.notificationPolicy.notifySellerOnSuspension}
                                        onChange={() => updateLocalState('notificationPolicy', 'notifySellerOnSuspension', !settings.notificationPolicy.notifySellerOnSuspension)}
                                        className="w-4 h-4 text-gray-900 rounded"
                                    />
                                    On Shop Suspension
                                </label>
                            </div>
                        </SettingsBlock>

                        <SettingsBlock label="Customer Notifications">
                            <div className="space-y-3 mt-2">
                                <label className="flex items-center gap-3 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={settings.notificationPolicy.notifyCustomerOnReportResolution}
                                        onChange={() => updateLocalState('notificationPolicy', 'notifyCustomerOnReportResolution', !settings.notificationPolicy.notifyCustomerOnReportResolution)}
                                        className="w-4 h-4 text-gray-900 rounded"
                                    />
                                    On Report Resolution
                                </label>
                            </div>
                        </SettingsBlock>
                    </div>
                )}

                {/* 9. SECURITY */}
                {activeTab === 'securityPolicy' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Security" sub="Protect admin access and authority." onSave={() => initiateSave('securityPolicy')} />

                        <SettingsBlock label="Admin Session Timeout (Minutes)" sub="Force logout after inactivity.">
                            <input
                                type="number"
                                value={settings.securityPolicy.adminSessionTimeoutMinutes}
                                onChange={(e) => updateLocalState('securityPolicy', 'adminSessionTimeoutMinutes', parseInt(e.target.value))}
                                className="w-24 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>
                    </div>
                )}

                {/* 10. AUDIT & COMPLIANCE */}
                {activeTab === 'auditPolicy' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="Audit & Compliance" sub="Control logging and accountability." onSave={() => initiateSave('auditPolicy')} />

                        <SettingsBlock label="Log Retention Period (Days)" sub="Data retention policy.">
                            <input
                                type="number"
                                value={settings.auditPolicy.logRetentionDays}
                                onChange={(e) => updateLocalState('auditPolicy', 'logRetentionDays', parseInt(e.target.value))}
                                className="w-24 p-2 border border-gray-300 rounded text-sm font-bold focus:border-gray-900 outline-none"
                            />
                        </SettingsBlock>

                        <SettingsBlock label="Immutable Logs" sub="Logs can never be disabled manually." danger>
                            <div className="flex items-center gap-2 opacity-60 cursor-not-allowed">
                                <FiToggleRight className="text-3xl text-[#174D38]" />
                                <span className="text-sm font-bold text-gray-900">Enabled (Locked)</span>
                            </div>
                        </SettingsBlock>
                    </div>
                )}

                {/* 11. SYSTEM INFORMATION */}
                {activeTab === 'systemInfo' && (
                    <div className="animate-fade-in">
                        <SectionHeader title="System Information" sub="Current platform status (Read-only)." />

                        <div className="grid grid-cols-2 gap-4">
                            <SettingsBlock label="App Version">
                                <p className="text-xl font-bold text-gray-900">v1.2.0</p>
                            </SettingsBlock>
                            <SettingsBlock label="Environment">
                                <p className="text-xl font-bold text-gray-900">Production</p>
                            </SettingsBlock>
                            <SettingsBlock label="API Status">
                                <p className="text-xl font-bold text-[#174D38]">Healthy</p>
                            </SettingsBlock>
                            <SettingsBlock label="Database">
                                <p className="text-xl font-bold text-[#174D38]">Connected</p>
                            </SettingsBlock>
                        </div>
                    </div>
                )}

            </div>

            {/* CONFIRMATION MODAL */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-gray-100 flex items-start gap-3 bg-gray-50/50">
                            <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                                <FiAlertTriangle />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirm System Change</h3>
                                <p className="text-sm text-gray-500 mt-1 leading-tight">You are about to modify global platform settings.</p>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-700 mb-6 font-medium">
                                Action: <span className="text-gray-900">{confirmModal.title}</span>
                                <br />
                                <span className="text-xs text-gray-500 font-normal mt-1 block">These changes will apply immediately to all users.</span>
                            </p>

                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-[#174D38] text-white hover:bg-[#123d2c] text-sm font-bold rounded shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {saving ? 'Applying...' : 'Confirm & Apply'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
