# ER:LC Operations

A free-plan-friendly Node.js starter for an ER:LC operations platform.

## Included
- Live Map with simulated live movement
- CAD / 911 calls and dispatch units
- MDT player/vehicle lookup, reports, BOLOs
- Community roster and applications
- Command dashboard
- Socket.IO real-time updates
- JSON persistence for the starter version
- Render configuration

## Deploy to Render
1. Put this folder in a GitHub repository.
2. Create a new Render Web Service from the repository.
3. Render can use `render.yaml`, or set:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Optional environment variables:
   - `ADMIN_PASSWORD`
   - `ERLC_API_KEY`

## Important
The Live Map currently uses simulated movement so the project works immediately. Replace the `setInterval` section in `server.js` with your authorized ER:LC API integration.

For production/community-scale use, move persistent data from `data/database.json` to a persistent database. Render's free web service filesystem is not durable across all restarts/redeployments.

## ER:LC API
Do not put a private API key in frontend JavaScript. Keep it in Render environment variables and make server-side API requests only.

## Render layout fix
The application runtime is under `src/`, including `src/server.js` and `src/public/index.html`.
Use the Render start command `npm start`.
Do not use `node server.js` if you are using this package.
