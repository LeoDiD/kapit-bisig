# Maintenance Notes

This guide documents routine maintenance, operational checks, and safe change procedures.

## 1. Daily Startup Checklist

1. Start services:
```powershell
npm run dev
```
2. Verify health endpoints:
- `http://localhost:3001/api/health`
- `http://localhost:8000/api/health`
- `http://localhost:8000/docs`
3. Confirm mobile app can reach API URLs from `mobile/.env`.

## 2. Wi-Fi / Local IP Changes

When switching Wi-Fi, update local IP-based URLs in:
- `mobile/.env`
- `apps/web/apps/.env.local` (if needed)

Use: `docs/WIFI_IP_CHANGE_CHECKLIST.md`

## 3. Dependency Management

### Node dependencies

At repository root:
```powershell
npm install
```

For workspaces:
```powershell
cd apps/web/apps
npm install
cd ../../../mobile
npm install
```

Or run:
```powershell
npm run install:all
```

### Python dependencies

```powershell
cd backend
.\venv\Scripts\Activate
pip install -r requirements.txt
```

## 4. Configuration and Secrets

- Never commit real credentials or production secrets.
- Keep `backend/.env.example` as the template source.
- Rotate exposed credentials immediately if secrets are ever committed.
- Prefer environment-level secret management in deployment environments.

## 5. Data and Storage Notes

- FastAPI uses in-memory data plus `backend/face_embeddings.json` for persistence fallback.
- MongoDB stores resident embeddings and registration logs when connected.
- `GET /api/face/residents` intentionally excludes raw embedding vectors.

## 6. Operational Verification

### Express API
- Check `GET /api/health` returns `status: ok`.
- Verify auth and resident routes respond as expected.

### FastAPI face service
- Check `GET /api/health` for model, detector, and MongoDB status.
- Run a known face through `/api/face/detect` and `/api/face/check-duplicate`.

## 7. Troubleshooting Quick Guide

### Face API does not start

- Validate Python environment activation.
- Reinstall `backend/requirements.txt`.
- Confirm port `8000` is free.

### MongoDB unavailable

- Check `MONGODB_URI` and network access.
- Service falls back to in-memory mode, but logs/residents from MongoDB will be unavailable.

### Mobile cannot call local APIs

- Confirm laptop and phone are on the same Wi-Fi.
- Update IP-based URLs and restart Expo.

## 8. Change Management Recommendations

1. Update documentation together with any API change.
2. If endpoints or payloads change, update:
- `docs/API_DOCUMENTATION.md`
- Postman collection in `docs/postman/`
3. For infra or env updates, update:
- `docs/MAINTENANCE_NOTES.md`
- `docs/WIFI_IP_CHANGE_CHECKLIST.md` if networking behavior changed
