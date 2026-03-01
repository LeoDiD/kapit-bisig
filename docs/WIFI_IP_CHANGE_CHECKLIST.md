# Wi-Fi IP Change Checklist

Use this every time you connect your laptop to a different Wi-Fi.

## 1. Get your current laptop IP

Run in PowerShell:

```powershell
ipconfig
```

Copy the `IPv4 Address` under your active Wi-Fi adapter (example: `192.168.1.72`).

## 2. Update mobile app URLs (required)

File: `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://192.168.1.72:3001/api
EXPO_PUBLIC_FACE_API_URL=http://192.168.1.72:8000
```

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.72:3001/api
EXPO_PUBLIC_FACE_API_URL=http://192.168.1.72:8000
```

## 3. Update web frontend URL (only if opening web from another device)

File: `apps/web/apps/.env.local`

```env
NEXT_PUBLIC_API_URL=http://192.168.1.72:3001/api
```

If using web only on the same laptop browser, you can keep:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 4. CORS setting for cross-device access

File: `apps/web/apps/.env.local`

Use one:

```env
CORS_ORIGIN=*
```

or a specific origin:

```env
CORS_ORIGIN=http://192.168.1.72:3000
```




## 5. No IP edit needed here

- `backend/main.py` already binds to `0.0.0.0:8000` (LAN accessible).

## 6. Restart services

1. Restart web backend (`apps/web/apps`).
2. Restart Python backend (`backend`).
3. Restart Expo (`mobile`), then reload the app.

## 7. Quick test

From phone browser (same Wi-Fi), open:

- `http://192.168.1.72:3001/api/health`
- `http://192.168.1.72:8000/docs`

If both open, your mobile app should connect.


