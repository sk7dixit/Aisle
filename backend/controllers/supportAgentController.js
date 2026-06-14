const SupportSession = require('../models/SupportSession');
const InvestigationLog = require('../models/InvestigationLog');
const { getRecurringIssueGreeting, saveIssueToMemory } = require('../support/sellerMemory');
const { handleConversationTurn } = require('../support/conversationEngine');
const buildEscalationSummary = require('../support/escalationSummary');
const { getActiveFollowUp } = require('../support/followUpEngine');
const SupportRequest = require('../models/SupportRequest');
const { createNotification } = require('./notificationController');

/**
 * Starts a new Conversational AI support session for the seller.
 */
const startInvestigation = async (req, res) => {
    try {
        const { issue } = req.body;
        const sellerId = req.user._id;

        if (!issue) {
            return res.status(400).json({ message: 'Starting issue topic is required' });
        }

        // Check if there is an active session for this seller, if so close it
        await SupportSession.updateMany(
            { sellerId, status: 'INVESTIGATING' },
            { $set: { status: 'COMPLETED' } }
        );

        // Check seller memory for recurring greets
        const recurringGreeting = await getRecurringIssueGreeting(sellerId);

        // Save issue type to memory history
        await saveIssueToMemory(sellerId, issue);

        const User = require('../models/User');
        const seller = await User.findById(sellerId);
        const shopType = require('../support/context/businessContext').getNormalizedShopType(seller?.shopDetails?.shopType);

        const session = await SupportSession.create({
            sellerId,
            issue: issue.toUpperCase(),
            findings: [],
            status: 'INVESTIGATING',
            conversation: [],
            currentStep: 'ASK_TIMEFRAME',
            metadata: { shopType }
        });

        // Seed initial greeting
        let initialAgentText = "Hello! I am Aisle support assistant. I see you want to investigate an issue.";
        if (recurringGreeting) {
            initialAgentText = recurringGreeting;
            session.currentStep = 'OFFER_FIX_PROPOSAL'; // Skip ahead to let them confirm
        } else {
            const cleanIssue = issue.toLowerCase();
            if (['sale', 'sales', 'order', 'orders', 'traffic', 'nobody', 'no one'].some(w => cleanIssue.includes(w))) {
                session.issue = 'SALES_DROP';
                session.currentStep = 'ASK_TIMEFRAME';
                initialAgentText = "I understand you are experiencing a drop in orders. To help me investigate, when did you first notice this sales drop start?";
            } else if (['visible', 'visibility', 'show', 'product', 'dikh'].some(w => cleanIssue.includes(w))) {
                session.issue = 'PRODUCT';
                session.currentStep = 'ASK_PRODUCT_NAME';
                initialAgentText = "I can help check your products. Which product name or item is currently not appearing for your customers?";
            } else if (['payment', 'payout', 'money', 'paisa', 'settle'].some(w => cleanIssue.includes(w))) {
                session.issue = 'PAYMENTS';
                session.currentStep = 'ASK_PAYMENT_ISSUE';
                initialAgentText = "Let's check your payouts. Are you experiencing a pending bank verification or did a specific weekly settlement release fail?";
            }
        }

        session.conversation.push({ sender: 'agent', text: initialAgentText });
        await session.save();

        res.status(201).json(session);
    } catch (error) {
        console.error('Start Investigation Error:', error);
        res.status(500).json({ message: 'Server Error starting investigation', error: error.message });
    }
};

/**
 * Sends a conversational message from the seller and processes the state transition.
 */
const continueInvestigation = async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        const sellerId = req.user._id;

        if (!sessionId || !message) {
            return res.status(400).json({ message: 'Session ID and message text are required' });
        }

        const session = await SupportSession.findOne({ _id: sessionId, sellerId });
        if (!session) {
            return res.status(404).json({ message: 'Investigation session not found or access denied' });
        }

        if (session.status !== 'INVESTIGATING') {
            return res.status(400).json({ message: 'This support session is already closed/escalated' });
        }

        const turnResult = await handleConversationTurn(session, message);

        // Handle escalation triggers
        if (turnResult.session.status === 'ESCALATED') {
            const summary = await buildEscalationSummary(turnResult.session);
            
            // Log/Create standard support ticket/escalation model
            await SupportRequest.create({
                user: sellerId,
                identifier: req.user.phone || '0000000000',
                category: turnResult.session.issue,
                summary: `Conversational Support Agent Escalation: ${turnResult.session.issue}`,
                logs: turnResult.session.conversation.map(c => `[${c.sender}] ${c.text}`),
                meta: summary,
                status: 'open',
                shopType: turnResult.session.metadata?.shopType || 'OTHER'
            });

            await createNotification(
                sellerId,
                'SYSTEM',
                '📞 Escalated to Operations Support',
                'Your conversational diagnostic logs have been forwarded to a human manager.',
                'HIGH'
            );
        }

        res.status(200).json(turnResult.session);
    } catch (error) {
        console.error('Continue Investigation Error:', error);
        res.status(500).json({ message: 'Server Error continuing investigation', error: error.message });
    }
};

/**
 * Fetches the session timeline status and step-by-step logs.
 */
const getInvestigationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const sellerId = req.user._id;

        const session = await SupportSession.findOne({ _id: id, sellerId });
        if (!session) {
            return res.status(404).json({ message: 'Support session not found or access denied' });
        }

        const logs = await InvestigationLog.find({ sessionId: id }).sort({ createdAt: 1 });

        res.status(200).json({
            session,
            logs
        });
    } catch (error) {
        console.error('Get Investigation Status Error:', error);
        res.status(500).json({ message: 'Server Error fetching status', error: error.message });
    }
};

/**
 * Returns any check-back follow-up prompt.
 */
const getFollowUpStatus = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const followup = await getActiveFollowUp(sellerId);
        
        if (!followup) {
            return res.status(200).json({ active: false });
        }

        res.status(200).json({
            active: true,
            followup
        });
    } catch (error) {
        console.error('Get Follow Up Status Error:', error);
        res.status(500).json({ message: 'Server Error fetching follow up', error: error.message });
    }
};

module.exports = {
    startInvestigation,
    continueInvestigation,
    getInvestigationStatus,
    getFollowUpStatus
};
