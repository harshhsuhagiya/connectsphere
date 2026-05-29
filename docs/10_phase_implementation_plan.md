# 10-Phase Implementation Plan

This is a day-by-day checklist to build ConnectSphere.

## Phase 1: Project Setup & Antigravity UI System
- [ ] Initialize Git repository.
- [ ] Set up Server with Express, Helmet, CORS, and Mongoose.
- [ ] Set up Client with Vite, React, Tailwind CSS.
- [ ] **Code Snippet: Antigravity UI CSS Variable Override (`client/src/index.css`)**
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  /* Warm & Human Colors */
  --ag-primary: #D97757;       /* Warm Terracotta */
  --ag-secondary: #4A6670;     /* Slate Blue */
  --ag-background: #FDFBF7;    /* Warm Off-white */
  --ag-surface: #FFFFFF;
  --ag-text: #2C2A29;
  --ag-text-secondary: #6B6968;
  --ag-border: #E8E3DF;
  --ag-accent: #E8A87C;

  /* Typography */
  --ag-font-family: 'DM Sans', sans-serif;
  --ag-font-family-heading: 'Lora', serif;
  
  /* Soft Geometry */
  --ag-radius-sm: 8px;
  --ag-radius-md: 16px;
  --ag-radius-lg: 24px;
}

h1, h2, h3, .ag-h1, .ag-h2, .ag-h3 {
  font-family: var(--ag-font-family-heading);
}

body {
  font-family: var(--ag-font-family);
  background-color: var(--ag-background);
  color: var(--ag-text);
}
```

## Phase 2: Authentication & Database
- [ ] Configure MongoDB connection.
- [ ] Create User Schema (Mongoose).
- [ ] Implement JWT Login/Register with HTTP-only cookies.
- [ ] Implement Rate Limiting.
- [ ] **Code Snippet: Secure Auth Middleware (`server/middlewares/auth.js`)**
```javascript
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Access Denied' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid Token' });
  }
};
```

## Phase 3: WebSockets & Redis
- [ ] Initialize Socket.io on Node.js server.
- [ ] Connect Redis adapter for Socket.io scalability.
- [ ] Implement basic `join-room` and `user-connected` logic.

## Phase 4: WebRTC Peer-to-Peer Foundation
- [ ] Create `useWebRTC` React Hook.
- [ ] Request Camera/Mic permissions (`navigator.mediaDevices.getUserMedia`).
- [ ] Implement signaling logic (Offer, Answer, ICE Candidates).
- [ ] **Code Snippet: Signaling Exchange (`server/sockets/signaling.js`)**
```javascript
module.exports = (io, socket) => {
  socket.on('signal', (data) => {
    // Send signal to specific user
    io.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal
    });
  });
};
```

## Phase 5: Multi-user Video Mesh
- [ ] Manage multiple `RTCPeerConnection` instances in state.
- [ ] Map video streams to UI components.
- [ ] Handle dynamic participant disconnects gracefully.

## Phase 6: Screen Sharing
- [ ] Add `navigator.mediaDevices.getDisplayMedia()`.
- [ ] Replace video tracks on existing peer connections.
- [ ] Create UI toggle button with Antigravity styling (`.ag-btn-outline`).

## Phase 7: Real-time Collaborative Whiteboard
- [ ] Initialize Fabric.js Canvas.
- [ ] Capture draw events (path created, object modified).
- [ ] Broadcast events via Socket.io to peers.
- [ ] **Code Snippet: Canvas Sync (`client/src/components/whiteboard/Whiteboard.jsx`)**
```javascript
useEffect(() => {
  if (!canvas) return;
  canvas.on('object:added', (e) => {
    if (e.target.isRemote) return;
    socket.emit('canvas-update', { roomId, data: e.target.toJSON() });
  });

  socket.on('canvas-update', ({ data }) => {
    fabric.util.enlivenObjects([data], (objects) => {
      objects.forEach((obj) => {
        obj.isRemote = true;
        canvas.add(obj);
      });
      canvas.renderAll();
    });
  });
}, [canvas, socket]);
```

## Phase 8: File Sharing with AWS S3
- [ ] Create Backend route for pre-signed URLs.
- [ ] Implement Client-side drag-and-drop zone.
- [ ] Upload file directly to S3 and broadcast link in chat.

## Phase 9: End-to-End Encryption (E2EE)
- [ ] WebRTC media is natively E2EE (DTLS-SRTP).
- [ ] Implement AES-256 for file sharing links via WebRTC Data Channels.
- [ ] **Code Snippet: Data Channel Setup**
```javascript
const peer = new RTCPeerConnection(config);
const dataChannel = peer.createDataChannel('crypto-keys');
dataChannel.onmessage = (event) => {
  const { fileId, aesKey } = JSON.parse(event.data);
  // Store key to decrypt file when downloaded from S3
};
```

## Phase 10: Production Deployment
- [ ] Write Dockerfiles for Client and Server.
- [ ] Setup Nginx reverse proxy with SSL (`default.conf`).
- [ ] Configure PM2 for process management.
- [ ] Build GitHub Actions CI/CD workflow.
