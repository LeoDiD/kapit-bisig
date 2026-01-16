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
