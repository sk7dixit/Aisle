const analyzeRootCause = require('./rootCauseAnalyzer');
const { runInvestigationSuite } = require('./investigationEngine');
const buildSellerContext = require('./context/contextBuilder');

/**
 * Core Dialogue Manager. Evaluates input text, updates state, and generates the agent's reply.
 */
const handleConversationTurn = async (session, messageText) => {
    const text = messageText.toLowerCase();
    const sellerId = session.sellerId;

    let responseText = '';
    let runInvestigation = false;

    // Detect if starting a new topic from scratch (in case they switch topics)
    const isSalesDrop = ['sale', 'sales', 'order', 'orders', 'traffic', 'nobody', 'no one', 'buying', 'buy'].some(w => text.includes(w));
    const isVisibility = ['visible', 'visibility', 'show', 'product', 'dikh'].some(w => text.includes(w));
    const isPayments = ['payment', 'payout', 'money', 'paisa', 'settle'].some(w => text.includes(w));

    // Initial state setup if first turn
    if (session.conversation.length === 0) {
        if (isSalesDrop) {
            session.issue = 'SALES_DROP';
            session.currentStep = 'ASK_TIMEFRAME';
            responseText = "I understand you are experiencing a drop in orders. To help me investigate, when did you first notice this sales drop start?";
        } else if (isVisibility) {
            session.issue = 'PRODUCT';
            session.currentStep = 'ASK_PRODUCT_NAME';
            responseText = "I can help check your products. Which product name or item is currently not appearing for your customers?";
        } else if (isPayments) {
            session.issue = 'PAYMENTS';
            session.currentStep = 'ASK_PAYMENT_ISSUE';
            responseText = "Let's check your payouts. Are you experiencing a pending bank verification or did a specific weekly settlement release fail?";
        } else {
            session.issue = 'GENERAL';
            session.currentStep = 'ASK_GENERAL_HELP';
            responseText = "I can help investigate issues. Could you describe in more detail if it is related to products, payments, shop hours, or customer orders?";
        }
        
        session.conversation.push({ sender: 'seller', text: messageText });
        session.conversation.push({ sender: 'agent', text: responseText });
        await session.save();
        return { responseText, session };
    }

    // Process turn based on state
    session.conversation.push({ sender: 'seller', text: messageText });

    const step = session.currentStep;

    if (step === 'ASK_TIMEFRAME') {
        session.metadata.timeframe = messageText;
        session.currentStep = 'ASK_CHANGES';
        responseText = "Got it. Did you make any changes to your inventory, discount offers, product pricing, or shop working hours around that time?";
    } 
    else if (step === 'ASK_CHANGES') {
        session.metadata.changes = messageText;
        session.currentStep = 'OFFER_FIX_PROPOSAL';
        runInvestigation = true;

        // Perform diagnostics check
        const diagnosis = await analyzeRootCause(sellerId, session.issue);
        session.findings = diagnosis.findings;
        
        const findingsList = diagnosis.findings.map(f => `• ${f}`).join('\n');
        
        responseText = `That may be contributing. I have run an automated diagnostic check across your account.\n\nI found:\n${findingsList}\n\n**Why Analysis:**\n- **What happened:** ${diagnosis.whyAnalysis.what}\n- **Why it happened:** ${diagnosis.whyAnalysis.why}\n- **How to fix:** ${diagnosis.whyAnalysis.how}\n\nWould you like me to automatically fix this or schedule an escalation?`;
    } 
    else if (step === 'ASK_PRODUCT_NAME') {
        session.metadata.productName = messageText;
        session.currentStep = 'PRODUCT_FIX_PROPOSAL';
        runInvestigation = true;

        const diagnosis = await analyzeRootCause(sellerId, 'PRODUCT');
        session.findings = diagnosis.findings;

        const findingsList = diagnosis.findings.map(f => `• ${f}`).join('\n');

        responseText = `I ran a diagnostic check on your products.\n\nI found:\n${findingsList}\n\n**Why Analysis:**\n- **What happened:** ${diagnosis.whyAnalysis.what}\n- **Why it happened:** ${diagnosis.whyAnalysis.why}\n- **How to fix:** ${diagnosis.whyAnalysis.how}\n\nWould you like me to apply a Quick Fix now?`;
    } 
    else if (step === 'ASK_PAYMENT_ISSUE') {
        session.metadata.paymentDetail = messageText;
        session.currentStep = 'PAYMENT_FIX_PROPOSAL';
        runInvestigation = true;

        const diagnosis = await analyzeRootCause(sellerId, 'PAYMENTS');
        session.findings = diagnosis.findings;

        responseText = `I checked your payments database status.\n\n**Why Analysis:**\n- **What happened:** ${diagnosis.whyAnalysis.what}\n- **Why it happened:** ${diagnosis.whyAnalysis.why}\n- **How to fix:** ${diagnosis.whyAnalysis.how}\n\nWould you like me to complete setup mock routing updates or escalate to supervisor support?`;
    }
    else if (step === 'OFFER_FIX_PROPOSAL' || step === 'PRODUCT_FIX_PROPOSAL' || step === 'PAYMENT_FIX_PROPOSAL') {
        const negative = ['no', 'dont', "don't", 'never', 'escalate', 'callback'].some(w => text.includes(w));
        const affirmative = ['yes', 'fix', 'please', 'sure', 'ok', 'apply', 'resolve'].some(w => text.includes(w));
        
        if (negative) {
            responseText = "Understood. I will prepare a structured escalation report for our operations team. They will contact you shortly.";
            session.status = 'ESCALATED';
        } else if (affirmative) {
            responseText = "Excellent! I have queued the auto-fix commands. You can click 'Apply Fix' in the Quick Actions alerts banner to execute instantly, or I can mark this session as completed.";
            session.status = 'COMPLETED';
        } else {
            responseText = "Excellent! I have queued the auto-fix commands. You can click 'Apply Fix' in the Quick Actions alerts banner to execute instantly, or I can mark this session as completed.";
            session.status = 'COMPLETED';
        }
    } 
    else {
        responseText = "I can continue diagnosing your shop details. Let me know if you would like me to check active offers, product listings, or bank settlements.";
    }

    session.conversation.push({ sender: 'agent', text: responseText });
    await session.save();

    // Trigger step-by-step logs in background
    if (runInvestigation) {
        const context = await buildSellerContext(sellerId);
        await runInvestigationSuite(session._id, sellerId, context);
    }

    return { responseText, session };
};

module.exports = {
    handleConversationTurn
};
