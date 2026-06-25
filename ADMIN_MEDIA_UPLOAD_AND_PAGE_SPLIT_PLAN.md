# Admin Media Upload + Admin Page Split Plan

## Tujuan

1. Ubah upload gambar admin dari base64 di database menjadi file `.jpg` di folder server.
2. Simpan ke database hanya URL/path gambar.
3. Terapkan untuk:
   - project images
   - foto profil
   - lanyard image
4. Pecah file admin page yang sekarang masih digabung dalam `OtherPages.tsx` menjadi file page terpisah.
5. Pastikan layout dan Tailwind tidak berubah sama sekali.

---

## Diagnosis Saat Ini

### 1. Project image masih masuk database sebagai string
Frontend admin sekarang mengubah file menjadi base64/data URL lalu mengirimnya sebagai string JSON.

Referensi:
- `frontend/src/pages/Admin/components/ui/index.tsx:415`
- `frontend/src/pages/Admin/components/ui/index.tsx:437`
- `frontend/src/pages/Admin/components/ui/index.tsx:461`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:100`
- `backend/routes/project_routes.py:42`
- `backend/routes/project_routes.py:68`

### 2. Foto profil masih masuk database sebagai string
Referensi:
- `frontend/src/pages/Admin/pages/OtherPages.tsx:299`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:359`

### 3. Lanyard image masih masuk database sebagai string
Referensi:
- `frontend/src/pages/Admin/pages/OtherPages.tsx:19`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:199`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:201`

### 4. Banyak admin page masih digabung dalam satu file
Saat ini page berikut masih berada dalam satu file:
- `HomePage`
- `ProfilePage`
- `AboutPage`
- `StudentPage`
- `SocialLinksPage`
- `MessagesPage`
- `GithubPage`

Referensi:
- `frontend/src/pages/Admin/pages/OtherPages.tsx:19`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:299`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:439`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:603`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:744`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:854`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:969`

Yang sudah terpisah:
- `frontend/src/pages/Admin/pages/OverviewPage.tsx`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx`
- `frontend/src/pages/Admin/pages/LoginPage.tsx`

Referensi integrasi page:
- `frontend/src/pages/Admin/Admin.tsx:7`
- `frontend/src/pages/Admin/Admin.tsx:27`

---

## Constraint UI

Semua perubahan harus menjaga layout dan Tailwind tetap sama persis.

### Aturan
- jangan ubah struktur visual halaman
- jangan ubah class Tailwind existing
- jangan ubah spacing, sizing, warna, border, radius, shadow, responsive breakpoint, dan alignment
- jangan ubah urutan elemen visual kecuali benar-benar perlu untuk split file
- split file hanya memindahkan logic/code ke file terpisah, bukan redesign
- bila perlu buat helper baru, output JSX final harus tetap identik
- upload flow baru tidak boleh mengubah tampilan komponen admin yang sudah ada

### Area yang wajib tetap identik
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx`
- `frontend/src/pages/Admin/pages/OverviewPage.tsx`
- seluruh UI yang dipindah dari `frontend/src/pages/Admin/pages/OtherPages.tsx`
- `frontend/src/pages/Admin/Admin.tsx`
- komponen layout admin di:
  - `frontend/src/pages/Admin/components/layout/DashboardLayout.tsx`
  - `frontend/src/pages/Admin/components/layout/Sidebar.tsx`
  - `frontend/src/pages/Admin/components/layout/Topbar.tsx`

### Rule refactor
- fokus ke pemisahan file dan alur upload
- JSX, className, dan susunan layout dipertahankan semaksimal mungkin
- bila ada perubahan UI, itu bug kecuali memang diminta user

---

## Arsitektur Media Baru

## Aturan umum

- Semua file gambar hasil upload disimpan sebagai `.jpg`
- Database hanya menyimpan URL/path file
- Nama folder stabil
- Untuk project gunakan `project.id`
- Untuk profil dan lanyard gunakan folder tetap

