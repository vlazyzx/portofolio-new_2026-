# Backend Portfolio

Backend Python untuk portfolio Muhammad Ikhsan. Struktur ini disiapkan untuk data project, kontak, dashboard, dan integrasi GitHub contribution lewat API yang aman.

## Jalankan Lokal

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python app.py
```

Server default berjalan di `http://127.0.0.1:5000`.

## Endpoint Awal

- `GET /api/health`
- `GET /api/projects`
- `GET /api/projects/<id>`
- `POST /api/contact/messages`
- `GET /api/github/contributions`

`GITHUB_TOKEN` jangan pernah dimasukkan ke frontend. Simpan token di `.env` backend saja.
