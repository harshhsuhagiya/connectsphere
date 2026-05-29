# Security Model

ConnectSphere is designed with a defense-in-depth security approach, protecting data at rest, in transit, and during execution.

## 1. Transport Layer Security (Data in Transit)
- **HTTPS/WSS**: All external traffic is encrypted using TLS 1.3 via Nginx reverse proxy.
- **WebRTC DTLS-SRTP**: All peer-to-peer media (video/audio) and data channels are encrypted end-to-end using Datagram Transport Layer Security (DTLS) and Secure Real-time Transport Protocol (SRTP). The server never decrypts media streams.

## 2. Application Layer Protections (Backend)
- **Helmet.js**: Injects strict HTTP headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options) to mitigate XSS and clickjacking.
- **express-mongo-sanitize**: Strips `$`, `.`, and other operators from `req.body`, `req.params`, and `req.query` to prevent NoSQL Injection.
- **xss-clean**: Sanitizes user input to prevent Cross-Site Scripting.
- **Rate Limiting**: `express-rate-limit` is applied to all `/api/auth` routes (e.g., max 5 requests per 15 minutes for logins) and general API endpoints.
- **CORS Configuration**: Strictly limited to `CLIENT_URL` with credentials enabled.

## 3. Authentication & Authorization
- **JWT (JSON Web Tokens)**: Short-lived access tokens stored in secure, `httpOnly`, `SameSite=Strict` cookies to prevent XSS exfiltration.
- **OAuth 2.0**: Google OAuth integration prevents password fatigue and leverages Google's security.
- **bcryptjs**: Passwords (if native auth is used) are hashed with salt rounds of 12.

## 4. Session & State Management
- **Redis**: User sessions and real-time canvas states are stored in Redis, ensuring rapid access and avoiding stale data vulnerabilities in clustered environments.

## 5. File Security
- **AWS S3 Pre-signed URLs**: Files are uploaded directly from client to S3 using short-lived pre-signed URLs, preventing server bottlenecking and validating upload intent.
- **AES-256 Encryption**: Sensitive files are encrypted on the client side before upload using Web Crypto API. The AES key is shared via the WebRTC data channel (E2EE), meaning the server and S3 only store ciphertext.

## 6. Process Management & Deployment
- **Docker**: Isolates application dependencies and limits process capabilities.
- **PM2**: Runs the Node.js application in cluster mode with non-root user privileges.
