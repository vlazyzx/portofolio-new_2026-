# Portfolio New

Struktur project dipisah menjadi frontend dan backend.

```txt
portfolio New
├─ backend
└─ frontend
```

## Frontend

React + Vite + TypeScript ada di folder `frontend`.

```bash
cd frontend
npm install
npm run dev
```

URL lokal: `http://localhost:5173` atau `http://127.0.0.1:5173`

File halaman ada di:

```txt
frontend/src/pages
```

Dashboard admin frontend bisa dibuka di:

```txt
http://localhost:5173/#admin
http://127.0.0.1:5173/#admin
```

## Backend

Python + Flask ada di folder `backend`.

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

URL lokal: `http://127.0.0.1:5000`

Frontend punya proxy `/api` ke backend lokal. Token seperti `GITHUB_TOKEN` hanya boleh masuk ke `.env` backend.
