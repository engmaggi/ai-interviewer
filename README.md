# Orbit (AI Interviewer)

Monorepo with two apps:

| App | Path | Host |
| --- | --- | --- |
| Frontend (Next.js) | [`frontend/`](./frontend) | Vercel |
| Backend (Next.js API) | [`backend/`](./backend) | Render |

## Local development

```bash
# Backend (optional if you use the hosted API)
cd backend
cp .env.example .env
npm install
npm run dev -- -p 3001

# Frontend
cd frontend
cp .env.example .env.local
# Set BACKEND_URL to http://localhost:3001 or https://ai-interviewer-5kzg.onrender.com
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy

- **Vercel:** set Root Directory to `frontend`. Required env includes `BACKEND_URL` pointing at the Render API.
- **Render:** set Root Directory to `backend`.
