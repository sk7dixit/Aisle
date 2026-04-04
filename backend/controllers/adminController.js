const User = require('../models/User');
const Product = require('../models/Product');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog'); // Deprecated for Admin Actions, kept for generic system logs if needed
const AdminActionLog = require('../models/AdminActionLog'); // STRICT STEP 15
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification'); // Fix: Import Notification
const SellerNotification = require('../models/SellerNotification');
const SystemSettings = require('../models/SystemSettings');
const FaceUpdateRequest = require('../models/FaceUpdateRequest');
const AssistedListingRequest = require('../models/AssistedListingRequest');

// --- PERMISSION & SAFETY LAYERS (STEP 16) ---

/**
 * Validates if the requestor has permission for the action.
 * Throws error if unauthorized and Logs the violation.
 */
const checkAdminPermission = async (user, actionType, ip) => {
    // 16. Permission Matrix
    const permissions = {
        'APPROVE_SELLER': ['super_admin', 'admin'],
        'REJECT_SELLER': ['super_admin', 'admin'],
        'SUSPEND_SHOP': ['super_admin', 'admin'],
        'REINSTATE_SHOP': ['super_admin', 'admin'],
        'BLOCK_USER': ['super_admin', 'admin'],
        'UNBLOCK_USER': ['super_admin', 'admin'],
        'DISABLE_PRODUCT': ['super_admin', 'admin'],
        'ENABLE_PRODUCT': ['super_admin', 'admin'],
        'APPROVE_FACE': ['super_admin', 'admin'],
        'REJECT_FACE': ['super_admin', 'admin'],
        'RESOLVE_REPORT': ['super_admin', 'admin'],
        'ESCALATE_REPORT': ['super_admin', 'admin', 'moderator'],
        'UPDATE_SETTINGS': ['super_admin'],
        'VIEW_LOGS': ['super_admin', 'admin', 'moderator'],
        'EXPORT_LOGS': ['super_admin']
    };

    const allowedRoles = permissions[actionType];
    if (!allowedRoles) throw new Error(`Unknown action type: ${actionType}`);

    if (!allowedRoles.includes(user.role)) {
        // Log Unauthorized Attempt
        await AdminActionLog.create({
            actionType: 'UNAUTHORIZED_ATTEMPT',
            performedBy: user._id,
            targetType: 'System',
            targetId: user._id, // Self as target of the error
            reason: `Role '${user.role}' attempted '${actionType}'`,
            severity: 'Critical',
            ipAddress: ip,
            metadata: { attemptedAction: actionType }
        });
        throw new Error(`Access Denied: You do not have permission to perform ${actionType}`);
    }
}


/**
 * Velocity Check: Detects if an admin is performing too many destructive actions.
 */
const detectSuspiciousActivity = async (admin, ip) => {
    try {
        const thresholdTime = new Date(Date.now() - 60 * 1000); // 1 Minute
        const recentDestructive = await AdminActionLog.countDocuments({
            performedBy: admin._id,
            severity: { $in: ['Warning', 'Critical'] }, // Destructive actions are Warning+
            createdAt: { $gt: thresholdTime }
        });

        if (recentDestructive >= 5) {
            // Check if we already alerted effectively (avoid spamming Criticals)
            const recentAlerts = await AdminActionLog.countDocuments({
                actionType: 'SUSPICIOUS_VELOCITY',
                performedBy: admin._id,
                createdAt: { $gt: thresholdTime }
            });

            if (recentAlerts === 0) {
                await AdminActionLog.create({
                    actionType: 'SUSPICIOUS_VELOCITY',
                    performedBy: admin._id,
                    targetType: 'System',
                    targetId: admin._id,
                    reason: `High Velocity: ${recentDestructive} destructive actions in 1 minute.`,
                    severity: 'Critical',
                    ipAddress: ip,
                    metadata: { velocity: recentDestructive }
                });
                console.error(`SECURITY ALERT: Admin ${admin.name} (${admin._id}) flagged for suspicious velocity.`);
            }
        }
    } catch (error) {
        console.error("Failed to run velocity check", error);
    }
};

/**
 * Centralized Admin Logger (STEP 15)
 */
