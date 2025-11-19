# Yap Frontend

## Quick Start

1. Ensure you have Node.js and npm installed
2. Run `npm install`
3. Run `npm run dev` to start the vite development server

## Environment Variables

Vite will automatically load any environment variables based on the mode. For production mode, it will load from `.env.production`, and for development from .`env.development`.

- VITE_API_URL: the base URL of the backend. For development this will be `http://localhost:3000` by default because the backend port is configured to 3000 by default.
- VITE_WS_URL: similar to the api url, but for initiating websocket connections. Default `ws://localhost:3000` for dev.
