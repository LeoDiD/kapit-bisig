# Kapit-Bisig Web Application

A full-stack web application built with the MERN stack + Next.js.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: MongoDB with Mongoose

## Project Structure

```
apps/web/apps/
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   └── lib/           # Utilities and API client
├── server/
│   ├── config/        # Database configuration
│   ├── models/        # Mongoose models
│   └── routes/        # Express routes
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

1. Navigate to the web app directory:
   ```bash
   cd apps/web/apps
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.local` and update the MongoDB connection string if needed

### Running the Application

**Development mode (Next.js frontend):**
```bash
npm run dev
```

**Express.js backend server:**
```bash
npm run server:dev
```

**Production build:**
```bash
npm run build
npm run start
```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /api/health` - Server health status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/kapit-bisig` |
| `PORT` | Express server port | `3001` |
| `NEXT_PUBLIC_API_URL` | API base URL for frontend | `http://localhost:3001/api` |
| `API_PROXY_TARGET` | Dev proxy target for `/api/*` requests | `http://127.0.0.1:3001/api` |
| `API_PROXY_ALLOW_REMOTE` | Allow public remote proxy targets in development | `false` |

Notes:
- In development, `API_PROXY_TARGET` may point to `localhost`, `127.0.0.1`, or a private LAN host like `192.168.x.x`.
- Public remote targets still require `API_PROXY_ALLOW_REMOTE=true`; otherwise the proxy falls back to local `127.0.0.1:3001/api`.
## Distribution SMS and Push Setup

- Copy `.env.example` to the server environment and set `SMS_PROVIDER=semaphore`, `SMS_API_KEY`, and the approved `SMS_SENDER_NAME`. These values are server-only; never expose provider keys through `NEXT_PUBLIC_*` or `EXPO_PUBLIC_*` variables.
- Configure the Expo/EAS project in `mobile/app.json`, then add the Android Firebase service account / FCM V1 credentials with EAS credentials. Add the iOS APNs credential for iOS builds.
- Build the mobile app with an Expo development or production build. Expo Go does not provide remote push tokens for this workflow.
- After credentials are deployed, set `EXPO_PUSH_ENABLED=true` on the server. The app registers Expo tokens after resident login and deactivates them on logout or provider rejection.
- Distribution creation remains successful if SMS or push delivery fails; the API and web toast report each channel separately.