# Database Security Guide — Kapit-Bisig

> Last updated: 2026-02-17

---

## 1. Restricted MongoDB User

In production the application **must not** use an admin/root MongoDB user.
Create a dedicated user with only the permissions the app needs:

```javascript
// Run in the MongoDB shell connected as admin
use kapit-bisig

db.createUser({
  user: 'kapit_app',
  pwd: '<STRONG_RANDOM_PASSWORD>',
  roles: [
    { role: 'readWrite', db: 'kapit-bisig' }  // no admin, no clusterAdmin
  ]
})
```

Update `MONGODB_URI` in `.env.local` to use this user:

```
MONGODB_URI=mongodb+srv://kapit_app:<PASSWORD>@cluster0.xxxxx.mongodb.net/kapit-bisig?retryWrites=true&w=majority
```

> **Never** grant `dbAdmin`, `userAdmin`, or `root` to the application user.

---

## 2. TLS / Encryption in Transit

| Scenario | TLS status |
|----------|-----------|
| **MongoDB Atlas** (`mongodb+srv://`) | TLS enabled by default — the Node.js driver negotiates TLS automatically. |
| **Self-hosted MongoDB** | Include `?tls=true` in the URI **or** the app sets `tls: true` in production via `server/config/database.ts`. |

The application **always** sets `tlsAllowInvalidCertificates: false` in production to prevent MITM attacks.

### How to verify TLS is active

```bash
# In the Mongo Shell connected to Atlas:
db.runCommand({ connectionStatus: 1 })
# Check that the connection shows TLS info

# Or from the app logs at startup:
# ✅ MongoDB Connected: cluster0-shard-00-01.xxxxx.mongodb.net
# 🔒 TLS: enabled (mongodb+srv default)
```

---

## 3. Network Access Restrictions

- **Atlas**: use the *Network Access* tab to restrict connections to an **IP allowlist**.
  - In production, only allow the server's static IP or VPC peering range.
  - Remove `0.0.0.0/0` (allow-all) before going live.
- **Self-hosted**: bind MongoDB to `127.0.0.1` or the private-network interface; use firewall rules (`iptables` / Security Groups) to block public access to port 27017.

---

## 4. Encryption at Rest

- **Atlas**: encryption at rest is enabled by default (AES-256) on all clusters. For additional control, configure *Customer-Managed Keys* (CMK) via AWS KMS, Azure Key Vault, or GCP KMS.
- **Self-hosted**: enable the WiredTiger `encryptionAtRest` option with a KMS-backed key file.

---

## 5. Backup & Recovery

- **Atlas**: automated daily snapshots with point-in-time recovery. Verify in *Project → Backup*.
- **Self-hosted**: schedule `mongodump` or filesystem snapshots; store backups in an encrypted, off-site location.

---

## 6. Secret Rotation & Monitoring

### Secrets to rotate periodically

| Secret | Location | Rotation cadence |
|--------|----------|-----------------|
| `MONGODB_URI` (password) | `.env.local` | Every 90 days |
| `JWT_SECRET` | `.env.local` | Every 180 days (coordinate with active sessions) |
| `SUPERADMIN_PASSWORD_HASH` | `.env.local` | Every 90 days |
| `HASH_SALT` | `.env.local` | On compromise only |

### Monitoring checklist

- [ ] Enable Atlas **Alerts** for: slow queries, connection spikes, replication lag.
- [ ] Review `AuditLog` collection weekly for unusual `ACCESS_DENIED` or `LOGIN_FAILURE` patterns.
- [ ] Set up a `/api/health` uptime monitor (already exists in the server).

---

## 7. Application-Level Hardening (implemented)

| Control | Detail |
|---------|--------|
| **NoSQL injection** | `mongoSanitize` middleware strips `$` and `.` keys from all input. |
| **Pagination caps** | All list endpoints enforce `limit ≤ 50`. |
| **Sort whitelist** | Only `createdAt` descending is used — no client-controlled sort. |
| **No raw query passthrough** | Queries are built from whitelisted params only; `Model.find(req.query)` is never used. |
| **Indexes** | Common filter fields (`barangay`, `status`, `createdAt`) are indexed on `Resident`, `Distribution`, `Claim`, and `AuditLog`. |
| **Mongoose debug off in prod** | `mongoose.set('debug', false)` in production prevents logging queries. |
| **URI never logged** | Only the host and database name are printed; the full URI (with credentials) is never logged. |

---

## 8. Additional Recommendations

1. **Replica set / sharding** — use at least a 3-node replica set (Atlas M10+ or self-hosted) for HA.
2. **Audit logging at DB level** — Atlas M10+ supports native audit logs. Enable them for compliance.
3. **Field-level encryption** — consider Client-Side Field Level Encryption (CSFLE) for PII like `mobileNumber` and `idNumber`.
4. **Rate limit DB writes** — already handled via Express rate limiters in the middleware stack.
