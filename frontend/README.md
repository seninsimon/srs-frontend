# CrowdStream - Remote Annotator Monitoring Platform

A production-ready MVP for monitoring remote annotators with WebRTC screen sharing, camera, and microphone capabilities.

## Features

- **Authentication**: JWT with refresh tokens, role-based access (Super Admin & Host)
- **User Management**: Create and manage Super Admin and Host users
- **Session Management**: Create sessions, assign hosts, generate secure join links
- **WebRTC Streaming**: Screen sharing, camera, and microphone sharing via P2P WebRTC
- **Monitoring Dashboard**: View connected clients, search, focus mode, screenshots, manual flags
- **Scalable Design**: Built to easily replace signaling with Mediasoup SFU for 50+ clients

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Socket.IO for signaling
- JWT for authentication
- Winston for logging

### Frontend
- React + TypeScript + Vite
- Tailwind CSS
- TanStack Query
- Axios
- Socket.IO client
- WebRTC

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB (or Docker)
- Docker (optional)

### Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install