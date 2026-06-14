const fs = require('fs');
const path = require('path');

// Target directory for code auditing
const TARGET_DIR = path.join(__dirname, '..');

// File extensions to audit
const FILE_EXTENSIONS = ['.js'];

// Folders to bypass
const EXCLUDED_DIRS = ['node_modules', '.git', 'backups', 'logs', 'tests', 'scratch', 'scripts'];

// Audit rules defining regex patterns, severity, and guidance messages
const RULES = [
    {
        name: 'EVAL_DETECTION',
        regex: /\beval\s*\(/g,
        severity: 'Critical',
        message: 'Avoid using eval() as it leads to direct Remote Code Execution (RCE) vulnerabilities.'
    },
    {
        name: 'UNSAFE_CHILD_PROCESS',
        regex: /\b(exec|execSync)\s*\([^)]*(req\.(body|query|params|headers)|userInput)/g,
        severity: 'Critical',
        message: 'Unsafe execution of system commands using un-sanitized client parameters.'
    },
    {
        name: 'HARDCODED_JWT_SECRET',
        regex: /JWT_SECRET\s*=\s*['"`](?!fallback_secret_for_dev_only)[a-zA-Z0-9_-]{12,}['"`]/g,
        severity: 'Critical',
        message: 'Hardcoded JWT signing secret detected in source file.'
    },
    {
        name: 'HARDCODED_MONGO_CREDS',
        regex: /MONGO_URI\s*=\s*['"`]mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/g,
        severity: 'Critical',
        message: 'Exposed plain-text database credentials in connection string.'
    },
    {
        name: 'UNGUARDED_MONGO_QUERY',
        regex: /\bUser\.find\(\s*req\.(body|query|params)\s*\)/g,
        severity: 'High',
        message: 'Direct Mongoose query filter using un-sanitized request payload (NoSQL injection risk).'
    },
    {
        name: 'CONSOLE_LOG_PROCESS_ENV',
        regex: /console\.log\(\s*process\.env\s*\)/g,
        severity: 'Warning',
        message: 'Dumping entire environment variables map to logs might leak active secrets.'
    }
];

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat && stat.isDirectory()) {
            if (!EXCLUDED_DIRS.includes(file)) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (FILE_EXTENSIONS.includes(path.extname(file))) {
                results.push(fullPath);
            }
        }
    });
    
    return results;
};

const auditFile = (filepath) => {
    const content = fs.readFileSync(filepath, 'utf8');
    const lines = content.split('\n');
    const fileFindings = [];

    RULES.forEach((rule) => {
        // Reset regex state for global matches
        rule.regex.lastIndex = 0;
        
        lines.forEach((lineText, index) => {
            if (rule.regex.test(lineText)) {
                fileFindings.push({
                    rule: rule.name,
                    severity: rule.severity,
                    line: index + 1,
                    code: lineText.trim(),
                    message: rule.message
                });
            }
        });
    });
    
    return fileFindings;
};

const runScan = () => {
    console.log(`\n\x1b[36m=== Starting Aisle Local SAST Scanner ===\x1b[0m`);
    console.log(`Auditing files in: ${TARGET_DIR}\n`);

    const files = walk(TARGET_DIR);
    console.log(`Found ${files.length} javascript files to analyze.`);

    let totalFindings = 0;
    let criticalCount = 0;
    let highCount = 0;

    files.forEach((file) => {
        const relativePath = path.relative(TARGET_DIR, file);
        const findings = auditFile(file);
        
        if (findings.length > 0) {
            console.log(`\n\x1b[33m⚠️  File: ${relativePath}\x1b[0m`);
            findings.forEach((finding) => {
                totalFindings++;
                if (finding.severity === 'Critical') criticalCount++;
                if (finding.severity === 'High') highCount++;

                const color = finding.severity === 'Critical' ? '\x1b[31m' : finding.severity === 'High' ? '\x1b[35m' : '\x1b[33m';
                console.log(`  [${color}${finding.severity}\x1b[0m] Line ${finding.line}: ${finding.message}`);
                console.log(`    Code: "${finding.code}"`);
            });
        }
    });

    console.log(`\n\x1b[36m=== SAST Summary ===\x1b[0m`);
    console.log(`Total Audited Files: ${files.length}`);
    console.log(`Total Findings: ${totalFindings}`);
    console.log(`  - Critical: ${criticalCount}`);
    console.log(`  - High: ${highCount}`);
    console.log(`  - Warning: ${totalFindings - criticalCount - highCount}`);

    // If critical or high vulnerability is found, exit with status 1 to break pipeline builds
    if (criticalCount > 0 || highCount > 0) {
        console.log(`\n\x1b[41m\x1b[37m BUILD FAILED: Security check failed due to critical/high vulnerabilities. \x1b[0m\n`);
        process.exit(1);
    } else {
        console.log(`\n\x1b[42m\x1b[30m BUILD PASSED: No critical/high static security risks found. \x1b[0m\n`);
        process.exit(0);
    }
};

// Check if run directly
if (require.main === module) {
    runScan();
}

module.exports = { runScan, auditFile };
