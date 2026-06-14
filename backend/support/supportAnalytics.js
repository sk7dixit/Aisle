const SupportAnalytics = require('../models/SupportAnalytics');

/**
 * Logs that a support ticket was created.
 * @param {string} issueId 
 * @param {string} title 
 * @param {string} category 
 */
const logTicketCreated = async (issueId, title, category) => {
    try {
        await SupportAnalytics.findOneAndUpdate(
            { issueId },
            { 
                $setOnInsert: { title, category },
                $inc: { ticketsCreatedCount: 1 } 
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error logging support analytics (ticket):', error);
    }
};

/**
 * Logs user feedback for a support article.
 * @param {string} issueId 
 * @param {string} title 
 * @param {string} category 
 * @param {boolean} isHelpful 
 */
const logFeedback = async (issueId, title, category, isHelpful) => {
    try {
        const update = isHelpful 
            ? { $inc: { helpfulCount: 1 } }
            : { $inc: { notHelpfulCount: 1 } };
        await SupportAnalytics.findOneAndUpdate(
            { issueId },
            { 
                $setOnInsert: { title, category },
                ...update
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error logging support analytics (feedback):', error);
    }
};

/**
 * Logs a support search trigger.
 * @param {string} issueId 
 * @param {string} title 
 * @param {string} category 
 */
const logSearch = async (issueId, title, category) => {
    try {
        await SupportAnalytics.findOneAndUpdate(
            { issueId },
            { 
                $setOnInsert: { title, category },
                $inc: { searchCount: 1 } 
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error logging support analytics (search):', error);
    }
};

/**
 * Logs that a query was resolved without creating a ticket (when marked helpful or closed).
 * @param {string} issueId 
 * @param {string} title 
 * @param {string} category 
 */
const logResolution = async (issueId, title, category) => {
    try {
        await SupportAnalytics.findOneAndUpdate(
            { issueId },
            { 
                $setOnInsert: { title, category },
                $inc: { resolvedWithoutTicketCount: 1 } 
            },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error('Error logging support analytics (resolution):', error);
    }
};

module.exports = {
    logTicketCreated,
    logFeedback,
    logSearch,
    logResolution
};
