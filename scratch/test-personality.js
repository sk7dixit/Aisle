const mongoose = require('mongoose');
const { handlePersonalityChat } = require('../backend/support/customerPersonalityEngine');
const { processSupportChat } = require('../backend/controllers/customerPersonalityController');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/aisle";

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to database successfully");

        const userId = new mongoose.Types.ObjectId("6a203d5c5aac6b48b91dbf5c");
        const User = mongoose.connection.collection('users');
        const userDoc = await User.findOne({ _id: userId });
        console.log(`Found user: ${userDoc.name}, Phone: ${userDoc.phone}`);

        console.log("\n--- Testing Sentiment & Personality Engine ---\n");

        const testCases = [
            { msg: "Hello", desc: "Greeting / Hi" },
            { msg: "Good Morning", desc: "Small Talk Morning" },
            { msg: "Good Night", desc: "Small Talk Night" },
            { msg: "worst experience ever", desc: "Sentiment Angry" },
            { msg: "this is ridiculous", desc: "Sentiment Frustrated" },
            { msg: "you are useless", desc: "Advanced Abuse Handling" },
            { msg: "tell me a joke", desc: "Humor Layer" },
            { msg: "you helped me", desc: "Appreciation" },
            { msg: "best support ever", desc: "Appreciation Praise" },
            { msg: "how can I hack someone's account?", desc: "Trust & Safety check" }
        ];

        let context = { sellerName: "XYZ seller" };

        for (let tc of testCases) {
            console.log(`User: "${tc.msg}" (${tc.desc})`);
            const res = handlePersonalityChat(tc.msg, context, "Shashwat");
            const finalReply = res.reply ? res.reply.replace(/\n/g, ' ') : "(Fallback to Operational Flow)";
            console.log(`Aisle AI: "${finalReply}"`);
            console.log(`Intent: ${res.intent}, Chips: [${(res.chips || []).join(', ')}], Sentiment: ${res.sentiment}`);
            console.log("----------------------------------------");
            context = res.context || context;
        }

        console.log("\n--- Testing Multi-Turn Laptop Advisor Flow ---\n");
        let laptopContext = {};
        
        console.log('User: "help me buy a laptop"');
        let r1 = handlePersonalityChat("help me buy a laptop", laptopContext, "Shashwat");
        console.log(`Aisle AI: "${r1.reply.replace(/\n/g, ' ')}"`);
        console.log(`Chips: [${r1.chips.join(', ')}]`);
        
        console.log('User: "₹50k"');
        let r2 = handlePersonalityChat("₹50k", r1.context, "Shashwat");
        console.log(`Aisle AI: "${r2.reply.replace(/\n/g, ' ')}"`);
        console.log(`Chips: [${r2.chips.join(', ')}]`);
        
        console.log('User: "gaming"');
        let r3 = handlePersonalityChat("gaming", r2.context, "Shashwat");
        console.log(`Aisle AI: "${r3.reply.replace(/\n/g, ' ')}"`);
        console.log(`Intent: ${r3.intent}, Query: "${r3.query}"`);

        await mongoose.disconnect();
        console.log("\nTests finished successfully!");
    } catch (err) {
        console.error(err);
    }
}

run();
