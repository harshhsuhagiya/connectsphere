# WebRTC Signaling Flow

The WebRTC Mesh architecture requires every participant to connect to every other participant. Below is the signaling flow when **Peer B** joins a room where **Peer A** is already present.

```mermaid
sequenceDiagram
    participant B as Peer B
    participant S as Server (Socket.io)
    participant A as Peer A

    B->>S: emit 'join-room' (roomId, B_ID)
    S->>A: emit 'user-connected' (B_ID)
    
    Note over A,B: Peer A initiates connection to new Peer B
    
    A->>A: createPeerConnection()
    A->>A: createOffer()
    A->>S: emit 'signal' (to: B_ID, signal: offer)
    S->>B: emit 'signal' (from: A_ID, signal: offer)
    
    B->>B: createPeerConnection()
    B->>B: setRemoteDescription(offer)
    B->>B: createAnswer()
    B->>S: emit 'signal' (to: A_ID, signal: answer)
    S->>A: emit 'signal' (from: B_ID, signal: answer)
    
    A->>A: setRemoteDescription(answer)
    
    Note over A,B: ICE Candidate Exchange (Trickle ICE)
    
    A->>S: emit 'signal' (to: B_ID, signal: ICE_A)
    S->>B: emit 'signal' (from: A_ID, signal: ICE_A)
    B->>B: addIceCandidate(ICE_A)
    
    B->>S: emit 'signal' (to: A_ID, signal: ICE_B)
    S->>A: emit 'signal' (from: B_ID, signal: ICE_B)
    A->>A: addIceCandidate(ICE_B)
    
    Note over A,B: DTLS-SRTP Handshake & Media Flow
    A<-->>B: Direct P2P Encrypted Video/Audio
```

### Multi-user Context (Up to 12 users)
When User C joins, both A and B receive `user-connected`. A creates an offer for C, and B creates an offer for C. This results in an `N * (N - 1) / 2` connection mesh.
