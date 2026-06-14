const ConversationMemory = require('../models/ConversationMemory');
const { handlePersonalityChat } = require('../support/customerPersonalityEngine');
const mongoose = require('mongoose');

// @desc    Process customer AI support chat
// @route   POST /api/customer/support-chat
// @access  Private (Customer)
const processSupportChat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;
        const userName = req.user.name ? req.user.name.split(' ')[0] : 'Shashwat';

        if (!message) {
            return res.status(400).json({ message: "Message is required" });
        }

        // 1. Fetch or create ConversationMemory
        let convo = await ConversationMemory.findOne({ userId });
        if (!convo) {
            convo = await ConversationMemory.create({
                userId,
                memoryContext: {
                    sellerName: null,
                    orderId: null,
                    productName: null,
                    budget: null,
                    lastTopic: null,
                    lastProductId: null,
                    lastProductName: null,
                    guestCount: null,
                    laptopStep: null,
                    laptopUsage: null,
                    laptopBudget: null,
                    phoneStep: null,
                    phoneBudget: null
                },
                logs: []
            });
        }

        let context = convo.memoryContext || {};

        // 2. Add user message to log
        convo.logs.push({ sender: 'user', text: message });

        // 3. Process message using the Personality Engine
        let response = handlePersonalityChat(message, context, userName);

        // 4. Fallback to operational intents if the personality engine returned null
        if (!response.reply) {
            const lower = message.toLowerCase().trim();
            let reply = "";
            let chips = [];
            let intent = "none";
            let triggerEscalation = false;
            let intentData = {};

            const isAngry = convo.lastSentiment === 'angry' || convo.lastSentiment === 'frustrated';

            // Traditional support checks
            if (lower.includes("still no response") || lower.includes("still no reply") || lower.includes("not replying")) {
                if (context.sellerName) {
                    reply = `I understand you're referring to "${context.sellerName}". Since they are not responding, would you like me to raise a callback ticket so a manager can contact them?`;
                    chips = ["Raise callback ticket", "Cancel my order"];
                } else {
                    context.lastTopic = 'seller-no-reply';
                    reply = "Could you tell me the seller name so I can check their active hours and status?";
                }
            } else if (lower.includes("track") || lower.includes("where is my order")) {
                const prefix = isAngry ? "I understand you're anxious about your order location. " : "";
                reply = `${prefix}You can track your order live from the 'Activity' tab on your profile page. Active orders show current dispatch and rider assignment detail.`;
                chips = ["Go to Activity", "Talk to Seller"];
            } else if (lower.includes("booking") || lower.includes("appointment")) {
                reply = "You can view and cancel all booking appointments under the 'Bookings' tab in your Profile. If the status is pending, the provider has not confirmed it yet.";
                chips = ["View Bookings", "Support Callback"];
            } else if (lower.includes("app") || lower.includes("slow") || lower.includes("crash") || lower.includes("bug")) {
                const prefix = isAngry ? "I understand this app experience is frustrating. " : "";
                reply = `${prefix}We apologize for the glitch. Please try refreshing or clear your browser cache. If it persists, let us know so we can fix it.`;
                chips = ["Report app bug", "Request manager callback"];
            } else if (lower.includes("raise callback ticket") || lower.includes("callback")) {
                reply = "Please share your phone number below and our support representative will call you back within 24 hours.";
                triggerEscalation = true;
            } else if (lower.includes("delayed order") || lower === "delayed") {
                intent = 'track-orders';
                reply = "Checking your active orders for delays...";
            } else if (lower === "refund check" || lower.includes("check refund status") || lower === "refunds") {
                intent = 'track-orders';
                reply = "Checking refund eligibility. Please select the order you need a refund check for:";
            } else if (lower === "wrong product" || lower.includes("wrong item delivered")) {
                intent = 'track-orders';
                reply = "Please select the order containing the wrong product to initiate a replacement request:";
            } else if (lower === "missing product") {
                intent = 'track-orders';
                reply = "Please select the order missing items from your list below to raise an operations ticket:";
            } else if (lower === "seller issue" || lower.includes("seller is not responding")) {
                intent = 'track-orders';
                reply = "Please select the order or merchant you are trying to contact:";
            } else if (lower === "payment issue") {
                reply = "⚠️ **Payment Issue Support**\n\nIf your account was charged but no order confirmation was created, this is flagged as CRITICAL.\n\nWould you like me to escalate this immediately to the operations team?";
                chips = ["Escalate Payment Issue", "Resolve Order Issue"];
            } else if (lower === "escalate payment issue") {
                intent = 'create-ticket';
                intentData = {
                    category: 'Other',
                    priority: 'urgent',
                    summary: "Payment charged but no order created. Needs immediate review."
                };
                reply = "Filing high-priority escalation ticket to resolve the payment issue...";
            } else if (lower === "my complaint status" || lower === "complaint status" || lower === "ticket status" || lower.includes("ticket status")) {
                intent = 'check-tickets';
                reply = "Fetching your operations complaint status...";
            } else if (lower.includes("bookings") || lower.includes("booking") || lower === "manage my bookings") {
                intent = 'booking-details';
                reply = "Fetching your service bookings details...";
            } else if (lower.includes("select slot:") || lower.includes("confirm slot:")) {
                reply = `📅 **Booking Rescheduled Successfully!**\n\nYour Home Cleaning appointment has been updated to the alternative slot. Provider CleanPro has confirmed.`;
                chips = ["Manage Bookings", "Shopping Help"];
            } else if (lower === "cancel booking appointment") {
                reply = "❌ **Booking Cancelled Successfully**\n\nYour CleanPro booking has been cancelled. If any prepayment was charged, a refund has been initiated to your original payment method.";
                chips = ["Manage Bookings", "Shopping Help"];
            } else if (lower.match(/track order\s+([a-f0-9]+)/i)) {
                const match = lower.match(/track order\s+([a-f0-9]+)/i);
                intent = 'order-tracking';
                intentData = { orderId: match[1].trim() };
                reply = `Fetching live tracking steps...`;
            } else if (lower.match(/refund check\s+([a-f0-9]+)/i)) {
                const match = lower.match(/refund check\s+([a-f0-9]+)/i);
                intent = 'refund-eligibility';
                intentData = { orderId: match[1].trim() };
                reply = "Checking refund policy eligibility details...";
            } else if (lower.match(/return items\s+([a-f0-9]+)/i)) {
                const match = lower.match(/return items\s+([a-f0-9]+)/i);
                intent = 'return-replacement-flow';
                intentData = { orderId: match[1].trim() };
                reply = "Starting replacement wizard. Please verify the uploaded images:";
            } else if (lower.match(/cancel order\s+([a-f0-9]+)/i)) {
                const match = lower.match(/cancel order\s+([a-f0-9]+)/i);
                intent = 'cancel-order-intent';
                intentData = { orderId: match[1].trim() };
                reply = "Processing cancellation request...";
            } else if (lower.match(/dispute order\s+([a-f0-9]+)/i)) {
                const match = lower.match(/dispute order\s+([a-f0-9]+)/i);
                intent = 'dispute-flow';
                intentData = { orderId: match[1].trim() };
                reply = "Investigating details to submit dispute report...";
            } else if (lower === "escalate wrong item delivery replacement" || lower.includes("submit replacement request")) {
                intent = 'create-ticket';
                intentData = {
                    category: 'Shopping',
                    priority: 'high',
                    summary: "Return/replacement requested for wrong product delivered."
                };
                reply = "Submitting replacement ticket...";
            } else if (lower.includes("need groceries again") || lower.includes("reorder groceries") || lower === "reorder") {
                reply = `Based on your previous orders, here are your frequent grocery purchases from **XYZ seller**:\n\n• Tata Salt (1kg) - ₹25\n• Fortune Mustard Oil (1L) - ₹175\n• Ashirvaad Atta (5kg) - ₹260\n• Maggi 2-Minute Noodles (12-pack) - ₹160\n\nWould you like to reorder them now?`;
                chips = ["Reorder All", "Tata Salt Only", "Fortune Oil + Atta", "Cancel"];
            } else if (lower === "reorder all") {
                intent = 'reorder-action';
                intentData = {
                    items: [
                        { productId: "6a265ea64ff762e97a744c26", name: "Tata Salt", quantity: 1, price: 25, image: "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400" },
                        { productId: "6a265ea64ff762e97a744c29", name: "Fortune Mustard Oil", quantity: 1, price: 175, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
                        { productId: "6a265ea64ff762e97a744c2c", name: "Ashirvaad Atta", quantity: 1, price: 260, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" },
                        { productId: "6a265ea64ff762e97a744c2f", name: "Maggi 2-Minute Noodles", quantity: 1, price: 160, image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400" }
                    ],
                    sellerId: "6a22678de410c49988759fa5"
                };
                reply = "Placing reorder for all items...";
            } else if (lower === "tata salt only") {
                intent = 'reorder-action';
                intentData = {
                    items: [
                        { productId: "6a265ea64ff762e97a744c26", name: "Tata Salt", quantity: 1, price: 25, image: "https://images.unsplash.com/photo-1518085023892-ed6b1a13e1f6?w=400" }
                    ],
                    sellerId: "6a22678de410c49988759fa5"
                };
                reply = "Placing reorder for Tata Salt...";
            } else if (lower === "fortune oil + atta") {
                intent = 'reorder-action';
                intentData = {
                    items: [
                        { productId: "6a265ea64ff762e97a744c29", name: "Fortune Mustard Oil", quantity: 1, price: 175, image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400" },
                        { productId: "6a265ea64ff762e97a744c2c", name: "Ashirvaad Atta", quantity: 1, price: 260, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400" }
                    ],
                    sellerId: "6a22678de410c49988759fa5"
                };
                reply = "Placing reorder for Fortune Mustard Oil and Ashirvaad Atta...";
            } else if (lower.includes("favorite shops") || lower === "show my favorite shops") {
                intent = 'favorites';
                reply = "Fetching your favorite shops list...";
            } else if (lower.includes("continue where i left off") || lower.includes("continue shopping")) {
                intent = 'recent-activity';
                reply = "Retrieving your recently viewed items...";
            } else if (lower.includes("show my recommendations") || lower.includes("recommendations") || lower === "recommended for you") {
                intent = 'recommendation';
                reply = "Retrieving recommendations based on your profile...";
            } else if (lower.includes("shopping help") || lower === "🛍 shopping help") {
                reply = "What are you looking for today?";
                chips = ["Need groceries", "Need gift", "Need bakery", "Need electronics", "Need medicine", "Need home decor"];
            } else if (lower.includes("homemade snacks") || lower.includes("homemade")) {
                intent = 'home-business';
                intentData = { query: 'snacks' };
                reply = "Searching local home businesses for snacks...";
                chips = ["Need homemade cake", "Shopping Help"];
            } else if (lower.includes("shampoo")) {
                reply = "What type of shampoo are you looking for?";
                chips = ["Anti Hair Fall", "Anti Dandruff", "Daily Use", "Herbal"];
            } else if (lower.includes("milk") || lower === "need milk") {
                intent = 'product-search';
                intentData = { query: 'milk' };
                reply = "I found these popular milk options nearby (e.g. Amul Gold, Amul Toned, Mother Dairy, Nandini):";
                chips = ["Show nearby stores", "Shopping Help"];
            } else {
                // Default fallback
                const empathyPrefix = isAngry ? "I understand you're frustrated. Let's get this resolved.\n\n" : "";
                reply = `${empathyPrefix}I can assist you with finding products, discovering local stores, and troubleshooting app issues.\n\nWhat can I find for you today?`;
                chips = ["🛍 Shopping Help", "Track My Order", "Seller Support"];
            }

            response = {
                reply,
                chips,
                intent,
                context,
                sentiment: convo.lastSentiment,
                triggerEscalation,
                ...intentData
            };
        }

        // Determine agent dynamically if not set
        if (!response.agent) {
            const lower = message.toLowerCase().trim();
            const intent = response.intent || "none";
            let agent = "Support Agent";
            if (intent === 'track-orders' || intent === 'order-tracking' || intent === 'cancel-order-intent' || intent === 'refund-eligibility' || intent === 'return-replacement-flow' || lower.includes("order") || lower.includes("refund") || lower.includes("cancel") || lower.includes("delivery") || lower.includes("delayed")) {
                agent = "Order Agent";
            } else if (intent === 'booking-details' || lower.includes("booking") || lower.includes("appointment")) {
                agent = "Booking Agent";
            } else if (intent === 'create-ticket' || intent === 'dispute-flow' || intent === 'check-tickets') {
                agent = "Support Agent";
            } else if (intent === 'product-search' || intent === 'shop-search' || intent === 'home-business' || intent === 'recommendation' || intent === 'alternatives' || intent === 'create-reminder' || intent === 'reorder-action' || lower.includes("buy") || lower.includes("price") || lower.includes("trend") || lower.includes("grocery")) {
                agent = "Shopping Agent";
            } else if (lower.includes("seller") || lower.includes("not responding") || lower.includes("not replying")) {
                agent = "Seller Agent";
            }
            response.agent = agent;
        }

        // 5. Generate progressive human-like typing steps based on intent
        let typingSteps = ["● Processing message...", "● Aligning dialogue tone...", "● Generating response..."];
        if (response.intent === 'product-search' || response.intent === 'recommendation') {
            typingSteps = [
                "● Understanding your request...",
                "● Scanning catalog database...",
                "● Filtering nearby stores..."
            ];
        } else if (response.intent === 'shop-search' || response.intent === 'home-business') {
            typingSteps = [
                "● Locating your coordinates...",
                "● Checking merchant open hours...",
                "● Finding closest sellers..."
            ];
        } else if (response.intent === 'order-tracking' || response.intent === 'track-orders') {
            typingSteps = [
                "● Locating order records...",
                "● Fetching dispatch log details...",
                "● Resolving driver GPS location..."
            ];
        } else if (response.intent === 'refund-eligibility') {
            typingSteps = [
                "● Validating payment capture state...",
                "● Checking store refund timelines...",
                "● Approving eligibility criteria..."
            ];
        } else if (response.intent === 'cancel-order-intent') {
            typingSteps = [
                "● Checking cancellation constraints...",
                "● Reverting transaction capture...",
                "● Updating order documents..."
            ];
        } else if (response.intent === 'create-ticket' || response.intent === 'dispute-flow') {
            typingSteps = [
                "● Writing conversation transcript...",
                "● Generating operations ticket...",
                "● Assigning support queue..."
            ];
        }

        // 6. Save update ConversationMemory state
        convo.logs.push({ sender: 'bot', text: response.reply, agent: response.agent });
        convo.memoryContext = response.context || context;
        convo.lastSentiment = response.sentiment || 'neutral';
        await convo.save();

        res.json({
            reply: response.reply,
            chips: response.chips,
            intent: response.intent,
            sentiment: response.sentiment,
            agent: response.agent || "Support Agent",
            triggerEscalation: response.triggerEscalation,
            typingSteps,
            memory: convo.memoryContext,
            // Pass along any extra fields
            intentData: response.intentData,
            query: response.query,
            orderId: response.orderId,
            reminderItem: response.reminderItem,
            reminderFrequency: response.reminderFrequency,
            delayDays: response.delayDays,
            items: response.items,
            sellerId: response.sellerId,
            budget: response.budget,
            cheaper: response.cheaper,
            category: response.category,
            summary: response.summary,
            priority: response.priority,
            customReplyPrefix: response.customReplyPrefix,
            customChips: response.customChips
        });

    } catch (error) {
        console.error("Support Chat Personality Error:", error);
        res.status(500).json({ message: "Server Error processing chat", error: error.message });
    }
};

// @desc    Update support chat feedback
// @route   POST /api/customer/support-chat/feedback
// @access  Private (Customer)
const updateChatFeedback = async (req, res) => {
    try {
        const { feedback } = req.body;
        const userId = req.user._id;

        if (!['thumbsUp', 'thumbsDown'].includes(feedback)) {
            return res.status(400).json({ message: "Invalid feedback value" });
        }

        await ConversationMemory.updateOne(
            { userId },
            { $set: { feedback } }
        );

        res.json({ message: "Feedback registered successfully", feedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    processSupportChat,
    updateChatFeedback
};
