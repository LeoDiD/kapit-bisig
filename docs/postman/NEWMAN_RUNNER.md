# Newman Runner (Auth Security Tests)

## Prerequisites
- Backend server running on `http://localhost:3001`
- Update environment variables in `docs/postman/KapitBisig_Local.postman_environment.json`:
  - `unifiedUsername`
  - `unifiedPassword`
  - `householdMobile`
  - `householdPassword`

## Run from repo root
```powershell
npm run test:auth:newman
```

If you need to bypass SSL verification (self-signed certs):
```powershell
npm run test:auth:newman:insecure
```

## Run from web app folder
```powershell
cd apps/web/apps
npm run test:auth:newman
```

## Typical workflow
1. Start backend server:
```powershell
npm run dev:server
```
2. In another terminal, run Newman:
```powershell
npm run test:auth:newman
```

## What this validates
- Login success paths
- Generic auth failures (401)
- Strict schema rejection for extra fields (400)
- NoSQL-style payload rejection (400)
- Logout/token revocation checks
- Invalid resident mobile validation (400)
