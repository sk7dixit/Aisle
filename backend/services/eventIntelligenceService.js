const User = require('../models/User');
const Notification = require('../models/Notification');
const EventIntelligence = require('../models/EventIntelligence');
const HistoricalEventImpact = require('../models/HistoricalEventImpact');
const EventProductMap = require('../models/EventProductMap');

/**
 * Seed initial event intelligence data if empty
 */
const seedEventIntelligenceData = async () => {
    try {
        const eventCount = await EventIntelligence.countDocuments();
        if (eventCount === 0) {
            console.log('[EventService] Seeding initial Event Intelligence data...');

            // 1. Seed EventProductMap
            const productMaps = [
                { eventName: "Raksha Bandhan", products: ["rakhi", "sweets", "gift boxes", "chocolates"] },
                { eventName: "Diwali", products: ["sweets", "decorations", "gift packs", "candles", "diyas", "snacks", "lights"] },
                { eventName: "Holi", products: ["colors", "water guns", "sweets", "snacks"] },
                { eventName: "Eid ul-Fitr", products: ["sweets", "perfumes", "apparel", "gifts"] },
                { eventName: "Christmas", products: ["cakes", "decorations", "chocolates", "greeting cards", "gifts"] },
                { eventName: "IPL Cricket Tournament", products: ["soft drinks", "snacks", "popcorn", "team jerseys"] },
                { eventName: "Cricket World Cup", products: ["snacks", "cold drinks", "party platters", "jerseys"] },
                { eventName: "Monsoon Season", products: ["umbrella", "raincoat", "waterproof bags", "tea", "pakora ingredients"] },
                { eventName: "Summer Heatwave", products: ["cold drinks", "ice cream", "coolers", "water bottles"] },
                { eventName: "College Fest", products: ["fast food", "cold drinks", "printing services", "stationery"] },
                { eventName: "Navratri", products: ["traditional clothing", "traditional accessories", "sweets", "garba sticks"] },
                { eventName: "Lohri", products: ["sweets", "popcorn", "peanuts", "jaggery"] }
            ];

            await EventProductMap.insertMany(productMaps);

            // 2. Seed HistoricalEventImpact
            const historicalImpacts = [
                // Raksha Bandhan
                { eventName: "Raksha Bandhan", product: "rakhi", demandIncrease: 210, year: 2025 },
                { eventName: "Raksha Bandhan", product: "sweets", demandIncrease: 180, year: 2025 },
                { eventName: "Raksha Bandhan", product: "gift boxes", demandIncrease: 150, year: 2025 },
                { eventName: "Raksha Bandhan", product: "chocolates", demandIncrease: 120, year: 2025 },
                
                // Diwali
                { eventName: "Diwali", product: "sweets", demandIncrease: 280, year: 2025 },
                { eventName: "Diwali", product: "decorations", demandIncrease: 340, year: 2025 },
                { eventName: "Diwali", product: "gift packs", demandIncrease: 410, year: 2025 },
                { eventName: "Diwali", product: "lights", demandIncrease: 310, year: 2025 },
                { eventName: "Diwali", product: "diyas", demandIncrease: 300, year: 2025 },

                // Monsoon
                { eventName: "Monsoon Season", product: "umbrella", demandIncrease: 120, year: 2025 },
                { eventName: "Monsoon Season", product: "raincoat", demandIncrease: 100, year: 2025 },
                { eventName: "Monsoon Season", product: "tea", demandIncrease: 150, year: 2025 },
                { eventName: "Monsoon Season", product: "pakora ingredients", demandIncrease: 130, year: 2025 },

                // Summer Heatwave
                { eventName: "Summer Heatwave", product: "cold drinks", demandIncrease: 220, year: 2025 },
                { eventName: "Summer Heatwave", product: "ice cream", demandIncrease: 180, year: 2025 },
                { eventName: "Summer Heatwave", product: "water bottles", demandIncrease: 110, year: 2025 },

                // College Fest
                { eventName: "College Fest", product: "fast food", demandIncrease: 180, year: 2025 },
                { eventName: "College Fest", product: "cold drinks", demandIncrease: 150, year: 2025 },
                { eventName: "College Fest", product: "printing services", demandIncrease: 120, year: 2025 },
                { eventName: "College Fest", product: "stationery", demandIncrease: 100, year: 2025 },

                // Navratri
                { eventName: "Navratri", product: "traditional clothing", demandIncrease: 300, year: 2025 },
                { eventName: "Navratri", product: "traditional accessories", demandIncrease: 250, year: 2025 },
                { eventName: "Navratri", product: "garba sticks", demandIncrease: 280, year: 2025 },

                // Lohri
                { eventName: "Lohri", product: "sweets", demandIncrease: 200, year: 2025 },
                { eventName: "Lohri", product: "popcorn", demandIncrease: 150, year: 2025 },
                { eventName: "Lohri", product: "peanuts", demandIncrease: 120, year: 2025 }
            ];

            await HistoricalEventImpact.insertMany(historicalImpacts);

            // 3. Seed EventIntelligence
            // Dates set to the future to look "upcoming"
            const today = new Date();
            const getFutureDate = (days) => {
                const d = new Date(today);
                d.setDate(today.getDate() + days);
                return d;
            };

            const events = [
                {
                    eventName: "Raksha Bandhan",
                    eventType: "festival",
                    startDate: getFutureDate(15),
                    endDate: getFutureDate(15),
                    expectedDemandImpact: 92,
                    impactScore: 92,
                    confidenceScore: 88
                },
                {
                    eventName: "Diwali",
                    eventType: "festival",
                    startDate: getFutureDate(60),
                    endDate: getFutureDate(62),
                    expectedDemandImpact: 96,
                    impactScore: 96,
                    confidenceScore: 95
                },
                {
                    eventName: "Holi",
                    eventType: "festival",
                    startDate: getFutureDate(120),
                    endDate: getFutureDate(121),
                    expectedDemandImpact: 85,
                    impactScore: 85,
                    confidenceScore: 90
                },
                {
                    eventName: "Eid ul-Fitr",
                    eventType: "festival",
                    startDate: getFutureDate(90),
                    endDate: getFutureDate(91),
                    expectedDemandImpact: 88,
                    impactScore: 88,
                    confidenceScore: 90
                },
                {
                    eventName: "Christmas",
                    eventType: "festival",
                    startDate: getFutureDate(180),
                    endDate: getFutureDate(180),
                    expectedDemandImpact: 78,
                    impactScore: 78,
                    confidenceScore: 85
                },
                {
                    eventName: "IPL Cricket Tournament",
                    eventType: "sports",
                    startDate: getFutureDate(30),
                    endDate: getFutureDate(90),
                    expectedDemandImpact: 72,
                    impactScore: 72,
                    confidenceScore: 80
                },
                {
                    eventName: "Monsoon Season",
                    eventType: "weather",
                    startDate: getFutureDate(5),
                    endDate: getFutureDate(95),
                    expectedDemandImpact: 75,
                    impactScore: 75,
                    confidenceScore: 85
                },
                {
                    eventName: "Summer Heatwave",
                    eventType: "weather",
                    startDate: getFutureDate(2),
                    endDate: getFutureDate(30),
                    expectedDemandImpact: 82,
                    impactScore: 82,
                    confidenceScore: 88
                },
                {
                    eventName: "College Fest",
                    eventType: "local",
                    city: "Indore",
                    state: "Madhya Pradesh",
                    startDate: getFutureDate(8),
                    endDate: getFutureDate(10),
                    expectedDemandImpact: 65,
                    impactScore: 65,
                    confidenceScore: 75
                },
                {
                    eventName: "Navratri",
                    eventType: "festival",
                    state: "Gujarat",
                    startDate: getFutureDate(45),
                    endDate: getFutureDate(53),
                    expectedDemandImpact: 90,
                    impactScore: 90,
                    confidenceScore: 92
                },
                {
                    eventName: "Lohri",
                    eventType: "festival",
                    state: "Punjab",
                    startDate: getFutureDate(210),
                    endDate: getFutureDate(210),
                    expectedDemandImpact: 85,
                    impactScore: 85,
                    confidenceScore: 90
                }
            ];

            await EventIntelligence.insertMany(events);
            console.log('[EventService] Database seeding completed successfully.');
        }
    } catch (err) {
        console.error('[EventService] Seeding error:', err.message);
    }
};

