# Local Network Setup

The project now detects the laptop's active Wi-Fi or Ethernet IPv4 address automatically.

## Normal startup

From the project root, run:

```powershell
npm run dev
```

Before starting the web, API, and mobile apps, this command updates:

- `mobile/.env`
- `apps/web/apps/.env.local`
- `backend/.env`

Starting Expo directly from `mobile` also performs the same update automatically.
The normal `npm start` command explicitly targets Expo Go, even though the project also includes development-build tooling.

## After changing Wi-Fi

Stop the running services and start them again. You no longer need to run `ipconfig` or edit IP addresses manually.

To update the settings without starting the apps, run:

```powershell
npm run network:sync
```

## Optional manual override

If Windows selects the wrong network adapter because the laptop has multiple active adapters, run:

```powershell
$env:KAPIT_BISIG_LAN_IP="192.168.1.4"
npm run network:sync
```

Replace `192.168.1.4` with the correct private IPv4 address.

## Phone connection requirements

- The phone and laptop must be on the same Wi-Fi network.
- Windows Firewall must allow Node.js on private networks and ports `3001`, `8000`, and `8082`.
- Restart Expo after changing networks so its QR code uses the new LAN address.

The configuration command prints the detected address and the mobile API URLs so they can be checked immediately.
