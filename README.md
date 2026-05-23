# ConnectSphere

ConnectSphere is a full-stack real-time video conferencing and collaboration platform built with the MERN stack. Designed with a warm, human-centric UI using the Antigravity CSS framework, it supports HD multi-user video calling, screen sharing, real-time whiteboarding, and secure drag-and-drop file sharing.

## Architecture & Tech Stack
- **Frontend**: React 18, Vite, Redux Toolkit, React Hook Form, Zod, Tailwind CSS, Framer Motion, Fabric.js (Whiteboard).
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Socket.io.
- **Infrastructure**: Docker, Nginx, Redis (Session/State), AWS S3 (Files), PM2.
- **Security**: JWT, Google OAuth, Helmet.js, express-mongo-sanitize, xss-clean, Rate Limiting, DTLS-SRTP, AES-256 equivalent via S3.

## Complete Folder Structure
```text
ConnectSphere/
├── .github/workflows/ci-cd.yml   # GitHub Actions pipeline
├── client/                       # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── components/room/      # VideoGrid, ControlBar, Whiteboard, ChatPanel, FileDropzone
│   │   ├── hooks/                # useWebRTC, useSocket
│   │   ├── pages/                # Login, Register, Dashboard, Room
│   │   ├── store/                # Redux Auth Slice
│   │   ├── utils/                # Axios API instance
│   │   ├── index.css             # Antigravity Design Variables
│   │   └── App.jsx               # React Router
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── Dockerfile
├── server/                       # Backend Express API
│   ├── config/                   # db.js, passport.js
│   ├── controllers/              # auth, room, file
│   ├── middlewares/              # authMiddleware, rateLimiter
│   ├── models/                   # User, Room, Message, File
│   ├── routes/                   # API Endpoints
│   ├── sockets/                  # socketHandlers, chatHandlers, whiteboardHandlers
│   ├── app.js                    # Express setup with Helmet & CORS
│   ├── server.js                 # HTTP & Socket Server
│   └── Dockerfile
├── nginx/
│   └── default.conf              # Reverse proxy, SSL, Rate limiting
├── ecosystem.config.js           # PM2 configuration
├── docker-compose.yml            # MongoDB & Redis Local
└── .env.example
```

## Security Model
ConnectSphere utilizes a defense-in-depth architecture:
1. **Network**: Nginx reverse proxy terminates SSL (TLS 1.3).
2. **WebRTC**: All peer-to-peer data uses DTLS-SRTP encryption natively.
3. **Backend Middleware**: Helmet.js for CSP and headers, `express-mongo-sanitize` for NoSQL injection prevention, `xss-clean` for cross-site scripting mitigation.
4. **Auth & Identity**: JWTs are stored in HTTP-only, strict SameSite cookies. Passwords hashed via bcrypt. Google OAuth 2.0 supported. Rate limiters active on all routes.
5. **Data Storage**: AWS S3 leverages short-lived pre-signed URLs to keep credentials out of the client.
6. **Socket Authentication**: JWTs are verified before establishing persistent WSS connections.

## WebRTC Signaling Flow
- User connects to `Socket.io` and emits `join-room`.
- Server notifies all connected users via `user-connected`.
- Each existing user creates a new `RTCPeerConnection` using Google and Twilio STUN servers.
- The `useWebRTC` hook generates an `Offer`, emitting it via the `signal` event.
- The receiving peer sets the remote description, generates an `Answer`, and signals back.
- `ICE Candidates` are trickled back and forth until the encrypted P2P mesh network stabilizes.

## API Documentation
### Auth (`/api/auth`)
- `POST /register`: Registers user and sets HTTP-only cookie.
- `POST /login`: Authenticates and sets cookie.
- `GET /me`: Validates JWT and returns user object.
- `GET /google`: Initiates Google OAuth.
- `GET /logout`: Clears session cookie.

### Rooms (`/api/rooms`)
- `POST /`: Generates unique 8-character hex room ID.
- `GET /:roomId`: Verifies room exists and is active.

### Files (`/api/rooms/:roomId/files`)
- `GET /presigned-url`: Generates AWS S3 pre-signed upload link.
- `POST /metadata`: Saves file document to MongoDB.
- `GET /`: Retrieves all room files.

## Production Setup (GitHub Safe)
- **CI/CD**: Any PR/push to `main` runs `npm run lint` and `npm run build` on GitHub Actions, alongside `npm audit`.
- **Docker**: Included `client/Dockerfile` (multi-stage Nginx build) and `server/Dockerfile` (PM2 runtime).
- **GitHub Guidelines**: NEVER commit `.env`. Add `*.pem`, `*.key` to `.gitignore`. Inject secrets via GitHub Actions Secrets.

## Run Development Environment
```bash
# Start Mongo and Redis
docker-compose up -d

# Start Server
cd server && npm install && npm run dev

# Start Client
cd client && npm install && npm run dev
```

*Built sequentially by Antigravity AI.*