/**
 * Get Event Intelligence Dashboard Data for a Seller
 */
const getEventIntelligenceDashboard = async (sellerId) => {
    // 1. Fetch Seller details to customize hyperlocal & regional events
    const seller = await User.findById(sellerId);
    if (!seller) {
        throw new Error('Seller not found');
    }

    const sellerCity = (seller.shopDetails?.city || seller.shopDetails?.shopLocation?.city || 'Indore').toLowerCase().trim();
    const sellerState = (seller.shopDetails?.state || 'Madhya Pradesh').toLowerCase().trim();
    const sellerCategory = seller.shopDetails?.shopCategory || seller.shopDetails?.category || 'Grocery';

    // 2. Fetch all upcoming/active events
    const allEvents = await EventIntelligence.find().sort({ startDate: 1 });

    // 3. Filter and enrich events based on seller regional/hyperlocal context
    const enrichedEvents = [];
    for (const event of allEvents) {
        let isRelevant = false;

        // National/Weather/Sports/Holidays are globally relevant
        if (!event.city && !event.state) {
            isRelevant = true;
        }
        // Regional relevance match
        if (event.state && event.state.toLowerCase().trim() === sellerState) {
            isRelevant = true;
        }
        // Hyperlocal relevance match
        if (event.city && event.city.toLowerCase().trim() === sellerCity) {
            isRelevant = true;
        }

        if (isRelevant) {
            // Find products mapped to this event
            const mapping = await EventProductMap.findOne({ eventName: event.eventName });
            const products = mapping ? mapping.products : [];

            // Calculate business opportunity value (dummy calculation based on seller ratings/expectedDemandImpact)
            const baseFactor = seller.shopDetails?.rating ? parseFloat(seller.shopDetails.rating) * 1000 : 4000;
            const opportunityValue = Math.round(baseFactor * (event.expectedDemandImpact / 20) * 10) / 10;

            const daysLeft = Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24));

            enrichedEvents.push({
                _id: event._id,
                eventName: event.eventName,
                eventType: event.eventType,
                city: event.city,
                state: event.state,
                startDate: event.startDate,
                endDate: event.endDate,
                expectedDemandImpact: event.expectedDemandImpact,
                impactScore: event.impactScore,
                confidenceScore: event.confidenceScore,
                products,
                relevance: event.city ? 'Hyperlocal Event' : event.state ? 'Regional Event' : 'National Event',
                opportunityValue: opportunityValue > 0 ? opportunityValue : 12000,
                daysBefore: daysLeft >= 0 ? daysLeft : 0
            });
        }
    }

    // 4. Generate Opportunity Alerts for events with impactScore > 80
    const opportunityAlerts = enrichedEvents
        .filter(e => e.impactScore > 80)
        .map(e => {
            const productString = e.products.slice(0, 3).join(', ');
            let message = `${e.eventName} is approaching in ${e.daysBefore} days! High demand expected for: ${productString}. Stock early to capture revenue.`;
            if (e.eventName === 'Monsoon Season') {
                message = `Monsoon Season forecast! Continuous showers expected. Expected demand for umbrellas, raincoats, and hot beverages is up by +120%.`;
            }
            return {
                eventName: e.eventName,
                message,
                impactScore: e.impactScore,
                opportunityLevel: e.impactScore >= 90 ? 'very_high' : 'high'
            };
        });

    // 5. Seasonal Stock Planner Suggestions (Step 11 & 13)
    const seasonalPlanner = [];
    const weatherEvents = enrichedEvents.filter(e => e.eventType === 'weather' || e.eventName === 'Monsoon Season' || e.eventName === 'Summer Heatwave');
    
    for (const we of weatherEvents) {
        const recs = [];
        const mapping = await EventProductMap.findOne({ eventName: we.eventName });
        const products = mapping ? mapping.products : [];

        for (const p of products) {
            // Find historical increase
            const historical = await HistoricalEventImpact.findOne({ eventName: we.eventName, product: p });
            const increase = historical ? historical.demandIncrease : 120;
            
            recs.push({
                product: p,
                stockQuantity: Math.round(50 + (increase / 2)),
                action: `Rain forecast is active. Hot beverages and rainproof gear will see search momentum.`
            });
        }

        seasonalPlanner.push({
            season: we.eventName.includes('Monsoon') ? 'Monsoon' : 'Summer',
            eventName: we.eventName,
            recommendations: recs
        });
    }

    // Default Summer/Monsoon planner suggestions if empty
    if (seasonalPlanner.length === 0) {
        seasonalPlanner.push({
            season: 'Summer',
            eventName: 'Summer Heatwave',
            recommendations: [
                { product: "cold drinks", stockQuantity: 200, action: "Heatwave approaching. Cold beverages trend +220%." },
                { product: "ice cream", stockQuantity: 150, action: "Summer surge. Fresh frozen items in very high demand." },
                { product: "water bottles", stockQuantity: 100, action: "Increase stock count by 110% before temperature peaks." }
            ]
        });
    }

    // 6. Event-Based Revenue Forecasting (Step 12 & 13)
    // Find closest high-impact event (e.g. Diwali or Raksha Bandhan)
    const highImpactEvents = enrichedEvents.filter(e => e.impactScore >= 90);
    const primaryEvent = highImpactEvents[0] || enrichedEvents[0] || { eventName: 'Diwali', expectedDemandImpact: 96, opportunityValue: 45000 };

    const revenueForecast = {
        eventName: primaryEvent.eventName,
        expectedRevenueIncreasePercent: primaryEvent.expectedDemandImpact ? primaryEvent.expectedDemandImpact * 2 : 180,
        projectedRevenueLift: primaryEvent.opportunityValue || 45000
    };

    return {
        upcomingEvents: enrichedEvents,
        opportunityAlerts,
        seasonalPlanner,
        revenueForecast
    };
};

