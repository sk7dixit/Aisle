const SupportTicket = require('../models/SupportTicket');
const SupportAnalytics = require('../models/SupportAnalytics');
const SupportContextSnapshot = require('../models/SupportContextSnapshot');
const SupportHistory = require('../models/SupportHistory');
const Offer = require('../models/Offer');
const ResolutionAction = require('../models/ResolutionAction');
const ResolutionHistory = require('../models/ResolutionHistory');
const { createNotification } = require('./notificationController');

// Support engine modules
const searchIssues = require('../support/searchIssues');
const detectIntent = require('../support/detectIntent');
const priorityEngine = require('../support/priorityEngine');
const { logTicketCreated, logFeedback, logSearch, logResolution } = require('../support/supportAnalytics');
const buildSellerContext = require('../support/context/contextBuilder');
const diagnoseIssue = require('../support/diagnoseIssue');

// Resolvers
const { executeProductResolution, rollbackProductResolution } = require('../support/resolution/productResolver');
const { executeShopResolution, rollbackShopResolution } = require('../support/resolution/shopResolver');
const { executeOfferResolution, rollbackOfferResolution } = require('../support/resolution/offerResolver');
const { executePaymentResolution, rollbackPaymentResolution } = require('../support/resolution/paymentResolver');
const { executeInventoryResolution, rollbackInventoryResolution } = require('../support/resolution/inventoryResolver');
const { executeAccountResolution, rollbackAccountResolution } = require('../support/resolution/accountResolver');

