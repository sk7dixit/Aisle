# Aisle Enterprise Compliance & Regulatory Mapping Guide

This guide details how the security and architecture implementations in the Aisle platform map to major international and national regulatory standards: **GDPR (European Union)**, **DPDP Act 2023 (India)**, **SOC 2 Type II**, and **ISO/IEC 27001**.

---

## 1. GDPR (General Data Protection Regulation) Compliance

GDPR governs the protection of personal data for individuals within the European Union, enforcing privacy by design, encryption, and user access rights.

| GDPR Requirement | Aisle Technical Implementation | File Reference |
| :--- | :--- | :--- |
| **Art. 32: Security of Processing (Encryption)** | High-risk PII fields are encrypted at the field level inside MongoDB using AES-256-CBC deterministic and random IV algorithms. Cleartext values never reside in DB stores. | [User.js](file:///s:/Aisle/Aisle/backend/models/User.js) |
| **Art. 32: Biometric Encryption** | Seller face verification data and enrollment request payloads are fully encrypted prior to database persistence. | [FaceUpdateRequest.js](file:///s:/Aisle/Aisle/backend/models/FaceUpdateRequest.js) |
| **Art. 17: Right to Erasure ("Right to be Forgotten")** | Mongoose schema supports soft deletes (`deleted: true`) for auditing catalogs, while providing direct deletion triggers to wipe active session tokens, OTP logs, and physical documents upon user request. | [sellerController.js](file:///s:/Aisle/Aisle/backend/controllers/sellerController.js) |
| **Art. 33: Data Breach Notification** | In-house WinLog rotate triggers real-time webhook alarms dispatching high-risk events (e.g. mass export attempt, impossible travel) to security teams within minutes. | [alertDispatcher.js](file:///s:/Aisle/Aisle/backend/utils/alertDispatcher.js) |

---

## 2. DPDP Act 2023 (Digital Personal Data Protection Act, India) Compliance

India's DPDP Act regulates the processing of digital personal data, emphasizing verifiable user consent, data fiduciary obligations, and purpose limitation.

| DPDP Requirement | Aisle Technical Implementation | File Reference |
| :--- | :--- | :--- |
| **Sec. 6: Verifiable Consent** | Onboarding requires mobile number verification via secure, hashed, rate-limited One-Time Passwords (OTP) cached temporarily in Redis. | [authController.js](file:///s:/Aisle/Aisle/backend/controllers/authController.js) |
| **Sec. 8: Accuracy & Security of Data** | Implements recursive Express sanitization filtering NoSQL inject queries (`$`, `.`) and custom recursive sanitizers stripping `<script>` tags from profiles. | [server.js](file:///s:/Aisle/Aisle/backend/server.js) |
| **Sec. 8(5): Data Loss Prevention** | Data Loss Prevention (DLP) guard restricts moderators/admins from pulling datasets larger than 100 entries. Violation suspends the account immediately. | [dlpMiddleware.js](file:///s:/Aisle/Aisle/backend/middleware/dlpMiddleware.js) |
| **Sec. 11: Right to Correction & Erasure** | Users can update and wipe profile details, terminating active sessions across load-balanced clusters instantly. | [authController.js](file:///s:/Aisle/Aisle/backend/controllers/authController.js) |

---

## 3. SOC 2 Type II Alignment (Security, Confidentiality & Availability)

SOC 2 is an auditing standard assessing a service organization's controls relevant to security, availability, processing integrity, confidentiality, and privacy.

| Trust Services Criteria (TSC) | Aisle Technical Implementation | File Reference |
| :--- | :--- | :--- |
| **CC6.1: Access Control & Authorization** | Role-Based Access Control (RBAC) restricts route execution via `authorize()` and checks specific admin actions against granular permissions lists. | [authMiddleware.js](file:///s:/Aisle/Aisle/backend/middleware/authMiddleware.js) |
| **CC6.3: Multi-Factor Authentication** | Authenticator TOTP token checks are required for privileged logins (admin, moderator) and are verified on every request during elevated operations. | [authController.js](file:///s:/Aisle/Aisle/backend/controllers/authController.js) |
| **CC6.5: Network Boundary Isolation** | Docker Compose defines private backend subnets separating Redis cache and databases from the public web server network interface. | [docker-compose.yml](file:///s:/Aisle/Aisle/docker-compose.yml) |
| **CC6.8: Threat Detection & Monitoring** | Winston writes combined, error, and dedicated security logs daily. InfraMonitor tracks CPU/Disk limits and alerts upon breach. | [logger.js](file:///s:/Aisle/Aisle/backend/config/logger.js) |
| **A1.2: Backup & Availability Recovery** | Scheduled daily DB backup engine creates serialized AES-256 encrypted archives and locks files to read-only permissions mimicking WORM. | [dbBackup.js](file:///s:/Aisle/Aisle/backend/scripts/dbBackup.js) |

---

## 4. ISO/IEC 27001:2022 Security Mapping

ISO 27001 is an international standard specifying the requirements for establishing, implementing, maintaining, and continually improving an Information Security Management System (ISMS).

| ISO 27001 Control | Aisle Technical Implementation | File Reference |
| :--- | :--- | :--- |
| **A.5.15: Access Control** | Authenticator-backed MFA enrollment, brute-force lockout, and Zero Trust continuous session caching in Redis. | [authMiddleware.js](file:///s:/Aisle/Aisle/backend/middleware/authMiddleware.js) |
| **A.8.12: Data Leakage Prevention** | Enforces `dlpGuard` wrapping user list endpoints, halting mass queries and disabling insider accounts. | [dlpMiddleware.js](file:///s:/Aisle/Aisle/backend/middleware/dlpMiddleware.js) |
| **A.8.20: Network Security** | Terraform provisions isolated private security groups allowing DocumentDB access strictly from application nodes. | [main.tf](file:///s:/Aisle/Aisle/deployment/main.tf) |
| **A.8.24: Use of Cryptography** | PII database encryption keys and JWT secrets are managed via distinct environment configurations (`.env`) with rotation fallbacks. | [User.js](file:///s:/Aisle/Aisle/backend/models/User.js) |
| **A.8.28: Secure Coding (SAST)** | Static Application Security Testing (SAST) regex checks scan inputs, `eval` commands, and credentials to block builds on security risks. | [securityScan.js](file:///s:/Aisle/Aisle/backend/scripts/securityScan.js) |
| **A.8.30: Outsourced Development (CI/CD)** | GitHub Actions workflow enforces secret checks (TruffleHog), NPM vulnerability audits, and test mounts on merges. | [ci-cd.yml](file:///s:/Aisle/Aisle/.github/workflows/ci-cd.yml) |
