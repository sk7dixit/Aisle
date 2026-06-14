# Aisle Business Continuity & Disaster Recovery (BCP/DR) Plan

This document establishes the official business continuity policies, disaster recovery objectives, and step-by-step restoration manuals for the Aisle marketplace platform.

---

## 1. Disaster Recovery Objectives

Aisle defines its critical metrics for service restoration during outages as follows:

* **Recovery Point Objective (RPO)**: **15 minutes**.
  * The maximum acceptable duration of data loss during a critical database failure. Database backups or replication clusters must ensure no more than 15 minutes of transactional logs are lost.
* **Recovery Time Objective (RTO)**: **30 minutes**.
  * The maximum acceptable duration of service downtime during a critical outage. System restore scripts, container recreation, and dns-routing shifts must bring the application back online within 30 minutes.

---

## 2. Infrastructure Resilience & Redundancy

Aisle relies on cloud-native high availability to meet its RTO/RPO goals:

### A. Database Redundancy (MongoDB Atlas)
* MongoDB Atlas is provisioned as a **Replica Set** distributed across three AWS Availability Zones (AZs) in an Active-Passive-Passive structure.
* If the primary database node goes down, Mongoose drivers automatically detect the failure and transition read/write operations to a secondary node (election takes less than 5 seconds).

### B. Geographic Redundancy (Multi-Region Failover)
* Aisle employs a primary-region deploy (Region A) and a warm-standby region (Region B).
* **Traffic Routing**: Cloudflare load balancer performs continuous HTTP health checks on the Region A ALB. If checks fail consecutively for 60 seconds, DNS traffic is shifted to Region B (Active-Passive failover).

### C. Containerized Application Resiliency
* Clustered PM2 instances automatically spawn across CPU cores to handle process crashes.
* Docker Compose healthchecks monitor `/health` routes, automatically restarting dead application containers.

---

## 3. Step-by-Step Disaster Recovery Runbooks

Use the following operational manuals to restore services under major failure scenarios:

### Runbook A: Database Corruption or Data Deletion (Restore from Backup)
If database collection data is corrupted, deleted, or ransomware hits MongoDB, recover the database using the encrypted local backups:

1. **Verify Backup Integrity**:
   * Navigate to the `/backups` directory on the secure offline archive host.
   * Locate the latest hourly or daily backup file: `backup-YYYY-MM-DDTHH-mm-ss.enc`.
   * Backups are saved with filesystem permissions restricted to read-only (`0o444`) to enforce WORM (Write-Once-Read-Many) parameters.

2. **Execute Restoration script**:
   * Pull down the backup archive and place it in the `backend/backups/` directory on the restoration host.
   * Run the decryption restore script:
     ```bash
     cd backend
     node scripts/dbRestore.js backups/backup-YYYY-MM-DDTHH-mm-ss.enc
     ```
   * The script decrypts the database backup using `BACKUP_ENCRYPTION_KEY` via AES-256-CBC, deserializes collections, and bulk writes the documents back into Mongoose models.

3. **Verify Restored State**:
   * Inspect logs to ensure Mongoose successfully connected and parsed all schemas.
   * Run `/health` checks to verify MongoDB status transitions to `connected`.

---

### Runbook B: Cloud Provider Regional Outage (Active-Passive Shift)
If AWS faces a total regional outage in the primary deployment zone:

1. **DNS Traffic Shift**:
   * Log in to the Cloudflare DNS dashboard.
   * Verify that Cloudflare Load Balancer has initiated failover to the Region B ALB.
   * If automated failover is delayed, manually modify DNS A records to route traffic to the standby IP interface.

2. **Spin Up Standby Containers**:
   * SSH into the Region B runner host.
   * Ensure the environment variables (`.env`) match the primary region keys, specifically:
     * `MONGO_URI` (pointing to the cross-region database replica set)
     * `REDIS_PASSWORD` and cache credentials
   * Execute compose orchestration:
     ```bash
     docker compose up -d --build
     ```

3. **Validate Regional Isolation**:
   * Run health checks on Region B public interface:
     ```bash
     curl -i http://localhost:5000/health
     ```
   * Confirm response returns `200 OK` with database and cache connectivity active.
