const axios = require('axios');
const { logSecurityEvent } = require('../utils/securityLogger');

// Local blacklist containing simulated malicious IPs and common Tor nodes
const blacklistedIps = new Set([
    '198.51.100.42', // Mock scanner IP
    '203.0.113.111', // Mock crawler IP
    '185.220.101.4', // Tor Exit Node
    '185.220.101.5', // Tor Exit Node
    '185.220.101.6', // Tor Exit Node
    'tor-exit-ip'    // Simulated Tor IP for testing
]);

// Fetch live list of Tor exit nodes from check.torproject.org on startup
const fetchLiveTorExitNodes = async () => {
    try {
        const response = await axios.get('https://check.torproject.org/torbulkexitlist', { timeout: 3000 });
        if (response.data && typeof response.data === 'string') {
            const lines = response.data.split('\n');
            let loadedCount = 0;
            for (const line of lines) {
                const ip = line.trim();
                if (ip && !ip.startsWith('#')) {
                    blacklistedIps.add(ip);
                    loadedCount++;
                }
            }
            console.log(`[ThreatIntel] Successfully loaded ${loadedCount} active Tor exit nodes.`);
        }
    } catch (err) {
        console.log('[ThreatIntel] Live Tor exit nodes lookup failed (using local fallback list):', err.message);
    }
};

// Initiate async load of live threat intelligence data
fetchLiveTorExitNodes();

const threatIntelMiddleware = async (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown';
    let cleanIp = ip;
    if (typeof ip === 'string') {
        cleanIp = ip.split(',')[0].trim();
    }

    // 1. IP Check
    if (blacklistedIps.has(cleanIp)) {
        await logSecurityEvent(null, 'threat-intel', 'BOT_BLOCKED', req, {
            reason: 'Threat Intelligence Blacklist Match (Blocked IP/TOR Node)',
            ipAddress: cleanIp
        });

        return res.status(403).json({
            message: 'Access Denied. Your IP address is flagged as suspicious by Threat Intelligence (Tor/Malicious IP).'
        });
    }

    // 2. User-Agent Scanner / Exploit Tool Checks
    const userAgent = req.headers['user-agent'] || '';
    if (/sqlmap|nikto|hydra|dirbuster|nmap|netsparker|webinspect|acunetix|nessus|gobuster|w3af/i.test(userAgent)) {
        await logSecurityEvent(null, 'threat-intel', 'BOT_BLOCKED', req, {
            reason: `Exploit scanner blocked: User-agent match (${userAgent})`,
            ipAddress: cleanIp
        });

        return res.status(403).json({
            message: 'Access Denied. Automated scanner tools are blocked.'
        });
    }

    next();
};

module.exports = threatIntelMiddleware;
