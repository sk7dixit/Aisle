const Product = require('../../models/Product');
const SellerProduct = require('../../models/SellerProduct');

/**
 * Compiles catalog and inventory details, counting active/inactive and out of stock products.
 */
const getProductContext = async (sellerId) => {
    try {
        // Run count queries in parallel using fast indices
        const [
            totalLoose,
            totalLinked,
            looseOutOfStock,
            linkedOutOfStock,
            looseActive,
            linkedActive
        ] = await Promise.all([
            Product.countDocuments({ seller: sellerId }),
            SellerProduct.countDocuments({ seller: sellerId }),
            
            Product.countDocuments({
                seller: sellerId,
                $or: [
                    { quantity: { $lte: 0 } },
                    { stockStatus: 'OUT_OF_STOCK' },
                    { availability: 'UNAVAILABLE' }
                ]
            }),
            SellerProduct.countDocuments({
                seller: sellerId,
                $or: [
                    { quantity: { $lte: 0 } },
                    { stockStatus: 'OUT_OF_STOCK' },
                    { availability: 'UNAVAILABLE' }
                ]
            }),

            Product.countDocuments({
                seller: sellerId,
                isAvailable: { $ne: false },
                adminStatus: 'Active',
                availability: 'AVAILABLE'
            }),
            SellerProduct.countDocuments({
                seller: sellerId,
                availability: 'AVAILABLE',
                is_active: { $ne: false },
                stockStatus: 'IN_STOCK'
            })
        ]);

        const totalProducts = totalLoose + totalLinked;
        const outOfStockCount = looseOutOfStock + linkedOutOfStock;
        const activeCount = looseActive + linkedActive;
        const inactiveCount = totalProducts - activeCount;

        // Fetch a limited sample of products for context lists (e.g. 10 low-stock/flagged, and 10 active)
        const [looseSample, linkedSample] = await Promise.all([
            Product.find({ seller: sellerId })
                .sort({ quantity: 1, updatedAt: -1 }) // get low stock and recently updated first
                .limit(10)
                .select('_id name quantity sellingPrice stockStatus availability imageUrl images needsReview adminStatus restockType initialStock createdAt updatedAt')
                .lean(),
            SellerProduct.find({ seller: sellerId })
                .sort({ quantity: 1, updatedAt: -1 })
                .limit(10)
                .select('_id variant quantity sellingPrice stockStatus availability needsReview restockType initialStock createdAt updatedAt')
                .populate({
                    path: 'variant',
                    select: 'brand_id pack_size',
                    populate: { 
                        path: 'brand_id', 
                        select: 'brand_name product_base_id',
                        populate: { 
                            path: 'product_base_id',
                            select: 'base_name category'
                        } 
                    }
                })
                .lean()
        ]);

        const list = [];

        looseSample.forEach(p => {
            const isActive = p.isAvailable !== false && p.adminStatus === 'Active' && p.availability === 'AVAILABLE';

            list.push({
                id: p._id,
                name: p.name,
                quantity: p.quantity,
                price: p.sellingPrice,
                stockStatus: p.stockStatus,
                availability: p.availability,
                active: isActive,
                imageUrl: p.imageUrl,
                imagesCount: p.images?.length || 0,
                approvalStatus: p.adminStatus || 'Active',
                source: 'LOCAL'
            });
        });

        linkedSample.forEach(sp => {
            const isActive = sp.availability === 'AVAILABLE' && sp.is_active !== false && sp.stockStatus === 'IN_STOCK';

            const variantName = sp.variant?.brand_id?.product_base_id?.base_name || 'Variant';
            const brandName = sp.variant?.brand_id?.brand_name || '';
            const fullName = `${brandName} ${variantName} ${sp.variant?.pack_size || ''}`.trim();

            list.push({
                id: sp._id,
                name: fullName,
                quantity: sp.quantity,
                price: sp.sellingPrice,
                stockStatus: sp.stockStatus,
                availability: sp.availability,
                active: isActive,
                imageUrl: null,
                imagesCount: 1,
                approvalStatus: 'Active',
                source: 'MASTER'
            });
        });

        return {
            totalProducts,
            activeCount,
            inactiveCount,
            outOfStockCount,
            list
        };
    } catch (error) {
        console.error('Error in productContext:', error);
        return {
            totalProducts: 0,
            activeCount: 0,
            inactiveCount: 0,
            outOfStockCount: 0,
            list: []
        };
    }
};

module.exports = getProductContext;