---

## Struktur Folder

### 1. Project images
```text
backend/uploads/projects/<project.id>/cover.jpg
backend/uploads/projects/<project.id>/gallery-1.jpg
backend/uploads/projects/<project.id>/gallery-2.jpg
backend/uploads/projects/<project.id>/gallery-3.jpg
backend/uploads/projects/<project.id>/gallery-4.jpg
backend/uploads/projects/<project.id>/gallery-5.jpg
```

### 2. Foto profil
```text
backend/uploads/foto-profil/img/profile.jpg
```

### 3. Lanyard image
```text
backend/uploads/lanyard/img/lanyard.jpg
```

### 4. Public URL result
```text
/uploads/projects/<project.id>/cover.jpg
/uploads/projects/<project.id>/gallery-1.jpg
/uploads/foto-profil/img/profile.jpg
/uploads/lanyard/img/lanyard.jpg
```

---

## Format Data di Database

## 1. Collection `projects`
Field `images` tetap dipakai, tapi isinya URL file, bukan base64.

Contoh:
```json
{
  "id": "project-a1b2c3d4e5",
  "title": "Portfolio App",
  "slug": "portfolio-app",
  "images": [
    "/uploads/projects/project-a1b2c3d4e5/cover.jpg",
    "/uploads/projects/project-a1b2c3d4e5/gallery-1.jpg",
    "/uploads/projects/project-a1b2c3d4e5/gallery-2.jpg"
  ]
}
```

Referensi field sekarang:
- `backend/routes/project_routes.py:42`
- `frontend/src/pages/Admin/services/api.ts:100`
- `frontend/src/pages/Admin/types/index.ts:23`

## 2. Profile
Field `avatar` tetap dipakai, tapi isi URL file.

Contoh:
```json
{
  "avatar": "/uploads/foto-profil/img/profile.jpg"
}
```

Referensi:
- `frontend/src/pages/Admin/types/index.ts:73`
- `frontend/src/pages/Admin/services/api.ts:169`

## 3. Home
Field `lanyardImage` tetap dipakai, tapi isi URL file.

Contoh:
```json
{
  "lanyardImage": "/uploads/lanyard/img/lanyard.jpg"
}
```

Referensi:
- `frontend/src/pages/Admin/types/index.ts:62`
- `frontend/src/pages/Admin/services/api.ts:131`

---

## Endpoint Backend Baru

## 1. Create project dulu
Tetap gunakan endpoint project existing untuk membuat project dan mendapatkan `project.id`.

### Endpoint
```http
POST /api/projects
Content-Type: application/json
```

### Tujuan
- simpan data teks project dulu
- generate `project.id`
- return project object

Referensi:
- `backend/routes/project_routes.py:65`
- `backend/routes/project_routes.py:77`

---

## 2. Upload project images
### Endpoint
```http
POST /api/projects/<project_id>/images
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Form fields
- `cover` → 1 file image
- `gallery` → multi file image, max 5

### Behavior
- pastikan project ada
- buat folder `backend/uploads/projects/<project_id>/`
- simpan:
  - cover → `cover.jpg`
  - gallery ke:
    - `gallery-1.jpg`
    - `gallery-2.jpg`
    - `gallery-3.jpg`
    - `gallery-4.jpg`
    - `gallery-5.jpg`
- overwrite file lama jika nama sama
- update field `images` di MongoDB
- return array URL final

### Response contoh
```json
{
  "status": "success",
  "message": "Gambar project berhasil diunggah.",
  "data": {
    "images": [
      "/uploads/projects/project-a1b2c3d4e5/cover.jpg",
      "/uploads/projects/project-a1b2c3d4e5/gallery-1.jpg",
      "/uploads/projects/project-a1b2c3d4e5/gallery-2.jpg"
    ]
  }
}
```

---

## 3. Upload foto profil
### Endpoint
```http
POST /api/profile/avatar
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Form fields
- `image` → 1 file image

