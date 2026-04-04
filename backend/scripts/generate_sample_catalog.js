const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const data = {
    "General Provision / Kirana": [
        { "Product Name": "Tata Salt 1kg", "Brand": "Tata", "Price": 28 },
        { "Product Name": "Aashirvaad Atta 5kg", "Brand": "Aashirvaad", "Price": 245 },
        { "Product Name": "Madhur Sugar 1kg", "Brand": "Madhur", "Price": 52 }
    ],
    "Fruits & Vegetables": [
        { "Product Name": "Potato (Batata) 1kg", "Brand": "Fresh", "Price": 30 },
        { "Product Name": "Onion (Kanda) 1kg", "Brand": "Fresh", "Price": 45 }
    ],
    "Dairy & Ice Cream": [
        { "Product Name": "Amul Gold 500ml", "Brand": "Amul", "Price": 33 },
        { "Product Name": "Amul Taaza 500ml", "Brand": "Amul", "Price": 27 }
    ],
    "Bakery & Cake Shop": [
        { "Product Name": "Britannia Bread 400g", "Brand": "Britannia", "Price": 45 },
        { "Product Name": "Wibs Bread 400g", "Brand": "Wibs", "Price": 42 }
    ],
    "Sweet Shop (Mithai & Farsan)": [
        { "Product Name": "Gulab Jamun 1kg", "Brand": "Haldiram", "Price": 350 }
    ],
    "Dry Fruits & Spices": [
        { "Product Name": "Cashews (Kaju) 250g", "Brand": "DryFruit", "Price": 280 }
    ],
    "Wholesale / Grain Mart": [
        { "Product Name": "Rice 25kg Bag", "Brand": "Loose", "Price": 1200 }
    ],
    "Organic / Gourmet": [
        { "Product Name": "Organic Honey 500g", "Brand": "OrganicBrand", "Price": 450 }
    ]
};

const wb = XLSX.utils.book_new();

Object.keys(data).forEach(sheetName => {
    // Excel sheet names cannot contain /
    const safeSheetName = sheetName.replace(/\//g, ' ');
    const ws = XLSX.utils.json_to_sheet(data[sheetName]);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
});

const filePath = path.join(process.cwd(), 'Grocery &Kirana List.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Sample Excel created at: ${filePath}`);
