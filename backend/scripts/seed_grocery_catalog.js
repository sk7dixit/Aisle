const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const ProductBase = require('../models/master/ProductBase');
const Brand = require('../models/master/Brand');
const Variant = require('../models/master/Variant');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const groceryData = [
    {
        category: 'General Provision / Kirana',
        categoryId: 'general_kirana',
        products: [
            {
                base: 'Salt',
                brands: [
                    { name: 'Tata', variant: 'Tata Salt 1kg', size: '1kg', price: 28 },
                    { name: 'Aashirvaad', variant: 'Aashirvaad Salt 1kg', size: '1kg', price: 25 },
                    { name: 'Patanjali', variant: 'Patanjali Salt 1kg', size: '1kg', price: 22 }
                ]
            },
            {
                base: 'Sugar',
                brands: [
                    { name: 'Madhur', variant: 'Madhur Pure Sugar 1kg', size: '1kg', price: 48 },
                    { name: 'Loose', variant: 'Loose Sugar S-30 1kg', size: '1kg', price: 42 }
                ]
            }
        ]
    },
    {
        category: 'Fruits & Vegetables',
        categoryId: 'fruits_vegetables',
        products: [
            {
                base: 'Potato',
                brands: [
                    { name: 'Fresh', variant: 'Potato (Batata) 1kg', size: '1kg', price: 30 }
                ]
            },
            {
                base: 'Onion',
                brands: [
                    { name: 'Fresh', variant: 'Onion (Kanda) 1kg', size: '1kg', price: 40 }
                ]
            }
        ]
    },
    {
        category: 'Dairy & Ice Cream',
        categoryId: 'dairy_ice_cream',
        products: [
            {
                base: 'Milk',
                brands: [
                    { name: 'Amul', variant: 'Amul Gold 500ml', size: '500ml', price: 33 },
                    { name: 'Amul', variant: 'Amul Taaza 500ml', size: '500ml', price: 27 },
                    { name: 'Mother Dairy', variant: 'Mother Dairy Full Cream 500ml', size: '500ml', price: 33 }
                ]
            }
        ]
    },
    {
        category: 'Bakery & Cake Shop',
        categoryId: 'bakery_cakes',
        products: [
            {
                base: 'Bread',
                brands: [
                    { name: 'Britannia', variant: 'Britannia White Bread 400g', size: '400g', price: 45 },
                    { name: 'Wibs', variant: 'Wibs White Bread 400g', size: '400g', price: 40 }
                ]
            }
        ]
    },
    {
        category: 'Sweet Shop (Mithai & Farsan)',
        categoryId: 'sweets_farsan',
        products: [
            {
                base: 'Gulab Jamun',
                brands: [
                    { name: 'Haldiram', variant: 'Haldiram Gulab Jamun 1kg', size: '1kg', price: 250 }
                ]
            }
        ]
    },
    {
        category: 'Dry Fruits & Spices',
        categoryId: 'dry_fruits_spices',
        products: [
            {
                base: 'Cashew (Kaju)',
                brands: [
                    { name: 'Premium', variant: 'W240 Cashews 250g', size: '250g', price: 280 }
                ]
            }
        ]
    },
    {
        category: 'Wholesale / Grain Mart',
        categoryId: 'wholesale_grains',
        products: [
            {
                base: 'Wheat (Geun)',
                brands: [
                    { name: 'Loose', variant: 'Lokwan Wheat 10kg', size: '10kg', price: 450 }
                ]
            }
        ]
    },
    {
        category: 'Organic / Gourmet',
        categoryId: 'organic_gourmet',
        products: [
            {
                base: 'Olive Oil',
                brands: [
                    { name: 'Borges', variant: 'Borges Extra Virgin Olive Oil 500ml', size: '500ml', price: 650 }
                ]
            }
        ]
    }
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Optional: clear existing master data if you want a fresh start
        // await ProductBase.deleteMany({ allowed_states: 'SYSTEM_GROCERY' }); 

        for (const cat of groceryData) {
            for (const p of cat.products) {
                // Check if base exists
                let baseDoc = await ProductBase.findOne({ base_name: p.base, category: cat.category });
                if (!baseDoc) {
                    baseDoc = await ProductBase.create({
                        base_name: p.base,
                        category: cat.category,
                        product_type: 'REGULAR',
                        allowed_states: ['SYSTEM_GROCERY'] // Marker
                    });
                }

                for (const b of p.brands) {
                    let brandDoc = await Brand.findOne({ brand_name: b.name, product_base_id: baseDoc._id });
                    if (!brandDoc) {
                        brandDoc = await Brand.create({
                            brand_name: b.name,
                            product_base_id: baseDoc._id
                        });
                    }

                    // For catalog, we just need one indicative variant
                    let variantDoc = await Variant.findOne({ variant_label: b.variant, brand_id: brandDoc._id });
                    if (!variantDoc) {
                        await Variant.create({
                            variant_label: b.variant,
                            brand_id: brandDoc._id,
                            pack_size: b.size,
                            attributes: [b.price.toString()] // Store price in attributes temporarily for seeding indicative price
                        });
                    }
                }
            }
        }
        console.log('Specialized Grocery Data Seeded');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seed();
