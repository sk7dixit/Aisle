const WeeklyReport = require('../models/WeeklyReport');
const RiskAlert = require('../models/RiskAlert');
const { calculateSellerHealth } = require('../support/healthScoreEngine');
const { detectRisks } = require('../support/riskDetectionEngine');
const { analyzeSalesPerformance } = require('../support/salesAnalyzer');
const { analyzeLocalDemand } = require('../support/demandAnalyzer');
const { getMarketTrends } = require('../support/trendEngine');
const { generateWeeklyReport } = require('../support/weeklyReportEngine');
const { getPrioritizedRecommendations } = require('../support/recommendationEngine');
const { getCoachAdvice } = require('../support/businessCoach');
const buildSellerContext = require('../support/context/contextBuilder');

/**
 * Compiles and returns all Seller Success Center dashboard data.
 */
const getSuccessCenterDashboard = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // Compile context
        const context = await buildSellerContext(sellerId);

        // 1. Calculate & Get Live Health Score
        const health = await calculateSellerHealth(sellerId, context);

        // 2. Scan Risks
        const risks = await detectRisks(sellerId, context);

        // 3. Scan Sales WoW metrics
        const sales = await analyzeSalesPerformance(sellerId, context);

        // 4. Run Search Demand matching
        const demand = await analyzeLocalDemand(sellerId, context);

        // 5. Competitor & Seasonal trends
        const trends = await getMarketTrends(sellerId, context);

        // 6. Consolidate priority campaigns
        const tasks = await getPrioritizedRecommendations(sellerId, context);

        // 7. Get or generate weekly report
        let weeklyReport = await WeeklyReport.findOne({ sellerId }).sort({ generatedAt: -1 });
        if (!weeklyReport) {
            weeklyReport = await generateWeeklyReport(sellerId, context);
        }

        res.status(200).json({
            healthScore: health.score,
            healthFactors: health.factors,
            risks,
            salesMetrics: sales,
            demandOpportunities: demand,
            trends,
            priorityTasks: tasks,
            weeklyReport: weeklyReport.report,
            generatedAt: weeklyReport.generatedAt
        });
    } catch (error) {
        console.error('Success Center Dashboard Error:', error);
        res.status(500).json({ message: 'Server Error loading Success Center', error: error.message });
    }
};

/**
 * Processes growth queries for the AI Business Coach tab.
 */
const askBusinessCoach = async (req, res) => {
    try {
        const { message } = req.body;
        const sellerId = req.user._id;

        if (!message) {
            return res.status(400).json({ message: 'Query message text is required' });
        }

        const advice = await getCoachAdvice(sellerId, message);
        res.status(200).json(advice);
    } catch (error) {
        console.error('Business Coach Error:', error);
        res.status(500).json({ message: 'Server Error running AI Coach', error: error.message });
    }
};

/**
 * Returns list of historically generated reports.
 */
const getWeeklyReportsList = async (req, res) => {
    try {
        const sellerId = req.user._id;
        const reports = await WeeklyReport.find({ sellerId }).sort({ generatedAt: -1 });
        res.status(200).json(reports);
    } catch (error) {
        console.error('Weekly Reports Error:', error);
        res.status(500).json({ message: 'Server Error fetching reports', error: error.message });
    }
};

module.exports = {
    getSuccessCenterDashboard,
    askBusinessCoach,
    getWeeklyReportsList
};
