/**
 * Aisle Customer support AI - Personality, Small Talk & Dialogue Engine (Phase 5)
 */

// 1. Sentiment Analysis Engine
const analyzeSentiment = (text) => {
    const lower = text.toLowerCase().trim();
    
    const happyRegex = /(thanks|thank you|helpful|great|awesome|love|good|happy|perfect|best|wonderful|appreciate)/i;
    const confusedRegex = /(don't understand|confused|what does this mean|how to|what is|not clear|dont understand|explain)/i;
    const frustratedRegex = /(ridiculous|slow|annoyed|bad|useless|stupid|waste|terrible|horrible|trash|nonsense|lag)/i;
    const angryRegex = /(worst|cheat|scam|garbage|hate|frustrated|angry|fraud|steal|rob|police|court|sue)/i;

    if (angryRegex.test(lower)) return 'angry';
    if (frustratedRegex.test(lower)) return 'frustrated';
    if (confusedRegex.test(lower)) return 'confused';
    if (happyRegex.test(lower)) return 'happy';
    return 'neutral';
};

// Jokes Repository (Humor Layer)
const jokes = [
    {
        joke: "Why did the grocery store hire a computer?\n\nTo improve its byte-sized inventory 😄",
        trigger: "tell me a joke"
    },
    {
        joke: "Why was the shopping cart so confident?\n\nBecause it always knew where it was headed 🛒",
        trigger: "another one"
    },
    {
        joke: "Why did the tomato blush?\n\nBecause it saw the salad dressing! 🍅",
        trigger: "tell me a joke"
    },
    {
        joke: "What do you call a fake noodle?\n\nAn impasta! 🍝",
        trigger: "another one"
    }
];

// Main Personality & Small Talk Dialogue Handler
const _handlePersonalityChat = (message, context = {}, userName = 'Shashwat') => {
    const lower = message.toLowerCase().trim();
    let reply = "";
    let chips = [];
    let intent = "none";
    let triggerEscalation = false;
    let category = "Other";
    let priority = "medium";
    let summary = "";
    let intentData = {};

    // Analyze Sentiment
    const sentiment = analyzeSentiment(lower);

    // Initial default chips
    const defaultChips = ["Hello 👋", "Find Products", "Track Order", "Gift Ideas", "Nearby Shops", "Need Help"];

    // 1. ABUSE / OFFENSIVE LANGUAGE HANDLER (Advanced Abuse Handling)
    if (lower.match(/(stupid|idiot|fuck|useless|shit|bitch|dumb|mental|bastard|nonsense|asshole)/)) {
        // First offense or general venting
        if (lower.includes("useless")) {
            return {
                reply: "I can see you're upset. Let's focus on fixing the issue.\n\nWhat went wrong?",
                chips: ["Order Issue", "Seller Issue", "App Issue"],
                intent: "none",
                context,
                sentiment
            };
        } else {
            return {
                reply: "I understand you're frustrated. I'm still here to help if you'd like assistance.",
                chips: ["Resolve Order Issue", "Restart Help", "Need Help"],
                intent: "none",
                context,
                sentiment
            };
        }
    }

    // 2. TRUST & SAFETY PERSONALITY
    const isSensitive = /(hack|steal|password|card details|otp|cvv|account hack|bypass|crack)/i.test(lower);
    if (isSensitive) {
        return {
            reply: "I can't help with that.\n\nIf you're having account access issues, I can help you recover your own account.",
            chips: ["Recover Account", "Contact Support", "Need Help"],
            intent: "none",
            context,
            sentiment
        };
    }

    // 3. APPRECIATION RECOGNITION
    if (lower === "you helped me" || lower === "helpful" || lower === "thanks for helping") {
        return {
            reply: "I'm happy I could help 😊\n\nThank you for using Aisle.",
            chips: defaultChips,
            intent: "none",
            context,
            sentiment
        };
    }
    if (lower.includes("best support ever") || lower.includes("awesome support") || lower.includes("you are great")) {
        return {
            reply: "That means a lot.\n\nI'll always do my best to help.",
            chips: defaultChips,
            intent: "none",
            context,
            sentiment
        };
    }

    // 4. HUMOR LAYER (Jokes)
    if (lower.includes("joke") && !lower.includes("another")) {
        context.lastTopic = "joke-flow";
        return {
            reply: jokes[0].joke,
            chips: ["Another one", "Shopping Help"],
            intent: "none",
            context,
            sentiment
        };
    }
    if (lower.includes("another") && context.lastTopic === "joke-flow") {
        // Return a random alternative joke
        const randomJoke = jokes[1 + Math.floor(Math.random() * (jokes.length - 1))];
        return {
            reply: randomJoke.joke,
            chips: ["Another one", "Shopping Help"],
            intent: "none",
            context,
            sentiment
        };
    }

    // 5. SMALL TALK ENGINE
    if (lower === "hello" || lower === "hi" || lower === "hey" || lower === "yo") {
        return {
            reply: `Hello ${userName} 👋\n\nWhat can I help you with today?`,
            chips: ["Find Products", "Track Order", "Reorder Groceries", "Need Help"],
            intent: "none",
            context,
            sentiment
        };
    }
    if (lower.includes("good morning") || lower === "morning") {
        return {
            reply: "Good Morning ☀️\n\nHope you're having a great day. Need help with shopping, bookings, or orders?",
            chips: ["Find Products", "Track Order", "Reorder Groceries"],
            intent: "none",
            context,
            sentiment
        };
    }
    if (lower.includes("good night") || lower === "night") {
        return {
            reply: "Good Night 🌙\n\nIf you need anything later, I'll be here.",
            chips: ["Hello 👋"],
            intent: "none",
            context,
            sentiment
        };
    }

    // 6. EMOTION DETECTION LAYER RESPONSE PREPENDS (If not handled above)
    let emotionGreeting = "";
    if (sentiment === 'angry') {
        emotionGreeting = "I'm sorry you've had a poor experience. Let's find the best solution.\n\n";
    } else if (sentiment === 'frustrated') {
        emotionGreeting = "I understand this has been frustrating. Let's get this sorted out as quickly as possible.\n\n";
    } else if (sentiment === 'confused') {
        emotionGreeting = "No worries. I'll explain it step by step.\n\n";
    } else if (sentiment === 'happy') {
        emotionGreeting = "You're welcome 😊 I'm glad I could help.\n\n";
    }

    // ==========================================
    // ==========================================
    // PHASE 7: AISLE OS DIALOGUE INTENTS
    // ==========================================
    // ==========================================

    // 7A. Party Planner Checklist
    if (lower.includes("party for 30") || lower.includes("birthday party for 30") || lower.includes("party plan for 30")) {
        return {
            reply: "🎉 **Aisle OS Party Concierge**\n\nI have generated a complete Party Plan Checklist for **30 guests** using top local businesses on Aisle:\n\n🎂 **Birthday Cake**: 3 kg custom cake (Est. ₹1,800)\n🎈 **Decorations**: Balloons, banners, lights kit (Est. ₹1,200)\n🎁 **Return Gifts**: 30 mini chocolate/toy hampers (Est. ₹3,500)\n🍿 **Snacks & Drinks**: Soft drinks & finger food (Est. ₹1,500)\n📸 **Photography**: Event photoshoot (Optional, Est. ₹4,000)\n\nWould you like me to find nearby stores selling these items?",
            chips: ["Find cake store", "Find decorations", "Get quotes", "Go Back"],
            intent: "party-planning",
            intentData: {
                guests: 30,
                checklist: [
                    { name: "Birthday Cake", status: "Required", cost: 1800, checked: false },
                    { name: "Decorations", status: "Required", cost: 1200, checked: false },
                    { name: "Return Gifts", status: "Required", cost: 3500, checked: false },
                    { name: "Snacks & Drinks", status: "Required", cost: 1500, checked: false },
                    { name: "Photography", status: "Optional", cost: 4000, checked: false }
                ]
            },
            context,
            sentiment
        };
    }

    // 7B. Life Event: Moving Checklist
    if (lower.includes("moving to a new house") || lower.includes("moving checklist") || lower.includes("moving house")) {
        return {
            reply: "📦 **Aisle OS Relocation Concierge**\n\nMoving to a new house is exciting! Here is your structured Moving Checklist, matched with local service providers near you:\n\n🛋️ **Furniture**: Sofa, beds, study table setup\n📺 **Electronics**: TV mounting & appliance hookup\n🖼️ **Home Decor**: Curtains, frames, rugs\n🧹 **Cleaning Services**: Deep clean prior to move-in\n🚛 **Packers & Movers**: Local shifting transit\n\nSelect a task below to connect with verified Aisle businesses.",
            chips: ["Book Packers", "Book Cleaning", "Show Home Decor", "Go Back"],
            intent: "life-event-moving",
            intentData: {
                eventName: "Moving to New House",
                checklist: [
                    { name: "Furniture Shifting & Assembly", status: "Required", provider: "Local Carpentry/Furniture" },
                    { name: "TV Mounting & Appliance Hookup", status: "Required", provider: "Aisle Handyman Services" },
                    { name: "Curtains, Rugs & Decor Setup", status: "Required", provider: "Home Decor Boutique" },
                    { name: "Move-In Deep Cleaning", status: "Required", provider: "CleanPro Services" },
                    { name: "Packers & Movers Transit", status: "Required", provider: "MoveEasy Logistics" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7C. Life Event: Baby Checklist
    if (lower.includes("baby is arriving") || lower.includes("baby checklist") || lower.includes("baby helper") || lower.includes("newborn")) {
        return {
            reply: "👶 **Aisle OS Newborn Concierge**\n\nCongratulations on the upcoming arrival! Here is your Newborn Prep Checklist, compiled with verified local shops and clinics:\n\n🍼 **Baby Products**: Diapers, wipes, baby wash, cradle\n🩺 **Pediatric Services**: Nearby children clinics\n🍲 **Home Food Providers**: Postpartum nutritional meals\n💊 **Pharmacies**: Essential newborn medical kits\n\nClick an option below to browse local products or clinics.",
            chips: ["Buy Baby Products", "Consult Pediatrician", "Order Food", "Go Back"],
            intent: "life-event-baby",
            intentData: {
                eventName: "Newborn Arrival",
                checklist: [
                    { name: "Diapers, Cradle & Wash Kit", status: "Required", provider: "Toddler Emporium" },
                    { name: "Pediatric Consultation Checkup", status: "Required", provider: "City Childrens Clinic" },
                    { name: "Postpartum Healthy Meals", status: "Required", provider: "Moms Kitchen Catering" },
                    { name: "Essential Newborn Medical Kit", status: "Required", provider: "Aisle Pharmacy 24/7" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7D. Multi-Shop Shopping Cart Optimization
    if (lower.includes("grocery weekly optimizer") || lower.includes("groceries for one week") || lower.includes("multi-shop") || lower.includes("optimize grocery") || lower.includes("grocery plan")) {
        return {
            reply: "🛒 **Aisle OS Multi-Shop Optimizer**\n\nI have cross-analyzed live prices across Indore's local grocery stores to assemble your Weekly Staple Checklist at the lowest possible cost:\n\n🏪 **Indore Kirana Mart**: Tata Salt (₹25), Fortune Mustard Oil (₹175) -> Total: ₹200\n🏪 **Fresh Grocery Hub**: Bread (₹40), Eggs (₹60) -> Total: ₹100\n🏪 **Daily Essentials**: Rice (₹120), Atta (₹260) -> Total: ₹380\n\n📉 **Optimized Cart Total: ₹472** (Buying everything from one store would have cost ₹680! You save **₹208** across 3 shops).",
            chips: ["Add Multi-Cart to Checkout", "Edit Groceries List", "Go Back"],
            intent: "multi-shop-cart",
            intentData: {
                shopsCount: 3,
                totalAmount: 472,
                savings: 208,
                items: [
                    { name: "Tata Salt", price: 25, shopName: "Indore Kirana Mart" },
                    { name: "Fortune Mustard Oil", price: 175, shopName: "Indore Kirana Mart" },
                    { name: "Bread", price: 40, shopName: "Fresh Grocery Hub" },
                    { name: "Eggs", price: 60, shopName: "Fresh Grocery Hub" },
                    { name: "Rice", price: 120, shopName: "Daily Essentials" },
                    { name: "Atta", price: 260, shopName: "Daily Essentials" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7E. Gym Diet Planner
    if (lower.includes("gym diet") || lower.includes("protein diet") || lower.includes("plan gym diet") || lower.includes("diet planner")) {
        return {
            reply: "💪 **Aisle OS Fitness Diet Planner**\n\nI have generated a high-protein nutrition shopping list with nearby wellness retailers:\n\n🥚 **Protein Sources**: Eggs, chicken breast, paneer, tofu (Est. ₹550)\n🍌 **Energy Fruits**: Bananas, apples, berries (Est. ₹220)\n🥦 **Vitamins & Greens**: Broccoli, spinach, carrots (Est. ₹150)\n🥛 **Supplements**: Whey protein, creatine (Optional, Est. ₹2,200)\n\nWe have verified stocks for these items in wellness shops near Indore.",
            chips: ["Buy Protein Items", "Show Supplements", "Go Back"],
            intent: "shopping-planner-gym",
            intentData: {
                dietType: "High Protein / Gym Diet",
                checklist: [
                    { name: "Eggs, Chicken Breast & Tofu", status: "Required", cost: 550, shop: "Indore Meat & Dairy" },
                    { name: "Bananas, Apples & Berries", status: "Required", cost: 220, shop: "Fresh Farm Fruit Shop" },
                    { name: "Broccoli, Spinach & Carrots", status: "Required", cost: 150, shop: "Green Veggie Mart" },
                    { name: "Whey Protein Supplement", status: "Optional", cost: 2200, shop: "Active Life Nutrition" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7F. Wedding Planner
    if (lower.includes("wedding planner") || lower.includes("plan my wedding") || lower.includes("wedding")) {
        return {
            reply: "💍 **Aisle OS Wedding Concierge**\n\nLet's plan your special day! Here is your comprehensive Wedding Checklist using trusted local Aisle merchants:\n\n🎈 **Decoration & Stage**: Flowers, lighting, seating (Est. ₹65,000)\n📸 **Photography**: Pre-wedding shoot, video coverage (Est. ₹45,000)\n🍲 **Catering**: Multi-cuisine dinner buffet (Est. ₹1,20,000)\n🎂 **Bakery**: 3-tier custom wedding cake (Est. ₹8,000)\n🎁 **Gift Hampers**: Bulk return hampers for guests (Est. ₹15,000)",
            chips: ["Get Bulk Quotes", "Consult Decorator", "Book Photography", "Go Back"],
            intent: "wedding-planner",
            intentData: {
                eventName: "Wedding Ceremony",
                checklist: [
                    { name: "Stage & Flower Decoration", status: "Required", cost: 65000, provider: "Classic Floral Decors" },
                    { name: "Photography & Video Coverage", status: "Required", cost: 45000, provider: "Memories Studio" },
                    { name: "Catering Dinner Buffet", status: "Required", cost: 120000, provider: "Indore Royal Caterers" },
                    { name: "3-Tier Wedding Cake", status: "Required", cost: 8000, provider: "Priya's Bakehouse" },
                    { name: "Bulk Gift Hampers", status: "Required", cost: 15000, provider: "Indore Gift Bazaar" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7G. Picnic Planner
    if (lower.includes("picnic") || lower.includes("weekend picnic") || lower.includes("picnic planner")) {
        return {
            reply: "🧺 **Aisle OS Weekend Picnic Planner**\n\nPlanning a nice outdoor day! Here is your Checklist for a perfect weekend picnic:\n\n🥤 **Snacks & Beverages**: Sandwich bread, juices, chips (Est. ₹450)\n🧸 **Picnic Mats & Cushions**: Foldable waterproof mat (Est. ₹600)\n🎲 **Board Games**: Ludo, cards, Jenga (Est. ₹350)\n🥐 **Bakery Goods**: Croissants, muffins (Est. ₹300)",
            chips: ["Buy Snacks", "Find Bakery Goods", "Go Back"],
            intent: "picnic-planner",
            intentData: {
                eventName: "Weekend Picnic",
                checklist: [
                    { name: "Sandwich Bread, Juices & Chips", status: "Required", cost: 450, shop: "Fresh Grocery Hub" },
                    { name: "Foldable Waterproof Mat", status: "Required", cost: 600, shop: "Indore Home Decor" },
                    { name: "Ludo, Cards & Jenga Games", status: "Required", cost: 350, shop: "Toy World Indore" },
                    { name: "Croissants & Muffins", status: "Required", cost: 300, shop: "Priya's Bakehouse" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7H. Bulk Negotiation hampers
    if (lower.includes("50 gift hampers") || lower.includes("bulk quotes") || lower.includes("bulk hampers") || lower.includes("negotiation quotes")) {
        return {
            reply: "🛡️ **Aisle OS Bulk Quote Negotiation**\n\nI have requested bulk quotations for **50 gift hampers** from top local sellers nearby. Here are the offers received:\n\n🏪 **Indore Electronics Hub**: ₹250 each (Total: ₹12,500)\n• *Includes: Wireless earbuds, premium mug, dark chocolate*\n• *Delivery: 24 Hours | Rating: 4.8*\n\n🏪 **Madhya Pradesh Bakery**: ₹230 each (Total: ₹11,500)\n• *Includes: Hand-baked cookies, plum cake, jar cake, diwali candle*\n• *Delivery: 48 Hours | Rating: 4.6*\n\n🏪 **Priya's Bakes**: ₹220 each (Total: ₹11,000)\n• *Includes: Custom cupcakes, brownie box, handmade dry fruit box*\n• *Delivery: 36 Hours | Rating: 4.5*",
            chips: ["Accept Indore Electronics", "Accept MP Bakery", "Accept Priyas Bakes", "Go Back"],
            intent: "bulk-negotiation",
            intentData: {
                quantity: 50,
                itemType: "Gift Hamper",
                quotes: [
                    { shopName: "Indore Electronics Hub", pricePerUnit: 250, total: 12500, deliveryHours: 24, rating: 4.8, includes: "Earbuds, Mug, Chocolate" },
                    { shopName: "Madhya Pradesh Bakery", pricePerUnit: 230, total: 11500, deliveryHours: 48, rating: 4.6, includes: "Cookies, Plum Cake, Diwali Candle" },
                    { shopName: "Priya's Bakes", pricePerUnit: 220, total: 11000, deliveryHours: 36, rating: 4.5, includes: "Cupcakes, Brownie Box, Dry Fruit" }
                ]
            },
            context,
            sentiment
        };
    }

    // 7I. Voice assistant command mockup
    if (lower.includes("order milk from my usual shop") || lower.includes("voice command milk")) {
        return {
            reply: "🎤 **Aisle Voice Command Confirmed**\n\nI have added **Organic Milk (1L)** to your shopping cart from **Indore Kirana Mart**.\n\n🚚 **Expected Delivery**: in 25 minutes\n💵 **Total Price**: ₹60 (Cash on Delivery)\n\nWould you like me to place the order now?",
            chips: ["Confirm Order", "Cancel Voice Command"],
            intent: "voice-assistance",
            context,
            sentiment
        };
    }

    if (lower === "confirm order" && context.lastTopic === "voice-assistance-pending") {
        return {
            reply: "🎉 **Order Placed Successfully!**\n\nYour voice request has been processed. Indore Kirana Mart is preparing your Organic Milk delivery. You can track this under active orders.",
            chips: ["Track Order", "Shopping Help"],
            intent: "none",
            context,
            sentiment
        };
    }

    // 7J. Visual search mockup queries
    if (lower.includes("visual search chair") || lower.includes("image search chair")) {
        return {
            reply: "📸 **Aisle Visual Shopping Analysis**\n\nI have analyzed your uploaded image: **Modern Wooden Accent Chair**.\n\nHere are matching furniture products available nearby:",
            chips: ["Show nearby stores", "Shopping Help"],
            intent: "visual-search-chair",
            context,
            sentiment
        };
    }

    if (lower.includes("visual search cake") || lower.includes("image search cake")) {
        return {
            reply: "📸 **Aisle Visual Shopping Analysis**\n\nI have analyzed your uploaded image: **Red Velvet Celebration Cake**.\n\nHere are nearby home bakers that can make this custom design:",
            chips: ["Show home bakers", "Shopping Help"],
            intent: "visual-search-cake",
            context,
            sentiment
        };
    }

    // 7K. Bulk quote acceptance mocks
    if (lower.includes("accept indore electronics") || lower.includes("accept mp bakery") || lower.includes("accept priyas bakes")) {
        const dealer = lower.includes("electronics") ? "Indore Electronics Hub" : lower.includes("mp") ? "Madhya Pradesh Bakery" : "Priya's Bakes";
        const total = lower.includes("electronics") ? "₹12,500" : lower.includes("mp") ? "₹11,500" : "₹11,000";
        return {
            reply: `🎉 **Bulk Deal Accepted!**\n\nYour order for 50 hampers with **${dealer}** has been confirmed for a total of **${total}**.\n\nMerchant is packaging items for dispatch. You can track the progress of this bulk order in your dashboard.`,
            chips: ["Track Orders", "Shopping Help"],
            intent: "none",
            context,
            sentiment
        };
    }

    // 7L. Go back support
    if (lower === "go back") {
        return {
            reply: "What would you like to plan or search today?",
            chips: ["Party for 30", "Weekly Groceries", "Gym Diet Plan", "Moving checklist", "Baby arrival", "Bulk quotes"],
            intent: "none",
            context,
            sentiment
        };
    }

    // 7. COMPANION MODE: LAPTOP SHOPPING WIZARD (Intelligent Laptop Dialogue)
    if (lower.includes("help me buy a laptop") || lower === "buy a laptop" || lower.includes("laptop assistant")) {
        context.lastTopic = "laptop-companion";
        context.laptopStep = "budget";
        return {
            reply: "💻 **Aisle Laptop Advisor Activated**\n\nLet's find the perfect laptop together. What is your budget limit?",
            chips: ["₹30k", "₹50k", "₹70k+"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (context.lastTopic === "laptop-companion" && context.laptopStep === "budget") {
        context.laptopBudget = lower;
        context.laptopStep = "usage";
        return {
            reply: `Got it. A budget of ${message}.\n\nNext, what is your primary usage requirement?`,
            chips: ["Study", "Gaming", "Office", "Editing"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (context.lastTopic === "laptop-companion" && context.laptopStep === "usage") {
        const usage = lower;
        const budget = context.laptopBudget;
        context.lastTopic = null; // Reset
        context.laptopStep = null;
        context.laptopUsage = null;
        context.laptopBudget = null;

        // Recommendations based on combination
        let recs = "";
        if (usage.includes("gaming")) {
            recs = "• ASUS TUF Gaming Series (Est. ₹58,000)\n• Lenovo IdeaPad Gaming 3 (Est. ₹52,000)\n• HP Victus (Est. ₹62,000)";
        } else if (usage.includes("edit") || usage.includes("design")) {
            recs = "• MacBook Air M1/M2 (Est. ₹79,000)\n• ASUS Zenbook 14 OLED (Est. ₹75,000)\n• HP Pavilion Plus (Est. ₹68,000)";
        } else if (usage.includes("study") || usage.includes("office")) {
            if (budget.includes("30")) {
                recs = "• Lenovo IdeaPad Slim 3 Chromebook (Est. ₹24,000)\n• Acer One 14 (Est. ₹28,000)\n• HP Chromebook 14 (Est. ₹25,000)";
            } else {
                recs = "• Dell Inspiron 15 (Est. ₹42,000)\n• HP 15s (Est. ₹45,000)\n• Lenovo ThinkPad E14 (Est. ₹49,000)";
            }
        } else {
            recs = "• HP 15s (Core i3) - ₹38,000\n• Lenovo IdeaPad Slim 3 - ₹35,000";
        }

        return {
            reply: `Based on your budget and usage request, here are top recommended choices nearby:\n\n${recs}\n\nWould you like to search local electronics dealers selling these?`,
            chips: ["Show nearby stores", "Shopping Help"],
            intent: "product-search",
            query: "laptop",
            context,
            sentiment
        };
    }

    // 8. SHOPPING ADVISOR: PHONE SHOPPING ADVISOR
    if (lower.includes("phone under 15000") || lower.includes("phone under 15k") || lower.includes("mobile under 15000")) {
        context.lastTopic = "phone-advisor";
        context.phoneStep = "priority";
        context.phoneBudget = "15000";
        return {
            reply: "📱 **Aisle Phone Advisor Activated**\n\nFor a budget under ₹15,000, I recommend these popular line-ups:\n• Redmi Note Series\n• Realme C/Number Series\n• Samsung Galaxy M Series\n\nTo pick the best option, what is most important to you?",
            chips: ["Camera", "Battery", "Gaming", "Daily Use"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (context.lastTopic === "phone-advisor" && context.phoneStep === "priority") {
        const priorityChoice = lower;
        context.lastTopic = null;
        context.phoneStep = null;
        context.phoneBudget = null;

        let rec = "";
        if (priorityChoice.includes("camera")) {
            rec = "Realme 12x 5G (50MP Triple Camera) or Redmi Note 13 (Super-clear photography).";
        } else if (priorityChoice.includes("battery")) {
            rec = "Samsung Galaxy M15 5G (6000mAh Massive Battery).";
        } else if (priorityChoice.includes("gaming")) {
            rec = "Redmi 13C 5G (MediaTek Dimensity 6100+ Processor for performance).";
        } else {
            rec = "Realme C65 (Good balanced battery and clean interface).";
        }

        return {
            reply: `Got it! Since **${message}** is your key priority, the best choice for you is the **${rec}**.\n\nWould you like to find nearby retailers carrying this device?`,
            chips: ["Show nearby stores", "Shopping Help"],
            intent: "product-search",
            query: rec.split(' (')[0],
            context,
            sentiment
        };
    }

    // 9. CONVERSATIONAL RECOMMENDATIONS: BAKERY
    if (lower.includes("find bakery") || lower === "bakery" || lower.includes("bakery near me")) {
        context.lastTopic = "bakery-discovery";
        return {
            reply: "Are you looking for:\n\n🎂 Birthday Cake\n🧁 Cupcakes\n🍞 Fresh Bread\n🥐 Pastries",
            chips: ["🎂 Birthday Cake", "🧁 Cupcakes", "🍞 Fresh Bread", "🥐 Pastries", "Find bakery store"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (context.lastTopic === "bakery-discovery" && /(cake|cupcake|bread|pastry|pastries)/.test(lower)) {
        context.lastTopic = null; // reset
        return {
            reply: `Finding nearby bakeries specializing in "${message}"...`,
            chips: ["Shopping Help"],
            intent: "shop-search",
            query: "bakery",
            context,
            sentiment
        };
    }

    // 10. MULTI-TURN MEMORY FOR SELLER NON-RESPONSE
    if (lower.includes("seller is not responding") || lower.includes("seller not responding") || lower === "seller issue") {
        if (context.sellerName) {
            return {
                reply: `I understand you're referring to **${context.sellerName}**.\n\nSince they are not responding, would you like me to raise a callback ticket so a support manager can contact them?`,
                chips: ["Raise callback ticket", "Cancel my order"],
                intent: "none",
                context,
                sentiment
            };
        } else {
            context.lastTopic = "seller-no-reply-flow";
            return {
                reply: "Could you tell me which seller or store name you are trying to reach?",
                chips: ["XYZ seller ", "Demo Shop"],
                intent: "none",
                context,
                sentiment
            };
        }
    }

    if (context.lastTopic === "seller-no-reply-flow") {
        context.sellerName = message.trim();
        context.lastTopic = null; // reset
        return {
            reply: `Got it, you are referring to **${context.sellerName}**.\n\nWould you like me to check their operating hours, or escalate this directly to our support team?`,
            chips: ["Check operating hours", "Raise callback ticket", "Cancel Order"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (lower === "still nothing" || lower === "still no reply" || lower === "no reply yet") {
        if (context.sellerName) {
            return {
                reply: `You're referring to **${context.sellerName}**.\n\nWould you like me to escalate this now and create a support ticket?`,
                chips: ["Raise callback ticket", "Cancel my order"],
                intent: "none",
                context,
                sentiment
            };
        }
    }

    // 11. GENERAL SUPPORT INTENT MAPPINGS WITH EMOTIONS
    if (lower.includes("resolve order issue") || lower.includes("report issue") || lower === "report issue" || lower.includes("resolve issue")) {
        return {
            reply: `${emotionGreeting}⚡ **Operations Assistant Activated**\n\nWhat type of issue would you like to resolve?`,
            chips: ["Delayed Order", "Refund Check", "Wrong Product", "Missing Product", "Seller Issue", "Payment Issue"],
            intent: 'none',
            context,
            sentiment
        };
    }

    // Vague inputs clarification (Intelligent Clarification)
    if (lower === "order issue" || lower === "nothing works" || lower === "broken") {
        return {
            reply: `${emotionGreeting}Let's figure it out together. Are you facing:\n\n• App problems\n• Order issues\n• Booking issues\n• Seller issues`,
            chips: ["App problems", "Order issues", "Booking issues", "Seller issues"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (lower === "app problems" || lower.includes("app bug")) {
        return {
            reply: "Let's diagnose. Could you tell me:\n\n• What issue are you facing?\n• Which screen does it occur on?\n• Is it slow or crashing?",
            chips: ["App slow", "Page crashes", "Login problem"],
            intent: "none",
            context,
            sentiment
        };
    }

    if (lower === "order issues") {
        return {
            intent: "track-orders",
            reply: "Let's check your orders. Fetching list of recent transactions..."
        };
    }

    if (lower === "booking issues") {
        return {
            intent: "booking-details",
            reply: "Let's look at your service bookings. Fetching details..."
        };
    }

    if (lower === "seller issues") {
        return {
            reply: "Could you tell me:\n\n• Which seller?\n• What issue are you facing?",
            chips: ["Seller not responding", "Wrong item delivered"],
            intent: "none",
            context,
            sentiment
        };
    }

    // Fallbacks
    return {
        reply: null, // Let controller route logic fallback to standard Phase 4 responses
        intent: "none",
        context,
        sentiment
    };
};

const handlePersonalityChat = (message, context = {}, userName = 'Shashwat') => {
    const lower = message.toLowerCase().trim();
    const res = _handlePersonalityChat(message, context, userName);
    
    // Classify agent based on keywords and resolved intent
    let agent = "Support Agent";
    const intent = res.intent || "none";
    if (intent === 'product-search' || intent === 'shop-search' || intent === 'home-business' || intent === 'recommendation' || intent === 'alternatives' || res.context?.lastTopic === 'laptop-companion' || res.context?.lastTopic === 'phone-advisor' || res.context?.lastTopic === 'bakery-discovery') {
        agent = "Shopping Agent";
    } else if (intent === 'track-orders' || intent === 'order-tracking' || intent === 'cancel-order-intent' || intent === 'refund-eligibility' || intent === 'return-replacement-flow' || lower.includes("order") || lower.includes("refund") || lower.includes("cancel") || lower.includes("delivery") || lower.includes("delayed")) {
        agent = "Order Agent";
    } else if (intent === 'booking-details' || lower.includes("booking") || lower.includes("appointment")) {
        agent = "Booking Agent";
    } else if (lower.includes("seller") || lower.includes("not responding") || lower.includes("not replying") || res.context?.lastTopic === 'seller-no-reply-flow') {
        agent = "Seller Agent";
    }
    
    res.agent = agent;
    return res;
};

module.exports = {
    analyzeSentiment,
    handlePersonalityChat
};
