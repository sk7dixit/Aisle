import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    FaTimes, FaChevronRight, FaHeadset, FaSearch, FaArrowLeft, FaThumbsUp, FaThumbsDown,
    FaPhone, FaCheckCircle, FaExclamationTriangle, FaSpinner, FaBoxOpen, FaChartLine,
    FaStore, FaUnlock, FaMoneyBillWave, FaPaperPlane, FaLanguage, FaShieldAlt, FaFire,
    FaTimesCircle, FaClock, FaHistory, FaCheck, FaUndo, FaStar, FaLightbulb, FaTrophy, FaCalendarAlt
} from 'react-icons/fa';

// The knowledge base static fallback in frontend
const POPULAR_ISSUES_DEFAULT = [
    { id: 'product_visibility', title: 'Product not visible to customers', category: 'PRODUCT' },
    { id: 'payment_pending', title: 'Payment not received', category: 'PAYMENTS' },
    { id: 'shop_status', title: 'Shop showing closed', category: 'SETTINGS' }
];

const QUICK_ACTIONS = [
    { id: 'PRODUCT', label: 'Products & Media', icon: <FaBoxOpen className="text-amber-500" />, subtext: 'Listing, images, blurred photos' },
    { id: 'ORDERS', label: 'Orders & Sales', icon: <FaChartLine className="text-blue-500" />, subtext: 'Sales tracking, zero earnings' },
    { id: 'PAYMENTS', label: 'Payments & Payouts', icon: <FaMoneyBillWave className="text-emerald-500" />, subtext: 'Bank details, payment cycles' },
    { id: 'SETTINGS', label: 'Shop Settings', icon: <FaStore className="text-purple-500" />, subtext: 'Hours, status' },
    { id: 'LOGIN', label: 'Login & Security', icon: <FaUnlock className="text-rose-500" />, subtext: 'Password reset, hacked account' },
    { id: 'CALLBACK', label: 'Contact Support', icon: <FaPhone className="text-indigo-500" />, subtext: 'Request agent callback' }
];

const KNOWLEDGE_BASE = [
    {
        id: 'product_visibility',
        title: 'Product not visible to customers',
        category: 'PRODUCT',
        solution: 'Check if the product is marked as "In Stock" and "Active". Go to Products → Edit → Availability. Ensure your shop operating hours are active so products display to local buyers.'
    },
    {
        id: 'product_addition',
        title: 'Unable to add a product',
        category: 'PRODUCT',
        solution: 'Ensure all required fields are filled. Product name, subcategory, and price are mandatory. Try uploading with fewer optional fields first.'
    },
    {
        id: 'image_upload',
        title: 'Image not uploading',
        category: 'PRODUCT',
        solution: 'Use JPG or PNG images under 5MB. Ensure you have a stable network connection during the product upload process.'
    },
    {
        id: 'image_quality',
        title: 'Image looks blurred',
        category: 'PRODUCT',
        solution: 'Avoid screenshots or heavily compressed images. Use a clear original photo from your camera. Keep the background clean and products centered.'
    },
    {
        id: 'sales_tracking',
        title: 'Sales showing ₹0',
        category: 'ORDERS',
        solution: 'Sales figures update after orders are completed. Please check completed orders in History. Active or pending orders do not count towards completed revenue.'
    },
    {
        id: 'offer_visibility',
        title: 'Offer not visible',
        category: 'ORDERS',
        solution: 'Check if the offer is active and within the valid date range in the "Offers" tab. Ensure the offer is linked to the correct catalog products.'
    },
    {
        id: 'shop_status',
        title: 'Shop showing closed',
        category: 'SETTINGS',
        solution: 'Your shop may be in Auto mode or outside working hours. Check Shop Controls in the Dashboard header to toggle manual overrides.'
    },
    {
        id: 'login_issues',
        title: 'Cannot login',
        category: 'LOGIN',
        solution: 'Verify your email/number and password. Use the "Forgot Password" option on the login screen if you cannot remember your credentials.'
    },
    {
        id: 'payment_pending',
        title: 'Payment not received',
        category: 'PAYMENTS',
        solution: 'Weekly payouts are processed automatically. Please verify your bank details in Settings → Payments. Payouts can take up to 2-3 business days depending on banking cycles.'
    },
    {
        id: 'payout_issue',
        title: 'Cannot receive payout',
        category: 'PAYMENTS',
        solution: 'Weekly payouts are suspended if bank account verification fails. Please re-upload bank details in Settings → Payments for active verification.'
    },
    {
        id: 'fraud_payment',
        title: 'Fraud payment',
        category: 'LOGIN',
        solution: 'If you suspect a fraudulent transaction or card use, please freeze the order immediately in your Dashboard and report it here for prompt investigation.'
    },
    {
        id: 'security_issue',
        title: 'Account security issue',
        category: 'LOGIN',
        solution: 'Immediately change your password in Settings → Security. If you cannot access your account, request an emergency lock via support.'
    }
];

const COPILOT_PROMPTS = [
    { label: "Why are sales down?", text: "Why are sales down?" },
    { label: "Show low stock items", text: "Show low stock items" },
    { label: "What should I do today?", text: "What should I do today?" },
    { label: "Check shop health", text: "Check shop health" }
];

