/**
 * Get stock status based on quantity
 * @param {number} quantity - Stock quantity
 * @returns {string} - 'OUT' | 'LIMITED' | 'IN'
 */
export const getStockStatus = (quantity) => {
    if (quantity <= 0) return 'OUT';
    if (quantity <= 5) return 'LIMITED';
    return 'IN';
};

/**
 * Get stock badge configuration
 * @param {number} quantity - Stock quantity
 * @returns {object} - { text, color, bgColor, borderColor, disabled }
 */
export const getStockBadge = (quantity) => {
    const status = getStockStatus(quantity);

    switch (status) {
        case 'OUT':
            return {
                text: 'Out of Stock',
                color: 'text-red-700',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                dotColor: 'text-red-600',
                disabled: true
            };
        case 'LIMITED':
            return {
                text: 'Limited Stock',
                color: 'text-orange-700',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200',
                dotColor: 'text-orange-600',
                disabled: false
            };
        case 'IN':
        default:
            return {
                text: 'In Stock',
                color: 'text-green-700',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200',
                dotColor: 'text-green-600',
                disabled: false
            };
    }
};
