const supportKnowledgeBase = [
    {
        id: 'product_visibility',
        title: 'Product not visible to customers',
        keywords: ['product', 'visible', 'showing', 'display', 'customer', 'missing', 'unlisted', 'catalog', 'find', 'active', 'stock'],
        category: 'PRODUCT',
        defaultPriority: 'medium',
        solution: 'Please check if the product is marked as "In Stock" and "Active". Go to Products → Edit → Availability.'
    },
    {
        id: 'product_addition',
        title: 'Unable to add a product',
        keywords: ['add', 'create', 'new', 'unable', 'cannot', 'fail', 'upload', 'save', 'product', 'fields', 'mandatory', 'required'],
        category: 'PRODUCT',
        defaultPriority: 'low',
        solution: 'Ensure all required fields are filled. Product name, category, and price are mandatory.'
    },
    {
        id: 'image_upload',
        title: 'Image not uploading',
        keywords: ['image', 'photo', 'upload', 'fail', 'jpeg', 'png', 'format', 'size', 'mb', 'uploading', 'error'],
        category: 'IMAGE',
        defaultPriority: 'low',
        solution: 'Use JPG or PNG images under 5MB. Clear images with good lighting work best.'
    },
    {
        id: 'image_quality',
        title: 'Image looks blurred',
        keywords: ['image', 'blur', 'camera', 'screenshot', 'quality', 'compress', 'blurry', 'pixels', 'resolution'],
        category: 'IMAGE',
        defaultPriority: 'low',
        solution: 'Avoid screenshots or compressed images. Use a clear original photo from your camera.'
    },
    {
        id: 'sales_tracking',
        title: 'Sales showing ₹0',
        keywords: ['sales', 'revenue', 'rupee', 'zero', 'history', 'update', 'income', 'earning', 'track', 'earnings', '0'],
        category: 'ORDERS',
        defaultPriority: 'medium',
        solution: 'Sales update after orders are completed. Please check completed orders in History.'
    },
    {
        id: 'offer_visibility',
        title: 'Offer not visible',
        keywords: ['offer', 'discount', 'coupon', 'promo', 'active', 'date', 'visible', 'valid', 'range', 'showing'],
        category: 'OFFERS',
        defaultPriority: 'low',
        solution: 'Check if the offer is active and within the valid date range in the "Offers" tab.'
    },
    {
        id: 'shop_status',
        title: 'Shop showing closed',
        keywords: ['shop', 'closed', 'open', 'hours', 'working', 'operating', 'mode', 'status', 'auto', 'dashboard'],
        category: 'SETTINGS',
        defaultPriority: 'medium',
        solution: 'Your shop may be in Auto mode or outside working hours. Check Shop Controls in the Dashboard header.'
    },
    {
        id: 'login_issues',
        title: 'Cannot login',
        keywords: ['login', 'signin', 'password', 'email', 'forgot', '2fa', 'credential', 'account', 'sign', 'reset'],
        category: 'LOGIN',
        defaultPriority: 'high',
        solution: 'Verify your email/number and password. Use "Forgot Password" on the login screen if needed.'
    },
    {
        id: 'payment_pending',
        title: 'Payment not received',
        keywords: ['payment', 'payout', 'money', 'bank', 'weekly', 'cycle', 'received', 'pending', 'transfer', 'credit'],
        category: 'PAYMENTS',
        defaultPriority: 'high',
        solution: 'Payouts follow the weekly cycle. Please verify your bank details in Settings → Payments.'
    },
    {
        id: 'payout_issue',
        title: 'Cannot receive payout',
        keywords: ['payout', 'transfer', 'bank', 'verify', 'details', 'failed', 'verification', 'account', 'card', 'wire'],
        category: 'PAYMENTS',
        defaultPriority: 'high',
        solution: 'Weekly payouts are suspended if bank verification is incomplete. Please re-upload bank details in Settings → Payments.'
    },
    {
        id: 'fraud_payment',
        title: 'Fraud payment',
        keywords: ['fraud', 'scam', 'fake', 'hacked', 'suspicious', 'security', 'alert', 'stolen', 'unauthorized', 'cheat'],
        category: 'SECURITY',
        defaultPriority: 'critical',
        solution: 'If you suspect a fraudulent transaction or card use, please freeze the order immediately in your Dashboard and report it here for prompt investigation.'
    },
    {
        id: 'security_issue',
        title: 'Account security issue',
        keywords: ['hacked', 'compromised', 'unauthorized', 'security', 'password', 'compromise', 'login', 'leak', 'access'],
        category: 'SECURITY',
        defaultPriority: 'critical',
        solution: 'Immediately change your password in Settings → Security. If you cannot access your account, request an emergency lock.'
    }
];

module.exports = supportKnowledgeBase;
