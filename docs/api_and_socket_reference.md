# API & Socket Event Reference

## REST API (Express)

### Auth Routes (`/api/auth`)
- `POST /register`: Register a new user.
- `POST /login`: Authenticate user, sets HTTP-only JWT cookie.
- `GET /google`: Initiates Google OAuth.
- `POST /logout`: Clears cookie.
- `GET /me`: Returns current user data based on JWT.

### Room Routes (`/api/rooms`)
- `POST /`: Create a new room (returns roomId).
- `GET /:roomId`: Verify room exists and get metadata.
- `POST /:roomId/upload-url`: Get S3 pre-signed URL for file upload.

---

## WebSockets (Socket.io)

### Connection & Room Management
- **Client -> Server**
  - `join-room`: `{ roomId, userId, userProfile }` -> Joins the socket to a room.
  - `leave-room`: `{ roomId, userId }` -> Leaves the room.
- **Server -> Client**
  - `user-connected`: `{ userId, userProfile }` -> Notifies peers in the room.
  - `user-disconnected`: `{ userId }` -> Notifies peers when someone drops.
  - `room-full`: `{}` -> Emitted if room exceeds 12 participants.

### WebRTC Signaling
- **Client -> Server**
  - `signal`: `{ to: targetUserId, from: myUserId, signal: signalData }` -> Routes WebRTC offer/answer/ICE candidates.
- **Server -> Client**
  - `signal`: `{ from: senderUserId, signal: signalData }` -> Receives WebRTC data.

### Collaboration (Whiteboard & Chat)
- **Client -> Server**
  - `canvas-update`: `{ roomId, canvasData }` -> Sends Fabric.js object changes.
  - `send-message`: `{ roomId, messageData }` -> Broadcasts chat message.
- **Server -> Client**
  - `canvas-update`: `{ canvasData }`
  - `receive-message`: `{ messageData }`
