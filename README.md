# Aisle

Aisle is a local marketplace ecosystem that connects local shops and pharmacies directly with customers. It features real-time inventory discovery, physical navigation using OpenStreetMap, digital storefronts for vendors, and a seamless developer/ecosystem dashboard.

## Features

- **Store Discovery & Navigation**: Locate nearby shops, general stores, and pharmacies around you. Physical routing with integrated OSM APIs.
- **Smart Catalog**: Real-time product search inside local shops. Shopkeepers can seamlessly upload pictures or bulk Excel lists to manage their inventory.
- **Seller Ecosystem**: Dedicated dashboard for shopkeepers to trace orders, schedule visits, update stocks, and request support.
- **Push Notifications & Socket.io Integration**: Real-time order status tracking and booking confirmations.
- **AI Receipts/Computer Vision Ready**: Prompt structures ready for scanning receipts and automatic item categorization.

## Tech Stack

- **Frontend**: React.js, Vite, TailwindCSS, React-Router, Framer Motion, Socket.io-client.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, Cloudinary, JWT Authentication, Nodemailer.
- **Mobile/Progressive Ready**: Responsive design geared towards on-the-go mapping and purchasing.

## Setup Steps

### 1. Clone the repository
```bash
git clone https://github.com/sk7dixit/aisle.git
cd aisle
```

### 2. Configure Environment Variables
You must define your local environment keys based on the provided example file.
Navigate to `backend` and create your `.env`:
```bash
cd backend
cp .env.example .env
```
Fill in your MongoDB URI, JWT Secret, Cloudinary Keys, and Email Configuration.

For the `frontend`, create an `.env` with:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=your_key_here
```

### 3. Install Dependencies
Install packages for both frontend and backend.
```bash
# In the root, frontend, and backend directories:
npm install        # (Root)
cd frontend
npm install        # (Frontend)
cd ../backend
npm install        # (Backend)
```

### 4. Run the Project locally
Open two terminal instances.
**Terminal 1 (Backend)**:
```bash
cd backend
node server.js
```
The API will spin up on `http://localhost:5000`.

**Terminal 2 (Frontend)**:
```bash
cd frontend
npm run dev
```
The application will launch on your local vite server (usually `http://localhost:5173`).
