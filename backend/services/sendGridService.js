const sgMail = require('@sendgrid/mail');

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
    console.error('[SendGrid] WARNING: SENDGRID_API_KEY is not defined in the environment variables.');
} else {
    sgMail.setApiKey(apiKey);
    console.log('[SendGrid] Service initialized successfully.');
}

// Verified Sender Email configuration (must match the email verified in your SendGrid account)
const SENDER_EMAIL = process.env.EMAIL_USER || 'shoplens017@gmail.com';

/**
 * Generic email sender using SendGrid
 * @param {Object} options - Email sending options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 * @returns {Promise<boolean>} Resolves to true if successful, false otherwise
 */
const sendEmail = async ({ to, subject, text, html, skipFallback = false }) => {
    const { sendGridCircuit } = require('../utils/circuitBreaker');
    const FailedNotification = require('../models/FailedNotification');

    const action = async () => {
        if (!process.env.SENDGRID_API_KEY) {
            throw new Error('SENDGRID_API_KEY environment variable is not defined.');
        }

        const msg = {
            to,
            from: SENDER_EMAIL,
            subject,
            text,
            html: html || `<div>${text}</div>`,
        };

        console.log(`[SendGrid] Sending email to ${to} (Subject: "${subject}")...`);
        const response = await sgMail.send(msg);
        console.log(`[SendGrid] Email sent successfully to ${to}. Status Code: ${response[0].statusCode}`);
        return true;
    };

    if (skipFallback) {
        return await sendGridCircuit.execute(action);
    }

    const fallback = async (error) => {
        console.warn(`[SendGrid-Fallback] SendGrid circuit open or failed: ${error ? error.message : 'fail-fast'}. Queuing email to database for retry.`);
        try {
            await FailedNotification.create({
                to,
                subject,
                text,
                html,
                lastError: error ? error.message : 'SendGrid circuit open (fail-fast)'
            });
            return false;
        } catch (dbErr) {
            console.error(`[SendGrid-Fallback] Failed to queue email to database:`, dbErr.message);
            throw dbErr;
        }
    };

    try {
        return await sendGridCircuit.execute(action, fallback);
    } catch (err) {
        console.error('[SendGrid] Error sending email (circuit breaker execution failed):', err.message);
        throw err;
    }
};

/**
 * Sends a verification OTP email using SendGrid
 * @param {string} email - Recipient email
 * @param {string} otp - Verification code
 * @returns {Promise<boolean>} Resolves to true if successful, false otherwise
 */
const sendOtp = async (email, otp) => {
    const subject = 'Aisle Verification OTP';
    const text = `Your verification OTP is ${otp}. It expires in 10 minutes.`;
    
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Dev-Only] OTP for ${email} is: ${otp}`);
    }
    
    // A premium HTML template to wow the user!
    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 20px; background-color: #fdfcf8; border: 1px solid rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 24px;">
                <h1 style="color: #0f766e; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Aisle</h1>
                <p style="color: #6a584b; font-size: 14px; margin: 5px 0 0 0;">Neighborhood Marketplace Ecosystem</p>
            </div>
            
            <div style="background-color: #ffffff; border-radius: 16px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.02); border: 1px solid rgba(45,36,36,0.04);">
                <h2 style="color: #1c140f; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">Verify Your Account</h2>
                <p style="color: #4b3a2f; font-size: 15px; line-height: 1.5; margin-bottom: 24px; text-align: center;">
                    Thank you for joining Aisle. Use the secure verification code below to complete your sign-up process:
                </p>
                
                <div style="background: linear-gradient(135deg, #0f766e 0%, #115e59 100%); border-radius: 12px; padding: 16px 24px; text-align: center; margin-bottom: 24px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #ffffff;">${otp}</span>
                </div>
                
                <p style="color: #6a584b; font-size: 13px; text-align: center; margin-top: 0; margin-bottom: 0;">
                    ⏳ This code is extremely time-sensitive and will expire in <b>10 minutes</b>. For security reasons, please do not share this code with anyone.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 24px; color: #8c7c6d; font-size: 11px; line-height: 1.4;">
                <p style="margin: 0;">This email was sent dynamically via the Aisle API Secure Gateway.</p>
                <p style="margin: 5px 0 0 0;">&copy; 2026 Aisle Inc. All rights reserved.</p>
            </div>
        </div>
    `;

    return await sendEmail({ to: email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendOtp
};