/**
 * Worker Job 1: Event Calendar Sync
 */
const syncEventCalendarJob = async () => {
    console.log('[Worker-EventCalendar] Running syncEventCalendarJob...');
    // In a real environment, we'd pull from external Indian Festival Calendar API or similar database.
    // For local system, we make sure dates are correctly rolled forward if they pass.
    const allEvents = await EventIntelligence.find();
    const today = new Date();
    
    for (const event of allEvents) {
        if (new Date(event.endDate) < today) {
            // Roll forward to next year
            const oldStart = new Date(event.startDate);
            const oldEnd = new Date(event.endDate);
            
            oldStart.setFullYear(today.getFullYear() + (oldStart.getMonth() < today.getMonth() ? 1 : 0));
            oldEnd.setFullYear(today.getFullYear() + (oldEnd.getMonth() < today.getMonth() ? 1 : 0));
            
            event.startDate = oldStart;
            event.endDate = oldEnd;
            event.generatedAt = today;
            await event.save();
            console.log(`[Worker-EventCalendar] Rolled forward event date: ${event.eventName} to ${oldStart.toDateString()}`);
        }
    }
};

/**
 * Worker Job 2: Weather Intelligence Sync
 */
const syncWeatherForecastJob = async () => {
    console.log('[Worker-Weather] Running syncWeatherForecastJob...');
    // Simulates an API call to weather provider
    // Check if rain or extreme temperatures are on the horizon
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    
    let weatherEventName = "";
    let impact = 50;
    
    if (currentMonth >= 5 && currentMonth <= 8) { // Jun - Sep (Monsoon)
        weatherEventName = "Monsoon Season";
        impact = 75;
    } else if (currentMonth >= 3 && currentMonth <= 5) { // Apr - Jun (Summer Heatwave)
        weatherEventName = "Summer Heatwave";
        impact = 82;
    }
    
    if (weatherEventName) {
        const weatherEvent = await EventIntelligence.findOne({ eventName: weatherEventName });
        if (weatherEvent) {
            weatherEvent.startDate = today;
            weatherEvent.endDate = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // Active for next 7 days
            weatherEvent.expectedDemandImpact = impact;
            weatherEvent.impactScore = impact;
            weatherEvent.confidenceScore = 85;
            weatherEvent.generatedAt = today;
            await weatherEvent.save();
            console.log(`[Worker-Weather] Updated active weather event: ${weatherEventName} (Impact: ${impact})`);
        }
    }
};