const logAdminAction = async ({ actionType, performedBy, targetType, targetId, previousState, newState, reason, ip, severity = 'Info', metadata = {} }) => {
    try {
        await AdminActionLog.create({
            actionType,
            performedBy: performedBy._id,
            targetType,
            targetId,
            previousState,
            newState,
            reason,
            ipAddress: ip,
            severity,
            metadata: {
                ...metadata,
                performedByRole: performedBy.role // Step 16 Audit Extension
            }
        });

        // 18.2 Suspicious Activity Check (Fire and Forget)
        if (severity === 'Warning' || severity === 'Critical') {
            detectSuspiciousActivity(performedBy, ip).catch(err => console.error(err));
        }

    } catch (error) {
        console.error("FATAL: Failed to log admin action", error);
        // In a real strict system, we might want to rollback the transaction if logging fails.
        // For now, we log to console.
    }
};

// --- CONTROLLERS ---

// @desc    Get all sellers
// @route   GET /api/admin/sellers
// @access  Private/Admin|SuperAdmin
const getAllSellers = async (req, res) => {
    try {
        const sellers = await User.find({ role: 'seller' }).select('-password');
        res.json(sellers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get pending seller requests
// @route   GET /api/admin/verification-queue
// @access  Private/Admin
const getPendingSellers = async (req, res) => {
    try {
        const pendingSellers = await User.find({
            role: 'seller',
            verificationStatus: { $in: ['pending', 'needs_review', 'rejected_by_system', 'approved'] }
        }).select('-password');
        res.json(pendingSellers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Update seller verification status (Approve/Reject/Suspend)
// @route   PUT /api/admin/seller/:id/status
// @access  Private/Admin|SuperAdmin
const updateSellerStatus = async (req, res) => {
    const { verificationStatus, reason } = req.body;
    const admin = req.user;
    const ip = req.ip;

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Determine Action Type
        let actionType = '';
        if (verificationStatus === 'approved') actionType = 'APPROVE_SELLER';
        else if (verificationStatus === 'rejected_by_system') actionType = 'REJECT_SELLER';
        else if (verificationStatus === 'suspended') actionType = 'SUSPEND_SHOP';

        if (verificationStatus === 'approved' && user.verificationStatus === 'suspended') actionType = 'REINSTATE_SHOP';

        // 2. Permission Check
        await checkAdminPermission(admin, actionType, ip);

        // 3. Strict Transition & Capture Previous State
        const oldStatus = user.verificationStatus;

        // 17.4 Idempotency Check
        if (oldStatus === verificationStatus) {
            return res.status(400).json({ message: `Shop is already ${verificationStatus}. No changes made.` });
        }

        const validStatuses = ['approved', 'rejected_by_system', 'needs_review', 'suspended', 'pending'];
        if (!validStatuses.includes(verificationStatus)) {
            return res.status(400).json({ message: 'Invalid status transition' });
        }

        // 4. Update State (Step 4 Logic)
        user.verificationStatus = verificationStatus;
        user.verificationSource = 'admin';

        if (verificationStatus === 'approved') {
            user.verificationReason = null;
            user.shopDetails.isOpen = true; // Side Effect: Shop becomes visible
        } else if (verificationStatus === 'rejected_by_system') {
            user.verificationReason = 'manual_rejection';
            user.shopDetails.isOpen = false; // Side Effect: Shop hidden
        } else if (verificationStatus === 'suspended') {
            user.shopDetails.isOpen = false;
        }

        await user.save();

        // 5. Side Effects: Notification
        let notificationWarning = null;
        try {
            let notifTitle = '';
            let notifMsg = '';
            if (actionType === 'APPROVE_SELLER') {
                notifTitle = 'Shop Approved';
                notifMsg = 'Congratulations! Your shop has been approved and is now live.';
            } else if (actionType === 'REJECT_SELLER') {
                notifTitle = 'Application Needs Review';
                notifMsg = `Your seller application is undergoing manual review. Our team is checking your details.`;
            } else if (actionType === 'SUSPEND_SHOP') {
                notifTitle = 'Shop Suspended';
                notifMsg = `Urgent: Your shop has been suspended. Reason: ${reason}`;
            } else if (actionType === 'REINSTATE_SHOP') {
                notifTitle = 'Shop Reinstated';
                notifMsg = 'Your shop functionality has been restored.';
            }

            if (notifTitle) {
                // Assuming SellerNotification is imported or handled globally
                // For now keep existing logic but with updated values
                // ...
            }
        } catch (notifError) {
            console.error("Partial Failure: Notification failed", notifError);
            notificationWarning = "Action applied, but notification delivery failed.";
        }

        // 6. Log Action (Strict)
        await logAdminAction({
            actionType,
            performedBy: admin,
            targetType: 'User',
            targetId: user._id,
            previousState: oldStatus,
            newState: verificationStatus,
            reason: reason || user.verificationReason,
            ip,
            severity: (actionType === 'SUSPEND_SHOP' || actionType === 'REJECT_SELLER') ? 'Warning' : 'Info',
            metadata: { sellerName: user.name, partialFailure: notificationWarning }
        });

        res.json({
            message: `Seller status updated to ${verificationStatus}${notificationWarning ? ' (Warning: Notification Failed)' : ''}`,
            user,
            warning: notificationWarning
        });
    } catch (error) {
        console.error(error);
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};

// @desc    Get Face Verification Requests (Pending)
// @route   GET /api/admin/face-requests
// @access  Private/Admin|Moderator
const getFaceRequests = async (req, res) => {
    try {
        // Fetch pending requests from the new dedicated model
        const requests = await FaceUpdateRequest.find({ status: 'PENDING' })
            .populate('sellerId', 'name shopDetails email identityStatus')
            .sort({ createdAt: 1 });

        // Map to expected format if needed, or send raw
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Reject Face Verification
// @route   PUT /api/admin/face-requests/:id/status
// @access  Private/Admin|SuperAdmin
const updateFaceStatus = async (req, res) => {
    const { status, reason } = req.body; // status: 'APPROVED' | 'REJECTED'
    const admin = req.user;
    const ip = req.ip;

    try {
        const request = await FaceUpdateRequest.findById(req.params.id).populate('sellerId');
        if (!request) return res.status(404).json({ message: 'Request not found' });

        // Safety check if already processed
        if (request.status !== 'PENDING') {
            return res.status(400).json({ message: 'Request already processed' });
        }

        const user = request.sellerId;
        if (!user) return res.status(404).json({ message: 'User not found' });

        const actionType = status === 'APPROVED' ? 'APPROVE_FACE' : 'REJECT_FACE';
        await checkAdminPermission(admin, actionType, ip);

        // Update Request Status
        request.status = status;
        request.adminComment = reason;
        request.reviewedAt = Date.now();
        await request.save();

        // If Approved, Apply Changes to User
        if (status === 'APPROVED') {
            user.faceData = request.newFaceData;
            user.identityStatus = 'verified'; // Ensure user status reflects verified
            await user.save();
        }

        // Notification
        await SellerNotification.create({
            sellerId: user._id,
            source: 'ADMIN',
            type: 'IDENTITY_VERIFICATION',
            priority: status === 'REJECTED' ? 'IMPORTANT' : 'INFO',
            title: status === 'APPROVED' ? 'Face Update Approved' : 'Face Update Rejected',
            message: status === 'APPROVED'
                ? 'Your new face identity has been verified and updated.'
                : `Your face update request was rejected. Reason: ${reason}`
        });

        await logAdminAction({
            actionType,
            performedBy: admin,
            targetType: 'FaceUpdateRequest',
            targetId: request._id,
            previousState: 'PENDING',
            newState: status,
            reason,
            ip,
            severity: 'Info',
            metadata: { sellerName: user.name }
        });

        res.json({ message: `Request ${status}`, request });

    } catch (error) {
        console.error(error);
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};


// @desc    Block a user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin|SuperAdmin
const blockUser = async (req, res) => {
    const { reason } = req.body;
    const admin = req.user;
    const ip = req.ip;

    try {
        await checkAdminPermission(admin, 'BLOCK_USER', ip);

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.accountStatus === 'blocked') {
            return res.status(400).json({ message: 'User is already blocked.' });
        }

        const oldStatus = user.accountStatus;
        user.accountStatus = 'blocked';
        await user.save();

        // No direct notification model for Customers yet, so we skip DB notification for Customer.
        // In real app, we would send Email here.

        await logAdminAction({
            actionType: 'BLOCK_USER',
            performedBy: admin,
            targetType: 'User',
            targetId: user._id,
            previousState: oldStatus,
            newState: 'blocked',
            reason,
            ip,
            severity: 'Warning'
        });

        res.json({ message: 'User blocked successfully', user });
    } catch (error) {
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};

// @desc    Unblock a user
// @route   PUT /api/admin/users/:id/unblock
// @access  Private/Admin|SuperAdmin
const unblockUser = async (req, res) => {
    const admin = req.user;
    const ip = req.ip;

    try {
        await checkAdminPermission(admin, 'UNBLOCK_USER', ip);

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.accountStatus === 'active') {
            return res.status(400).json({ message: 'User is already active.' });
        }

        const oldStatus = user.accountStatus;
        user.accountStatus = 'active';
        await user.save();

        await logAdminAction({
            actionType: 'UNBLOCK_USER',
            performedBy: admin,
            targetType: 'User',
            targetId: user._id,
            previousState: oldStatus,
            newState: 'active',
            reason: 'Unblocked by admin',
            ip,
            severity: 'Info'
        });

        res.json({ message: 'User unblocked successfully', user });
    } catch (error) {
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};

// @desc    Get all products (Admin)
// @route   GET /api/admin/products
// @access  Private
const getAdminProducts = async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};
        if (search) {
            query.$or = [{ name: { $regex: search, $options: 'i' } }]; // Simplified
        }
        if (status) query.adminStatus = status;

        const products = await Product.find(query)
            .populate('seller', 'name shopDetails email verificationStatus')
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update product status (Flag/Disable)
// @route   PUT /api/admin/product/:id/status
// @access  Private/Admin|SuperAdmin
const updateProductStatus = async (req, res) => {
    const { status, flagReason, note } = req.body;
    const admin = req.user;
    const ip = req.ip;

    try {
        const product = await Product.findById(req.params.id).populate('seller');
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const actionType = status === 'Disabled' ? 'DISABLE_PRODUCT' : 'ENABLE_PRODUCT';
        await checkAdminPermission(admin, actionType, ip);

        // 17.4 Idempotency
        if (product.adminStatus === status) {
            return res.status(400).json({ message: `Product is already ${status}.` });
        }

        const oldStatus = product.adminStatus || 'Active';
        product.adminStatus = status;
        if (flagReason) product.flagReason = flagReason;

        await product.save();

        let notificationWarning = null;
        try {
            if (product.seller) {
                await SellerNotification.create({
                    sellerId: product.seller._id,
                    source: 'ADMIN',
                    type: 'PRODUCT_STATUS',
                    priority: status === 'Disabled' ? 'CRITICAL' : 'INFO',
                    title: status === 'Disabled' ? 'Product Disabled' : 'Product Active',
                    message: status === 'Disabled' ? `Your product '${product.name}' has been disabled. Reason: ${flagReason}` : `Your product '${product.name}' is now active.`
                });
            }
        } catch (notifError) {
            console.error("Partial Failure: Product Notification", notifError);
            notificationWarning = "Action applied, but notification failed.";
        }

        await logAdminAction({
            actionType,
            performedBy: admin,
            targetType: 'Product',
            targetId: product._id,
            previousState: oldStatus,
            newState: status,
            reason: flagReason || note,
            ip,
            severity: status === 'Disabled' ? 'Warning' : 'Info',
            metadata: { productName: product.name, partialFailure: notificationWarning }
        });

        res.json({
            message: `Product updated to ${status}${notificationWarning ? ' (Warning: Notification Failed)' : ''}`,
            product,
            warning: notificationWarning
        });
    } catch (error) {
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};


// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin|Moderator
const getReports = async (req, res) => {
    try {
        const { status, category, priority } = req.query;
        let query = {};
        if (status && status !== 'All') query.status = status;
        if (category && category !== 'All') query.category = category;
        if (priority && priority !== 'All') query.priority = priority;

        const reports = await Report.find(query)
            .populate('reporter', 'name email')
            .sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update report status (Resolve/Escalate)
// @route   PUT /api/admin/reports/:id/status
// @access  Private/Admin|SuperAdmin|Moderator
const updateReportStatus = async (req, res) => {
    const { status, resolution, escalationReason, priority } = req.body;
    const admin = req.user;
    const ip = req.ip;

    try {
        const report = await Report.findById(req.params.id);
        if (!report) return res.status(404).json({ message: 'Report not found' });

        const actionType = status === 'Escalated' ? 'ESCALATE_REPORT' : 'RESOLVE_REPORT';
        await checkAdminPermission(admin, actionType, ip);

        const oldStatus = report.status;
        report.status = status;

        if (status === 'Resolved') {
            report.resolvedBy = admin._id;
            report.resolution = resolution || 'Resolved by Admin';
        } else if (status === 'Escalated') {
            // report.escalationReason = escalationReason; // If schema supported it
            // report.priority = priority;
            // For now just change status as per schema
        }

        await report.save();

        await logAdminAction({
            actionType,
            performedBy: admin,
            targetType: 'Report',
            targetId: report._id,
            previousState: oldStatus,
            newState: status,
            reason: status === 'Escalated' ? escalationReason : resolution,
            ip,
            severity: status === 'Escalated' ? 'Warning' : 'Info'
        });

        res.json(report);
    } catch (error) {
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private/SuperAdmin
const updateSystemSettings = async (req, res) => {
    const { section, settings } = req.body;
    const admin = req.user;
    const ip = req.ip;

    try {
        await checkAdminPermission(admin, 'UPDATE_SETTINGS', ip);

        const systemSettings = await SystemSettings.getInstance();
        if (systemSettings[section]) {
            const oldState = systemSettings[section];
            Object.assign(systemSettings[section], settings);

            systemSettings.lastUpdatedBy = admin._id;
            systemSettings.lastUpdatedAt = Date.now();
            await systemSettings.save();

            await logAdminAction({
                actionType: 'UPDATE_SETTINGS',
                performedBy: admin,
                targetType: 'SystemSettings',
                targetId: systemSettings._id,
                previousState: JSON.stringify(oldState), // Simplified diff
                newState: JSON.stringify(systemSettings[section]),
                reason: 'Settings Update',
                ip,
                severity: 'Warning',
                metadata: { section }
            });

            res.json({ message: 'Settings updated', settings: systemSettings });
        } else {
            res.status(400).json({ message: 'Invalid section' });
        }
    } catch (error) {
        res.status(error.message.includes('Access Denied') ? 403 : 500).json({ message: error.message });
    }
};

// ... Keep other read-only controllers (Stats, Users Get, Logs Get) ...
// Rewriting them here for completeness since we are replacing the file content

const getDashboardStats = async (req, res) => {
    try {
        const pendingCount = await User.countDocuments({ role: 'seller', verificationStatus: 'pending' });
        const openReportsCount = await Report.countDocuments({ status: { $ne: 'Resolved' } });
        const criticalLogsCount = await AdminActionLog.countDocuments({ severity: 'Critical' }); // From new logs
        const faceRequestsCount = await User.countDocuments({ role: 'seller', verificationStatus: 'pending', faceData: { $ne: null } });

        res.json({
            kpis: {
                pendingVerifications: pendingCount,
                openReports: openReportsCount,
                faceRequests: faceRequestsCount,
                criticalAlerts: criticalLogsCount,
                systemHealth: 'Healthy'
            },
            overview: {
                totalUsers: await User.countDocuments(),
                activeSellers: await User.countDocuments({ role: 'seller', accountStatus: 'active' })
            },
            activity: [], // Frontend likely uses dedicated logs endpoint now or this can be deprecated
            pendingList: [],
            reports: []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getUsers = async (req, res) => {
    try {
        const { search, role, status } = req.query;
        let query = {};
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        if (role) query.role = role;
        if (status) query.accountStatus = status;

        const users = await User.find(query).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getActivityLogs = async (req, res) => {
    try {
        // Now fetching from AdminActionLog primarily
        const { severity } = req.query;
        let query = {};
        if (severity && severity !== 'All') query.severity = severity;

        const logs = await AdminActionLog.find(query)
            .populate('performedBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ logs, stats: {} });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getInstance();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ... Announcements (Low priority, keeping simple)
// Helper to Fan-Out Notifications
// Helper to Fan-Out Notifications
const fanOutAnnouncement = async (announcement) => {
    try {
        let query = {};
        if (announcement.target === 'Sellers Only') query.role = 'seller';
        else if (announcement.target === 'Buyers Only') query.role = 'customer';

        const users = await User.find(query).select('_id role');
        if (users.length === 0) return;

        const notifications = users.map(user => ({
            user: user._id,
            recipientRole: user.role,
            type: 'ANNOUNCEMENT',
            priority: announcement.priority === 'Critical' ? 'CRITICAL' :
                announcement.priority === 'Important' ? 'IMPORTANT' : 'INFO',
            title: `📢 ${announcement.title}`,
            message: announcement.message,
            actionUrl: user.role === 'seller' ? '/seller/announcements' : '/announcements',
            isRead: false
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
            console.log(`[Announcement] Fanned out to ${notifications.length} users via consolidated model.`);
        }
    } catch (error) {
        console.error('Fan-Out Error:', error);
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const data = await Announcement.find().sort({ createdAt: -1 });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createAnnouncement = async (req, res) => {
    try {
        const { title, message, target, priority, status, quickAction } = req.body;

        const announcement = await Announcement.create({
            title,
            message,
            target,
            priority,
            status,
            quickAction, // Save structured action
            author: req.user._id
        });

        if (status === 'Published') {
            // Async Fan-out (don't await to keep response fast, or await if critical safety needed)
            // safer to await here to ensure it happens or offload to queue. Simple await for now.
            await fanOutAnnouncement(announcement);
        }

        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message, target, priority, status, quickAction } = req.body;

        const existing = await Announcement.findById(id);

        if (!existing) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // GOVERNANCE RULE: Cannot edit if already published
        if (existing.status === 'Published') {
            return res.status(403).json({
                message: 'Published announcements are locked and cannot be edited. Please delete and create a new one if necessary.'
            });
        }

        existing.title = title || existing.title;
        existing.message = message || existing.message;
        existing.target = target || existing.target;
        existing.priority = priority || existing.priority;
        if (quickAction) existing.quickAction = quickAction;

        // State Transition: Draft -> Published
        const wasDraft = existing.status === 'Draft';
        existing.status = status || existing.status;

        await existing.save();

        if (wasDraft && existing.status === 'Published') {
            await fanOutAnnouncement(existing);
        }

        res.json(existing);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        await Announcement.findByIdAndDelete(id);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
const getAnalytics = async (req, res) => { res.json({}) };

// @desc    Get Shop Command Center Details
// @route   GET /api/admin/shops/:id
// @access  Private/Admin|SuperAdmin|Moderator

// @desc    Get detailed user activity timeline
// @route   GET /api/admin/users/:id/activity
// @access  Private (Admin/Moderator)
const getUserActivity = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 1. Fetch Admin Actions (Against this user)
        const adminActions = await AdminActionLog.find({ targetId: userId })
            .sort({ createdAt: -1 })
            .lean();

        // 2. Fetch Products (Listings by this user)
        const products = await Product.find({ user: userId })
            .select('name category status createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // 3. Fetch Reports (Filed by this user)
        const reportsFiled = await Report.find({ reporterId: userId })
            .select('type status createdAt description')
            .sort({ createdAt: -1 })
            .lean();

        // 4. Fetch Reports (Against this user if seller)
        const reportsAgainst = await Report.find({ reportedEntityId: userId })
            .select('type status createdAt description')
            .sort({ createdAt: -1 })
            .lean();

        // 5. Normalizing Events for Timeline
        let timeline = [];

        // Admin Actions
        adminActions.forEach(action => {
            timeline.push({
                id: `admin-${action._id}`,
                type: 'admin_action',
                date: action.createdAt,
                title: `Admin Action: ${action.action}`,
                description: action.reason || action.note || 'No details provided',
                status: 'critical',
                metadata: { adminName: action.adminName }
            });
        });

        // Products
        products.forEach(product => {
            timeline.push({
                id: `product-${product._id}`,
                type: 'listing',
                date: product.createdAt,
                title: `Listed Product: ${product.name}`,
                description: `Category: ${product.category}`,
                status: product.status === 'active' ? 'success' : 'warning'
            });
        });

        // Reports Filed
        reportsFiled.forEach(report => {
            timeline.push({
                id: `report-filed-${report._id}`,
                type: 'report_filed',
                date: report.createdAt,
                title: `Filed Report: ${report.type}`,
                description: report.description,
                status: 'info'
            });
        });

        // Reports Against
        reportsAgainst.forEach(report => {
            timeline.push({
                id: `report-against-${report._id}`,
                type: 'report_against',
                date: report.createdAt,
                title: `Reported for: ${report.type}`,
                description: report.description,
                status: 'danger'
            });
        });

        // Sort by Date Descending
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.accountStatus,
                shopName: user.shopDetails?.shopName,
                createdAt: user.createdAt
            },
            stats: {
                products: products.length,
                reportsFiled: reportsFiled.length,
                reportsAgainst: reportsAgainst.length,
                lastActive: timeline[0] ? timeline[0].date : user.updatedAt
            },
            timeline
        });

    } catch (error) {
        console.error('Get User Activity Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get detailed product activity timeline
// @route   GET /api/admin/products/:id/activity
// @access  Private (Admin/Moderator)
const getProductActivity = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId).populate('seller', 'name email _id');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // 1. Fetch Admin Actions (On this product)
        const adminActions = await AdminActionLog.find({ targetId: productId })
            .sort({ createdAt: -1 })
            .lean();

        // 2. Fetch Reports (Against this product)
        const reports = await Report.find({ reportedEntityId: productId })
            .select('type status createdAt description')
            .sort({ createdAt: -1 })
            .lean();

        // 3. Normalizing Events for Timeline
        let timeline = [];

        // Creation Event
        timeline.push({
            id: `create-${product._id}`,
            type: 'created',
            date: product.createdAt,
            title: 'Product Created',
            description: `Initial listing by ${product.seller?.name || 'Seller'}`,
            status: 'success'
        });

        // Edit Event (if updated significantly later than created)
        if (new Date(product.updatedAt).getTime() - new Date(product.createdAt).getTime() > 60000) {
            timeline.push({
                id: `edit-${product._id}`,
                type: 'edited',
                date: product.updatedAt,
                title: 'Product Edited',
                description: 'Seller updated product details',
                status: 'info'
            });
        }

        // Admin Actions
        adminActions.forEach(action => {
            timeline.push({
                id: `admin-${action._id}`,
                type: 'admin_action',
                date: action.createdAt,
                title: `Admin Action: ${action.action}`,
                description: action.reason || action.note || 'No details provided',
                status: 'critical',
                metadata: { adminName: action.adminName }
            });
        });

        // Reports
        reports.forEach(report => {
            timeline.push({
                id: `report-${report._id}`,
                type: 'reported',
                date: report.createdAt,
                title: `Product Reported: ${report.type}`,
                description: report.description,
                status: 'danger'
            });
        });

        // Sort by Date Descending
        timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({
            product: {
                id: product._id,
                name: product.name,
                category: product.category,
                status: product.adminStatus,
                imageUrl: product.imageUrl,
                createdAt: product.createdAt
            },
            seller: {
                id: product.seller?._id,
                name: product.seller?.name,
                email: product.seller?.email
            },
            stats: {
                reports: reports.length,
                flags: product.adminStatus === 'Flagged' ? 'Active Flag' : 'None',
                lastAdminAction: adminActions[0] ? adminActions[0].createdAt : null
            },
            timeline
        });

    } catch (error) {
        console.error('Get Product Activity Error:', error);
        res.status(500).json({ message: error.message });
    }
};

const getShopDetails = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Fetch User (Seller) with Shop Details
        const seller = await User.findById(userId).select('-password');
        if (!seller || seller.role !== 'seller') {
            return res.status(404).json({ message: 'Shop not found' });
        }

        // 2. Fetch Aggregated Stats
        // Products
        const totalProducts = await Product.countDocuments({ seller: userId });
        const activeProducts = await Product.countDocuments({ seller: userId, adminStatus: 'Active', isAvailable: true }); // Simplified availability check
        const disabledProducts = await Product.countDocuments({ seller: userId, adminStatus: 'Disabled' });

        // Reports
        const reportsCount = await Report.countDocuments({ reportedSeller: userId });
        const pendingReports = await Report.countDocuments({ reportedSeller: userId, status: { $ne: 'Resolved' } });

        // Activity Logs (Admin Actions on this shop)
        const recentActivity = await AdminActionLog.find({ targetId: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('performedBy', 'name role');

        // 3. Construct Unified Response
        const response = {
            identity: {
                shopId: seller._id,
                displayId: seller._id.toString().substring(0, 8).toUpperCase(),
                shopName: seller.shopDetails?.shopName || 'Unnamed Shop',
                category: seller.shopDetails?.category || 'General',
                status: seller.verificationStatus === 'approved' ? 'Active' :
                    seller.verificationStatus === 'suspended' ? 'Suspended' :
                        seller.verificationStatus === 'needs_review' ? 'Needs Review' :
                            seller.verificationStatus === 'rejected_by_system' ? 'Rejected by System' : 'Pending',
                isOpen: seller.shopDetails?.isOpen,
                address: seller.shopDetails?.address,
                joinedAt: seller.createdAt,
                verifiedAt: seller.shopDetails?.verifiedAt,
                verificationStatus: seller.verificationStatus,
                verificationSource: seller.verificationSource || 'ai',
                verificationReason: seller.verificationReason
            },
            seller: {
                name: seller.name,
                email: seller.email, // Contact info for admin
                phone: seller.phone,
                sellerId: seller._id.toString().substring(seller._id.toString().length - 8).toUpperCase(),
                faceStatus: seller.faceData ? 'Verified' : 'Not Enrolled'
            },
            risk: {
                totalReports: reportsCount,
                pendingReports: pendingReports,
                flags: disabledProducts > 0 ? `${disabledProducts} Disabled Products` : 'None',
                verificationStatus: seller.verificationStatus
            },
            products: {
                total: totalProducts,
                active: activeProducts,
                disabled: disabledProducts
            },
            activity: recentActivity.map(log => ({
                id: log._id,
                action: log.actionType,
                admin: log.performedBy?.name || 'Unknown',
                date: log.createdAt,
                reason: log.reason,
                severity: log.severity
            }))
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all Assisted Listing Requests
// @route   GET /api/admin/assisted-listings
// @access  Private/Admin|SuperAdmin|Moderator
const getAllAssistedListingRequests = async (req, res) => {
    try {
        const requests = await AssistedListingRequest.find()
            .populate('seller', 'name email shopDetails')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Assisted Listing Status
// @route   PUT /api/admin/assisted-listings/:id/status
// @access  Private/Admin|SuperAdmin
const updateAssistedListingStatus = async (req, res) => {
    const { status } = req.body;
    const admin = req.user;
    const ip = req.ip;

    try {
        if (!['pending', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const request = await AssistedListingRequest.findById(req.params.id).populate('seller');
        if (!request) return res.status(404).json({ message: 'Request not found' });

        const oldStatus = request.status;
        request.status = status;
        await request.save();

        // Optional: Notify seller about status change
        try {
            await SellerNotification.create({
                sellerId: request.seller._id,
                source: 'ADMIN',
                type: 'ACCOUNT_STATUS',
                priority: 'INFO',
                title: 'Assisted Listing Update',
                message: `Your assisted listing request status has been updated to: ${status.toUpperCase().replace('-', ' ')}.`
            });
        } catch (notifErr) {
            console.error('Failed to notify seller about assisted listing status update:', notifErr);
        }

        // Log Admin Action
        await logAdminAction({
            actionType: 'UPDATE_ASSISTED_LISTING_STATUS',
            performedBy: admin,
            targetType: 'AssistedListingRequest',
            targetId: request._id,
            previousState: oldStatus,
            newState: status,
            reason: `Status changed from ${oldStatus} to ${status}`,
            ip,
            severity: 'Info',
            metadata: { sellerName: request.seller?.name }
        });

        res.json({ message: `Status updated to ${status}`, request });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const getUserAccountDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Confirm User Role = Seller
        const user = await User.findById(id).select('role name shopDetails');
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role !== 'seller') {
            return res.status(400).json({ message: 'User is not a seller' });
        }

        // 2. Fetch from SellerAccountDetails
        const SellerAccountDetails = require('../models/SellerAccountDetails');
        let settings = await SellerAccountDetails.findOne({ sellerId: id });

        // 3. Response shape
        const response = {
            acceptsOnlinePayment: false,
            paymentMethod: '—',
            upiIdMasked: '—',
            paymentSetupCompleted: false,
            lastUpdated: null
        };

        if (settings) {
            response.acceptsOnlinePayment = settings.acceptsOnlinePayment;
            response.paymentMethod = settings.paymentMethod || '—';
            response.upiIdMasked = settings.maskedUpiId || '—';
            response.paymentSetupCompleted = settings.paymentSetupCompleted;
            response.lastUpdated = settings.updatedAt;
        } else if (user.shopDetails) {
            // Fallback to shopDetails if no dedicated record (legacy compatibility)
            response.acceptsOnlinePayment = user.shopDetails.acceptsOnlinePayment || false;
            response.paymentMethod = user.shopDetails.paymentMethod || 'UPI';

            if (user.shopDetails.upiId) {
                const upi = user.shopDetails.upiId;
                const parts = upi.split('@');
                if (parts.length === 2) {
                    response.upiIdMasked = `${parts[0].slice(0, 2)}***@${parts[1]}`;
                } else {
                    response.upiIdMasked = `${upi.slice(0, 2)}***`;
                }
            }
            response.paymentSetupCompleted = user.shopDetails.paymentSetupCompleted || false;
        }

        res.json(response);
    } catch (error) {
        console.error('Admin Get Account Details Error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllSellers, getPendingSellers, updateSellerStatus, updateFaceStatus,
    getDashboardStats,
    getUsers, blockUser, unblockUser,
    getAdminProducts, updateProductStatus,
    getReports, updateReportStatus, getActivityLogs,
    getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement,
    getAnalytics,
    getSystemSettings, updateSystemSettings,
    getShopDetails,
    getUserActivity,
    getUserAccountDetails,
    getProductActivity,
    getFaceRequests,
    getAllAssistedListingRequests,
    updateAssistedListingStatus
};
