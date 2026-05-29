# Project Architecture & Structure

The repository is organized as a monorepo containing both the frontend (React) and backend (Node.js/Express) applications, alongside deployment and DevOps configurations.

```text
ConnectSphere/
├── .github/
│   └── workflows/
│       └── ci-cd.yml             # GitHub Actions pipeline
├── client/                       # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── assets/               # Images, icons, local fonts
│   │   ├── components/           # Reusable UI components (Antigravity themed)
│   │   │   ├── common/           # Buttons, Inputs, Modals
│   │   │   ├── room/             # VideoGrid, Controls, Chat
│   │   │   └── whiteboard/       # Fabric.js Canvas wrapper
│   │   ├── hooks/                # Custom hooks (useWebRTC, useSocket)
│   │   ├── pages/                # Route components (Home, Dashboard, Room)
│   │   ├── store/                # Redux Toolkit store and slices
│   │   ├── styles/               # Global CSS, Antigravity overrides (index.css)
│   │   ├── utils/                # Helpers (encryption, formatting)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js        # Merged with Antigravity design tokens
│   └── vite.config.js
├── server/                       # Backend Node.js Application
│   ├── config/                   # DB, Redis, S3 configurations
│   ├── controllers/              # Route handlers
│   ├── middlewares/              # Auth, Rate Limiting, Error handling
│   ├── models/                   # Mongoose schemas (User, Room, Message)
│   ├── routes/                   # Express routes
│   ├── services/                 # WebRTC signaling, S3 upload service
│   ├── sockets/                  # Socket.io event handlers
│   ├── utils/                    # Crypto, JWT generators
│   ├── app.js                    # Express app setup (Helmet, CORS)
│   ├── server.js                 # HTTP/WSS Server entry point
│   ├── package.json
│   └── ecosystem.config.js       # PM2 configuration
├── docs/                         # Project Documentation
├── docker-compose.yml            # Production services
├── docker-compose.dev.yml        # Local development (Mongo, Redis)
├── nginx/
│   └── default.conf              # Nginx reverse proxy configuration
├── .gitignore
└── README.md
```
