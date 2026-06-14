require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('Testing Email Sending...');
console.log('User:', process.env.EMAIL_USER);
// Mask password for safety in logs
console.log('Pass (first 4 chars):', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.substring(0, 4) + '****' : 'Unset');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s+/g, ''), // Strip spaces just in case
    },
});

const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // Send to self
    subject: 'Test Email from Aisle',
    text: 'If you receive this, email sending is working!',
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error occurred:', error);
    } else {
        console.log('Email sent successfully:', info.response);
    }
});
