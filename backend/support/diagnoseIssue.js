const buildSellerContext = require('./context/contextBuilder');

/**
 * Investigates specific intent topics to determine a root cause diagnosis.
 */
const diagnoseIssue = async (sellerId, intent, queryText = '', targetId = null, prebuiltContext = null) => {
    const context = prebuiltContext || await buildSellerContext(sellerId);
    const result = {
        intent,
        diagnosed: false,
        type: 'GENERAL',
        title: 'Support Diagnosis',
        status: 'INFO',
        message: 'No automatic root cause could be identified. A support representative will review this request.',
        details: {},
        suggestions: []
    };

    const cleanText = (queryText || '').toLowerCase();

    // 1. PRODUCT DIAGNOSIS (PRODUCT_VISIBILITY / PRODUCT_ADDITION)
    if (intent === 'PRODUCT_VISIBILITY' || cleanText.includes('product') || cleanText.includes('item') || cleanText.includes('visible') || cleanText.includes('show')) {
        result.type = 'PRODUCT';
        result.title = 'Product Visibility Analysis';
        
        let targetProduct = null;
        const productsList = context.products?.list || [];

        // Try to match targetId if provided, else look up by text name matching
        if (targetId) {
            targetProduct = productsList.find(p => p.id.toString() === targetId.toString());
        } else {
            // Find if any product name is present in queryText
            targetProduct = productsList.find(p => cleanText.includes(p.name.toLowerCase()));
        }

        if (targetProduct) {
            const hasStock = targetProduct.quantity > 0 && targetProduct.stockStatus === 'IN_STOCK' && targetProduct.availability === 'AVAILABLE';
            const isActive = targetProduct.active;
            const approved = targetProduct.approvalStatus === 'Active';
            const hasImages = targetProduct.imagesCount > 0;

            result.diagnosed = true;
            result.details = {
                productName: targetProduct.name,
                stock: targetProduct.quantity,
                stockStatus: targetProduct.stockStatus,
                active: isActive,
                approved,
                hasImages,
                source: targetProduct.source,
                productId: targetProduct.id
            };

            if (!isActive) {
                result.status = 'ERROR';
                result.message = context.shop?.shopType === 'SERVICES'
                    ? `Service "${targetProduct.name}" is marked inactive or unavailable. Enable it in your catalog to show to buyers.`
                    : `Product "${targetProduct.name}" is marked inactive or unavailable. Enable it in your inventory to show to buyers.`;
                result.suggestions = ['ENABLE_PRODUCT', 'EDIT_PRODUCT'];
            } else if (!hasStock) {
                result.status = 'ERROR';
                result.message = context.shop?.shopType === 'SERVICES'
                    ? `Service "${targetProduct.name}" slot capacity is fully booked (0 available slots). Customers cannot see services with zero available slots.`
                    : `Product "${targetProduct.name}" is active but Out of Stock (0 available). Customers cannot see products with zero stock.`;
                result.suggestions = ['RESTOCK_INVENTORY'];
            } else if (!approved) {
                result.status = 'WARNING';
                result.message = `Product "${targetProduct.name}" has administrative hold/review status: "${targetProduct.approvalStatus}". It is hidden until verified.`;
                result.suggestions = ['CONTACT_ADMIN'];
            } else if (!hasImages && targetProduct.source === 'LOCAL') {
                result.status = 'WARNING';
                result.message = `Product "${targetProduct.name}" has no images uploaded. Listing might be hidden or receive low discovery.`;
                result.suggestions = ['ADD_PRODUCT_IMAGE'];
            } else {
                // If product is healthy, check shop offline status
                const isShopClosed = context.shop?.derivedStatus === 'OFFLINE';
                if (isShopClosed) {
                    result.status = 'WARNING';
                    result.message = `Product "${targetProduct.name}" is healthy, but your shop is currently OFFLINE (Operating Hours: ${context.shop.openingTime} - ${context.shop.closingTime}). Products are hidden when shop is offline.`;
                    result.suggestions = ['TOGGLE_SHOP_HOURS', 'ENABLE_MANUAL_OPEN'];
                } else {
                    result.status = 'SUCCESS';
                    result.message = `Product "${targetProduct.name}" is healthy (Active, In Stock, Approved). If it still does not show, try clearing your customer app cache.`;
                    result.suggestions = [];
                }
            }
        } else {
            // General Product inventory checks
            const total = context.products?.totalProducts || 0;
            const oos = context.products?.outOfStockCount || 0;
            const isService = context.shop?.shopType === 'SERVICES';

            if (total === 0) {
                result.diagnosed = true;
                result.status = 'ERROR';
                result.message = isService 
                    ? 'You have not listed any service packages yet. Customers cannot book your services until packages are listed.'
                    : 'You have not listed any products yet. Customers cannot find your shop until products are listed.';
                result.suggestions = isService ? ['ADD_SERVICE_PACKAGE'] : ['ADD_PRODUCT_MANUAL'];
            } else if (oos === total) {
                result.diagnosed = true;
                result.status = 'ERROR';
                result.message = isService
                    ? `All of your services (${total}) have fully booked slots. Increase slot capacity to make them available to customers.`
                    : `All of your products (${total}) are currently Out of Stock. Restock items to make them visible to customers.`;
                result.suggestions = isService ? ['INCREASE_SLOTS'] : ['RESTOCK_ALL'];
            } else if (oos > 0) {
                result.diagnosed = true;
                result.status = 'WARNING';
                result.message = isService
                    ? `You have ${oos} services with fully booked slots.`
                    : `You have ${oos} products out of stock. Out of stock products are automatically hidden from buyers.`;
                result.suggestions = isService ? ['INCREASE_SLOTS'] : ['RESTOCK_INVENTORY'];
            }
        }
    }
    // 2. OFFERS DIAGNOSIS (OFFER_VISIBILITY)
    else if (intent === 'OFFER_VISIBILITY' || cleanText.includes('offer') || cleanText.includes('discount') || cleanText.includes('coupon')) {
        result.type = 'OFFER';
        result.title = 'Offer Visibility Analysis';
        
        const offersList = context.offers?.list || [];
        const expiredOffer = offersList.find(o => o.isExpired);
        const disabledOffer = offersList.find(o => o.status === 'Disabled');

        if (offersList.length === 0) {
            result.diagnosed = true;
            result.status = 'WARNING';
            result.message = 'No active offers found. Create a discount offer to attract more buyers.';
            result.suggestions = ['CREATE_OFFER'];
        } else if (expiredOffer) {
            result.diagnosed = true;
            result.status = 'ERROR';
            result.message = `Your offer "${expiredOffer.title}" expired on ${new Date(expiredOffer.validUntil).toLocaleDateString()}. Extend validity to make it visible.`;
            result.suggestions = ['EXTEND_OFFER', 'MANAGE_OFFERS'];
            result.details = { offerId: expiredOffer.id, title: expiredOffer.title };
        } else if (disabledOffer) {
            result.diagnosed = true;
            result.status = 'WARNING';
            result.message = `Your offer "${disabledOffer.title}" is currently disabled. Enable it in the Offers tab.`;
            result.suggestions = ['ENABLE_OFFER', 'MANAGE_OFFERS'];
            result.details = { offerId: disabledOffer.id, title: disabledOffer.title };
        } else {
            result.diagnosed = true;
            result.status = 'SUCCESS';
            result.message = 'Your offers appear to be active and valid. If buyers cannot see them, verify that the products match the discount parameters.';
            result.suggestions = ['MANAGE_OFFERS'];
        }
    }
    // 3. SHOP CLOSED DIAGNOSIS (SHOP_STATUS)
    else if (intent === 'SHOP_STATUS' || cleanText.includes('closed') || cleanText.includes('open') || cleanText.includes('dukan') || cleanText.includes('hours')) {
        result.type = 'SHOP';
        result.title = 'Shop Status Analysis';

        const shop = context.shop || {};
        
        // Parse time logic
        const now = new Date();
        const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

        // Convert "09:00" format to minutes
        const parseTimeToMinutes = (timeStr) => {
            if (!timeStr) return 0;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
        };

        const openMin = parseTimeToMinutes(shop.openingTime);
        const closeMin = parseTimeToMinutes(shop.closingTime);
        
        const isOutsideOperatingHours = currentTimeMinutes < openMin || currentTimeMinutes >= closeMin;

        result.diagnosed = true;
        result.details = {
            isOpen: shop.isOpen,
            derivedStatus: shop.derivedStatus,
            manualOverride: shop.manualOverride,
            isManuallyOpen: shop.isManuallyOpen,
            openingTime: shop.openingTime,
            closingTime: shop.closingTime,
            currentTime: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        if (shop.manualOverride && !shop.isManuallyOpen) {
            result.status = 'ERROR';
            result.message = 'Your shop is marked closed due to manual override closing action. Enable manual open mode or return controls to system auto schedule.';
            result.suggestions = ['ENABLE_MANUAL_OPEN', 'DISABLE_MANUAL_OVERRIDE'];
        } else if (!shop.manualOverride && isOutsideOperatingHours) {
            result.status = 'WARNING';
            result.message = `Your shop is currently outside operating hours (${shop.openingTime} - ${shop.closingTime}). The system automatically marked it offline.`;
            result.suggestions = ['TOGGLE_SHOP_HOURS', 'ENABLE_MANUAL_OPEN'];
        } else if (context.account?.verificationStatus !== 'approved') {
            result.status = 'ERROR';
            result.message = `Your shop registration status is "${context.account.verificationStatus}". Shops cannot operate online until approved by admin.`;
            result.suggestions = ['CONTACT_SUPPORT'];
        } else {
            result.status = 'SUCCESS';
            result.message = 'Your shop status is currently ONLINE. Products should be discoverable locally.';
            result.suggestions = [];
        }
    }
    // 4. PAYMENTS DIAGNOSIS (PAYMENT_PENDING / PAYOUT_ISSUE)
    else if (intent === 'PAYMENT_PENDING' || intent === 'PAYOUT_ISSUE' || cleanText.includes('payment') || cleanText.includes('payout') || cleanText.includes('money') || cleanText.includes('paisa')) {
        result.type = 'PAYMENT';
        result.title = 'Payment & Settlement Analysis';

        const payment = context.payments || {};

        result.diagnosed = true;
        result.details = {
            paymentSetupCompleted: payment.paymentSetupCompleted,
            bankStatus: payment.bankStatus,
            pendingAmount: payment.pendingAmount,
            lastPayout: payment.lastPayout
        };

        if (!payment.paymentSetupCompleted) {
            result.status = 'ERROR';
            result.message = `Your bank account verification is PENDING. Your payout of ₹${payment.pendingAmount.toLocaleString()} cannot be processed until payment setup is complete.`;
            result.suggestions = ['COMPLETE_PAYMENT_SETUP'];
        } else if (payment.pendingAmount === 0) {
            result.status = 'SUCCESS';
            result.message = `All settled amounts have been cleared. Last payout released on ${payment.lastPayout}. Currently no pending balance.`;
            result.suggestions = [];
        } else {
            result.status = 'WARNING';
            result.message = `You have a pending settlement of ₹${payment.pendingAmount.toLocaleString()}. Payouts follow a weekly cycle and will release automatically.`;
            result.suggestions = [];
        }
    }
    // 5. ORDERS/SALES DIAGNOSIS (SALES_TRACKING)
    else if (intent === 'SALES_TRACKING' || cleanText.includes('sale') || cleanText.includes('revenue') || cleanText.includes('zero') || cleanText.includes('income')) {
        result.type = 'ORDER';
        result.title = 'Sales and Revenue Analysis';

        const orders = context.orders || {};

        result.diagnosed = true;
        result.details = {
            totalOrders: orders.totalOrders,
            completedOrders: orders.completedOrders,
            pendingOrders: orders.pendingOrders
        };

        if (orders.totalOrders > 0 && orders.completedOrders === 0) {
            result.status = 'WARNING';
            result.message = `Your sales remain ₹0 because none of your ${orders.totalOrders} active orders have been marked FULFILLED. Complete delivered orders to release revenue.`;
            result.suggestions = ['MANAGE_ORDERS'];
        } else if (orders.totalOrders === 0) {
            result.status = 'WARNING';
            result.message = 'You have not received any orders yet. Ensure your shop is online and active with product stock to start receiving orders.';
            result.suggestions = ['CHECK_SHOP_STATUS'];
        } else {
            result.status = 'SUCCESS';
            result.message = `Your revenue is tracking successfully. Completed sales total: ₹${orders.completedSales.toLocaleString()}.`;
            result.suggestions = [];
        }
    }
    // 6. ACCOUNT DIAGNOSIS (LOGIN_ISSUES / SECURITY_ISSUE)
    else if (intent === 'LOGIN_ISSUES' || intent === 'SECURITY_ISSUE' || cleanText.includes('login') || cleanText.includes('password')) {
        result.type = 'ACCOUNT';
        result.title = 'Account Security Analysis';

        const account = context.account || {};

        result.diagnosed = true;
        result.details = {
            status: account.accountStatus,
            verified: account.verificationStatus,
            phoneVerified: account.phoneVerified
        };

        if (account.accountStatus === 'blocked') {
            result.status = 'ERROR';
            result.message = 'Your seller account has been administratively BLOCKED. Urgent contact with our compliance unit is required.';
            result.suggestions = ['CONTACT_ADMIN'];
        } else if (!account.phoneVerified) {
            result.status = 'ERROR';
            result.message = 'Account login security alert: Phone number verification is incomplete. Confirm your number to prevent lockouts.';
            result.suggestions = ['VERIFY_PHONE'];
        } else {
            result.status = 'SUCCESS';
            result.message = 'Your account status is active and verified. To reset security credentials, edit details under Account settings.';
            result.suggestions = [];
        }
    }
    // 7. GENERIC DISCOVERY DIAGNOSIS (SHOP DISCOVERY HOLDS)
    else if (cleanText.includes('find my shop') || cleanText.includes('discover') || cleanText.includes('customer search')) {
        result.type = 'DISCOVERY';
        result.title = 'Shop Discoverability Analysis';

        const totalProducts = context.products?.totalProducts || 0;
        const hasLocation = context.shop?.hasLocation || false;

        result.diagnosed = true;
        result.details = {
            totalProducts,
            hasLocation,
            shopOnline: context.shop?.derivedStatus === 'ONLINE'
        };

        if (!hasLocation) {
            result.status = 'ERROR';
            result.message = 'Your shop location is not set on the map. Swiggy-style local customer discovery requires GPS coordinates.';
            result.suggestions = ['SET_SHOP_LOCATION'];
        } else if (totalProducts === 0) {
            result.status = 'ERROR';
            result.message = 'Your shop location and status are healthy. However, you have 0 products listed. Customers will not see your shop until items are added.';
            result.suggestions = ['ADD_PRODUCT_MANUAL'];
        } else if (context.shop?.derivedStatus !== 'ONLINE') {
            result.status = 'WARNING';
            result.message = 'Your shop is currently OFFLINE. Customers only see online shops on their discovery page.';
            result.suggestions = ['ENABLE_MANUAL_OPEN', 'TOGGLE_SHOP_HOURS'];
        } else {
            result.status = 'SUCCESS';
            result.message = 'Your shop discoverability metrics are healthy. Customers in your local coordinates should see you listed.';
            result.suggestions = [];
        }
    }

    return result;
};

module.exports = diagnoseIssue;
