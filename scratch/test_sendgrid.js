const sgMail = require('@sendgrid/mail');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
    console.error('SENDGRID_API_KEY is not defined in the environment.');
    process.exit(1);
}

sgMail.setApiKey(apiKey);

const msg = {
    to: 'shoplens017@gmail.com',
    from: process.env.EMAIL_USER || 'shoplens017@gmail.com',
    subject: 'Test SendGrid Direct',
    text: 'Testing if this API key is active.',
};

async function test() {
    try {
        console.log('Sending via SendGrid...');
        console.log('API Key:', apiKey);
        console.log('From:', msg.from);
        const response = await sgMail.send(msg);
        console.log('Success! Status code:', response[0].statusCode);
    } catch (error) {
        console.error('SendGrid Error details:');
        if (error.response) {
            console.error('Status Code:', error.response.statusCode);
            console.error('Body:', JSON.stringify(error.response.body, null, 2));
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Error:', error.message);
        }
    }
}

test();
