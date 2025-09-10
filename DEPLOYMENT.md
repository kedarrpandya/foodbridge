## Deployment Guide

### Frontend (Vercel)
1. Create a new project in Vercel, import the `frontend` directory.
2. Build Command: `npm run build`
3. Output Dir: `dist`
4. Environment Variables:
   - `VITE_API_BASE_URL` → your backend base (e.g., `https://api.yourdomain.com/api/v1`)
5. Deploy.

### Backend (Render/Railway/Fly)
- Dockerfile is provided in `backend/`.
- Required environment variables:
  - `EMAIL_SENDING=1` (or `0` to disable)
  - `SMTP_SERVER`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `FROM_EMAIL`
  - `PYTHONPATH=.` (Render often not needed)
- Expose port `8000`.
- Health check: `GET /api/v1/items/` should return 200.

#### Render example
- New Web Service → Use Docker → root: `backend/`
- Env: set values above.
- Auto deploy on push.

### Local Docker
#### Backend
```bash
cd backend
docker build -t fwt-backend .
docker run -p 8000:8000 --env-file .env fwt-backend
```

#### Frontend
```bash
cd frontend
docker build -t fwt-frontend .
docker run -p 8080:80 fwt-frontend
```

Then open `http://localhost:8080` and set `VITE_API_BASE_URL` during build to your backend.

### Domains & CORS
- Set frontend to use the backend URL.
- Ensure backend CORS allows the frontend domain.

### Data Persistence
- For production, use Postgres instead of SQLite.
- Mount a persistent volume or managed Postgres; update `DATABASE_URL` accordingly and migrate data.


