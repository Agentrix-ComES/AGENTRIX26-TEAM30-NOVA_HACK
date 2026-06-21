# GovGuide Backend — Run & Troubleshooting

This document explains how to run the backend (`backend/server.js`) using either a MongoDB Atlas connection string (`MONGO_URI`) or a local MongoDB instance (Docker or local service).

## Environment

- `MONGO_URI` (optional): full MongoDB connection URI. If not set, the server falls back to `mongodb://127.0.0.1:27017/govai`.
- `PORT` (optional): port for the Express server (default `5000`).

## Using MongoDB Atlas

1. Create a database user and get the connection string from Atlas. Make sure to include the target database name (e.g. `govai`) in the URI.
   Example:

```text
mongodb+srv://<USER>:<PASSWORD>@cluster0.cknkjbf.mongodb.net/govai?retryWrites=true&w=majority
```

2. Ensure your machine's IP is allowed in Atlas Network Access (or add `0.0.0.0/0` for quick testing — not recommended for production).

3. Start the backend (PowerShell example):

```powershell
$env:MONGO_URI = "mongodb+srv://USER:PASS@cluster0.cknkjbf.mongodb.net/govai?retryWrites=true&w=majority"
cd d:\govai\backend
npm install
npm run dev
```

Or in bash:

```bash
export MONGO_URI='mongodb+srv://USER:PASS@cluster0.cknkjbf.mongodb.net/govai?retryWrites=true&w=majority'
cd /path/to/govai/backend
npm install
npm run dev
```

## Using Local MongoDB (Docker)

1. Start a local Mongo container:

```bash
docker run --name govai-mongo -p 27017:27017 -d mongo:6
```

2. Start the backend (it will use the fallback local URI):

```powershell
cd d:\govai\backend
npm install
npm run dev
```

## Testing the API

- Run the included quick test script (node must be available):

```powershell
node test_api.js
```

- Example curl requests:

Register:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"t@example.com","phone":"0771234567","password":"pass123","district":"colombo"}'
```

Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"t@example.com","password":"pass123"}'
```

## Common Errors & Fixes

- `Error: querySrv ECONNREFUSED _mongodb._tcp.<host>`: DNS SRV lookup failed for Atlas host.
  - Check your `MONGO_URI` is correct and includes the DB name.
  - Ensure your network/DNS allows SRV lookups. Try switching to a standard connection string if needed.
  - Make sure Atlas IP access list includes your current IP.

- `ECONNREFUSED` connecting to `127.0.0.1`: local MongoDB is not running. Start a local Mongo (via Docker or service).

- Authentication errors: verify Atlas user name and password in the connection string.

## Notes

- The backend now reads `MONGO_URI` from env and falls back to local Mongo for development. Change `PORT` to run on a custom port.
- Do not commit production credentials to source control. Use environment variables or a secrets manager.

If you want, I can add a short root-level `README.md` summarizing how to run the entire project (frontend + backend).