/**
 * Worker Job 3: Event Demand Forecast Calculator
 */
const syncEventForecastJob = async () => {
    console.log('[Worker-EventForecast] Running syncEventForecastJob...');
    // Calculates and scales expectedDemandImpacts and confidence scores based on search momentum.
    // E.g., if searches for "colors" spike 10 days before Holi, raise Holi impactScore.
    const allEvents = await EventIntelligence.find();
    for (const event of allEvents) {
        const daysLeft = Math.ceil((new Date(event.startDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Step 7: Predict 1 Day, 7 Days, 30 Days before event
        if (daysLeft > 0 && daysLeft <= 30) {
            // Increase impact slightly as event gets closer and searches pick up
            const momentumModifier = daysLeft <= 7 ? 5 : 2;
            event.impactScore = Math.min(100, event.expectedDemandImpact + momentumModifier);
            event.confidenceScore = Math.min(100, event.confidenceScore + 1);
            await event.save();
        }
    }
};

/**
 * Worker Job 4: Opportunity Alerts Dispatcher
 */
const syncOpportunityAlertsJob = async () => {
    console.log('[Worker-OpportunityAlert] Running syncOpportunityAlertsJob...');
    // Pulls all high-impact events (>80) and dispatches system notifications to relevant sellers.
    const highImpactEvents = await EventIntelligence.find({ impactScore: { $gt: 80 } });
    
    // Find all sellers
    const sellers = await User.find({ role: 'seller', accountStatus: 'active' });
    
    for (const event of highImpactEvents) {
        // Find products for this event
        const mapping = await EventProductMap.findOne({ eventName: event.eventName });
        const products = mapping ? mapping.products : [];

        for (const seller of sellers) {
            const sellerCategory = (seller.shopDetails?.shopCategory || seller.shopDetails?.category || 'Grocery').toLowerCase();
            const sellerCity = (seller.shopDetails?.city || seller.shopDetails?.shopLocation?.city || 'Indore').toLowerCase();
            
            // Check if hyperlocal/regional matches
            let isLocalityMatch = true;
            if (event.city && event.city.toLowerCase() !== sellerCity) isLocalityMatch = false;
            
            // If matches local constraints, notify seller
            if (isLocalityMatch) {
                const title = `⚠️ Event Opportunity Alert: ${event.eventName}`;
                const message = `${event.eventName} expected demand is up! Suggested products to stock: ${products.slice(0, 3).join(', ')}.`;

                // Avoid duplicate alerts for the same event today
                const today = new Date();
                today.setHours(0,0,0,0);
                
                const existingNotif = await Notification.findOne({
                    user: seller._id,
                    title,
                    createdAt: { $gte: today }
                });

                if (!existingNotif) {
                    await Notification.create({
                        user: seller._id,
                        type: 'SELLER',
                        title,
                        message,
                        priority: 'HIGH',
                        recipientRole: 'seller'
                    });
                    console.log(`[Worker-OpportunityAlert] Dispatched notification to seller ${seller.email} for event ${event.eventName}`);
                }
            }
        }
    }
};

module.exports = {
    seedEventIntelligenceData,
    getEventIntelligenceDashboard,
    syncEventCalendarJob,
    syncWeatherForecastJob,
    calculateEventForecastsJob: syncEventForecastJob,
    checkOpportunityAlertsJob: syncOpportunityAlertsJob
};
