const axios = require('axios');
const fs = require('fs');
const path = require('path');
const sendGridService = require('../services/sendGridService');

// In-memory alert cooldown to prevent notification fatigue (5 minutes per event type & risk)
const cooldowns = new Map();

/**
 * Dispatches critical security alerts to various channels (Email, Discord, Slack, Telegram).
 * Logs all alerts to logs/alerts.log as a fallback local audit trial.
 * @param {Object} params
 * @param {string} params.title - Title of the alert
 * @param {string} params.message - Description of the threat
 * @param {string} params.risk - low, medium, high, critical
 * @param {string} params.event - Event type (e.g. FAILED_LOGIN, OTP_ABUSE)
 * @param {Object} params.details - JSON metadata context
 */
const sendSecurityAlert = async ({ title, message, risk, event, details = {} }) => {
    const cooldownKey = `${event}:${risk}`;
    const now = Date.now();
    if (cooldowns.has(cooldownKey) && (now - cooldowns.get(cooldownKey) < 5 * 60 * 1000)) {
        console.log(`[AlertDispatcher] Cooldown active for ${cooldownKey}. Skipping duplicate alert.`);
        return;
    }
    cooldowns.set(cooldownKey, now);

    const alertLog = `[ALERT] [${new Date().toISOString()}] [RISK: ${risk.toUpperCase()}] [EVENT: ${event}] ${title}: ${message}\nDetails: ${JSON.stringify(details)}\n\n`;
    
    // Write to a local simulation file logs/alerts.log
    try {
        const logDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(path.join(logDir, 'alerts.log'), alertLog);
    } catch (err) {
        console.error('[AlertDispatcher] Failed to write to alerts.log:', err.message);
    }

    // Print with visual formatting to terminal console
    console.log(`\n\x1b[41m\x1b[37m⚠️ [SOC ALERT - ${risk.toUpperCase()}] ${title} \x1b[0m\n\x1b[31m${message}\x1b[0m\n`);

    // 1. Email Alert (to security@aisle.in)
    try {
        if (process.env.NODE_ENV !== 'development') {
            await sendGridService.sendEmail({
                to: 'security@aisle.in',
                subject: `⚠️ SECURITY ALERT [${risk.toUpperCase()}]: ${title}`,
                text: `${message}\n\nDetails:\n${JSON.stringify(details, null, 2)}`,
                html: `
                    <div style="font-family: monospace; border: 2px solid red; padding: 20px; border-radius: 8px; background-color: #fafafa;">
                        <h2 style="color: red; margin: 0 0 10px 0;">⚠️ AISLE SECURITY SOC ALERT</h2>
                        <p><strong>Severity:</strong> <span style="background-color: #ffebeb; color: red; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${risk.toUpperCase()}</span></p>
                        <p><strong>Event Type:</strong> <code>${event}</code></p>
                        <p><strong>Description:</strong> ${message}</p>
                        <hr style="border: 0; border-top: 1px solid #ccc; margin: 15px 0;" />
                        <h4>Context Details:</h4>
                        <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px;">${JSON.stringify(details, null, 2)}</pre>
                        <p style="font-size: 9px; color: #777; margin-top: 15px;">Generated automatically by Aisle Security Operations Center.</p>
                    </div>
                `
            });
        } else {
            console.log(`[Dev-Only] Skipping SendGrid email alert dispatch for: ${title}`);
        }
    } catch (err) {
        // Safe failover
        console.log('[AlertDispatcher] SendGrid email skipped or failed:', err.message);
    }

    // 2. Discord Alert Webhook
    if (process.env.DISCORD_WEBHOOK_URL) {
        try {
            await axios.post(process.env.DISCORD_WEBHOOK_URL, {
                embeds: [{
                    title: `⚠️ Aisle SOC Alert - ${title}`,
                    description: message,
                    color: risk === 'critical' ? 15158332 : risk === 'high' ? 15105570 : 3447003,
                    fields: [
                        { name: 'Risk', value: risk.toUpperCase(), inline: true },
                        { name: 'Event', value: event, inline: true },
                        { name: 'Details', value: `\`\`\`json\n${JSON.stringify(details, null, 2).slice(0, 500)}\n\`\`\`` }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });
        } catch (err) {
            console.log('[AlertDispatcher] Discord dispatch failed:', err.message);
        }
    }

    // 3. Slack Alert Webhook
    if (process.env.SLACK_WEBHOOK_URL) {
        try {
            await axios.post(process.env.SLACK_WEBHOOK_URL, {
                text: `*⚠️ AISLE SECURITY SOC ALERT [${risk.toUpperCase()}]*\n*Event:* ${event}\n*Description:* ${message}\n\`\`\`${JSON.stringify(details, null, 2)}\`\`\``
            });
        } catch (err) {
            console.log('[AlertDispatcher] Slack dispatch failed:', err.message);
        }
    }

    // 4. Telegram Alert Webhook
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
        try {
            const cleanMessage = message.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&'); // MarkdownV2 escape
            const text = `⚠️ *Aisle Security Alert [${risk.toUpperCase()}]*\n*Event:* ${event}\n*Description:* ${cleanMessage}`;
            await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text,
                parse_mode: 'Markdown'
            });
        } catch (err) {
            console.log('[AlertDispatcher] Telegram dispatch failed:', err.message);
        }
    }
};

module.exports = { sendSecurityAlert };