// @desc    Create a new support ticket (enriched & snapshot context)
// @route   POST /api/seller/support/ticket
// @access  Private (Seller)
const createTicket = async (req, res) => {
    try {
        const { issueText, phoneNumber, issueId } = req.body;
        const seller = req.user;

        if (!issueText || !phoneNumber) {
            return res.status(400).json({ message: 'Issue description and phone number are required' });
        }

        // Run intent detection and priority engine
        const intentResult = detectIntent(issueText);
        const matchedPriority = priorityEngine(intentResult.intent, intentResult.category, issueText);

        // Language determination
        let language = 'English';
        const cleanText = issueText.toLowerCase();
        const hindiRegex = /[\u0900-\u097F]/;
        if (hindiRegex.test(issueText)) {
            language = 'Hindi';
        } else {
            const hinglishTriggers = ['mera', 'nahi', 'dikh', 'raha', 'dukan', 'band', 'paisa', 'mila', 'atka', 'kaise', 'kya'];
            if (hinglishTriggers.some(w => cleanText.includes(w))) {
                language = 'Hinglish';
            }
        }

        const ticket = await SupportTicket.create({
            sellerId: seller._id,
            sellerName: seller.name,
            shopName: seller.shopDetails?.shopName || 'Unknown Shop',
            city: seller.shopDetails?.location?.city || 'Unknown',
            issueText,
            phoneNumber,
            source: 'Aisle Support',
            status: 'open',
            priority: matchedPriority,
            category: intentResult.category,
            confidence: intentResult.confidence,
            language,
            shopType: require('../support/context/businessContext').getNormalizedShopType(seller.shopDetails?.shopType)
        });

        // 1. Snapshot Compile Context
        const context = await buildSellerContext(seller._id);
        await SupportContextSnapshot.create({
            ticketId: ticket._id,
            context
        });

        // 2. Log Support History timeline entry
        const issueKey = issueId || intentResult.intent.toLowerCase();
        const knowledgeBase = require('../support/supportKnowledgeBase');
        const matchedKb = knowledgeBase.find(kb => kb.id === issueKey || kb.id === intentResult.intent.toLowerCase());
        const title = matchedKb ? matchedKb.title : (intentResult.intent !== 'UNKNOWN' ? intentResult.intent.replace(/_/g, ' ') : 'Callback Requested');

        await SupportHistory.create({
            sellerId: seller._id,
            issue: title,
            category: intentResult.category,
            resolution: 'Callback scheduled with support team',
            status: 'Open'
        });

        // Log analytics event
        await logTicketCreated(issueKey, title, intentResult.category);

        await createNotification(
            seller._id,
            'SYSTEM',
            '📞 Support Request Received',
            `Our team will contact you soon. (Priority: ${matchedPriority})`,
            'MEDIUM'
        );

        res.status(201).json(ticket);
    } catch (error) {
        console.error('Create Support Ticket Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Search support knowledge base
// @route   GET /api/seller/support/search
// @access  Private (Seller)
const searchSupport = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(200).json([]);
        }

        const suggestions = searchIssues(query);

        // Log search event in analytics
        if (suggestions.length > 0) {
            const top = suggestions[0];
            await logSearch(top.id, top.title, top.category);
        } else {
            await logSearch('UNKNOWN', `Search: ${query}`, 'GENERAL');
        }

        res.status(200).json(suggestions);
    } catch (error) {
        console.error('Search Support Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Detect intent and priority on the fly
// @route   POST /api/seller/support/detect-intent
// @access  Private (Seller)
const runDetectIntent = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ message: 'Text query is required' });
        }

        const intentResult = detectIntent(text);
        const priority = priorityEngine(intentResult.intent, intentResult.category, text);

        res.status(200).json({
            ...intentResult,
            priority
        });
    } catch (error) {
        console.error('Detect Intent Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Log helpfulness feedback & save to history
// @route   POST /api/seller/support/feedback
// @access  Private (Seller)
const logHelpfulnessFeedback = async (req, res) => {
    try {
        const { issueId, isHelpful } = req.body;
        if (!issueId) {
            return res.status(400).json({ message: 'Issue ID is required' });
        }

        const knowledgeBase = require('../support/supportKnowledgeBase');
        const matchedKb = knowledgeBase.find(kb => kb.id === issueId);
        const title = matchedKb ? matchedKb.title : issueId;
        const category = matchedKb ? matchedKb.category : 'GENERAL';

        await logFeedback(issueId, title, category, isHelpful);

        if (isHelpful) {
            await logResolution(issueId, title, category);
            
            // Log a resolved entry in SupportHistory timeline
            await SupportHistory.create({
                sellerId: req.user._id,
                issue: title,
                category,
                resolution: 'Self-resolved via Smart Guide solution',
                status: 'Resolved'
            });
        }

        res.status(200).json({ message: 'Feedback logged successfully' });
    } catch (error) {
        console.error('Log Feedback Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get compiled support statistics
// @route   GET /api/seller/support/analytics
// @access  Private (Seller)
const getSupportAnalytics = async (req, res) => {
    try {
        const analytics = await SupportAnalytics.find({}).sort({ ticketsCreatedCount: -1, searchCount: -1 });
        res.status(200).json(analytics);
    } catch (error) {
        console.error('Get Support Analytics Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- PHASE 2 DIAGNOSTICS & HISTORY APIS ---

// @desc    Get active compiling seller context snapshot
// @route   GET /api/seller/support/context
// @access  Private (Seller)
const getSellerSupportContext = async (req, res) => {
    try {
        const context = await buildSellerContext(req.user._id);
        res.status(200).json(context);
    } catch (error) {
        console.error('Get Support Context Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Run automated Product Diagnostic checks
// @route   POST /api/seller/support/product-diagnosis
// @access  Private (Seller)
const runProductDiagnosis = async (req, res) => {
    try {
        const { productId, queryText } = req.body;
        const diagnosis = await diagnoseIssue(req.user._id, 'PRODUCT_VISIBILITY', queryText || 'product visibility', productId);
        res.status(200).json(diagnosis);
    } catch (error) {
        console.error('Product Diagnosis Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Run automated Payments Diagnostic checks
// @route   POST /api/seller/support/payment-diagnosis
// @access  Private (Seller)
const runPaymentDiagnosis = async (req, res) => {
    try {
        const { queryText } = req.body;
        const diagnosis = await diagnoseIssue(req.user._id, 'PAYMENT_PENDING', queryText || 'payment');
        res.status(200).json(diagnosis);
    } catch (error) {
        console.error('Payment Diagnosis Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Run automated Shop Status Diagnostic checks
// @route   POST /api/seller/support/shop-diagnosis
// @access  Private (Seller)
const runShopDiagnosis = async (req, res) => {
    try {
        const { queryText } = req.body;
        const diagnosis = await diagnoseIssue(req.user._id, 'SHOP_STATUS', queryText || 'shop hours');
        res.status(200).json(diagnosis);
    } catch (error) {
        console.error('Shop Diagnosis Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get Support Ticket history log timeline
// @route   GET /api/seller/support/history
// @access  Private (Seller)
const getSupportHistory = async (req, res) => {
    try {
        const history = await SupportHistory.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(history);
    } catch (error) {
        console.error('Get Support History Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// --- CRUD ENDPOINTS FOR OFFERS PERSISTENCE ---

// @desc    Get all active/disabled offers for seller
// @route   GET /api/seller/offers
// @access  Private (Seller)
const getSellerOffers = async (req, res) => {
    try {
        const offers = await Offer.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(offers);
    } catch (error) {
        console.error('Get Offers Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Create new discount offer
// @route   POST /api/seller/offers
// @access  Private (Seller)
const createSellerOffer = async (req, res) => {
    try {
        const { title, type, value, match, validFrom, validUntil } = req.body;
        if (!title || !type || value === undefined) {
            return res.status(400).json({ message: 'Title, type, and discount value are required' });
        }

        const offer = await Offer.create({
            sellerId: req.user._id,
            title,
            type,
            value,
            match: match || 'All Products',
            validFrom: validFrom ? new Date(validFrom) : null,
            validUntil: validUntil ? new Date(validUntil) : null,
            status: 'Active'
        });

        res.status(201).json(offer);
    } catch (error) {
        console.error('Create Offer Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Update discount offer (or toggle status)
// @route   PUT /api/seller/offers/:id
// @access  Private (Seller)
const updateSellerOffer = async (req, res) => {
    try {
        const { title, type, value, match, validFrom, validUntil, status } = req.body;
        
        const offer = await Offer.findOne({ _id: req.params.id, sellerId: req.user._id });
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }

        if (title !== undefined) offer.title = title;
        if (type !== undefined) offer.type = type;
        if (value !== undefined) offer.value = value;
        if (match !== undefined) offer.match = match;
        if (validFrom !== undefined) offer.validFrom = validFrom ? new Date(validFrom) : null;
        if (validUntil !== undefined) offer.validUntil = validUntil ? new Date(validUntil) : null;
        if (status !== undefined) offer.status = status;

        await offer.save();
        res.status(200).json(offer);
    } catch (error) {
        console.error('Update Offer Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Delete discount offer
// @route   DELETE /api/seller/offers/:id
// @access  Private (Seller)
const deleteSellerOffer = async (req, res) => {
    try {
        const offer = await Offer.findOneAndUpdate(
            { _id: req.params.id, sellerId: req.user._id },
            { $set: { deleted: true, deletedAt: new Date() } },
            { new: true }
        );
        if (!offer) {
            return res.status(404).json({ message: 'Offer not found' });
        }
        
        // Log security audit event
        const { logSecurityEvent } = require('../utils/securityLogger');
        await logSecurityEvent(
            req.user._id,
            req.user.email,
            'PRODUCT_DELETED',
            req,
            { offerId: offer._id, offerTitle: offer.title, type: 'offer' }
        );

        res.status(200).json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Delete Offer Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Execute an autonomous self-healing fix action
// @route   POST /api/seller/support/execute
// @access  Private (Seller)
const executeResolution = async (req, res) => {
    try {
        const { action, targetId, payload = {} } = req.body;
        const sellerId = req.user._id;

        if (!action) {
            return res.status(400).json({ message: 'Action type is required' });
        }

        let resolverResult;
        
        // Route to matching resolver
        if (action === 'ACTIVATE_PRODUCT' || action === 'SET_PRODUCT_CATEGORY') {
            resolverResult = await executeProductResolution(action, targetId, sellerId, payload);
        } else if (action === 'OPEN_SHOP' || action === 'DISABLE_MANUAL_OVERRIDE' || action === 'DISABLE_HOLIDAY_MODE') {
            resolverResult = await executeShopResolution(action, sellerId);
        } else if (action === 'ENABLE_OFFER' || action === 'EXTEND_OFFER') {
            resolverResult = await executeOfferResolution(action, targetId, sellerId, payload);
        } else if (action === 'COMPLETE_PAYMENT_SETUP') {
            resolverResult = await executePaymentResolution(action, sellerId);
        } else if (action === 'RESTOCK_INVENTORY') {
            resolverResult = await executeInventoryResolution(action, targetId, sellerId, payload);
        } else if (action === 'VERIFY_PHONE') {
            resolverResult = await executeAccountResolution(action, sellerId);
        } else {
            return res.status(400).json({ message: `Unknown resolution action: ${action}` });
        }

        const { targetName, previousState } = resolverResult;

        // Log to ResolutionActions (audit trail with previous state for rollback)
        const resolutionAction = await ResolutionAction.create({
            actionType: action,
            sellerId,
            targetId: targetId || sellerId.toString(),
            targetName,
            previousState,
            status: 'SUCCESS',
            performedBy: 'SUPPORT_AI'
        });

        // Log to ResolutionHistory
        await ResolutionHistory.create({
            sellerId,
            issue: `Seller reported issue target: ${targetName}`,
            fix: `Auto-healed via support action: ${action.replace(/_/g, ' ')}`,
            result: 'SUCCESS'
        });

        // Push real-time notification
        await createNotification(
            sellerId,
            'SYSTEM',
            '🔧 Action Self-Healed',
            `System successfully applied fix: ${action.replace(/_/g, ' ')} on ${targetName}.`,
            'LOW'
        );

        res.status(200).json(resolutionAction);
    } catch (error) {
        console.error('Execute Resolution Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Undo / Rollback a previously executed fix action
// @route   POST /api/seller/support/undo
// @access  Private (Seller)
const undoResolution = async (req, res) => {
    try {
        const { actionId } = req.body;
        const sellerId = req.user._id;

        if (!actionId) {
            return res.status(400).json({ message: 'Action ID is required' });
        }

        const actionLog = await ResolutionAction.findOne({ _id: actionId, sellerId });
        if (!actionLog) {
            return res.status(404).json({ message: 'Resolution action log not found or access denied' });
        }

        if (actionLog.status !== 'SUCCESS') {
            return res.status(400).json({ message: `Cannot undo action with status: ${actionLog.status}` });
        }

        const action = actionLog.actionType;
        const targetId = actionLog.targetId;
        const previousState = actionLog.previousState;

        // Route rollback to matching resolver
        if (action === 'ACTIVATE_PRODUCT' || action === 'SET_PRODUCT_CATEGORY') {
            await rollbackProductResolution(action, targetId, sellerId, previousState);
        } else if (action === 'OPEN_SHOP' || action === 'DISABLE_MANUAL_OVERRIDE' || action === 'DISABLE_HOLIDAY_MODE') {
            await rollbackShopResolution(action, sellerId, previousState);
        } else if (action === 'ENABLE_OFFER' || action === 'EXTEND_OFFER') {
            await rollbackOfferResolution(action, targetId, sellerId, previousState);
        } else if (action === 'COMPLETE_PAYMENT_SETUP') {
            await rollbackPaymentResolution(action, sellerId, previousState);
        } else if (action === 'RESTOCK_INVENTORY') {
            await rollbackInventoryResolution(action, targetId, sellerId, previousState);
        } else if (action === 'VERIFY_PHONE') {
            await rollbackAccountResolution(action, sellerId, previousState);
        }

        actionLog.status = 'UNDONE';
        await actionLog.save();

        // Update resolution summary status
        await ResolutionHistory.create({
            sellerId,
            issue: `Rolled back changes for target: ${actionLog.targetName}`,
            fix: `Undid support action: ${action.replace(/_/g, ' ')}`,
            result: 'REVERTED'
        });

        res.status(200).json({ message: 'Action successfully rolled back!', actionLog });
    } catch (error) {
        console.error('Undo Resolution Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// @desc    Get all executed resolution actions
// @route   GET /api/seller/support/resolutions
// @access  Private (Seller)
const getExecutedResolutions = async (req, res) => {
    try {
        const actions = await ResolutionAction.find({ sellerId: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(actions);
    } catch (error) {
        console.error('Get Resolutions Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    createTicket,
    searchSupport,
    runDetectIntent,
    logHelpfulnessFeedback,
    getSupportAnalytics,
    getSellerSupportContext,
    runProductDiagnosis,
    runPaymentDiagnosis,
    runShopDiagnosis,
    getSupportHistory,
    getSellerOffers,
    createSellerOffer,
    updateSellerOffer,
    deleteSellerOffer,
    executeResolution,
    undoResolution,
    getExecutedResolutions
};