### Behavior
- simpan ke `backend/uploads/foto-profil/img/profile.jpg`
- update field `avatar` pada data profile
- return URL final

### Response contoh
```json
{
  "status": "success",
  "message": "Foto profil berhasil diunggah.",
  "data": {
    "avatar": "/uploads/foto-profil/img/profile.jpg"
  }
}
```

---

## 4. Upload lanyard image
### Endpoint
```http
POST /api/home/lanyard-image
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

### Form fields
- `image` → 1 file image

### Behavior
- simpan ke `backend/uploads/lanyard/img/lanyard.jpg`
- update field `lanyardImage` pada data home
- return URL final

### Response contoh
```json
{
  "status": "success",
  "message": "Gambar lanyard berhasil diunggah.",
  "data": {
    "lanyardImage": "/uploads/lanyard/img/lanyard.jpg"
  }
}
```

---

## 5. Update text-only data tetap JSON
Endpoint update existing tetap dipakai untuk field teks/non-file.

### Project
```http
PATCH /api/projects/<project_id>
Content-Type: application/json
```

### Profile
```http
PATCH /api/profile
Content-Type: application/json
```

### Home
```http
PATCH /api/home
Content-Type: application/json
```

---

## Flow Final yang Diinginkan

## A. Tambah project baru
1. Admin isi form project
2. User klik simpan
3. Frontend kirim `POST /api/projects` dulu tanpa base64 image
4. Backend buat project dan return `project.id`
5. Frontend kirim image dengan `POST /api/projects/<project_id>/images`
6. Backend simpan image ke folder project
7. Backend update field `images`
8. Frontend refresh list

### Catatan
Ini sesuai keputusan:
- save project dulu
- baru upload image
- alasan: `project.id` sudah pasti ada

---

## B. Edit project
1. Admin edit field teks
2. Admin bisa ganti cover dan/atau gallery
3. Frontend kirim:
   - `PATCH /api/projects/<project_id>` untuk teks
   - `POST /api/projects/<project_id>/images` untuk file baru
4. Backend overwrite file lama jika diganti
5. Backend update field `images` sesuai file final

---

## C. Update foto profil
1. Admin pilih file avatar
2. Frontend upload file ke `POST /api/profile/avatar`
3. Backend simpan ke `backend/uploads/foto-profil/img/profile.jpg`
4. Backend update `avatar`
5. Frontend tampilkan URL baru

---

## D. Update lanyard image
1. Admin pilih file lanyard
2. Frontend upload file ke `POST /api/home/lanyard-image`
3. Backend simpan ke `backend/uploads/lanyard/img/lanyard.jpg`
4. Backend update `lanyardImage`
5. Frontend tampilkan URL baru

---

## Static File Serving

Backend perlu expose folder uploads sebagai URL publik.

### Target mapping
- filesystem:
  `backend/uploads/...`
- URL:
  `/uploads/...`

### Hasil
Frontend bisa langsung pakai:
```tsx
<img src="/uploads/projects/project-a1b2c3d4e5/cover.jpg" />
```

Referensi app bootstrap:
- `backend/app.py:72`

---

## Validasi Upload

## Rule umum
- hanya file `image/*`
- output selalu `.jpg`
- limit jumlah:
  - project cover: 1
  - project gallery: max 5
  - profile avatar: 1
  - lanyard: 1
- beri limit size file
- sanitize input
- jangan pakai nama file asli user
- overwrite by fixed filename

## Rekomendasi size
- max upload per file: 5 MB
- compress server-side ke JPEG
- strip metadata jika perlu

---

## Perubahan Frontend

## 1. `ImageUploader`
Saat ini `ImageUploader` mengubah file menjadi base64 string.

Referensi:
- `frontend/src/pages/Admin/components/ui/index.tsx:415`
- `frontend/src/pages/Admin/components/ui/index.tsx:437`
- `frontend/src/pages/Admin/components/ui/index.tsx:474`

### Target baru
`ImageUploader` jangan langsung hasilkan base64 untuk flow admin upload file.
Perlu mode baru:
- return `File` / `File[]`
- atau buat uploader khusus file-based untuk admin

### Opsi aman
Tetap pertahankan komponen lama bila dipakai di tempat lain, lalu tambahkan mode baru seperti:
- `returnMode="file"`
- atau komponen baru `FileImageUploader`

---

## 2. `ProjectsPage.tsx`
Referensi:
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:52`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:53`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:100`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:330`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:339`

### Ubah state
Dari:
- `coverImage: string`
- `galleryImages: string[]`

Menjadi 2 layer:
- preview URL untuk UI
- `File | null` dan `File[]` untuk upload

### Flow save baru
1. create project dulu
2. ambil `project.id`
3. upload files
4. refresh list

---

## 3. `ProfilePage`
Referensi:
- `frontend/src/pages/Admin/pages/OtherPages.tsx:299`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:359`

### Ubah flow
- upload avatar ke endpoint file
- update state `profile.avatar` dengan URL hasil backend
- simpan field teks profile lewat endpoint JSON existing

---

## 4. `HomePage`
Referensi:
- `frontend/src/pages/Admin/pages/OtherPages.tsx:19`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:199`

### Ubah flow
- upload lanyard image ke endpoint file
- update state `home.lanyardImage` dengan URL hasil backend
- field home lain tetap lewat endpoint JSON existing

---

## Perubahan Backend

## 1. Tambah config upload
Referensi:
- `backend/config.py:16`

### Tambah config baru
Contoh:
- `UPLOAD_ROOT`
- `UPLOAD_URL_PREFIX`
- `MAX_IMAGE_SIZE_MB`

---

## 2. Tambah helper upload image
Lokasi yang disarankan:
```text
backend/services/media.py
```

### Tugas helper
- validate mime
- validate size
- ensure folder exists
- convert/save as jpg
- build public URL
- remove old files jika perlu
- remove whole folder untuk delete project

---

## 3. Tambah static serving uploads
Referensi:
- `backend/app.py:72`

### Tujuan
Expose:
```text
/uploads/<path:filename>
```
ke folder:
```text
backend/uploads/
```

---

## 4. Update delete project
Referensi:
- `backend/routes/project_routes.py:128`

### Perubahan
Saat project dihapus:
1. hapus document project
2. hapus folder:
```text
backend/uploads/projects/<project.id>/
```

---

## Split Admin Pages

## Kondisi sekarang
`OtherPages.tsx` berisi banyak page sekaligus.

Referensi:
- `frontend/src/pages/Admin/pages/OtherPages.tsx:19`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:299`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:439`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:603`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:744`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:854`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:969`

## Target file baru
```text
frontend/src/pages/Admin/pages/HomePage.tsx
frontend/src/pages/Admin/pages/ProfilePage.tsx
frontend/src/pages/Admin/pages/AboutPage.tsx
frontend/src/pages/Admin/pages/StudentPage.tsx
frontend/src/pages/Admin/pages/SocialLinksPage.tsx
frontend/src/pages/Admin/pages/MessagesPage.tsx
frontend/src/pages/Admin/pages/GithubPage.tsx
```

## File existing yang tetap
```text
frontend/src/pages/Admin/pages/OverviewPage.tsx
frontend/src/pages/Admin/pages/ProjectsPage.tsx
frontend/src/pages/Admin/pages/LoginPage.tsx
```

## Update import
File:
- `frontend/src/pages/Admin/Admin.tsx:7`
- `frontend/src/pages/Admin/Admin.tsx:9`

### Dari
```ts
import { HomePage, ProfilePage, AboutPage, StudentPage, SocialLinksPage, MessagesPage, GithubPage } from './pages/OtherPages';
```

### Menjadi
```ts
import { HomePage } from './pages/HomePage';
import { ProfilePage } from './pages/ProfilePage';
import { AboutPage } from './pages/AboutPage';
import { StudentPage } from './pages/StudentPage';
import { SocialLinksPage } from './pages/SocialLinksPage';
import { MessagesPage } from './pages/MessagesPage';
import { GithubPage } from './pages/GithubPage';
```

## Manfaat split
- file lebih kecil
- lebih gampang maintenance
- lebih gampang test dan debug
- lebih aman saat ubah satu page
- lebih gampang lanjut refactor media upload per page

---

## Urutan Implementasi Disarankan

## Fase 1 — split page file
1. pecah `OtherPages.tsx` jadi file page terpisah
2. update import di `Admin.tsx`
3. pastikan admin tetap jalan

## Fase 2 — backend media foundation
1. tambah config upload
2. tambah helper media
3. expose static uploads
4. tambah endpoint upload project/profile/lanyard

## Fase 3 — frontend upload refactor
1. ubah flow project create → upload image
2. ubah flow profile avatar upload
3. ubah flow lanyard image upload
4. buang dependensi base64 untuk case admin file upload

## Fase 4 — cleanup
1. hapus sisa logic base64 yang tidak dipakai untuk admin
2. tambahkan fallback backward-compatible untuk data lama
3. pastikan delete project juga hapus folder media

---

## Compatibility / Data Lama

Data lama kemungkinan masih berisi base64 di field:
- `projects.images`
- `profile.avatar`
- `home.lanyardImage`

## Strategi aman
- frontend tetap bisa render string lama apa adanya
- project/profile/home baru pakai URL `/uploads/...`
- migrasi base64 lama dilakukan belakangan bila perlu

Karena `<img src="...">` sudah dipakai langsung, URL file dan base64 sama-sama tetap bisa tampil.

Referensi:
- `frontend/src/pages/Projects/Projects.tsx:221`
- `frontend/src/pages/Admin/pages/ProjectsPage.tsx:211`
- `frontend/src/pages/Admin/pages/OtherPages.tsx:397`

---

## Ringkasan Keputusan Final

### Media storage
- format file: `.jpg`
- project folder: by `project.id`
- profile folder: `foto-profil/img`
- lanyard folder: `lanyard/img`

### Upload flow
- project: save project dulu, baru upload image
- profile: upload file avatar ke endpoint khusus
- home: upload file lanyard ke endpoint khusus

### Admin page refactor
Pisah file berikut:
- Ringkasan: sudah terpisah
- Project: sudah terpisah
- Home: perlu dipisah
- Profil: perlu dipisah
- Tentang: perlu dipisah
- Student: perlu dipisah
- Link Sosial: perlu dipisah
- Pesan: perlu dipisah
- Github: perlu dipisah

---

## File yang Akan Tersentuh Saat Implementasi

### Backend
```text
backend/app.py
backend/config.py
backend/routes/project_routes.py
backend/routes/settings_routes.py
backend/services/media.py
```

### Frontend
```text
frontend/src/pages/Admin/Admin.tsx
frontend/src/pages/Admin/components/ui/index.tsx
frontend/src/pages/Admin/pages/ProjectsPage.tsx
frontend/src/pages/Admin/pages/HomePage.tsx
frontend/src/pages/Admin/pages/ProfilePage.tsx
frontend/src/pages/Admin/pages/AboutPage.tsx
frontend/src/pages/Admin/pages/StudentPage.tsx
frontend/src/pages/Admin/pages/SocialLinksPage.tsx
frontend/src/pages/Admin/pages/MessagesPage.tsx
frontend/src/pages/Admin/pages/GithubPage.tsx
```

### File sumber yang akan dipecah
```text
frontend/src/pages/Admin/pages/OtherPages.tsx
```
