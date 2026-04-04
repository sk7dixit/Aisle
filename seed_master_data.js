const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./backend/config/db');
const ProductBase = require('./backend/models/master/ProductBase');
const Brand = require('./backend/models/master/Brand');
const Variant = require('./backend/models/master/Variant');

dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });

const seedMaster = async () => {
    try {
        console.log("Connecting to DB with loose TLS...");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            tlsAllowInvalidCertificates: true
        });
        console.log('Connected to DB');

        // CLEANUP
        console.log('Cleaning old master data...');
        await Variant.deleteMany({});
        await Brand.deleteMany({});
        await ProductBase.deleteMany({});

        const data = [
            {
                base: 'Milk', category: 'Dairy', type: 'DAILY',
                brands: [
                    {
                        name: 'Amul',
                        variants: [
                            { label: 'Amul Gold Milk 500ml', size: '500ml', attrs: ['full cream'] },
                            { label: 'Amul Gold Milk 1L', size: '1L', attrs: ['full cream'] },
                            { label: 'Amul Taaza Milk 500ml', size: '500ml', attrs: ['toned'] },
                            { label: 'Amul Taaza Milk 1L', size: '1L', attrs: ['toned'] },
                            { label: 'Amul Cow Milk 500ml', size: '500ml', attrs: ['cow'] }
                        ]
                    },
                    {
                        name: 'Mother Dairy',
                        variants: [
                            { label: 'Mother Dairy Full Cream 500ml', size: '500ml', attrs: ['full cream'] },
                            { label: 'Mother Dairy Toned 1L', size: '1L', attrs: ['toned'] }
                        ]
                    }
                ]
            },
            {
                base: 'Curd', category: 'Dairy', type: 'DAILY',
                brands: [
                    {
                        name: 'Amul',
                        variants: [
                            { label: 'Amul Masti Dahi 200g', size: '200g', attrs: ['cup'] },
                            { label: 'Amul Masti Dahi 400g', size: '400g', attrs: ['cup'] },
                            { label: 'Amul Masti Dahi 1kg', size: '1kg', attrs: ['pouch'] }
                        ]
                    }
                ]
            },
            {
                base: 'Bread', category: 'Bakery', type: 'DAILY',
                brands: [
                    {
                        name: 'Britannia',
                        variants: [
                            { label: 'Britannia White Bread', size: '400g', attrs: ['white'] },
                            { label: 'Britannia Brown Bread', size: '400g', attrs: ['brown'] },
                            { label: 'Britannia 100% Whole Wheat', size: '450g', attrs: ['wheat'] }
                        ]
                    },
                    {
                        name: 'Wibs',
                        variants: [
                            { label: 'Wibs Large White Bread', size: '800g', attrs: ['white'] }
                        ]
                    }
                ]
            },
            {
                base: 'Atta', category: 'Staples', type: 'REGULAR',
                brands: [
                    {
                        name: 'Aashirvaad',
                        variants: [
                            { label: 'Aashirvaad Shudh Chakki Atta 5kg', size: '5kg', attrs: ['whole wheat'] },
                            { label: 'Aashirvaad Shudh Chakki Atta 10kg', size: '10kg', attrs: ['whole wheat'] },
                            { label: 'Aashirvaad Select Atta 5kg', size: '5kg', attrs: ['sharbati'] }
                        ]
                    }
                ]
            },
            {
                base: 'Rice', category: 'Staples', type: 'REGULAR',
                brands: [
                    {
                        name: 'India Gate',
                        variants: [
                            { label: 'India Gate Basmati Rice Tibar 1kg', size: '1kg', attrs: ['basmati'] },
                            { label: 'India Gate Basmati Rice Dubar 1kg', size: '1kg', attrs: ['basmati'] },
                            { label: 'India Gate Basmati Rice Super 5kg', size: '5kg', attrs: ['basmati'] }
                        ]
                    },
                    {
                        name: 'Daawat',
                        variants: [
                            { label: 'Daawat Rozana Gold 1kg', size: '1kg', attrs: ['basmati'] },
                            { label: 'Daawat Super Basmati 1kg', size: '1kg', attrs: ['basmati'] }
                        ]
                    }
                ]
            },
            {
                base: 'Salt', category: 'Staples', type: 'REGULAR',
                brands: [
                    {
                        name: 'Tata',
                        variants: [
                            { label: 'Tata Salt Desh Ka Namak 1kg', size: '1kg', attrs: ['iodized'] },
                            { label: 'Tata Salt Lite 1kg', size: '1kg', attrs: ['low sodium'] }
                        ]
                    }
                ]
            },
            {
                base: 'Oil', category: 'Oil', type: 'REGULAR',
                brands: [
                    {
                        name: 'Fortune',
                        variants: [
                            { label: 'Fortune Refined Soyabean Oil 1L', size: '1L', attrs: ['pouch'] },
                            { label: 'Fortune Refined Soyabean Oil 5L', size: '5L', attrs: ['can'] },
                            { label: 'Fortune Kachi Ghani Mustard Oil 1L', size: '1L', attrs: ['bottle'] }
                        ]
                    }
                ]
            },
            {
                base: 'Paracetamol', category: 'Pharma', type: 'REGULAR',
                brands: [
                    {
                        name: 'Dolo',
                        variants: [
                            { label: 'Dolo 650 Strip', size: '15 tabs', attrs: ['fever'] }
                        ]
                    },
                    {
                        name: 'Crocin',
                        variants: [
                            { label: 'Crocin Advance 650', size: '15 tabs', attrs: ['fever'] }
                        ]
                    }
                ]
            }
        ];

        for (const cat of data) {
            // Create Base
            const baseDoc = await ProductBase.create({
                base_name: cat.base,
                category: cat.category,
                product_type: cat.type,
                allowed_states: ['Gujarat', 'Maharashtra'] // For demo
            });

            for (const b of cat.brands) {
                // Create Brand
                const brandDoc = await Brand.create({
                    brand_name: b.name,
                    product_base_id: baseDoc._id
                });

                for (const v of b.variants) {
                    // Create Variant
                    await Variant.create({
                        variant_label: v.label,
                        brand_id: brandDoc._id,
                        pack_size: v.size,
                        attributes: v.attrs
                    });
                }
            }
        }

        console.log('Seeding Complete! Database saturated with Indian products.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
};

seedMaster();
