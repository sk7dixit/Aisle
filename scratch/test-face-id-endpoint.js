const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env') });

const { loginWithFace } = require('../backend/controllers/authController');

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const req = {
        body: {
            identifier: 'shashwatd.dixit33@gmail.com',
            faceData: 'data:image/jpeg;base64,mockfacedata'
        },
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        ip: '127.0.0.1',
        socket: {
            remoteAddress: '127.0.0.1'
        }
    };

    const res = {
        statusCode: 200,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            console.log("JSON response:", this.statusCode, data);
            return this;
        },
        send(data) {
            console.log("SEND response:", this.statusCode, data);
            return this;
        }
    };

    try {
        await loginWithFace(req, res);
    } catch (err) {
        console.error("Caught Exception:", err);
    }

    process.exit(0);
}

run().catch(console.error);