const AisleSupportPanel = ({ isOpen, onClose }) => {
    const { user, token } = useAuth();
    
    // Tabs: 'dashboard' (Aisle Business Center), 'copilot' (AI Copilot), 'help' (Smart Guide FAQs), 'timeline' (History Logs)
    const [activeTab, setActiveTab] = useState('copilot');
    
    // View States for the 'help' tab: 'home', 'category-detail', 'issue-detail', 'callback-form', 'success'
    const [viewState, setViewState] = useState('home');
    
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [categoryIssues, setCategoryIssues] = useState([]);
    
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
    const [wasHelpful, setWasHelpful] = useState(null);

    // Search States (Help tab)
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Callback Form States
    const [issueDescription, setIssueDescription] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
    const [loading, setLoading] = useState(false);
    
    // On-the-fly analysis states
    const [detectedIntent, setDetectedIntent] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    
    // Diagnostics, History, & Actions
    const [sellerContext, setSellerContext] = useState(null);
    const [supportHistory, setSupportHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [diagnosisLoading, setDiagnosisLoading] = useState(false);
    const [diagnosisResult, setDiagnosisResult] = useState(null);
    const [selectedProdId, setSelectedProdId] = useState('');
    
    // Actions execution status
    const [executingAction, setExecutingAction] = useState(null); 
    const [undoAction, setUndoAction] = useState(null); 
    const [successMessage, setSuccessMessage] = useState('');

    // Conversational diagnostics states
    const [activeSession, setActiveSession] = useState(null);
    const [sessionLogs, setSessionLogs] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [followupData, setFollowupData] = useState(null);

    const [popularIssues, setPopularIssues] = useState(POPULAR_ISSUES_DEFAULT);

    // Phase 6 Business Center States
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [automationMode, setAutomationMode] = useState('MANUAL');
    const [copilotMessages, setCopilotMessages] = useState([
        { sender: 'copilot', text: "How can I help you today? Ask me about sales, stock, tasks, or shop health.", createdAt: new Date() }
    ]);
    const [copilotInput, setCopilotInput] = useState('');
    const [copilotLoading, setCopilotLoading] = useState(false);

    const copilotEndRef = useRef(null);

    // Scroll to bottom of Copilot chat
    useEffect(() => {
        if (activeTab === 'copilot') {
            copilotEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [copilotMessages, activeTab]);

    // Reset panel state on open/close
    useEffect(() => {
        if (isOpen) {
            setViewState('home');
            setActiveTab('copilot');
            setSearchQuery('');
            setIssueDescription('');
            setPhoneNumber(user?.phone || '');
            setDetectedIntent(null);
            setFeedbackSubmitted(false);
            setSelectedIssue(null);
            setDiagnosisResult(null);
            setSelectedProdId('');
            setUndoAction(null);
            setSuccessMessage('');
            setActiveSession(null);
            setSessionLogs([]);
            setChatInput('');
            setCopilotInput('');
            setCopilotMessages([
                { sender: 'copilot', text: "How can I help you today? Ask me about sales, stock, tasks, or shop health.", createdAt: new Date() }
            ]);
            
            fetchContext();
            fetchSupportHistory();
            fetchFollowUp();
            fetchDashboardData();
        }
    }, [isOpen, user]);

    // Fetch active compiling context snapshot
    const fetchContext = async () => {
        try {
            const res = await fetch('/api/seller/support/context', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSellerContext(data);
            }
        } catch (err) {
            console.error('Error fetching support context:', err);
        }
    };

    // Fetch support logs history
    const fetchSupportHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/seller/support/history', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSupportHistory(data);
            }
        } catch (err) {
            console.error('Error fetching support history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchFollowUp = async () => {
        try {
            const res = await fetch('/api/support/followup', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.active) {
                    setFollowupData(data.followup);
                } else {
                    setFollowupData(null);
                }
            }
        } catch (err) {
            console.error('Error fetching follow up:', err);
        }
    };

    // Fetch Business Center Dashboard Data
    const fetchDashboardData = async () => {
        setDashboardLoading(true);
        try {
            const res = await fetch('/api/commerce/dashboard', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
                if (data.automationMode) {
                    setAutomationMode(data.automationMode);
                }
            }
        } catch (err) {
            console.error('Error fetching commerce dashboard data:', err);
        } finally {
            setDashboardLoading(false);
        }
    };

    const handleUpdateAutomationMode = async (newMode) => {
        try {
            const res = await fetch('/api/seller/automation-mode', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ automationMode: newMode })
            });
            if (res.ok) {
                const data = await res.json();
                setAutomationMode(data.automationMode);
                await fetchDashboardData();
            } else {
                alert('Failed to update AI Automation Mode');
            }
        } catch (err) {
            console.error('Error updating automation mode:', err);
        }
    };

    // Run Task Autonomous Action
    const runTaskExecution = async (taskId) => {
        setExecutingAction(taskId);
        setSuccessMessage('');
        try {
            const res = await fetch(`/api/commerce/tasks/${taskId}/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSuccessMessage(`Autonomous Action Executed: "${data.task?.task}" completed successfully!`);
                await fetchDashboardData();
                await fetchContext();
            } else {
                alert('Autonomous Action failed to execute.');
            }
        } catch (err) {
            console.error('Error executing task action:', err);
        } finally {
            setExecutingAction(null);
        }
    };

    // AI Commerce Copilot dialogue trigger
    const handleSendCopilotMessage = async (msgText) => {
        const textToSend = msgText || copilotInput;
        if (!textToSend.trim()) return;

        setCopilotInput('');
        setCopilotLoading(true);

        const updatedMsgs = [...copilotMessages, { sender: 'seller', text: textToSend, createdAt: new Date() }];
        setCopilotMessages(updatedMsgs);

        try {
            const res = await fetch('/api/commerce/copilot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: textToSend })
            });

            if (res.ok) {
                const advice = await res.json();
                setCopilotMessages(prev => [
                    ...prev,
                    {
                        sender: 'copilot',
                        text: advice.reply,
                        actions: advice.actions,
                        estimatedRevenueIncrease: advice.estimatedRevenueIncrease,
                        createdAt: new Date()
                    }
                ]);
            } else {
                setCopilotMessages(prev => [
                    ...prev,
                    { sender: 'copilot', text: "Sorry, I ran into an issue connecting to the copilot database. Please try again.", createdAt: new Date() }
                ]);
            }
        } catch (err) {
            console.error('Error in Copilot query:', err);
            setCopilotMessages(prev => [
                ...prev,
                { sender: 'copilot', text: "Connection error. Please try again later.", createdAt: new Date() }
            ]);
        } finally {
            setCopilotLoading(false);
        }
    };

    useEffect(() => {
        const handleSendPrompt = (e) => {
            const prompt = e.detail?.promptText;
            if (prompt) {
                setActiveTab('copilot');
                handleSendCopilotMessage(prompt);
            }
        };
        window.addEventListener('aisle:copilot:send-prompt', handleSendPrompt);
        return () => window.removeEventListener('aisle:copilot:send-prompt', handleSendPrompt);
    }, [token]);

    const handleStartInvestigation = async (topic) => {
        setLoading(true);
        setViewState('investigation-chat');
        try {
            const res = await fetch('/api/support/investigate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ issue: topic })
            });
            if (res.ok) {
                const session = await res.json();
                setActiveSession(session);
                setSessionLogs([]);
                if (session.currentStep === 'OFFER_FIX_PROPOSAL') {
                    fetchSessionStatus(session._id);
                }
            }
        } catch (err) {
            console.error('Error starting investigation:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSendChatMessage = async () => {
        if (!chatInput.trim() || !activeSession) return;
        const msg = chatInput;
        setChatInput('');
        setLoading(true);
        const updatedConversation = [...activeSession.conversation, { sender: 'seller', text: msg, createdAt: new Date() }];
        setActiveSession({ ...activeSession, conversation: updatedConversation });

        try {
            const res = await fetch('/api/support/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ sessionId: activeSession._id, message: msg })
            });
            if (res.ok) {
                const session = await res.json();
                setActiveSession(session);
                fetchSessionStatus(session._id);
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSessionStatus = async (sessionId) => {
        try {
            const res = await fetch(`/api/support/session/${sessionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSessionLogs(data.logs);
            }
        } catch (err) {
            console.error('Error fetching session logs:', err);
        }
    };

    // Fetch popular issues from analytics
    useEffect(() => {
        if (!isOpen) return;

        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/seller/support/analytics', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.length > 0) {
                        const mapped = data
                            .filter(item => item.issueId !== 'UNKNOWN')
                            .map(item => {
                                const kbMatch = KNOWLEDGE_BASE.find(kb => kb.id === item.issueId);
                                return {
                                    id: item.issueId,
                                    title: kbMatch ? kbMatch.title : item.title,
                                    category: kbMatch ? kbMatch.category : item.category
                                };
                            });
                        
                        const combined = [...mapped];
                        POPULAR_ISSUES_DEFAULT.forEach(def => {
                            if (!combined.some(c => c.id === def.id)) {
                                combined.push(def);
                            }
                        });
                        setPopularIssues(combined.slice(0, 4));
                    }
                }
            } catch (err) {
                console.error('Error fetching analytics:', err);
            }
        };

        fetchAnalytics();
    }, [isOpen, token]);

    // Debounce search input
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/seller/support/search?query=${encodeURIComponent(searchQuery)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data);
                }
            } catch (err) {
                console.error('Error searching support:', err);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery, token]);

    // Debounce callback form query parsing
    useEffect(() => {
        if (!issueDescription.trim() || issueDescription.length < 5) {
            setDetectedIntent(null);
            return;
        }

        const delayDebounce = setTimeout(async () => {
            setIsAnalyzing(true);
            try {
                const res = await fetch('/api/seller/support/detect-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ text: issueDescription })
                });
                if (res.ok) {
                    const data = await res.json();
                    setDetectedIntent(data);
                }
            } catch (err) {
                console.error('Error detecting intent:', err);
            } finally {
                setIsAnalyzing(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounce);
    }, [issueDescription, token]);

    // Run diagnostics API
    const runDiagnosisAPI = async (type, payload = {}) => {
        setDiagnosisLoading(true);
        setDiagnosisResult(null);
        try {
            const res = await fetch(`/api/seller/support/${type}-diagnosis`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                setDiagnosisResult(data);
            }
        } catch (err) {
            console.error(`Error running ${type} diagnosis:`, err);
        } finally {
            setDiagnosisLoading(false);
        }
    };

    // Execute Autonomous Fix Action API (legacy helper)
    const runExecutionAPI = async (action, targetId = null, payload = {}) => {
        setExecutingAction(action);
        setUndoAction(null);
        setSuccessMessage('');
        try {
            const res = await fetch('/api/seller/support/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, targetId, payload })
            });
            if (res.ok) {
                const actionLog = await res.json();
                setUndoAction(actionLog);
                setSuccessMessage(`System Auto-Fix executed: ${action.replace(/_/g, ' ')} successful!`);
                await fetchContext();
                await fetchDashboardData();
                
                if (diagnosisResult) {
                    if (diagnosisResult.type === 'PRODUCT') {
                        runDiagnosisAPI('product', { productId: targetId || selectedProdId });
                    } else if (diagnosisResult.type === 'PAYMENT') {
                        runDiagnosisAPI('payment');
                    } else if (diagnosisResult.type === 'SHOP') {
                        runDiagnosisAPI('shop');
                    }
                }
            } else {
                alert('Auto-fix failed to execute.');
            }
        } catch (err) {
            console.error('Error executing fix:', err);
        } finally {
            setExecutingAction(null);
        }
    };

    // Trigger Undo/Rollback API
    const runUndoAPI = async () => {
        if (!undoAction) return;
        const actionId = undoAction._id;
        setExecutingAction('UNDO');
        try {
            const res = await fetch('/api/seller/support/undo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ actionId })
            });
            if (res.ok) {
                setSuccessMessage('Action successfully rolled back!');
                setUndoAction(null);
                await fetchContext();
                await fetchDashboardData();

                if (diagnosisResult) {
                    if (diagnosisResult.type === 'PRODUCT') {
                        runDiagnosisAPI('product', { productId: diagnosisResult.details?.productId || selectedProdId });
                    } else if (diagnosisResult.type === 'PAYMENT') {
                        runDiagnosisAPI('payment');
                    } else if (diagnosisResult.type === 'SHOP') {
                        runDiagnosisAPI('shop');
                    }
                }
            }
        } catch (err) {
            console.error('Error rolling back:', err);
        } finally {
            setExecutingAction(null);
        }
    };

    // Navigate to issue details & run diagnosis if relevant
    const selectIssueDetail = (issue) => {
        setSelectedIssue(issue);
        setFeedbackSubmitted(false);
        setWasHelpful(null);
        setViewState('issue-detail');
        setDiagnosisResult(null);
        setSelectedProdId('');
        setUndoAction(null);
        setSuccessMessage('');

        if (issue.category === 'PAYMENTS' || issue.id === 'payment_pending' || issue.id === 'payout_issue') {
            runDiagnosisAPI('payment');
        } else if (issue.category === 'SETTINGS' || issue.id === 'shop_status') {
            runDiagnosisAPI('shop');
        } else if (issue.category === 'ORDERS' || issue.id === 'sales_tracking') {
            runDiagnosisAPI('payment', { queryText: 'sales' });
        } else if (issue.id === 'offer_visibility') {
            runDiagnosisAPI('product', { queryText: 'offer' });
        }
    };

    // Filter KNOWLEDGE_BASE by Category
    const selectCategoryDetail = (catId) => {
        if (catId === 'CALLBACK') {
            setViewState('callback-form');
            return;
        }
        
        let filtered = [];
        if (catId === 'PRODUCT') {
            filtered = KNOWLEDGE_BASE.filter(kb => kb.category === 'PRODUCT');
        } else if (catId === 'ORDERS') {
            filtered = KNOWLEDGE_BASE.filter(kb => kb.category === 'ORDERS');
        } else if (catId === 'PAYMENTS') {
            filtered = KNOWLEDGE_BASE.filter(kb => kb.category === 'PAYMENTS');
        } else if (catId === 'SETTINGS') {
            filtered = KNOWLEDGE_BASE.filter(kb => kb.category === 'SETTINGS');
        } else if (catId === 'LOGIN') {
            filtered = KNOWLEDGE_BASE.filter(kb => kb.category === 'LOGIN');
        }
        
        setSelectedCategory(QUICK_ACTIONS.find(q => q.id === catId));
        setCategoryIssues(filtered);
        setViewState('category-detail');
        setDiagnosisResult(null);
        setSelectedProdId('');
        setUndoAction(null);
        setSuccessMessage('');

        if (catId === 'PAYMENTS') {
            runDiagnosisAPI('payment');
        } else if (catId === 'SETTINGS') {
            runDiagnosisAPI('shop');
        } else if (catId === 'ORDERS') {
            runDiagnosisAPI('payment', { queryText: 'sales' });
        } else if (catId === 'LOGIN') {
            runDiagnosisAPI('shop', { queryText: 'login' });
        }
    };

    // Submit Callback Request Ticket
    const submitCallbackRequest = async () => {
        if (!issueDescription.trim() || !phoneNumber || phoneNumber.length < 10) return;
        setLoading(true);
        try {
            const res = await fetch('/api/seller/support/ticket', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    issueText: issueDescription,
                    phoneNumber,
                    issueId: selectedIssue?.id
                })
            });
            if (res.ok) {
                setViewState('success');
                fetchSupportHistory();
            } else {
                alert('Failed to register callback request.');
            }
        } catch (err) {
            console.error('Error submitting callback request:', err);
        } finally {
            setLoading(false);
        }
    };

    // Log Helpfulness Feedback
    const submitFeedback = async (helpful) => {
        setFeedbackSubmitted(true);
        setWasHelpful(helpful);
        try {
            await fetch('/api/seller/support/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    issueId: selectedIssue.id,
                    isHelpful: helpful
                })
            });
            fetchSupportHistory();
        } catch (err) {
            console.error('Failed to log feedback:', err);
        }
    };

    const renderDiagnosisCard = (result) => {
        if (!result) return null;

        const getStatusColor = (status) => {
            if (status === 'SUCCESS') return 'text-emerald-600 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900/30';
            if (status === 'WARNING') return 'text-amber-600 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-emerald-900/30';
            return 'text-rose-600 border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/30';
        };

        const handleAction = async (action) => {
            if (action === 'ENABLE_PRODUCT' || action === 'RESTOCK_INVENTORY') {
                runExecutionAPI(action, result.details?.productId);
            } else if (action === 'ENABLE_MANUAL_OPEN' || action === 'DISABLE_MANUAL_OVERRIDE' || action === 'DISABLE_HOLIDAY_MODE') {
                runExecutionAPI(action);
            } else if (action === 'COMPLETE_PAYMENT_SETUP') {
                runExecutionAPI('COMPLETE_PAYMENT_SETUP');
            } else if (action === 'VERIFY_PHONE') {
                runExecutionAPI('VERIFY_PHONE');
            } else if (action === 'ENABLE_OFFER' || action === 'EXTEND_OFFER') {
                runExecutionAPI(action, result.details?.offerId, { days: 7 });
            } else {
                alert(`Next step: ${action}`);
            }
        };

        return (
            <div className="space-y-4 animate-scale-up">
                <div className={`p-5 rounded-3xl border ${getStatusColor(result.status)} shadow-sm space-y-4`}>
                    <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-neutral-200">{result.title}</h4>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            result.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' :
                            result.status === 'WARNING' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-rose-500/20 text-rose-700 dark:text-rose-400'
                        }`}>
                            {result.status}
                        </span>
                    </div>

                    <div className="h-px bg-current opacity-10" />

                    {result.type === 'PRODUCT' && result.details?.productName && (
                        <div className="text-xs font-semibold space-y-2.5 text-slate-700 dark:text-neutral-300">
                            <div className="flex justify-between">
                                <span className="opacity-70">Product Name:</span>
                                <span className="font-bold">{result.details.productName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-70">Status:</span>
                                <span className="font-bold">{result.details.active ? '✓ Active' : '✗ Inactive'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-70">Stock:</span>
                                <span className="font-bold">{result.details.stock > 0 ? `✓ ${result.details.stock} Available` : '✗ 0 Available'}</span>
                            </div>
                        </div>
                    )}

                    {result.type === 'PAYMENT' && (
                        <div className="text-xs font-semibold space-y-2.5 text-slate-700 dark:text-neutral-300">
                            <div className="flex justify-between">
                                <span className="opacity-70">Pending Amount:</span>
                                <span className="font-bold text-base text-indigo-600 dark:text-indigo-400">₹{result.details.pendingAmount?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-70">Bank Verification:</span>
                                <span className="font-bold">{result.details.bankStatus === 'VERIFIED' ? '✓ Completed' : '✗ Pending'}</span>
                            </div>
                        </div>
                    )}

                    {result.type === 'SHOP' && (
                        <div className="text-xs font-semibold space-y-2.5 text-slate-700 dark:text-neutral-300">
                            <div className="flex justify-between">
                                <span className="opacity-70">Shop Status:</span>
                                <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{result.details.derivedStatus}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-70">Operating Hours:</span>
                                <span className="font-bold">{result.details.openingTime} - {result.details.closingTime}</span>
                            </div>
                        </div>
                    )}

                    <div className="h-px bg-current opacity-10" />

                    <div className="text-xs font-medium leading-relaxed">
                        <p className="text-slate-800 dark:text-neutral-200 font-bold">{result.message}</p>
                    </div>
                </div>

                {result.suggestions && result.suggestions.length > 0 && !undoAction && (
                    <div className="space-y-2 animate-fade-in">
                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block">Recommended Quick Fix</label>
                        <div className="flex flex-col gap-2">
                            {result.suggestions.map((sug, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAction(sug)}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition-all shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    {executingAction === sug ? (
                                        <FaSpinner className="animate-spin" />
                                    ) : (
                                        <FaCheckCircle />
                                    )}
                                    {sug.replace(/_/g, ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (!isOpen) return null;

    // Helper variables for fallback UI tasks counts
    const outOfStockProducts = sellerContext?.products?.list?.filter(p => p.quantity <= 0) || [];
    const inactiveProducts = sellerContext?.products?.list?.filter(p => !p.active) || [];
    const expiredOffers = sellerContext?.offers?.list?.filter(o => o.isExpired) || [];
    const isShopOffline = sellerContext?.shop?.derivedStatus === 'OFFLINE';
    const isBankSetupPending = sellerContext?.payments?.paymentSetupCompleted === false;

    // Opportunities count sum
    const totalOppsCount = (dashboardData?.demandGaps?.length || 0) + (dashboardData?.pricingAdvice?.length || 0) + (dashboardData?.retentionOpportunities?.length || 0);

    return (
        <div className="fixed inset-0 z-[100] flex justify-end p-0 md:p-4 pointer-events-none">
            <div className="absolute inset-0 dashboard-overlay pointer-events-auto bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            
            <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 h-full md:h-[calc(100vh-2rem)] shadow-2xl flex flex-col animate-slide-in-right pointer-events-auto md:rounded-[2rem] overflow-hidden border border-slate-100 dark:border-neutral-800">

                {/* Header */}
                <div className="p-6 bg-slate-900 dark:bg-neutral-950 text-white flex justify-between items-center shadow-md z-10 border-b border-slate-800 dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg rotate-3">
                            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 animate-pulse"></span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-black text-xl leading-tight tracking-tight text-white">Ask Aisle AI</h2>
                                <span className="px-2 py-0.5 bg-indigo-500 text-[8px] font-black rounded-md uppercase tracking-widest text-white shadow-sm">COPILOT DOCK</span>
                            </div>
                            <p className="text-xs text-slate-400 font-bold opacity-80 mt-0.5">AI Commerce Copilot & Operations Agent</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors text-slate-400">
                        <FaTimes size={18} />
                    </button>
                </div>

                {/* Sliding Tabs Indicator */}
                <div className="flex border-b border-slate-100 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-2 z-10 overflow-x-auto gap-1.5 scrollbar-none justify-between">
                    <button 
                        onClick={() => { setActiveTab('dashboard'); setViewState('home'); setUndoAction(null); setSuccessMessage(''); }}
                        className={`text-center py-2.5 px-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaChartLine size={11} /> Dashboard Feed
                    </button>
                    <button 
                        onClick={() => { setActiveTab('copilot'); setUndoAction(null); setSuccessMessage(''); }}
                        className={`text-center py-2.5 px-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'copilot' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaLightbulb size={11} /> Ask Aisle
                    </button>
                    <button 
                        onClick={() => { setActiveTab('help'); setViewState('home'); setUndoAction(null); setSuccessMessage(''); }}
                        className={`text-center py-2.5 px-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'help' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaHeadset size={11} /> Diagnostics
                    </button>
                    <button 
                        onClick={() => { setActiveTab('timeline'); fetchSupportHistory(); }}
                        className={`text-center py-2.5 px-3 text-[10px] font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeTab === 'timeline' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        <FaHistory size={11} /> Activity Logs
                    </button>
                </div>

                {/* Undo / Fix Applied Banner */}
                {successMessage && (
                    <div className="mx-6 mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex justify-between items-center text-xs font-black uppercase tracking-wider animate-scale-up z-10">
                        <div className="flex items-center gap-2">
                            <FaCheckCircle size={14} className="text-emerald-500" />
                            <span>{successMessage}</span>
                        </div>
                    </div>
                )}

                {/* Main Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-neutral-900/50 space-y-6 custom-scrollbar">

                    {activeTab === 'dashboard' && (
                        <div className="space-y-6 animate-fade-in">
                            {dashboardLoading ? (
                                <div className="py-20 flex flex-col justify-center items-center gap-3 text-slate-400 font-black text-xs uppercase tracking-widest">
                                    <FaSpinner className="animate-spin text-indigo-500 text-2xl" /> Syncing Commerce OS Dashboard...
                                </div>
                            ) : (
                                <>
                                    {/* 1. KPIs Operating Center Grid */}
                                    <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-5">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Today's Operation Card</span>
                                            <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black rounded-lg uppercase tracking-wider">
                                                Business Health: {dashboardData?.businessHealth || 94}/100
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">Today Revenue</span>
                                                <span className="text-2xl font-black text-white">₹{dashboardData?.revenueToday?.toLocaleString() || '12,450'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-black uppercase block tracking-wider">Forecast Revenue</span>
                                                <span className="text-2xl font-black text-emerald-400">₹{dashboardData?.forecastRevenue?.toLocaleString() || '14,100'}</span>
                                            </div>
                                        </div>

                                        <div className="h-px bg-white/10" />

                                        <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                                            <div className="bg-white/5 py-2 px-1 rounded-xl">
                                                <span className="text-white block font-black">{dashboardData?.ordersPending || 7}</span>
                                                <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Pending Orders</span>
                                            </div>
                                            <div className="bg-white/5 py-2 px-1 rounded-xl">
                                                <span className="text-amber-400 block font-black">{totalOppsCount || 4}</span>
                                                <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Growth Opps</span>
                                            </div>
                                            <div className="bg-white/5 py-2 px-1 rounded-xl">
                                                <span className="text-indigo-400 block font-black">{dashboardData?.tasks?.filter(t => t.status === 'PENDING').length || 3}</span>
                                                <span className="text-[8px] text-slate-400 uppercase tracking-widest block">Pending Actions</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* AI Agent Automation Controller */}
                                    <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h3 className="text-xs font-black text-slate-800 dark:text-neutral-200 uppercase tracking-wider">Aisle AI Copilot Mode</h3>
                                                <p className="text-[10px] text-slate-400 dark:text-neutral-500 font-bold mt-0.5">Control how Aisle AI executes store optimizations</p>
                                            </div>
                                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-md uppercase tracking-wider ${
                                                automationMode === 'AUTONOMOUS' 
                                                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30' 
                                                    : automationMode === 'ASSISTED'
                                                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                                    : 'bg-slate-500/20 text-slate-600 dark:text-slate-400 border border-slate-500/30'
                                            }`}>
                                                {automationMode}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-2">
                                            {['MANUAL', 'ASSISTED', 'AUTONOMOUS'].map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => handleUpdateAutomationMode(mode)}
                                                    className={`py-2 px-1 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                                                        automationMode === mode
                                                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-indigo-600 dark:border-indigo-600 shadow-sm'
                                                            : 'bg-transparent border-slate-200 text-slate-400 dark:border-neutral-800 dark:text-neutral-500 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-neutral-900'
                                                    }`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>

                                        <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-normal font-medium">
                                            {automationMode === 'AUTONOMOUS' && "🤖 Autonomous Mode: Aisle AI will automatically execute restocking, pricing, and campaign opportunities in the background."}
                                            {automationMode === 'ASSISTED' && "🤝 Assisted Mode: Aisle AI advises you on opportunities and asks for execution confirmation."}
                                            {automationMode === 'MANUAL' && "👤 Manual Mode: Aisle AI acts purely as an informational dashboard. Actions are triggered manually."}
                                        </p>
                                    </div>

                                    {/* 2. Today's Checklist Tasks Widget */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-bold">Today's To-Do Manager</label>
                                        {dashboardData?.tasks?.length > 0 ? (
                                            <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-3">
                                                {dashboardData.tasks.map((taskItem) => (
                                                    <div 
                                                        key={taskItem._id} 
                                                        className={`flex justify-between items-center gap-3 p-3 rounded-2xl border transition-all ${
                                                            taskItem.status === 'COMPLETED' 
                                                                ? 'bg-slate-50/50 dark:bg-neutral-900/20 border-slate-100 dark:border-neutral-800/20 opacity-60' 
                                                                : 'bg-white dark:bg-neutral-950 border-slate-200 dark:border-neutral-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                                            <button 
                                                                disabled={taskItem.status === 'COMPLETED' || executingAction === taskItem._id}
                                                                onClick={() => runTaskExecution(taskItem._id)}
                                                                className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all flex-shrink-0 ${
                                                                    taskItem.status === 'COMPLETED'
                                                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                                                        : 'border-slate-350 dark:border-neutral-700 hover:border-indigo-500 bg-transparent'
                                                                }`}
                                                            >
                                                                {taskItem.status === 'COMPLETED' && <FaCheck size={10} />}
                                                            </button>
                                                            <div className="min-w-0">
                                                                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300 block leading-snug truncate">{taskItem.task}</span>
                                                                <span className={`text-[8px] font-black uppercase tracking-wider ${
                                                                    taskItem.priority === 'HIGH' ? 'text-rose-500' : 'text-slate-400'
                                                                }`}>{taskItem.priority} Priority</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {taskItem.status === 'PENDING' && taskItem.action && (
                                                            <button
                                                                onClick={() => runTaskExecution(taskItem._id)}
                                                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow"
                                                            >
                                                                {executingAction === taskItem._id ? (
                                                                    <FaSpinner className="animate-spin text-white" />
                                                                ) : (
                                                                    "Run Fix"
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-white dark:bg-neutral-950 border border-slate-150 dark:border-neutral-800 rounded-3xl text-center text-slate-400 font-bold text-xs uppercase">
                                                All tasks completed!
                                            </div>
                                        )}
                                    </div>

                                    {/* 3. UNIFIED INTELLIGENCE FEED */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-bold">Unified Intelligence Feed</label>
                                        <div className="space-y-4">
                                            
                                            {/* Low Stock Warning Feed Items */}
                                            {dashboardData?.forecasts?.filter(f => f.currentStock < f.predictedDemand).map((fc, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="p-5 bg-gradient-to-r from-rose-500/5 to-amber-500/5 border border-rose-300/30 dark:border-rose-900/30 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-1.5 text-rose-500">
                                                            <FaExclamationTriangle className="animate-pulse" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Low Inventory Risk</span>
                                                        </div>
                                                        <span className="text-[9px] font-bold text-slate-400 font-mono">Conf: {fc.confidence}%</span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-neutral-100">
                                                        "{fc.productName}" may run out tomorrow
                                                    </h4>
                                                    
                                                    <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                                                        Expected demand tomorrow is <span className="font-black text-rose-500">{fc.predictedDemand} units</span>. Your current stock is <span className="font-black">{fc.currentStock} units</span>.
                                                    </p>

                                                    <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400">
                                                        <span>Recommended stock: <strong>{fc.recommendedStock} Units</strong></span>
                                                        <button 
                                                            onClick={() => runExecutionAPI('RESTOCK_INVENTORY', fc.productId)}
                                                            className="px-3 py-1 bg-rose-500 text-white font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Restock Now
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Missed Demand Gap Items */}
                                            {dashboardData?.demandGaps?.map((gap, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="p-5 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-md uppercase tracking-wider">
                                                            Missed Opportunity
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">DEMAND GAP</span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-neutral-100 leading-snug">
                                                        Nearby customers are searching for "{gap.productName}"
                                                    </h4>
                                                    
                                                    <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                                                        We tracked <span className="font-black text-indigo-500">{gap.searches} customer searches</span> in your postal coordinates. You currently do not sell this item.
                                                    </p>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-neutral-900/60">
                                                        <span className="text-[10px] text-slate-400">Est. Monthly Gain: <strong className="text-emerald-500">+₹{gap.estimatedRevenue}</strong></span>
                                                        <button 
                                                            onClick={() => alert(`Catalog addition trigger: ${gap.productName}`)}
                                                            className="px-3.5 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Add to Catalog
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Pricing Optimizations */}
                                            {dashboardData?.pricingAdvice?.map((pr, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="p-5 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-black rounded-md uppercase tracking-wider">
                                                            Revenue Optimization
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">PRICING</span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-neutral-100">
                                                        Price reduction suggested for "{pr.productName}"
                                                    </h4>
                                                    
                                                    <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                                                        Your price of ₹{pr.currentPrice} is higher than local market average of ₹{pr.competitorAverage}. Adjusting to <span className="font-black text-emerald-500">₹{pr.suggestedPrice}</span> is predicted to boost sales by <span className="font-black">+{pr.salesIncrease}%</span>.
                                                    </p>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-neutral-900/60">
                                                        <span className="text-[10px] text-slate-400">Est. Growth Boost: <strong className="text-emerald-500">+₹{pr.estimatedRevenue}</strong></span>
                                                        <button 
                                                            onClick={() => alert(`Applying pricing recommendation: ₹${pr.suggestedPrice}`)}
                                                            className="px-3.5 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Apply Price
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Loyalty Retention Alerts */}
                                            {dashboardData?.retentionOpportunities?.map((ret, idx) => (
                                                <div 
                                                    key={idx}
                                                    className="p-5 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3 relative overflow-hidden"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[9px] font-black rounded-md uppercase tracking-wider">
                                                            Customer Retention Alert
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase">CHURN RISK</span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-neutral-100">
                                                        Loyal customer "{ret.customerName}" has not returned
                                                    </h4>
                                                    
                                                    <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                                                         Amit used to purchase {ret.preferredItems?.join(' & ')} weekly, but has been inactive for <span className="font-black text-rose-500">{ret.inactiveDays} days</span>. 
                                                    </p>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-neutral-900/60">
                                                        <span className="text-[10px] text-slate-400">Suggested: <strong>{ret.suggestedDiscount}</strong></span>
                                                        <button 
                                                            onClick={() => alert(`Triggering retention loyalty campaign: ${ret.suggestedDiscount}`)}
                                                            className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Send Discount
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Seasonal Calibration Card */}
                                            {dashboardData?.marketTrends?.seasonal && (
                                                <div className="p-5 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-300/30 dark:border-indigo-900/30 rounded-3xl shadow-sm space-y-3 relative overflow-hidden">
                                                    <div className="flex items-center gap-1.5 text-indigo-500">
                                                        <FaCalendarAlt size={12} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Upcoming Seasonal Demand</span>
                                                    </div>
                                                    
                                                    <h4 className="text-sm font-black text-slate-800 dark:text-neutral-100">
                                                        {dashboardData.marketTrends.seasonal.upcomingSeason} Demand Spike: +{dashboardData.marketTrends.seasonal.demandIncrease}%
                                                    </h4>
                                                    
                                                    <p className="text-xs text-slate-600 dark:text-neutral-300 font-medium leading-relaxed">
                                                        Increase inventory margins for: {dashboardData.marketTrends.seasonal.recommendations?.join(', ')}.
                                                    </p>
                                                    
                                                    <button 
                                                        onClick={() => alert('Autogenerating campaign hampers...')}
                                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow"
                                                    >
                                                        Generate Campaign Hampers
                                                    </button>
                                                </div>
                                            )}

                                        </div>
                                    </div>

                                    {/* 4. Local Market Trends */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-bold">Local Market Signals</label>
                                        <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Indore Market Growth Indices</span>
                                                <span className="text-[9px] font-bold text-slate-400 font-mono">Live</span>
                                            </div>
                                            <div className="space-y-3 text-xs font-semibold">
                                                {dashboardData?.marketTrends?.categoryTrends?.map((tr, idx) => (
                                                    <div key={idx} className="flex justify-between items-center">
                                                        <span className="text-slate-700 dark:text-neutral-300">{tr.category}</span>
                                                        <span className={`font-black ${tr.growthRate > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                            {tr.growthRate > 0 ? `+${tr.growthRate}%` : `${tr.growthRate}%`}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Seller Growth Roadmap */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-bold">Seller Growth Roadmap</label>
                                        <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Guided Progression Tracker</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-neutral-200">{dashboardData?.businessHealth || 80}/100 Pts</span>
                                            </div>

                                            <div className="space-y-3">
                                                {dashboardData?.roadMilestones?.map((mil, idx) => (
                                                    <div key={idx} className="flex justify-between items-center gap-3">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                                mil.completed 
                                                                    ? 'bg-emerald-500 text-white text-[8px] font-black' 
                                                                    : 'border border-slate-350 dark:border-neutral-700 bg-transparent text-[8px]'
                                                            }`}>
                                                                {mil.completed ? "✓" : ""}
                                                            </div>
                                                            <span className={`text-xs font-bold truncate ${mil.completed ? 'text-slate-400 line-through font-medium' : 'text-slate-700 dark:text-neutral-300'}`}>
                                                                {mil.title}
                                                            </span>
                                                        </div>
                                                        <span className="text-[9px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-wider flex-shrink-0">+{mil.points} Pts</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'copilot' && (
                        <div className="space-y-4 animate-fade-in flex flex-col h-full min-h-[450px]">


                            {/* Chat Window */}
                            <div className="flex-1 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[350px] gap-4">
                                <div className="flex-1 overflow-y-auto space-y-4 max-h-[300px] pr-2 custom-scrollbar">
                                    {copilotMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.sender === 'seller' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs font-semibold leading-relaxed shadow-sm ${
                                                msg.sender === 'seller' 
                                                    ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-br-none' 
                                                    : 'bg-slate-50 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 rounded-bl-none border border-slate-200/50 dark:border-neutral-800/80'
                                            }`}>
                                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                                
                                                {msg.actions && msg.actions.length > 0 && (
                                                    <div className="mt-3 space-y-2 border-t border-slate-200/60 dark:border-neutral-800/60 pt-2.5 text-[11px]">
                                                        <span className="font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest block mb-1">Recommended Growth Roadmaps:</span>
                                                        <ul className="space-y-1.5 text-slate-600 dark:text-neutral-300">
                                                            {msg.actions.map((act, aIdx) => (
                                                                <li key={aIdx} className="flex items-start gap-1.5 leading-normal">
                                                                    <FaCheck className="text-[8px] text-emerald-500 mt-1 flex-shrink-0" />
                                                                    <span>{act}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                
                                                {msg.estimatedRevenueIncrease > 0 && (
                                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-300/30 rounded-lg text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider animate-pulse">
                                                        <FaTrophy className="text-xs text-amber-500" />
                                                        <span>Est. Growth Increase: +₹{msg.estimatedRevenueIncrease?.toLocaleString()}/month</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {copilotLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-50 dark:bg-neutral-900 text-slate-400 text-xs font-semibold rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200/50 dark:border-neutral-800/80 flex items-center gap-2 shadow-sm">
                                                <FaSpinner className="animate-spin text-indigo-500" /> Ask Aisle is evaluating context...
                                            </div>
                                        </div>
                                    )}
                                    <div ref={copilotEndRef} />
                                </div>

                                {/* Predefined Prompts */}
                                {!copilotLoading && (
                                    <div className="flex flex-col gap-1.5">
                                        <span className="text-[8px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-bold">Suggested Strategy Prompts</span>
                                        <div className="flex flex-wrap gap-2">
                                            {COPILOT_PROMPTS.map((prompt, pIdx) => (
                                                <button
                                                    key={pIdx}
                                                    onClick={() => handleSendCopilotMessage(prompt.text)}
                                                    className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 dark:bg-neutral-900 dark:hover:bg-indigo-950/20 border border-slate-200 dark:border-neutral-800/60 rounded-xl text-left text-[10px] font-bold text-slate-600 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-sm"
                                                >
                                                    {prompt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Input field */}
                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        value={copilotInput}
                                        onChange={(e) => setCopilotInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendCopilotMessage(); }}
                                        placeholder="Ask e.g. 'How can I earn more this month?'..."
                                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-semibold rounded-2xl text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                                    />
                                    <button 
                                        onClick={() => handleSendCopilotMessage()}
                                        disabled={copilotLoading || !copilotInput.trim()}
                                        className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                                    >
                                        <FaPaperPlane size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'help' && (
                        <>
                            {/* VIEW STATE: HOME */}
                            {viewState === 'home' && (
                                <div className="space-y-6 animate-fade-in">
                                    
                                    {/* Search Box */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Search Solutions</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                <FaSearch size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Try 'Mera product nahi dikh raha' or 'Payout pending'..."
                                                className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-neutral-950 text-slate-800 dark:text-neutral-200 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                                            />
                                            {searchQuery && (
                                                <button 
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                                                >
                                                    <FaTimes size={14} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Suggestions Dropdown */}
                                        {searchQuery.trim() && (
                                            <div className="relative z-20">
                                                <div className="absolute top-1 left-0 w-full bg-white dark:bg-neutral-950 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xl overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                                    {isSearching ? (
                                                        <div className="p-6 flex justify-center items-center gap-3 text-slate-400 text-sm font-semibold">
                                                            <FaSpinner className="animate-spin text-indigo-500" /> Searching solutions...
                                                        </div>
                                                    ) : searchResults.length > 0 ? (
                                                        <div className="divide-y divide-slate-100 dark:divide-neutral-900">
                                                            {searchResults.map((result) => (
                                                                <button
                                                                    key={result.id}
                                                                    onClick={() => selectIssueDetail(result)}
                                                                    className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-neutral-900 flex justify-between items-center transition-colors group"
                                                                >
                                                                    <div>
                                                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">{result.category}</span>
                                                                        <span className="text-sm font-bold text-slate-800 dark:text-neutral-200 group-hover:text-indigo-600 transition-colors">{result.title}</span>
                                                                    </div>
                                                                    <FaChevronRight className="text-slate-300 dark:text-neutral-700 group-hover:text-indigo-500 transition-colors flex-shrink-0 ml-4" size={12} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-6 text-center text-slate-400 dark:text-neutral-500">
                                                            <p className="text-sm font-bold">No matching articles found.</p>
                                                            <button 
                                                                onClick={() => setViewState('callback-form')}
                                                                className="mt-3 text-xs font-black text-indigo-500 uppercase hover:underline"
                                                            >
                                                                Click here to explain in detail &gt;
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Follow-Up check back banner */}
                                    {followupData && (
                                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-300 dark:border-amber-900/40 rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden animate-scale-up">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                                                <label className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider">Aisle Agent Follow-Up</label>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 dark:text-neutral-200 leading-normal">{followupData.message}</p>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => { setSuccessMessage('Thank you for confirming! We are glad it is resolved.'); setFollowupData(null); }}
                                                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                >
                                                    Yes, all good
                                                </button>
                                                <button 
                                                    onClick={() => { handleStartInvestigation(followupData.resolvedIssue); setFollowupData(null); }}
                                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                >
                                                    No, still buggy
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Conversational AI Agent Start Button */}
                                    <button
                                        onClick={() => handleStartInvestigation('SALES_DROP')}
                                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-3xl shadow-lg hover:shadow-indigo-500/10 transition-all flex items-center justify-center gap-3 group px-4 text-left"
                                    >
                                        <FaHeadset className="text-lg group-hover:rotate-12 transition-transform text-white" />
                                        <div className="flex-1">
                                            <span className="text-xs font-black uppercase tracking-wider block text-white">Start Operations Investigation</span>
                                            <span className="text-[9px] font-bold opacity-80 block text-white/90">Let agent trace visibility, sales, and timing causes</span>
                                        </div>
                                        <FaChevronRight size={10} className="opacity-70 group-hover:translate-x-1 transition-transform text-white" />
                                    </button>

                                    {/* One-Click Quick Fixes Panel Dashboard */}
                                    {(outOfStockProducts.length > 0 || inactiveProducts.length > 0 || expiredOffers.length > 0 || isShopOffline || isBankSetupPending) && (
                                        <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm space-y-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <FaExclamationTriangle className="text-amber-500 animate-pulse" />
                                                <label className="text-[10px] font-black text-slate-800 dark:text-neutral-200 uppercase tracking-wider">Quick Fix Alerts</label>
                                            </div>
                                            <div className="space-y-2.5">
                                                {inactiveProducts.length > 0 && (
                                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">⚠ {inactiveProducts.length} Hidden/Inactive Products</span>
                                                        <button 
                                                            onClick={() => runExecutionAPI('ACTIVATE_PRODUCT', inactiveProducts[0].id)}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Fix
                                                        </button>
                                                    </div>
                                                )}

                                                {outOfStockProducts.length > 0 && (
                                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">⚠ {outOfStockProducts.length} Out of Stock Products</span>
                                                        <button 
                                                            onClick={() => runExecutionAPI('RESTOCK_INVENTORY', outOfStockProducts[0].id)}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Fix
                                                        </button>
                                                    </div>
                                                )}

                                                {expiredOffers.length > 0 && (
                                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">⚠ {expiredOffers.length} Expired Offer</span>
                                                        <button 
                                                            onClick={() => runExecutionAPI('EXTEND_OFFER', expiredOffers[0].id, { days: 7 })}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Fix
                                                        </button>
                                                    </div>
                                                )}

                                                {isShopOffline && (
                                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">⚠ Shop closed outside operating hours</span>
                                                        <button 
                                                            onClick={() => runExecutionAPI('OPEN_SHOP')}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Open Shop
                                                        </button>
                                                    </div>
                                                )}

                                                {isBankSetupPending && (
                                                    <div className="flex justify-between items-center bg-slate-50 dark:bg-neutral-900 p-3 rounded-xl">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">⚠ Bank Account Setup Incomplete</span>
                                                        <button 
                                                            onClick={() => runExecutionAPI('COMPLETE_PAYMENT_SETUP')}
                                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg uppercase tracking-wider shadow"
                                                        >
                                                            Complete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Actions Grid */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Quick Actions</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {QUICK_ACTIONS.map((action) => (
                                                <button
                                                    key={action.id}
                                                    onClick={() => selectCategoryDetail(action.id)}
                                                    className="p-4 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/80 rounded-2xl text-left hover:border-indigo-400 dark:hover:border-indigo-900 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-[110px]"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-neutral-900 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/30 flex items-center justify-center text-lg transition-colors">
                                                        {action.icon}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-slate-800 dark:text-neutral-200 block truncate">{action.label}</span>
                                                        <span className="text-[9px] font-semibold text-slate-400 dark:text-neutral-500 truncate block mt-0.5">{action.subtext}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent/Popular Issues */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-1.5">
                                            <FaFire className="text-amber-500" />
                                            <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Most Popular Right Now</label>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {popularIssues.map((issue) => (
                                                <button
                                                    key={issue.id}
                                                    onClick={() => {
                                                        const fullIssue = KNOWLEDGE_BASE.find(kb => kb.id === issue.id) || issue;
                                                        selectIssueDetail(fullIssue);
                                                    }}
                                                    className="p-4 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/60 rounded-2xl text-left text-sm font-bold text-slate-700 dark:text-neutral-300 hover:border-indigo-400 dark:hover:border-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all flex justify-between items-center group"
                                                >
                                                    <span className="flex-1 pr-4">{issue.title}</span>
                                                    <FaChevronRight className="text-slate-300 dark:text-neutral-700 group-hover:text-indigo-500 transition-colors flex-shrink-0" size={12} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* VIEW STATE: INVESTIGATION CHAT */}
                            {viewState === 'investigation-chat' && activeSession && (
                                <div className="space-y-6 animate-fade-in flex flex-col h-full min-h-[400px]">
                                    <button 
                                        onClick={() => { setViewState('home'); setActiveSession(null); }}
                                        className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest"
                                    >
                                        <FaArrowLeft /> Exit Investigation
                                    </button>

                                    <div className="flex bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-5 shadow-sm flex-col justify-between space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-neutral-900">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-black">
                                                    AI
                                                </div>
                                                <div>
                                                    <span className="text-xs font-black text-slate-800 dark:text-neutral-200 block uppercase tracking-wider">Aisle Support Agent</span>
                                                    <span className="text-[9px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest">{activeSession.issue}</span>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                                activeSession.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-800' :
                                                activeSession.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                {activeSession.status}
                                            </span>
                                        </div>

                                        {/* Messages area */}
                                        <div className="space-y-3.5 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                                            {activeSession.conversation.map((msg, idx) => (
                                                <div key={idx} className={`flex ${msg.sender === 'seller' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs font-semibold leading-relaxed ${
                                                        msg.sender === 'seller' 
                                                            ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-br-none' 
                                                            : 'bg-slate-100 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 rounded-bl-none border border-slate-200/50 dark:border-neutral-800'
                                                    }`}>
                                                        <p className="whitespace-pre-wrap">{msg.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {loading && (
                                                <div className="flex justify-start">
                                                    <div className="bg-slate-100 dark:bg-neutral-900 text-slate-400 text-xs font-semibold rounded-2xl rounded-bl-none px-4 py-3 border border-slate-200/50 dark:border-neutral-800 flex items-center gap-2">
                                                        <FaSpinner className="animate-spin text-indigo-500" /> Thinking...
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Diagnostics */}
                                        {activeSession.status === 'INVESTIGATING' && (
                                            <div className="bg-slate-50 dark:bg-neutral-900/50 border border-slate-200/50 dark:border-neutral-800 rounded-2xl p-4 space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block font-bold">Investigation Timeline</label>
                                                <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-neutral-300">
                                                    {[
                                                        { id: 'CHECKING_PRODUCTS', label: 'Checking Product Status' },
                                                        { id: 'CHECKING_INVENTORY', label: 'Checking Stock quantities' },
                                                        { id: 'CHECKING_VISIBILITY', label: 'Checking Shop Visibility' },
                                                        { id: 'CHECKING_OFFERS', label: 'Checking Active Offers' },
                                                        { id: 'CHECKING_PAYMENTS', label: 'Checking Payment Settlements' }
                                                    ].map((stepObj) => {
                                                        const log = sessionLogs.find(l => l.step === stepObj.id);
                                                        const isCompleted = !!log;
                                                        const isError = log?.result === 'FAIL';
                                                        const isWarning = log?.result === 'WARNING';
                                                        return (
                                                            <div key={stepObj.id} className="flex justify-between items-center">
                                                                <span className="opacity-90">{stepObj.label}</span>
                                                                {isCompleted ? (
                                                                    isError ? <span className="text-rose-500 font-black">✗ Failed</span> :
                                                                    isWarning ? <span className="text-amber-500 font-black">⚠ Warning</span> :
                                                                    <span className="text-emerald-500 font-black">✓ Healthy</span>
                                                                ) : (
                                                                    <span className="text-slate-400 font-semibold animate-pulse">⏳ Checking...</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Input Box */}
                                        {activeSession.status === 'INVESTIGATING' ? (
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text"
                                                    value={chatInput}
                                                    onChange={(e) => setChatInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMessage(); }}
                                                    placeholder="Provide details..."
                                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 text-xs font-semibold rounded-xl text-slate-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                                <button 
                                                    onClick={handleSendChatMessage}
                                                    disabled={loading || !chatInput.trim()}
                                                    className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                                                >
                                                    <FaPaperPlane size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setViewState('home'); setActiveSession(null); }}
                                                className="mt-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black rounded-lg uppercase tracking-wider"
                                            >
                                                Return to support
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* VIEW STATE: CATEGORY DETAIL */}
                            {viewState === 'category-detail' && selectedCategory && (
                                <div className="space-y-4 animate-fade-in">
                                    <button 
                                        onClick={() => setViewState('home')}
                                        className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest"
                                    >
                                        <FaArrowLeft /> Back
                                    </button>

                                    <div className="p-4 bg-slate-900 dark:bg-neutral-950 text-white rounded-2xl border border-slate-800 dark:border-neutral-800 flex items-center gap-4 shadow-md">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-neutral-950 flex items-center justify-center text-xl">
                                            {selectedCategory.icon}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-base leading-snug">{selectedCategory.label}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold opacity-80">{selectedCategory.subtext}</p>
                                        </div>
                                    </div>

                                    {/* Products Selection */}
                                    {selectedCategory.id === 'PRODUCT' && (
                                        <div className="bg-white dark:bg-neutral-950 p-4 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block">Choose a Product to Diagnose</label>
                                            <select 
                                                value={selectedProdId} 
                                                onChange={(e) => {
                                                    setSelectedProdId(e.target.value);
                                                    if (e.target.value) {
                                                        runDiagnosisAPI('product', { productId: e.target.value });
                                                    } else {
                                                        setDiagnosisResult(null);
                                                    }
                                                }}
                                                className="w-full p-3.5 bg-slate-50 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            >
                                                <option value="">-- Select Product --</option>
                                                {sellerContext?.products?.list?.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} ({p.quantity} stock)</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Bank setup */}
                                    {selectedCategory.id === 'PAYMENTS' && (
                                        <div className="bg-white dark:bg-neutral-950 p-5 border border-slate-200 dark:border-neutral-800 rounded-3xl shadow-sm space-y-4">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest block">Bank Onboarding Checklist</label>
                                            <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-neutral-300">
                                                <div className="flex items-center gap-2 text-emerald-500">
                                                    <FaCheckCircle /> Bank details linked (✓)
                                                </div>
                                                <div className={`flex items-center gap-2 ${isBankSetupPending ? 'text-amber-500' : 'text-emerald-500'}`}>
                                                    {isBankSetupPending ? (
                                                        <><FaExclamationTriangle /> Verification holding (✗)</>
                                                    ) : (
                                                        <><FaCheckCircle /> KYC Approved (✓)</>
                                                    )}
                                                </div>
                                                {isBankSetupPending && (
                                                    <button 
                                                        onClick={() => runExecutionAPI('COMPLETE_PAYMENT_SETUP')}
                                                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl uppercase text-[10px] tracking-wider font-black shadow mt-4"
                                                    >
                                                        Submit Verification
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {diagnosisLoading && (
                                        <div className="p-6 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl flex justify-center items-center gap-3 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                                            <FaSpinner className="animate-spin text-indigo-500" /> Analysing details...
                                        </div>
                                    )}

                                    {renderDiagnosisCard(diagnosisResult)}

                                    <div className="space-y-2 mt-4">
                                        <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Related Articles</label>
                                        {categoryIssues.length > 0 && categoryIssues.map((issue) => (
                                            <button
                                                key={issue.id}
                                                onClick={() => selectIssueDetail(issue)}
                                                className="w-full p-4 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800/60 rounded-2xl text-left text-sm font-bold text-slate-700 dark:text-neutral-300 hover:border-indigo-400 dark:hover:border-indigo-900 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md transition-all flex justify-between items-center group"
                                            >
                                                <span className="flex-1 pr-4">{issue.title}</span>
                                                <FaChevronRight className="text-slate-300 dark:text-neutral-700 group-hover:text-indigo-500 transition-colors flex-shrink-0" size={12} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* VIEW STATE: ISSUE DETAIL */}
                            {viewState === 'issue-detail' && selectedIssue && (
                                <div className="space-y-6 animate-fade-in">
                                    <button 
                                        onClick={() => setViewState(selectedCategory ? 'category-detail' : 'home')}
                                        className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest"
                                    >
                                        <FaArrowLeft /> Back
                                    </button>

                                    <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-4">
                                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">
                                            {selectedIssue.category}
                                        </span>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-neutral-200 leading-snug">{selectedIssue.title}</h3>
                                        <div className="h-px bg-slate-100 dark:bg-neutral-900" />
                                        <p className="text-xs font-medium text-slate-600 dark:text-neutral-300 leading-relaxed">{selectedIssue.solution}</p>
                                    </div>

                                    {diagnosisLoading && (
                                        <div className="p-6 bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl flex justify-center items-center gap-3 text-slate-400 font-semibold text-xs uppercase tracking-wider animate-pulse">
                                            <FaSpinner className="animate-spin text-indigo-500" /> Diagnosing status...
                                        </div>
                                    )}

                                    {renderDiagnosisCard(diagnosisResult)}

                                    <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-sm">
                                        {!feedbackSubmitted ? (
                                            <>
                                                <h4 className="text-sm font-black text-slate-800 dark:text-neutral-200">Was this solution helpful?</h4>
                                                <div className="flex gap-3 justify-center">
                                                    <button 
                                                        onClick={() => submitFeedback(true)}
                                                        className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                                                    >
                                                        <FaThumbsUp /> Yes, fixed!
                                                    </button>
                                                    <button 
                                                        onClick={() => submitFeedback(false)}
                                                        className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-black rounded-xl border border-rose-100 dark:border-rose-900/50 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                                                    >
                                                        <FaThumbsDown /> Still stuck
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-xs text-slate-400 dark:text-neutral-500 font-bold">Thank you for the feedback!</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* VIEW STATE: CALLBACK TICKET FORM */}
                            {viewState === 'callback-form' && (
                                <div className="space-y-6 animate-fade-in">
                                    <button 
                                        onClick={() => setViewState(selectedIssue ? 'issue-detail' : 'home')}
                                        className="inline-flex items-center gap-2 text-xs font-black text-slate-400 hover:text-indigo-500 transition-colors uppercase tracking-widest"
                                    >
                                        <FaArrowLeft /> Back
                                    </button>

                                    <div className="bg-white dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="font-black text-base text-slate-800 dark:text-neutral-200 uppercase tracking-wide">Request Callback</h3>
                                            <p className="text-xs text-slate-400 dark:text-neutral-500 font-bold leading-relaxed">
                                                Our intelligent matcher routes priority dynamically.
                                            </p>
                                        </div>

                                        <textarea
                                            value={issueDescription}
                                            onChange={(e) => setIssueDescription(e.target.value)}
                                            placeholder="Detail your request..."
                                            className="w-full p-4 bg-slate-50 dark:bg-neutral-900 text-slate-800 dark:text-neutral-200 text-sm font-semibold rounded-2xl border border-slate-200 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px]"
                                        />

                                        <div className="flex bg-slate-50 dark:bg-neutral-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-neutral-800">
                                            <div className="px-4 py-3.5 bg-slate-150 dark:bg-neutral-950 text-slate-500 text-sm font-bold border-r border-slate-200 dark:border-neutral-800 flex items-center gap-2">+91</div>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                className="flex-1 p-3.5 bg-transparent border-none focus:outline-none text-sm font-bold text-slate-800 dark:text-neutral-200"
                                                placeholder="Enter phone number"
                                            />
                                        </div>

                                        <button
                                            onClick={submitCallbackRequest}
                                            disabled={loading || !issueDescription.trim() || phoneNumber.length < 10}
                                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-neutral-800 text-white disabled:text-slate-400 text-xs font-black rounded-2xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            {loading ? <FaSpinner className="animate-spin text-white" /> : <FaCheckCircle className="text-white" />}
                                            Register callback
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* VIEW STATE: SUCCESS CONFIRMATION */}
                            {viewState === 'success' && (
                                <div className="py-12 px-6 text-center space-y-6 animate-scale-up">
                                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-lg">
                                        <FaCheckCircle />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-neutral-200">Callback Registered!</h3>
                                    <button 
                                        onClick={() => setViewState('home')}
                                        className="px-6 py-3 bg-slate-900 dark:bg-neutral-800 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all uppercase tracking-widest inline-flex items-center gap-2"
                                    >
                                        Back to home
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'timeline' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-400 dark:text-neutral-500 uppercase tracking-widest">Recent Activity Logs</label>
                                <button 
                                    onClick={fetchSupportHistory} 
                                    className="text-xs font-black text-indigo-500 hover:underline uppercase"
                                >
                                    Refresh
                                </button>
                            </div>

                            {historyLoading ? (
                                <div className="py-12 flex justify-center items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                                    <FaSpinner className="animate-spin text-indigo-500" /> Loading timeline activity...
                                </div>
                            ) : supportHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {supportHistory.map((item) => (
                                        <div 
                                            key={item._id}
                                            className="bg-white dark:bg-neutral-950 p-5 rounded-3xl border border-slate-200 dark:border-neutral-800/80 shadow-sm relative overflow-hidden"
                                        >
                                            <div className="flex justify-between items-start mb-2.5">
                                                <span className="px-2 py-0.5 bg-slate-100 dark:bg-neutral-900 text-slate-500 dark:text-neutral-400 text-[9px] font-black rounded-md uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                                    item.status === 'Resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </div>

                                            <h4 className="text-sm font-bold text-slate-800 dark:text-neutral-200 leading-snug">{item.issue}</h4>
                                            
                                            <div className="mt-2.5 pt-2.5 border-t border-slate-50 dark:border-neutral-900/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-neutral-500">
                                                <span className="font-semibold flex items-center gap-1">
                                                    <FaClock /> {new Date(item.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="font-bold italic text-slate-500">{item.resolution}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 bg-white dark:bg-neutral-950 border border-slate-100 dark:border-neutral-800 rounded-3xl text-center text-slate-400 font-bold text-xs uppercase tracking-wider shadow-sm">
                                    No activity logged.
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                {viewState !== 'home' && viewState !== 'success' && activeTab === 'help' && (
                    <div className="p-4 bg-white dark:bg-neutral-950 border-t border-slate-100 dark:border-neutral-800/80 flex justify-center z-10">
                        <button 
                            onClick={() => {
                                setViewState('home');
                                setSelectedCategory(null);
                                setSelectedIssue(null);
                                setDiagnosisResult(null);
                                setSelectedProdId('');
                                setUndoAction(null);
                                setSuccessMessage('');
                            }} 
                            className="text-xs font-black text-slate-400 dark:text-neutral-500 hover:text-indigo-500 dark:hover:text-indigo-400 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
                        >
                            <FaArrowLeft size={10} /> Start Over
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AisleSupportPanel;
